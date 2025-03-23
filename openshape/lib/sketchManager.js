// Enhanced Sketch Manager for OpenShape
// Incorporates modern CAD features and improvements

import * as jscad from '@jscad/modeling';
// Destructure specific JSCAD operations we'll need
const { colorize } = jscad.colors;

import { modelStore, notifyModelChanged } from './mcpTools';

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
    if (!['xy', 'yz', 'xz', 'custom'].includes(planeInfo.plane)) {
      throw new Error('Invalid plane specified');
    }
    if (planeInfo.plane === 'custom' && typeof planeInfo.offset !== 'number') {
      throw new Error('Custom plane requires numeric offset');
    }

    const sketchId = `sketch_${this.nextSketchId++}`;
    const sketch = {
      id: sketchId,
      name: `Sketch ${this.nextSketchId - 1}`,
      plane: planeInfo.plane,
      offset: planeInfo.offset || 0,
      entities: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      layer: layer,
      constraints: {}
    };

    // Create a visualization of the sketch plane
    const planeSize = 10;
    let planeVisualization;
    
    // Use cuboid directly instead of trying to extrude a 2D rectangle
    // This avoids the "slices must have 3 or more edges" error
    switch (planeInfo.plane) {
      case 'yz': {
        // YZ plane at specified X
        planeVisualization = jscad.primitives.cuboid({ 
          size: [0.01, planeSize * 2, planeSize * 2] 
        });
        planeVisualization = jscad.transforms.translate(
          [sketch.offset, 0, 0], 
          planeVisualization
        );
        break;
      }
      case 'xz': {
        // XZ plane at specified Y
        planeVisualization = jscad.primitives.cuboid({ 
          size: [planeSize * 2, 0.01, planeSize * 2] 
        });
        planeVisualization = jscad.transforms.translate(
          [0, sketch.offset, 0], 
          planeVisualization
        );
        break;
      }
      case 'custom':
      case 'xy':
      default: {
        // XY plane at specified Z
        planeVisualization = jscad.primitives.cuboid({ 
          size: [planeSize * 2, planeSize * 2, 0.01] 
        });
        planeVisualization = jscad.transforms.translate(
          [0, 0, sketch.offset], 
          planeVisualization
        );
        break;
      }
    }
    
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
    
    // Determine camera view based on the plane
    let cameraView = 'front'; // default view (XY plane)
    switch (planeInfo.plane) {
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
        sketch, // Include the entire sketch object
        plane: planeInfo.plane,
        cameraView, 
        offset: planeInfo.offset || 0
      }
    });
    window.dispatchEvent(event);
    
    // Also dispatch the sketch mode changed event
    const modeEvent = new CustomEvent('openshape:sketchModeChanged', {
      detail: {
        active: true,
        sketch,
        plane: planeInfo.plane
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
    
    // Apply grid snapping
    if (this.grid.snap) {
      params = this.#applyGridSnapping(type, params);
    }

    const entityId = `entity_${this.activeSketch.id}_${this.activeSketch.entities.length + 1}`;
    const entity = {
      id: entityId,
      type,
      params: this.#sanitizeParams(type, params),
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
            if (connectedEntity && connectedEntity.type === 'line') {
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
    modelStore.removeModel(deleted.modelId);
    notifyModelChanged({ id: deleted.modelId, removed: true });
    
    // If this is a point, remove it from connection points and update any connected entities
    if (deleted.type === 'point' && this.connectionPoints.has(entityId)) {
      const connectionPoint = this.connectionPoints.get(entityId);
      
      // Remove references to this point from connected entities
      connectionPoint.connectedEntities.forEach(connectedId => {
        const connectedEntity = sketch.entities.find(e => e.id === connectedId);
        if (connectedEntity && connectedEntity.type === 'line') {
          // If the line was connected to this point, delete the line too
          this.deleteEntity(connectedId);
        }
      });
      
      // Remove the point from the connection points map
      this.connectionPoints.delete(entityId);
    }
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
  extrudeActiveSketch(height) {
    if (!this.activeSketch || this.activeSketch.entities.length === 0) {
      throw new Error('No active sketch or sketch is empty');
    }

    const sketchGeometries = this.activeSketch.entities
      .map(entity => modelStore.getModel(entity.modelId)?.geometry)
      .filter(Boolean);

    if (sketchGeometries.length === 0) {
      throw new Error('No valid geometries in sketch');
    }

    try {
      jscad.measurements.measureVolume(
        jscad.booleans.union(sketchGeometries)
      );
    } catch (e) {
      throw new Error('Invalid geometry for extrusion');
    }

    // Create extrusion
    const unionGeometry = jscad.booleans.union(sketchGeometries);
    const extruded = jscad.extrusions.extrudeLinear(
      { height, twistAngle: 0 }, 
      unionGeometry
    );
    
    // Add it to model store
    const modelId = modelStore.addModel(extruded, `extrusion_${this.activeSketch.id}`);
    
    // Notify about the new model
    notifyModelChanged({ id: modelId, geometry: extruded, isVisible: true });
    
    return modelId;
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
    
    // Special handling for point geometry
    if (geometry.type === 'point') {
      const position = geometry.position;
      const offset = this.activeSketch.offset || 0;
      let position3D;
      
      switch (this.activeSketch.plane) {
        case 'yz':
          position3D = [offset, position[0], position[1]];
          break;
        case 'xz':
          position3D = [position[0], offset, position[1]];
          break;
        case 'xy':
        default:
          position3D = [position[0], position[1], offset];
          break;
      }
      
      // Create a small sphere to represent the point
      return jscad.primitives.sphere({ 
        center: position3D, 
        radius: geometry.size || 0.2,
        segments: 8 // Lower segment count for better performance
      });
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
    
    return { points };
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