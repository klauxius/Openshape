// Sketch Manager for OpenShape
// Handles creation and management of 2D sketches

import * as jscad from '@jscad/modeling';
import { modelStore, notifyModelChanged } from './mcpTools';

class SketchManager {
  constructor() {
    this.activeSketch = null;
    this.sketches = {};
    this.nextSketchId = 1;
    this.isInSketchMode = false;
  }

  /**
   * Create a new sketch on the specified plane
   * @param {Object} planeInfo - Information about the sketch plane
   * @param {string} planeInfo.plane - Plane identifier (xy, yz, xz, or custom)
   * @param {number} planeInfo.offset - Offset from origin for custom planes
   * @returns {Object} The created sketch
   */
  createSketch(planeInfo) {
    const sketchId = `sketch_${this.nextSketchId++}`;
    
    // Create a sketch object to track sketch state
    const sketch = {
      id: sketchId,
      name: `Sketch ${this.nextSketchId - 1}`,
      plane: planeInfo.plane,
      offset: planeInfo.offset,
      entities: [],
      createdAt: new Date(),
      isActive: true
    };
    
    // Create a visual representation of the sketch plane
    const planeSize = 50; // Size of the sketch plane visual
    const halfSize = planeSize / 2;
    
    // Generate different geometries based on plane
    let planeGeometry;
    
    // Define planes for each standard orientation
    switch (planeInfo.plane) {
      case 'yz':
        // YZ plane (looking towards positive X)
        planeGeometry = jscad.primitives.polygon({
          points: [
            [0, -halfSize, -halfSize],  // bottom-left
            [0, halfSize, -halfSize],   // top-left
            [0, halfSize, halfSize],    // top-right
            [0, -halfSize, halfSize]    // bottom-right
          ]
        });
        break;
      case 'xz':
        // XZ plane (looking towards positive Y)
        planeGeometry = jscad.primitives.polygon({
          points: [
            [-halfSize, 0, -halfSize],  // bottom-left
            [halfSize, 0, -halfSize],   // bottom-right
            [halfSize, 0, halfSize],    // top-right
            [-halfSize, 0, halfSize]    // top-left
          ]
        });
        break;
      case 'custom':
        // For custom planes, we'll use XY plane with an offset along Z
        planeGeometry = jscad.primitives.polygon({
          points: [
            [-halfSize, -halfSize, planeInfo.offset],
            [halfSize, -halfSize, planeInfo.offset],
            [halfSize, halfSize, planeInfo.offset],
            [-halfSize, halfSize, planeInfo.offset]
          ]
        });
        break;
      case 'xy':
      default:
        // XY plane (looking towards positive Z)
        planeGeometry = jscad.primitives.polygon({
          points: [
            [-halfSize, -halfSize, 0],
            [halfSize, -halfSize, 0],
            [halfSize, halfSize, 0],
            [-halfSize, halfSize, 0]
          ]
        });
        break;
    }
    
    // Create a thin extrusion to visualize the sketch plane
    const planeVisualization = jscad.extrusions.extrudeLinear({ 
      height: 0.1,
      twistAngle: 0,
      twistSteps: 1
    }, planeGeometry);
    
    // Add to model store as a visible plane
    const planeModelId = modelStore.addModel(planeVisualization, `${sketch.name} Plane`);
    sketch.planeModelId = planeModelId;
    
    // Store the sketch
    this.sketches[sketchId] = sketch;
    
    // Set as active sketch
    this.activeSketch = sketch;
    this.isInSketchMode = true;
    
    // Notify the 3D viewer about the new sketch plane
    notifyModelChanged({
      id: planeModelId,
      geometry: planeVisualization,
      name: `${sketch.name} Plane`,
      isVisible: true,
      isSketchPlane: true
    });
    
    // Emit an event to notify the application that we're in sketch mode
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('openshape:sketchModeChanged', { 
        detail: { 
          active: true,
          sketch: sketch
        }
      });
      window.dispatchEvent(event);
    }
    
    return sketch;
  }
  
  /**
   * Exit sketch mode
   */
  exitSketchMode() {
    if (!this.isInSketchMode) return;
    
    this.isInSketchMode = false;
    
    // Emit an event to notify the application
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('openshape:sketchModeChanged', { 
        detail: { 
          active: false,
          sketch: this.activeSketch
        }
      });
      window.dispatchEvent(event);
    }
    
    this.activeSketch = null;
  }
  
  /**
   * Add a sketch entity
   * @param {string} type - Entity type (line, rectangle, circle, etc.)
   * @param {Object} params - Entity parameters
   * @returns {Object} The created entity
   */
  addEntity(type, params) {
    if (!this.activeSketch) {
      throw new Error('No active sketch');
    }
    
    const entityId = `entity_${this.activeSketch.id}_${this.activeSketch.entities.length + 1}`;
    
    const entity = {
      id: entityId,
      type,
      params,
      createdAt: new Date()
    };
    
    this.activeSketch.entities.push(entity);
    
    // Create geometry for the entity based on type
    let geometry;
    let modelId;
    
    switch (type) {
      case 'line':
        geometry = this.createLineGeometry(params);
        break;
      case 'rectangle':
        geometry = this.createRectangleGeometry(params);
        break;
      case 'circle':
        geometry = this.createCircleGeometry(params);
        break;
      // Add more entity types as needed
    }
    
    if (geometry) {
      // Apply plane transformation
      geometry = this.transformToSketchPlane(geometry);
      
      // Add to model store
      modelId = modelStore.addModel(geometry, `${entity.type}_${entityId}`);
      entity.modelId = modelId;
      
      // Notify the 3D viewer
      notifyModelChanged({
        id: modelId,
        geometry,
        name: `${entity.type}_${entityId}`,
        isVisible: true,
        isSketchEntity: true
      });
    }
    
    return entity;
  }
  
  /**
   * Create line geometry
   * @private
   */
  createLineGeometry(params) {
    const { startPoint, endPoint, thickness = 0.5 } = params;
    
    // Create a path for the line
    const points = [
      [startPoint[0], startPoint[1]],
      [endPoint[0], endPoint[1]]
    ];
    
    // For our transformToSketchPlane to work properly, we need to create
    // a polygon that represents the line with thickness
    // We'll approximate the line as a thin rectangle
    const vector = [
      endPoint[0] - startPoint[0],
      endPoint[1] - startPoint[1]
    ];
    const length = Math.sqrt(vector[0]*vector[0] + vector[1]*vector[1]);
    
    // If the line has zero length, use a small circle instead
    if (length < 0.001) {
      return {
        points: [
          [startPoint[0] - thickness/2, startPoint[1] - thickness/2],
          [startPoint[0] + thickness/2, startPoint[1] - thickness/2],
          [startPoint[0] + thickness/2, startPoint[1] + thickness/2],
          [startPoint[0] - thickness/2, startPoint[1] + thickness/2]
        ]
      };
    }
    
    // Normalize the vector
    const normalizedVector = [vector[0]/length, vector[1]/length];
    
    // Get perpendicular vector (rotate 90 degrees)
    const perpVector = [-normalizedVector[1], normalizedVector[0]];
    
    // Scale perpendicular vector by half thickness
    const halfThickVector = [perpVector[0] * thickness/2, perpVector[1] * thickness/2];
    
    // Create 4 corners of rectangle
    const rectPoints = [
      [startPoint[0] + halfThickVector[0], startPoint[1] + halfThickVector[1]],
      [endPoint[0] + halfThickVector[0], endPoint[1] + halfThickVector[1]],
      [endPoint[0] - halfThickVector[0], endPoint[1] - halfThickVector[1]],
      [startPoint[0] - halfThickVector[0], startPoint[1] - halfThickVector[1]]
    ];
    
    return { points: rectPoints };
  }
  
  /**
   * Create rectangle geometry
   * @private
   */
  createRectangleGeometry(params) {
    const { width, height, center = [0, 0] } = params;
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    
    // Create the four corners of the rectangle
    const points = [
      [center[0] - halfWidth, center[1] - halfHeight],
      [center[0] + halfWidth, center[1] - halfHeight],
      [center[0] + halfWidth, center[1] + halfHeight],
      [center[0] - halfWidth, center[1] + halfHeight]
    ];
    
    return { points: points };
  }
  
  /**
   * Create circle geometry
   * @private
   */
  createCircleGeometry(params) {
    const { radius, center = [0, 0], segments = 32 } = params;
    
    // Approximate a circle with points
    const points = [];
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = center[0] + radius * Math.cos(angle);
      const y = center[1] + radius * Math.sin(angle);
      points.push([x, y]);
    }
    
    return { points: points };
  }
  
  /**
   * Transform geometry to the active sketch plane
   * @private
   */
  transformToSketchPlane(geometry) {
    if (!this.activeSketch) return geometry;
    
    // First get the 2D points from the geometry
    // Assuming the geometry is a 2D shape in the XY plane
    const points2D = geometry.points || [];
    const halfSize = 50 / 2; // Match the same size as the sketch plane
    
    // Map 2D points to 3D points based on the sketch plane
    let points3D = [];
    
    switch (this.activeSketch.plane) {
      case 'yz':
        // Map to YZ plane (constant X=0)
        points3D = points2D.map(pt => [0, pt[0], pt[1]]);
        break;
      case 'xz':
        // Map to XZ plane (constant Y=0)
        points3D = points2D.map(pt => [pt[0], 0, pt[1]]);
        break;
      case 'custom':
        // Map to XY plane with an offset
        points3D = points2D.map(pt => [pt[0], pt[1], this.activeSketch.offset]);
        break;
      case 'xy':
      default:
        // Map to XY plane (constant Z=0)
        points3D = points2D.map(pt => [pt[0], pt[1], 0]);
        break;
    }
    
    // Create a new polygon with the 3D points
    return jscad.primitives.polygon({ points: points3D });
  }
  
  /**
   * Extrude the active sketch
   * @param {number} height - Extrusion height
   * @returns {string} Model ID of the extruded shape
   */
  extrudeActiveSketch(height) {
    if (!this.activeSketch || this.activeSketch.entities.length === 0) {
      throw new Error('No active sketch or sketch is empty');
    }
    
    // Collect all 2D geometries from the sketch
    const sketchGeometries = this.activeSketch.entities.map(entity => {
      const model = modelStore.getModel(entity.modelId);
      return model ? model.geometry : null;
    }).filter(Boolean);
    
    if (sketchGeometries.length === 0) {
      throw new Error('No valid geometries in sketch');
    }
    
    // Union all geometries if there are multiple entities
    let combinedGeometry;
    if (sketchGeometries.length === 1) {
      combinedGeometry = sketchGeometries[0];
    } else {
      combinedGeometry = jscad.booleans.union(sketchGeometries);
    }
    
    // Extrude the combined geometry
    const extruded = jscad.extrusions.extrudeLinear({ height }, combinedGeometry);
    
    // Add to model store
    const modelId = modelStore.addModel(extruded, `Extruded ${this.activeSketch.name}`);
    
    // Notify the 3D viewer
    notifyModelChanged({
      id: modelId,
      geometry: extruded,
      name: `Extruded ${this.activeSketch.name}`,
      isVisible: true
    });
    
    // Exit sketch mode
    this.exitSketchMode();
    
    return modelId;
  }
  
  /**
   * Get all sketches
   * @returns {Array} Array of sketches
   */
  getAllSketches() {
    return Object.values(this.sketches);
  }
  
  /**
   * Get a sketch by ID
   * @param {string} id - Sketch ID
   * @returns {Object} The sketch, or null if not found
   */
  getSketch(id) {
    return this.sketches[id] || null;
  }
  
  /**
   * Get the active sketch
   * @returns {Object} The active sketch, or null if none
   */
  getActiveSketch() {
    return this.activeSketch;
  }
  
  /**
   * Check if in sketch mode
   * @returns {boolean} Whether in sketch mode
   */
  getIsInSketchMode() {
    return this.isInSketchMode;
  }
}

// Create a singleton instance
const sketchManager = new SketchManager();

export default sketchManager; 