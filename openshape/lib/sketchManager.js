// Enhanced Sketch Manager for OpenShape
// Incorporates modern CAD features and improvements

import * as jscad from '@jscad/modeling';
// Destructure specific JSCAD operations we'll need
const { colorize } = jscad.colors;

import { modelStore, notifyModelChanged } from './mcpTools';
import planeManager from './planeManager';
import { basePlaneFrame, frameMatrix, to3D } from './planeFrame';
import { solveConstraints } from './constraintSolver.mjs';

class SketchManager {
  constructor() {
    this.activeSketch = null;
    this.sketches = {};
    this.nextSketchId = 1;
    this.isInSketchMode = false;
    
    // History management
    this.history = [];
    this.currentHistoryIndex = -1;
    
    // Grid configuration
    this.grid = {
      enabled: true,
      spacing: 1,
      snap: true
    };
    
    // Layer system
    this.layers = {
      default: { 
        id: 'default',
        visible: true,
        name: 'Default',
        color: [0.8, 0.8, 0.8]
      }
    };
    
    // Selection management
    this.selectedEntities = new Set();
    
    // Connection points management
    this.connectionPoints = new Map();
  }

  // [Existing createSketch method with enhancements]
  createSketch(planeInfo, layer = 'default') {
    // Resolve the sketch's plane frame. A sketch may be created on:
    //   - a named datum plane:   { planeId }
    //   - an explicit frame:     { frame }
    //   - a base plane (+offset): { plane: 'xy'|'yz'|'xz'|'custom', offset }
    let frame;
    let planeLabel = planeInfo.plane || 'custom';
    let offset = planeInfo.offset || 0;
    let planeId = null;

    if (planeInfo.frame) {
      frame = planeInfo.frame;
    } else if (planeInfo.planeId) {
      const datum = planeManager.getPlane(planeInfo.planeId);
      if (!datum) throw new Error(`Datum plane not found: ${planeInfo.planeId}`);
      frame = datum.frame;
      planeId = datum.id;
      planeLabel = datum.definition.basePlane || 'custom';
      offset = datum.definition.offset || 0;
    } else {
      if (!['xy', 'yz', 'xz', 'custom'].includes(planeInfo.plane)) {
        throw new Error('Invalid plane specified');
      }
      if (planeInfo.plane === 'custom' && typeof planeInfo.offset !== 'number') {
        throw new Error('Custom plane requires numeric offset');
      }
      frame = basePlaneFrame(planeInfo.plane, offset);
    }

    const sketchId = `sketch_${this.nextSketchId++}`;
    const sketch = {
      id: sketchId,
      name: `Sketch ${this.nextSketchId - 1}`,
      plane: planeLabel,
      offset,
      // Rigorous plane definition (origin + orthonormal u/v/w). All plane-aware
      // math (transform, extrude orientation, camera, drawing) uses this.
      frame,
      planeId,
      entities: [],
      // Named parametric variables that entity dimensions / the extrusion can
      // reference by name. Changing one via setParameter() rebuilds everything
      // that depends on it.
      parameters: (planeInfo.parameters && typeof planeInfo.parameters === 'object')
        ? { ...planeInfo.parameters }
        : {},
      // Link to the solid produced by extruding this sketch (kept so parameter
      // changes can rebuild it in place).
      extrusion: null,
      // Geometric relations (coincident, horizontal, parallel, ...) solved by
      // the constraint solver over the sketch's points.
      constraints: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      layer: layer
    };

    // Create a visualization of the sketch plane, oriented by its frame.
    const planeSize = 10;
    let planeVisualization = jscad.primitives.cuboid({
      size: [planeSize * 2, planeSize * 2, 0.01]
    });
    planeVisualization = jscad.transforms.transform(frameMatrix(frame), planeVisualization);

    // Add the plane visualization to the model store
    const planeModelId = modelStore.addModel(
      colorize([0.9, 0.9, 1, 0.2], planeVisualization),
      `plane_${sketchId}`
    );
    
    // Store the plane model ID in the sketch
    sketch.planeModelId = planeModelId;
    
    this.sketches[sketchId] = sketch;
    this.activeSketch = sketch;
    this.isInSketchMode = true;
    
    // Determine camera view based on the (base) plane
    let cameraView = 'front'; // default view (XY plane)
    switch (planeLabel) {
      case 'yz':
        cameraView = 'right';
        break;
      case 'xz':
        cameraView = 'top';
        break;
      case 'custom':
        cameraView = 'custom';
        break;
    }
    
    // Dispatch event to notify of sketch creation with camera view information
    const event = new CustomEvent('openshape:sketchCreated', {
      detail: { 
        sketchId, 
        sketch, // Include the entire sketch object (with its frame)
        plane: planeLabel,
        cameraView, 
        offset
      }
    });
    window.dispatchEvent(event);
    
    // Also dispatch the sketch mode changed event
    const modeEvent = new CustomEvent('openshape:sketchModeChanged', {
      detail: {
        active: true,
        sketch,
        plane: planeLabel
      }
    });
    window.dispatchEvent(modeEvent);
    
    return sketch;
  }

  // Exit sketch mode
  exitSketchMode() {
    if (!this.isInSketchMode || !this.activeSketch) {
      return false;
    }
    
    // Save current sketch state if needed
    const currentSketchId = this.activeSketch.id;
    
    // Clear active sketch and exit sketch mode
    const previousSketch = this.activeSketch;
    this.activeSketch = null;
    this.isInSketchMode = false;
    
    // Dispatch event to notify that sketch mode has been exited
    const event = new CustomEvent('openshape:sketchModeChanged', {
      detail: {
        active: false,
        previousSketch, // Include the sketch that was active
        previousPlane: previousSketch ? previousSketch.plane : null
      }
    });
    window.dispatchEvent(event);
    
    return true;
  }

  // [Enhanced entity management with constraints and history]
  addEntity(type, params) {
    if (!this.activeSketch) throw new Error('No active sketch');

    // Resolve any parametric bindings: a dimension given as a parameter-name
    // string (e.g. width: 'boxWidth') is recorded as a binding and replaced by
    // the parameter's current numeric value for geometry generation.
    const { resolved, bindings } = this.#resolveEntityParams(params);
    params = resolved;

    // Apply grid snapping
    if (this.grid.snap) {
      params = this.#applyGridSnapping(type, params);
    }

    const entityId = `entity_${this.activeSketch.id}_${this.activeSketch.entities.length + 1}`;
    const entity = {
      id: entityId,
      type,
      params: this.#sanitizeParams(type, params),
      bindings, // parameter-name bindings, e.g. { width: 'boxWidth' }
      createdAt: new Date(),
      updatedAt: new Date(),
      constraints: params.constraints || {}
    };

    // Apply constraints
    this.#applyConstraints(entity);

    // Generate geometry
    let geometry;
    switch (type) {
      case 'point':
        geometry = this.createPointGeometry(entity.params);
        break;
      case 'line':
        geometry = this.createLineGeometry(entity.params);
        break;
      case 'rectangle':
        geometry = this.createRectangleGeometry(entity.params);
        break;
      case 'circle':
        // Special handling for circles
        // First, create a point for the center
        const centerPointId = `entity_${this.activeSketch.id}_${this.activeSketch.entities.length + 1}_center`;
        const centerEntity = {
          id: centerPointId,
          type: 'point',
          params: {
            position: entity.params.center,
            size: 0.15, // Smaller point size for center points
            isCenter: true // Mark as center point
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          constraints: {}
        };
        
        // Add center point entity to the sketch
        const centerGeometry = this.createPointGeometry(centerEntity.params);
        const transformedCenterGeometry = this.transformToSketchPlane(centerGeometry);
        const centerModelId = modelStore.addModel(transformedCenterGeometry, `point_${centerPointId}`);
        
        centerEntity.modelId = centerModelId;
        this.activeSketch.entities.push(centerEntity);
        
        // Register center point in connection points
        this.connectionPoints.set(centerPointId, {
          id: centerPointId,
          position: centerEntity.params.position,
          connectedEntities: [entityId]
        });
        
        // Store reference to center point in circle entity
        entity.params.centerPointId = centerPointId;
        
        // Now create the circle geometry
        geometry = this.createCircleGeometry(entity.params);
        break;
      // Add more entity types...
    }

    if (geometry) {
      geometry = this.transformToSketchPlane(geometry);
      const modelId = modelStore.addModel(geometry, `${type}_${entityId}`);
      entity.modelId = modelId;
      notifyModelChanged({ id: modelId, geometry, isVisible: true });
      
      // If this is a point, add it to the connection points map
      if (type === 'point') {
        this.connectionPoints.set(entityId, {
          id: entityId,
          position: entity.params.position,
          connectedEntities: []
        });
      }
    }

    this.activeSketch.entities.push(entity);
    
    // Record history
    this.#recordHistory({
      undo: () => this.deleteEntity(entity.id),
      redo: () => {
        this.activeSketch.entities.push(entity);
        modelStore.addModel(geometry, entity.modelId);
      }
    });

    return entity;
  }

  // [Enhanced update/delete methods with history tracking]
  updateEntity(entityId, newParams) {
    const sketch = this.activeSketch;
    if (!sketch) throw new Error('No active sketch');
    
    const entity = sketch.entities.find(e => e.id === entityId);
    if (!entity) throw new Error('Entity not found');

    const oldParams = { ...entity.params };
    entity.params = { ...entity.params, ...newParams };
    entity.updatedAt = new Date();

    // Regenerate geometry
    let geometry;
    switch (entity.type) {
      case 'point':
        geometry = this.createPointGeometry(entity.params);
        
        // Update the connection point in the map
        if (this.connectionPoints.has(entityId)) {
          const connectionPoint = this.connectionPoints.get(entityId);
          connectionPoint.position = entity.params.position;
          this.connectionPoints.set(entityId, connectionPoint);
          
          // Update any connected entities that reference this point
          connectionPoint.connectedEntities.forEach(connectedId => {
            const connectedEntity = sketch.entities.find(e => e.id === connectedId);
            if (connectedEntity) {
              if (connectedEntity.type === 'line') {
                if (connectedEntity.params.startPointId === entityId) {
                  connectedEntity.params.startPoint = entity.params.position;
                } else if (connectedEntity.params.endPointId === entityId) {
                  connectedEntity.params.endPoint = entity.params.position;
                }
                
                // Update the line geometry
                const lineGeometry = this.createLineGeometry(connectedEntity.params);
                const transformedLineGeometry = this.transformToSketchPlane(lineGeometry);
                modelStore.updateModel(connectedEntity.modelId, transformedLineGeometry);
                notifyModelChanged({ id: connectedEntity.modelId, geometry: transformedLineGeometry });
              } else if (connectedEntity.type === 'circle') {
                // Check if this point is a center of a circle
                if (connectedEntity.params.centerPointId === entityId) {
                  // Update circle center position
                  connectedEntity.params.center = entity.params.position;
                  
                  // Update the circle geometry
                  const circleGeometry = this.createCircleGeometry(connectedEntity.params);
                  const transformedCircleGeometry = this.transformToSketchPlane(circleGeometry);
                  modelStore.updateModel(connectedEntity.modelId, transformedCircleGeometry);
                  notifyModelChanged({ id: connectedEntity.modelId, geometry: transformedCircleGeometry });
                }
              }
              // Add handling for other entity types as needed
            }
          });
        }
        break;
      case 'line':
        geometry = this.createLineGeometry(entity.params);
        break;
      case 'rectangle':
        geometry = this.createRectangleGeometry(entity.params);
        break;
      case 'circle':
        geometry = this.createCircleGeometry(entity.params);
        // If center parameter changed, also update the center point entity
        if (newParams.center && entity.params.centerPointId) {
          const centerPointEntity = sketch.entities.find(e => e.id === entity.params.centerPointId);
          if (centerPointEntity) {
            // Update the center point position
            centerPointEntity.params.position = newParams.center;
            
            // Update the center point geometry
            const centerGeometry = this.createPointGeometry(centerPointEntity.params);
            const transformedCenterGeometry = this.transformToSketchPlane(centerGeometry);
            modelStore.updateModel(centerPointEntity.modelId, transformedCenterGeometry);
            notifyModelChanged({ id: centerPointEntity.modelId, geometry: transformedCenterGeometry });
            
            // Update the connection point
            if (this.connectionPoints.has(entity.params.centerPointId)) {
              const connectionPoint = this.connectionPoints.get(entity.params.centerPointId);
              connectionPoint.position = newParams.center;
              this.connectionPoints.set(entity.params.centerPointId, connectionPoint);
            }
          }
        }
        break;
      // Handle other types...
    }

    if (geometry) {
      geometry = this.transformToSketchPlane(geometry);
      modelStore.updateModel(entity.modelId, geometry);
      notifyModelChanged({ id: entity.modelId, geometry });
    }

    // Record history
    this.#recordHistory({
      undo: () => this.updateEntity(entityId, oldParams),
      redo: () => this.updateEntity(entityId, newParams)
    });

    return entity;
  }

  deleteEntity(entityId) {
    const sketch = this.activeSketch;
    if (!sketch) throw new Error('No active sketch');
    
    const index = sketch.entities.findIndex(e => e.id === entityId);
    if (index === -1) return;

    const [deleted] = sketch.entities.splice(index, 1);
    
    // Store information for undo/redo operations
    const deletedEntityInfo = {
      entity: { ...deleted },
      geometry: modelStore.getModel(deleted.modelId)?.geometry,
      index
    };
    
    // Remove the model
    modelStore.removeModel(deleted.modelId);
    notifyModelChanged({ id: deleted.modelId, removed: true });
    
    // Special handling for different entity types
    if (deleted.type === 'point') {
      // If this is a point, remove it from connection points and handle connected entities
      if (this.connectionPoints.has(entityId)) {
        const connectionPoint = this.connectionPoints.get(entityId);
        
        // Remove references to this point from connected entities
        connectionPoint.connectedEntities.forEach(connectedId => {
          const connectedEntity = sketch.entities.find(e => e.id === connectedId);
          if (connectedEntity) {
            if (connectedEntity.type === 'line') {
              // If the line was connected to this point, delete the line too
              this.deleteEntity(connectedId);
            } else if (connectedEntity.type === 'circle') {
              // If the circle was using this point as center, delete the circle too
              if (connectedEntity.params.centerPointId === entityId) {
                this.deleteEntity(connectedId);
              }
            }
          }
        });
        
        // Remove the point from the connection points map
        this.connectionPoints.delete(entityId);
      }
    } else if (deleted.type === 'circle') {
      // When deleting a circle, check if we need to delete its center point
      if (deleted.params.centerPointId) {
        const centerPointId = deleted.params.centerPointId;
        const connectionPoint = this.connectionPoints.get(centerPointId);
        
        if (connectionPoint) {
          // Remove this circle from the connected entities of the center point
          connectionPoint.connectedEntities = connectionPoint.connectedEntities.filter(id => id !== entityId);
          
          // If this was the only entity using this center point, delete the center point
          if (connectionPoint.connectedEntities.length === 0) {
            // Find and delete the center point entity
            const centerPointIndex = sketch.entities.findIndex(e => e.id === centerPointId);
            if (centerPointIndex !== -1) {
              const [centerPoint] = sketch.entities.splice(centerPointIndex, 1);
              modelStore.removeModel(centerPoint.modelId);
              notifyModelChanged({ id: centerPoint.modelId, removed: true });
              
              // Remove from connection points map
              this.connectionPoints.delete(centerPointId);
            }
          } else {
            // Update the connection point map to reflect the removed connection
            this.connectionPoints.set(centerPointId, connectionPoint);
          }
        }
      }
    }
    
    // Record in history
    this.#recordHistory({
      undo: () => {
        sketch.entities.splice(deletedEntityInfo.index, 0, deletedEntityInfo.entity);
        if (deletedEntityInfo.geometry) {
          modelStore.addModel(deletedEntityInfo.geometry, deletedEntityInfo.entity.modelId);
          notifyModelChanged({ id: deletedEntityInfo.entity.modelId, geometry: deletedEntityInfo.geometry });
        }
      },
      redo: () => this.deleteEntity(entityId)
    });
  }
  
  // Create a connection between two points
  createConnection(pointId1, pointId2) {
    if (!this.activeSketch) throw new Error('No active sketch');
    
    // Verify both points exist
    if (!this.connectionPoints.has(pointId1) || !this.connectionPoints.has(pointId2)) {
      throw new Error('One or both points do not exist');
    }
    
    const point1 = this.connectionPoints.get(pointId1);
    const point2 = this.connectionPoints.get(pointId2);
    
    // Create a line entity connecting the two points
    const lineParams = {
      startPoint: point1.position,
      endPoint: point2.position,
      startPointId: pointId1,
      endPointId: pointId2
    };
    
    const lineEntity = this.addEntity('line', lineParams);
    
    // Update the connected entities for both points
    point1.connectedEntities.push(lineEntity.id);
    point2.connectedEntities.push(lineEntity.id);
    
    this.connectionPoints.set(pointId1, point1);
    this.connectionPoints.set(pointId2, point2);
    
    return lineEntity;
  }

  // [Undo/Redo implementation]
  #recordHistory(action) {
    this.history = this.history.slice(0, this.currentHistoryIndex + 1);
    this.history.push(action);
    this.currentHistoryIndex++;
  }

  undo() {
    if (this.currentHistoryIndex < 0) return;
    const action = this.history[this.currentHistoryIndex];
    action.undo();
    this.currentHistoryIndex--;
  }

  redo() {
    if (this.currentHistoryIndex >= this.history.length - 1) return;
    this.currentHistoryIndex++;
    const action = this.history[this.currentHistoryIndex];
    action.redo();
  }

  // [Constraint system implementation]
  #applyConstraints(entity) {
    switch (entity.type) {
      case 'line':
        if (entity.constraints?.length) {
          const dx = entity.params.endPoint[0] - entity.params.startPoint[0];
          const dy = entity.params.endPoint[1] - entity.params.startPoint[1];
          const currentLength = Math.hypot(dx, dy);
          if (currentLength === 0) return;
          
          const scale = entity.constraints.length / currentLength;
          entity.params.endPoint = [
            entity.params.startPoint[0] + dx * scale,
            entity.params.startPoint[1] + dy * scale
          ];
        }
        break;
      case 'circle':
        if (entity.constraints?.radius) {
          entity.params.radius = entity.constraints.radius;
        }
        break;
    }
  }

  // [Grid snapping implementation]
  #applyGridSnapping(type, params) {
    const snap = (point) => [
      Math.round(point[0] / this.grid.spacing) * this.grid.spacing,
      Math.round(point[1] / this.grid.spacing) * this.grid.spacing
    ];

    switch (type) {
      case 'point':
        return {
          ...params,
          position: snap(params.position)
        };
      case 'line':
        return {
          ...params,
          startPoint: snap(params.startPoint),
          endPoint: snap(params.endPoint)
        };
      case 'rectangle':
        return {
          ...params,
          center: snap(params.center),
          width: Math.round(params.width / this.grid.spacing) * this.grid.spacing,
          height: Math.round(params.height / this.grid.spacing) * this.grid.spacing
        };
      case 'circle':
        return {
          ...params,
          center: snap(params.center),
          radius: Math.round(params.radius / this.grid.spacing) * this.grid.spacing
        };
      default:
        return params;
    }
  }

  // Split incoming params into resolved numeric params (for geometry) and a map
  // of dimension->parameterName bindings for any dimension given as a string.
  #resolveEntityParams(params) {
    const bindings = {};
    const resolved = { ...params };
    const dimensionKeys = ['width', 'height', 'radius', 'innerRadius', 'outerRadius', 'size'];

    for (const key of dimensionKeys) {
      if (typeof resolved[key] === 'string') {
        bindings[key] = resolved[key];
        resolved[key] = this.#resolveValue(resolved[key]);
      }
    }

    return { resolved, bindings };
  }

  // Resolve a value that may be a number or a parameter-name string.
  #resolveValue(value) {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const params = this.activeSketch ? this.activeSketch.parameters : null;
      if (params && typeof params[value] === 'number') return params[value];
      const parsed = parseFloat(value);
      return Number.isNaN(parsed) ? 0 : parsed;
    }
    return value;
  }

  // Define or update a named parameter and rebuild everything bound to it:
  // every entity dimension bound to the parameter, and the linked extrusion.
  setParameter(name, value) {
    const sketch = this.activeSketch;
    if (!sketch) throw new Error('No active sketch');
    if (!name || typeof name !== 'string') throw new Error('Parameter name is required');

    const numeric = typeof value === 'number' ? value : parseFloat(value);
    if (Number.isNaN(numeric)) throw new Error(`Parameter value must be numeric, got: ${value}`);

    sketch.parameters[name] = numeric;

    // Update every entity dimension bound to this parameter.
    for (const entity of [...sketch.entities]) {
      if (!entity.bindings) continue;
      const changed = {};
      for (const [dimKey, paramName] of Object.entries(entity.bindings)) {
        if (paramName === name) changed[dimKey] = numeric;
      }
      if (Object.keys(changed).length > 0) {
        this.updateEntity(entity.id, changed);
      }
    }

    // Re-solve constraints (e.g. a distance bound to this parameter) and keep
    // the linked extrusion in sync. Solving rebuilds the extrusion itself.
    if (sketch.constraints && sketch.constraints.length > 0) {
      this.#solveSketchConstraints(sketch);
    } else if (sketch.extrusion) {
      this.#rebuildExtrusion(sketch);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('openshape:parametersChanged', {
        detail: { sketchId: sketch.id, name, value: numeric, parameters: { ...sketch.parameters } }
      }));
    }

    return { ...sketch.parameters };
  }

  // Get the current parameter map for the active sketch.
  getParameters() {
    return this.activeSketch ? { ...this.activeSketch.parameters } : {};
  }

  // Rebuild the solid produced from a sketch's current profile + parametric
  // extrude height, updating the existing model in place.
  #rebuildExtrusion(sketch) {
    const ext = sketch.extrusion;
    if (!ext) return;

    const profile = this.#buildExtrudableProfile(sketch);
    if (!profile) return;

    const height = this.#resolveValue(ext.height);
    const extruded = jscad.extrusions.extrudeLinear({ height, twistAngle: 0 }, profile);
    const oriented = this.#orientToSketchPlane(extruded, sketch);

    modelStore.updateModel(ext.modelId, { geometry: oriented });
    notifyModelChanged({ id: ext.modelId, geometry: oriented, isVisible: true });
  }

  // Add a geometric relation between sketch entities, then solve the sketch.
  // Supported: coincident, horizontal, vertical, parallel, perpendicular,
  // equal, distance (a.k.a length), and fixed. Line-based constraints accept a
  // line entity id (created via connectPoints) or two point ids; coincident and
  // fixed take point ids. `value` (for distance) may be a number or the name of
  // a sketch parameter.
  addConstraint(type, entities = [], value) {
    const sketch = this.activeSketch;
    if (!sketch) throw new Error('No active sketch');

    const supported = ['coincident', 'horizontal', 'vertical', 'parallel', 'perpendicular', 'equal', 'distance', 'length', 'fixed'];
    if (!supported.includes(type)) {
      throw new Error(`Unsupported constraint type: ${type}`);
    }

    const constraint = {
      id: `constraint_${sketch.id}_${sketch.constraints.length + 1}`,
      type,
      entities: Array.isArray(entities) ? [...entities] : [entities],
      value
    };

    if (type === 'fixed') {
      const pt = sketch.entities.find(e => e.id === constraint.entities[0] && e.type === 'point');
      if (!pt) throw new Error('fixed constraint requires a point entity id');
      pt.params.fixed = true;
    }

    sketch.constraints.push(constraint);

    this.#solveSketchConstraints(sketch);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('openshape:constraintAdded', {
        detail: { sketchId: sketch.id, constraint }
      }));
    }

    return constraint;
  }

  getConstraints() {
    return this.activeSketch ? this.activeSketch.constraints.map(c => ({ ...c })) : [];
  }

  // Map a stored constraint into the solver's schema, resolving line entities to
  // their endpoint point ids and parametric distance values to numbers.
  #resolveConstraintForSolver(sketch, c) {
    const lineEndpoints = (ref) => {
      const ent = sketch.entities.find(e => e.id === ref);
      if (ent && ent.type === 'line' && ent.params.startPointId && ent.params.endPointId) {
        return [ent.params.startPointId, ent.params.endPointId];
      }
      return null;
    };

    switch (c.type) {
      case 'coincident':
        return { type: 'coincident', a: c.entities[0], b: c.entities[1] };
      case 'horizontal':
      case 'vertical':
      case 'distance':
      case 'length': {
        let line = lineEndpoints(c.entities[0]);
        if (!line && c.entities.length >= 2) line = [c.entities[0], c.entities[1]];
        if (!line) return null;
        const out = { type: c.type === 'length' ? 'distance' : c.type, line };
        if (c.type === 'distance' || c.type === 'length') out.value = this.#resolveValue(c.value);
        return out;
      }
      case 'parallel':
      case 'perpendicular':
      case 'equal': {
        const l1 = lineEndpoints(c.entities[0]);
        const l2 = lineEndpoints(c.entities[1]);
        if (!l1 || !l2) return null;
        return { type: c.type, line1: l1, line2: l2 };
      }
      default:
        return null;
    }
  }

  // Solve all constraints on a sketch and write updated point positions back
  // (regenerating connected lines and any linked extrusion).
  #solveSketchConstraints(sketch = this.activeSketch) {
    if (!sketch || !sketch.constraints || sketch.constraints.length === 0) return;

    const pointEntities = sketch.entities.filter(e => e.type === 'point');
    if (pointEntities.length === 0) return;

    // Anchor the first point when nothing is explicitly fixed so the solve is
    // well-posed and the sketch doesn't drift.
    const anyFixed = pointEntities.some(e => e.params.fixed);
    const inputPoints = pointEntities.map((e, idx) => ({
      id: e.id,
      x: e.params.position[0],
      y: e.params.position[1],
      fixed: e.params.fixed ? true : (!anyFixed && idx === 0)
    }));

    const solverConstraints = sketch.constraints
      .map(c => this.#resolveConstraintForSolver(sketch, c))
      .filter(Boolean);

    if (solverConstraints.length === 0) return;

    const solved = solveConstraints(inputPoints, solverConstraints);

    for (const e of pointEntities) {
      const p = solved.get(e.id);
      if (!p) continue;
      const cur = e.params.position;
      if (Math.abs(cur[0] - p.x) > 1e-9 || Math.abs(cur[1] - p.y) > 1e-9) {
        this.updateEntity(e.id, { position: [p.x, p.y] });
      }
    }

    if (sketch.extrusion) {
      this.#rebuildExtrusion(sketch);
    }
  }

  // [Layer management]
  toggleLayerVisibility(layerId) {
    const layer = this.layers[layerId];
    if (layer) {
      layer.visible = !layer.visible;
      Object.values(this.sketches).forEach(sketch => {
        if (sketch.layer === layerId) {
          modelStore.setModelVisibility(sketch.planeModelId, layer.visible);
          sketch.entities.forEach(entity => {
            modelStore.setModelVisibility(entity.modelId, layer.visible);
          });
        }
      });
    }
  }

  // [Enhanced extrusion validation]
  extrudeActiveSketch(height = 5) {
    if (!this.activeSketch || this.activeSketch.entities.length === 0) {
      throw new Error('No active sketch or sketch is empty');
    }

    // Build a real 2D profile (JSCAD geom2) from the sketch's closed shapes.
    // Points and open segments are ignored - they can't define a solid.
    const profile = this.#buildExtrudableProfile(this.activeSketch);
    if (!profile) {
      throw new Error(
        'Sketch has no closed profile to extrude. Draw a rectangle, circle, or a closed loop of lines first.'
      );
    }

    // Height may itself be parametric (a parameter-name string). Keep the
    // authored value on the sketch so parameter changes can re-extrude.
    const resolvedHeight = this.#resolveValue(height);

    // extrudeLinear extrudes a 2D profile along +Z; reorient the result onto
    // the sketch plane (and apply the plane offset) so YZ/XZ sketches extrude
    // along the correct axis.
    const extruded = jscad.extrusions.extrudeLinear({ height: resolvedHeight, twistAngle: 0 }, profile);
    const oriented = this.#orientToSketchPlane(extruded, this.activeSketch);

    const modelId = modelStore.addModel(oriented, `extrusion_${this.activeSketch.id}`);
    // Remember the sketch -> solid link (with the authored, possibly parametric
    // height) so setParameter() can rebuild this solid in place.
    this.activeSketch.extrusion = { modelId, height };
    notifyModelChanged({ id: modelId, geometry: oriented, isVisible: true });

    // Let the viewer frame the freshly created solid (e.g. isometric view) so
    // the extruded 3D result is obvious instead of being seen edge-on.
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('openshape:sketchExtruded', { detail: { modelId } }));
    }

    return modelId;
  }

  // Build a single 2D profile (geom2) from the closed shapes in the active
  // sketch. Rectangles and circles map directly to JSCAD primitives; connected
  // line segments are assembled into a closed polygon. Multiple profiles are
  // unioned together. Returns null when there is nothing extrudable.
  #buildExtrudableProfile(sketch = this.activeSketch) {
    const profiles = [];
    const lineSegments = [];

    for (const entity of sketch.entities) {
      if (entity.type === 'rectangle') {
        const { center = [0, 0], width, height } = entity.params;
        if (width > 0 && height > 0) {
          profiles.push(jscad.primitives.rectangle({ size: [width, height], center }));
        }
      } else if (entity.type === 'circle') {
        const { center = [0, 0], radius } = entity.params;
        if (radius > 0) {
          profiles.push(jscad.primitives.circle({ radius, center, segments: 64 }));
        }
      } else if (entity.type === 'line') {
        const { startPoint, endPoint } = entity.params;
        if (startPoint && endPoint) {
          lineSegments.push([startPoint, endPoint]);
        }
      }
    }

    // Try to turn connected line segments into a closed polygon profile.
    const loop = this.#assembleClosedLoop(lineSegments);
    if (loop && loop.length >= 3) {
      try {
        profiles.push(jscad.geometries.geom2.fromPoints(loop));
      } catch (e) {
        console.warn('[SketchManager] Could not build polygon from line segments:', e);
      }
    }

    if (profiles.length === 0) return null;
    return profiles.length === 1 ? profiles[0] : jscad.booleans.union(profiles);
  }

  // Chain 2D line segments into an ordered, closed loop of vertices.
  // Returns null if the segments do not form a single closed loop.
  #assembleClosedLoop(segments) {
    if (!segments || segments.length < 3) return null;

    const tol = 1e-6;
    const eq = (a, b) => Math.abs(a[0] - b[0]) < tol && Math.abs(a[1] - b[1]) < tol;

    const remaining = segments.map(s => [[...s[0]], [...s[1]]]);
    const start = remaining[0][0];
    const path = [start, remaining[0][1]];
    remaining.splice(0, 1);

    while (remaining.length > 0) {
      const tail = path[path.length - 1];
      let idx = -1;
      let next = null;
      for (let i = 0; i < remaining.length; i++) {
        if (eq(remaining[i][0], tail)) { idx = i; next = remaining[i][1]; break; }
        if (eq(remaining[i][1], tail)) { idx = i; next = remaining[i][0]; break; }
      }
      if (idx === -1) return null; // open or disconnected chain

      remaining.splice(idx, 1);

      // Closing segment consumed and loop returns to the start: done.
      if (remaining.length === 0 && eq(next, start)) {
        return path;
      }
      path.push(next);
    }

    // All segments consumed and the chain closes back to the start.
    return eq(path[path.length - 1], start) ? path.slice(0, -1) : null;
  }

  // Reorient a solid that was extruded along +Z so it lies on the active
  // sketch plane, respecting the plane offset. Uses a 4x4 transform that maps
  // local axes (2D-x, 2D-y, extrude) onto the plane's world axes.
  #orientToSketchPlane(solid, sketch = this.activeSketch) {
    // extrudeLinear extrudes a profile from local z=0 along +z. The frame maps
    // local (a, b, t) -> origin + a*u + b*v + t*w, placing and orienting the
    // solid onto the sketch plane (base, offset, or arbitrary).
    const frame = sketch.frame || basePlaneFrame(sketch.plane, sketch.offset || 0);
    return jscad.transforms.transform(frameMatrix(frame), solid);
  }

  // [Selection management]
  setSelectedEntities(entityIds) {
    this.selectedEntities = new Set(entityIds);
    this.#emitSelectionEvent();
  }

  #emitSelectionEvent() {
    const event = new CustomEvent('openshape:selectionChanged', {
      detail: Array.from(this.selectedEntities)
    });
    window.dispatchEvent(event);
  }

  // Implementation of missing methods
  
  // Parameters validation and sanitization
  #sanitizeParams(type, params) {
    const sanitized = {...params};
    
    switch (type) {
      case 'point':
        if (!Array.isArray(sanitized.position) || sanitized.position.length < 2) {
          sanitized.position = [0, 0];
        }
        if (typeof sanitized.size !== 'number' || sanitized.size <= 0) {
          sanitized.size = 0.2; // Default point visualization size
        }
        break;
        
      case 'line':
        if (!Array.isArray(sanitized.startPoint) || sanitized.startPoint.length < 2) {
          sanitized.startPoint = [0, 0];
        }
        if (!Array.isArray(sanitized.endPoint) || sanitized.endPoint.length < 2) {
          sanitized.endPoint = [1, 0];
        }
        break;
        
      case 'rectangle':
        if (!Array.isArray(sanitized.center) || sanitized.center.length < 2) {
          sanitized.center = [0, 0];
        }
        if (typeof sanitized.width !== 'number' || sanitized.width <= 0) {
          sanitized.width = 1;
        }
        if (typeof sanitized.height !== 'number' || sanitized.height <= 0) {
          sanitized.height = 1;
        }
        break;
        
      case 'circle':
        if (!Array.isArray(sanitized.center) || sanitized.center.length < 2) {
          sanitized.center = [0, 0];
        }
        if (typeof sanitized.radius !== 'number' || sanitized.radius <= 0) {
          sanitized.radius = 1;
        }
        break;
        
      // Add more types as needed
    }
    
    return sanitized;
  }
  
  // Transform 2D geometry to the active sketch plane
  transformToSketchPlane(geometry) {
    if (!this.activeSketch) throw new Error('No active sketch');
    
    const frame = this.activeSketch.frame || basePlaneFrame(this.activeSketch.plane, this.activeSketch.offset || 0);

    // Special handling for point geometry
    if (geometry.type === 'point') {
      const position3D = to3D(frame, geometry.position);

      // Create a small sphere to represent the point
      return jscad.primitives.sphere({ 
        center: position3D, 
        radius: geometry.size || 0.2,
        segments: 8 // Lower segment count for better performance
      });
    }
    
    // Special handling for sketch entities with points array (like circles, lines)
    if (geometry.points && Array.isArray(geometry.points)) {
      // For sketch entities, preserve the 2D points but also embed the 3D points
      // mapped onto the sketch frame so the viewer can render the outline at the
      // correct location/orientation for any plane (base, offset, or arbitrary).
      const offset = this.activeSketch.offset || 0;
      const points3D = geometry.points.map(p => to3D(frame, p));

      const transformedGeometry = {
        ...geometry,
        metadata: {
          ...(geometry.metadata || {}),
          sketchOffset: offset,
          sketchPlane: this.activeSketch.plane,
          points3D
        }
      };

      return transformedGeometry;
    }
    
    // Check if we have at least 3 points to create a proper polygon
    if (!geometry.points || geometry.points.length < 3) {
      console.warn('Geometry has less than 3 points, which may not be suitable for creating a polygon');
      
      // If we have 2 points, create a third point to form a triangle
      if (geometry.points && geometry.points.length === 2) {
        const [p1, p2] = geometry.points;
        // Calculate a perpendicular vector to form a triangle
        const dx = p2[0] - p1[0];
        const dy = p2[1] - p1[1];
        const perpLength = 0.1; // Small perpendicular offset
        const perpX = -dy * perpLength;
        const perpY = dx * perpLength;
        
        // Add a third point perpendicular to the line
        geometry.points.push([p1[0] + perpX, p1[1] + perpY]);
      } else if (!geometry.points || geometry.points.length < 2) {
        console.error('Cannot transform geometry with less than 2 points');
        return null;
      }
    }
    
    try {
      // Map 2D points to 3D based on the active sketch plane
      const points3D = geometry.points.map(point => {
        const [x, y] = point;
        const offset = this.activeSketch.offset || 0;
        
        switch (this.activeSketch.plane) {
          case 'yz':
            // X is fixed, Y and Z are variable
            return [offset, x, y];
          case 'xz':
            // Y is fixed, X and Z are variable
            return [x, offset, y];
          case 'custom':
            // Custom plane logic would go here
            // For now, treating it as XY plane with offset Z
            return [x, y, offset];
          case 'xy':
          default:
            // Z is fixed, X and Y are variable
            return [x, y, offset];
        }
      });
      
      // Create a 3D polygon from the points
      return jscad.primitives.polygon({ points: points3D });
    } catch (error) {
      console.error('Error transforming geometry to sketch plane:', error, geometry);
      return null;
    }
  }
  
  // Create geometry for a point
  createPointGeometry(params) {
    const { position, size = 0.2 } = params;
    
    // Return a specialized point geometry that will be handled in transformToSketchPlane
    return {
      type: 'point',
      position,
      size
    };
  }
  
  // Create geometry for a line
  createLineGeometry(params) {
    const { startPoint, endPoint } = params;
    
    // Return a geometry that has points property for consistency
    return {
      points: [startPoint, endPoint]
    };
  }
  
  // Create geometry for a rectangle
  createRectangleGeometry(params) {
    const { center, width, height } = params;
    const [cx, cy] = center;
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    
    // Create points for the rectangle corners
    const points = [
      [cx - halfWidth, cy - halfHeight],
      [cx + halfWidth, cy - halfHeight],
      [cx + halfWidth, cy + halfHeight],
      [cx - halfWidth, cy + halfHeight]
    ];
    
    return { points };
  }
  
  // Create geometry for a circle
  createCircleGeometry(params) {
    const { center, radius } = params;
    const [cx, cy] = center;
    
    // Approximate a circle with points (enough for visualization)
    const numSegments = 32;
    const points = [];
    
    for (let i = 0; i < numSegments; i++) {
      const angle = (i / numSegments) * Math.PI * 2;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      points.push([x, y]);
    }
    
    // Return geometry with metadata
    return { 
      points,
      metadata: {
        type: 'circle',
        center: center,
        radius: radius,
        centerPointId: params.centerPointId,
        sketchOffset: this.activeSketch ? this.activeSketch.offset : 0
      }
    };
  }

  // Get the active sketch
  getActiveSketch() {
    return this.activeSketch;
  }
  
  // Get all available connection points
  getConnectionPoints() {
    return Array.from(this.connectionPoints.values());
  }
  
  // Find the closest connection point to a given position
  findClosestConnectionPoint(position, maxDistance = 0.5) {
    let closest = null;
    let minDistance = maxDistance;
    
    for (const [id, point] of this.connectionPoints.entries()) {
      const dx = point.position[0] - position[0];
      const dy = point.position[1] - position[1];
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < minDistance) {
        minDistance = distance;
        closest = { id, point, distance };
      }
    }
    
    return closest;
  }
}

// Singleton instance
const sketchManager = new SketchManager();
export default sketchManager;