// CAD Operations Library for OpenShape
// Provides a structured interface for standard CAD operations with JSCAD integration

import * as jscad from '@jscad/modeling';
import { modelStore, notifyModelChanged } from './mcpTools';
import sketchManager from './sketchManager';

// Notify observers about operation history changes
const notifyOperationHistoryChanged = () => {
  const event = new CustomEvent('openshape:operationHistoryChanged');
  window.dispatchEvent(event);
};

// Operation history management
const operationHistory = {
  operations: [],
  currentIndex: -1,
  
  addOperation(operation) {
    // If we're in the middle of the history, remove everything after the current point
    if (this.currentIndex < this.operations.length - 1) {
      this.operations = this.operations.slice(0, this.currentIndex + 1);
    }
    
    this.operations.push(operation);
    this.currentIndex = this.operations.length - 1;
    
    // Notify about history change
    notifyOperationHistoryChanged();
  },
  
  undo() {
    if (this.currentIndex >= 0) {
      const operation = this.operations[this.currentIndex];
      if (operation.undo && typeof operation.undo === 'function') {
        operation.undo();
      }
      this.currentIndex--;
      
      // Notify about history change
      notifyOperationHistoryChanged();
      return true;
    }
    return false;
  },
  
  redo() {
    if (this.currentIndex < this.operations.length - 1) {
      this.currentIndex++;
      const operation = this.operations[this.currentIndex];
      if (operation.redo && typeof operation.redo === 'function') {
        operation.redo();
      }
      
      // Notify about history change
      notifyOperationHistoryChanged();
      return true;
    }
    return false;
  },
  
  getOperations() {
    return [...this.operations];
  },
  
  getCurrentIndex() {
    return this.currentIndex;
  }
};

// Base operation class
class CADOperation {
  constructor(params = {}) {
    this.params = params;
    this.timestamp = Date.now();
    this.id = `op_${this.timestamp}`;
    this.type = 'base';
    this.description = 'Base CAD operation';
  }
  
  // Execute the operation and return result
  execute() {
    throw new Error('Not implemented');
  }
  
  // Generate JSCAD code for this operation
  toJscadCode() {
    throw new Error('Not implemented');
  }
  
  // Generate a human-readable description
  getDescription() {
    return this.description;
  }
}

// ===========================
// 1. PRIMITIVE CREATION OPERATIONS
// ===========================

class CreateCubeOperation extends CADOperation {
  constructor(params = {}) {
    super(params);
    this.type = 'createCube';
    this.description = 'Create cube';
  }
  
  execute() {
    const { width = 10, height = 10, depth = 10, position = [0, 0, 0], name = 'Cube' } = this.params;
    
    const cube = jscad.primitives.cuboid({
      size: [width, height, depth]
    });
    
    const positioned = jscad.transforms.translate(position, cube);
    const modelId = modelStore.addModel(positioned, name);
    
    // Add to history with undo/redo
    operationHistory.addOperation({
      type: this.type,
      params: this.params,
      modelId,
      undo: () => modelStore.removeModel(modelId),
      redo: () => {
        const redoCube = jscad.primitives.cuboid({ size: [width, height, depth] });
        const redoPositioned = jscad.transforms.translate(position, redoCube);
        modelStore.addModel(redoPositioned, name, modelId);
      }
    });
    
    notifyModelChanged({ id: modelId, geometry: positioned, isVisible: true });
    return { modelId, success: true };
  }
  
  toJscadCode() {
    const { width = 10, height = 10, depth = 10, position = [0, 0, 0] } = this.params;
    let code = `const cube = jscad.primitives.cuboid({ size: [${width}, ${height}, ${depth}] });\n`;
    
    if (position[0] !== 0 || position[1] !== 0 || position[2] !== 0) {
      code += `const positioned = jscad.transforms.translate([${position[0]}, ${position[1]}, ${position[2]}], cube);\n`;
      return code;
    }
    
    return code;
  }
}

class CreateSphereOperation extends CADOperation {
  constructor(params = {}) {
    super(params);
    this.type = 'createSphere';
    this.description = 'Create sphere';
  }
  
  execute() {
    const { radius = 5, segments = 32, position = [0, 0, 0], name = 'Sphere' } = this.params;
    
    const sphere = jscad.primitives.sphere({
      radius,
      segments
    });
    
    const positioned = jscad.transforms.translate(position, sphere);
    const modelId = modelStore.addModel(positioned, name);
    
    // Add to history with undo/redo
    operationHistory.addOperation({
      type: this.type,
      params: this.params,
      modelId,
      undo: () => modelStore.removeModel(modelId),
      redo: () => {
        const redoSphere = jscad.primitives.sphere({ radius, segments });
        const redoPositioned = jscad.transforms.translate(position, redoSphere);
        modelStore.addModel(redoPositioned, name, modelId);
      }
    });
    
    notifyModelChanged({ id: modelId, geometry: positioned, isVisible: true });
    return { modelId, success: true };
  }
  
  toJscadCode() {
    const { radius = 5, segments = 32, position = [0, 0, 0] } = this.params;
    let code = `const sphere = jscad.primitives.sphere({ radius: ${radius}, segments: ${segments} });\n`;
    
    if (position[0] !== 0 || position[1] !== 0 || position[2] !== 0) {
      code += `const positioned = jscad.transforms.translate([${position[0]}, ${position[1]}, ${position[2]}], sphere);\n`;
      return code;
    }
    
    return code;
  }
}

class CreateCylinderOperation extends CADOperation {
  constructor(params = {}) {
    super(params);
    this.type = 'createCylinder';
    this.description = 'Create cylinder';
  }
  
  execute() {
    const { 
      radius = 5, 
      height = 10, 
      segments = 32, 
      position = [0, 0, 0], 
      name = 'Cylinder' 
    } = this.params;
    
    const cylinder = jscad.primitives.cylinder({
      radius,
      height,
      segments
    });
    
    const positioned = jscad.transforms.translate(position, cylinder);
    const modelId = modelStore.addModel(positioned, name);
    
    // Add to history with undo/redo
    operationHistory.addOperation({
      type: this.type,
      params: this.params,
      modelId,
      undo: () => modelStore.removeModel(modelId),
      redo: () => {
        const redoCylinder = jscad.primitives.cylinder({ radius, height, segments });
        const redoPositioned = jscad.transforms.translate(position, redoCylinder);
        modelStore.addModel(redoPositioned, name, modelId);
      }
    });
    
    notifyModelChanged({ id: modelId, geometry: positioned, isVisible: true });
    return { modelId, success: true };
  }
  
  toJscadCode() {
    const { radius = 5, height = 10, segments = 32, position = [0, 0, 0] } = this.params;
    let code = `const cylinder = jscad.primitives.cylinder({ radius: ${radius}, height: ${height}, segments: ${segments} });\n`;
    
    if (position[0] !== 0 || position[1] !== 0 || position[2] !== 0) {
      code += `const positioned = jscad.transforms.translate([${position[0]}, ${position[1]}, ${position[2]}], cylinder);\n`;
      return code;
    }
    
    return code;
  }
}

// ===========================
// 2. SKETCH-BASED OPERATIONS
// ===========================

class CreateSketchOperation extends CADOperation {
  constructor(params = {}) {
    super(params);
    this.type = 'createSketch';
    this.description = 'Create sketch on plane';
  }
  
  execute() {
    const { plane = 'xy', offset = 0, name } = this.params;
    
    try {
      const sketch = sketchManager.createSketch({ plane, offset });
      
      // Add to history with undo/redo
      operationHistory.addOperation({
        type: this.type,
        params: this.params,
        sketchId: sketch.id,
        undo: () => {
          // We would need to implement a way to remove a sketch in sketchManager
          console.log('Undo create sketch not fully implemented');
        },
        redo: () => {
          sketchManager.createSketch({ plane, offset });
        }
      });
      
      return { 
        sketchId: sketch.id, 
        success: true,
        message: `Created sketch on ${plane} plane with offset ${offset}`
      };
    } catch (error) {
      console.error('Failed to create sketch:', error);
      return { success: false, error: error.message };
    }
  }
  
  toJscadCode() {
    const { plane = 'xy', offset = 0 } = this.params;
    return `// Create sketch on ${plane} plane with offset ${offset}\n`;
  }
}

class AddSketchCircleOperation extends CADOperation {
  constructor(params = {}) {
    super(params);
    this.type = 'addSketchCircle';
    this.description = 'Add circle to sketch';
  }
  
  execute() {
    const { center = [0, 0], radius = 5 } = this.params;
    
    try {
      if (!sketchManager.getActiveSketch()) {
        throw new Error('No active sketch');
      }
      
      const entity = sketchManager.addEntity('circle', { center, radius });
      
      // Add to history with undo/redo
      operationHistory.addOperation({
        type: this.type,
        params: this.params,
        entityId: entity.id,
        undo: () => {
          sketchManager.deleteEntity(entity.id);
        },
        redo: () => {
          sketchManager.addEntity('circle', { center, radius });
        }
      });
      
      return { 
        entityId: entity.id, 
        success: true,
        message: `Added circle with radius ${radius} to sketch`
      };
    } catch (error) {
      console.error('Failed to add circle to sketch:', error);
      return { success: false, error: error.message };
    }
  }
  
  toJscadCode() {
    const { center = [0, 0], radius = 5 } = this.params;
    return `// Add circle with center [${center[0]}, ${center[1]}] and radius ${radius} to sketch\n`;
  }
}

class AddSketchRectangleOperation extends CADOperation {
  constructor(params = {}) {
    super(params);
    this.type = 'addSketchRectangle';
    this.description = 'Add rectangle to sketch';
  }
  
  execute() {
    const { center = [0, 0], width = 10, height = 10 } = this.params;
    
    try {
      if (!sketchManager.getActiveSketch()) {
        throw new Error('No active sketch');
      }
      
      const entity = sketchManager.addEntity('rectangle', { center, width, height });
      
      // Add to history with undo/redo
      operationHistory.addOperation({
        type: this.type,
        params: this.params,
        entityId: entity.id,
        undo: () => {
          sketchManager.deleteEntity(entity.id);
        },
        redo: () => {
          sketchManager.addEntity('rectangle', { center, width, height });
        }
      });
      
      return { 
        entityId: entity.id, 
        success: true,
        message: `Added rectangle with dimensions ${width}×${height} to sketch`
      };
    } catch (error) {
      console.error('Failed to add rectangle to sketch:', error);
      return { success: false, error: error.message };
    }
  }
  
  toJscadCode() {
    const { center = [0, 0], width = 10, height = 10 } = this.params;
    return `// Add rectangle with center [${center[0]}, ${center[1]}] and dimensions ${width}×${height} to sketch\n`;
  }
}

class ExtrudeSketchOperation extends CADOperation {
  constructor(params = {}) {
    super(params);
    this.type = 'extrudeSketch';
    this.description = 'Extrude sketch';
  }
  
  execute() {
    const { height = 10 } = this.params;
    
    try {
      if (!sketchManager.getActiveSketch()) {
        throw new Error('No active sketch');
      }
      
      const modelId = sketchManager.extrudeActiveSketch(height);
      
      // Add to history with undo/redo
      operationHistory.addOperation({
        type: this.type,
        params: this.params,
        modelId,
        undo: () => {
          modelStore.removeModel(modelId);
        },
        redo: () => {
          // This is incomplete because we'd need to restore the exact same sketch state
          // For a complete implementation, we would need to store the sketch state
          console.log('Redo extrude sketch not fully implemented');
        }
      });
      
      return { 
        modelId, 
        success: true,
        message: `Extruded sketch to height ${height}`
      };
    } catch (error) {
      console.error('Failed to extrude sketch:', error);
      return { success: false, error: error.message };
    }
  }
  
  toJscadCode() {
    const { height = 10 } = this.params;
    return `// Extrude active sketch to height ${height}\n`;
  }
}

// ===========================
// 3. BOOLEAN OPERATIONS
// ===========================

class UnionOperation extends CADOperation {
  constructor(params = {}) {
    super(params);
    this.type = 'union';
    this.description = 'Boolean union';
  }
  
  execute() {
    const { modelIds = [], name = 'Union' } = this.params;
    
    if (modelIds.length < 2) {
      return { success: false, error: 'Union requires at least two models' };
    }
    
    try {
      const geometries = modelIds.map(id => {
        const model = modelStore.getModel(id);
        if (!model || !model.geometry) {
          throw new Error(`Model with ID ${id} not found`);
        }
        return model.geometry;
      });
      
      const result = jscad.booleans.union(geometries);
      const modelId = modelStore.addModel(result, name);
      
      // Add to history with undo/redo
      operationHistory.addOperation({
        type: this.type,
        params: this.params,
        modelId,
        sourceModelIds: [...modelIds],
        undo: () => {
          modelStore.removeModel(modelId);
          // Optionally restore original model visibility if they were hidden
        },
        redo: () => {
          const redoGeometries = modelIds.map(id => modelStore.getModel(id)?.geometry).filter(Boolean);
          const redoResult = jscad.booleans.union(redoGeometries);
          modelStore.addModel(redoResult, name, modelId);
        }
      });
      
      notifyModelChanged({ id: modelId, geometry: result, isVisible: true });
      return { 
        modelId, 
        success: true,
        message: `Created union of ${modelIds.length} models`
      };
    } catch (error) {
      console.error('Failed to create union:', error);
      return { success: false, error: error.message };
    }
  }
  
  toJscadCode() {
    const { modelIds = [] } = this.params;
    return `const union = jscad.booleans.union([${modelIds.map(id => `model_${id}`).join(', ')}]);\n`;
  }
}

class SubtractOperation extends CADOperation {
  constructor(params = {}) {
    super(params);
    this.type = 'subtract';
    this.description = 'Boolean subtraction';
  }
  
  execute() {
    const { modelId, subtractIds = [], name = 'Difference' } = this.params;
    
    if (!modelId || subtractIds.length === 0) {
      return { success: false, error: 'Subtraction requires a target model and at least one tool model' };
    }
    
    try {
      const targetModel = modelStore.getModel(modelId);
      if (!targetModel || !targetModel.geometry) {
        throw new Error(`Target model with ID ${modelId} not found`);
      }
      
      const subtractGeometries = subtractIds.map(id => {
        const model = modelStore.getModel(id);
        if (!model || !model.geometry) {
          throw new Error(`Subtraction model with ID ${id} not found`);
        }
        return model.geometry;
      });
      
      const result = jscad.booleans.subtract(targetModel.geometry, subtractGeometries);
      const resultId = modelStore.addModel(result, name);
      
      // Add to history with undo/redo
      operationHistory.addOperation({
        type: this.type,
        params: this.params,
        modelId: resultId,
        sourceModelId: modelId,
        subtractModelIds: [...subtractIds],
        undo: () => {
          modelStore.removeModel(resultId);
          // Optionally restore original model visibility if they were hidden
        },
        redo: () => {
          const redoTargetModel = modelStore.getModel(modelId)?.geometry;
          const redoSubtractGeometries = subtractIds.map(id => modelStore.getModel(id)?.geometry).filter(Boolean);
          const redoResult = jscad.booleans.subtract(redoTargetModel, redoSubtractGeometries);
          modelStore.addModel(redoResult, name, resultId);
        }
      });
      
      notifyModelChanged({ id: resultId, geometry: result, isVisible: true });
      return { 
        modelId: resultId, 
        success: true,
        message: `Subtracted ${subtractIds.length} models from model ${modelId}`
      };
    } catch (error) {
      console.error('Failed to create subtraction:', error);
      return { success: false, error: error.message };
    }
  }
  
  toJscadCode() {
    const { modelId, subtractIds = [] } = this.params;
    return `const difference = jscad.booleans.subtract(model_${modelId}, [${subtractIds.map(id => `model_${id}`).join(', ')}]);\n`;
  }
}

// ===========================
// 4. TRANSFORMATION OPERATIONS
// ===========================

class TranslateOperation extends CADOperation {
  constructor(params = {}) {
    super(params);
    this.type = 'translate';
    this.description = 'Translate model';
  }
  
  execute() {
    const { modelId, translation = [0, 0, 0], name } = this.params;
    
    if (!modelId) {
      return { success: false, error: 'Translation requires a model ID' };
    }
    
    try {
      const model = modelStore.getModel(modelId);
      if (!model || !model.geometry) {
        throw new Error(`Model with ID ${modelId} not found`);
      }
      
      const modelName = name || `${model.name}_translated`;
      const result = jscad.transforms.translate(translation, model.geometry);
      const resultId = modelStore.addModel(result, modelName);
      
      // Add to history with undo/redo
      operationHistory.addOperation({
        type: this.type,
        params: this.params,
        modelId: resultId,
        sourceModelId: modelId,
        undo: () => {
          modelStore.removeModel(resultId);
        },
        redo: () => {
          const redoModel = modelStore.getModel(modelId)?.geometry;
          const redoResult = jscad.transforms.translate(translation, redoModel);
          modelStore.addModel(redoResult, modelName, resultId);
        }
      });
      
      notifyModelChanged({ id: resultId, geometry: result, isVisible: true });
      return { 
        modelId: resultId, 
        success: true,
        message: `Translated model ${modelId} by [${translation.join(', ')}]`
      };
    } catch (error) {
      console.error('Failed to translate model:', error);
      return { success: false, error: error.message };
    }
  }
  
  toJscadCode() {
    const { modelId, translation = [0, 0, 0] } = this.params;
    return `const translated = jscad.transforms.translate([${translation.join(', ')}], model_${modelId});\n`;
  }
}

class RotateOperation extends CADOperation {
  constructor(params = {}) {
    super(params);
    this.type = 'rotate';
    this.description = 'Rotate model';
  }
  
  execute() {
    const { 
      modelId, 
      rotation = [0, 0, 0], // Euler angles in degrees
      name 
    } = this.params;
    
    if (!modelId) {
      return { success: false, error: 'Rotation requires a model ID' };
    }
    
    try {
      const model = modelStore.getModel(modelId);
      if (!model || !model.geometry) {
        throw new Error(`Model with ID ${modelId} not found`);
      }
      
      const modelName = name || `${model.name}_rotated`;
      
      // Convert degrees to radians
      const rotationRad = rotation.map(angle => angle * Math.PI / 180);
      
      // Apply rotations in X, Y, Z order
      let result = model.geometry;
      if (rotationRad[0] !== 0) {
        result = jscad.transforms.rotateX(rotationRad[0], result);
      }
      if (rotationRad[1] !== 0) {
        result = jscad.transforms.rotateY(rotationRad[1], result);
      }
      if (rotationRad[2] !== 0) {
        result = jscad.transforms.rotateZ(rotationRad[2], result);
      }
      
      const resultId = modelStore.addModel(result, modelName);
      
      // Add to history with undo/redo
      operationHistory.addOperation({
        type: this.type,
        params: this.params,
        modelId: resultId,
        sourceModelId: modelId,
        undo: () => {
          modelStore.removeModel(resultId);
        },
        redo: () => {
          const redoModel = modelStore.getModel(modelId)?.geometry;
          let redoResult = redoModel;
          if (rotationRad[0] !== 0) {
            redoResult = jscad.transforms.rotateX(rotationRad[0], redoResult);
          }
          if (rotationRad[1] !== 0) {
            redoResult = jscad.transforms.rotateY(rotationRad[1], redoResult);
          }
          if (rotationRad[2] !== 0) {
            redoResult = jscad.transforms.rotateZ(rotationRad[2], redoResult);
          }
          modelStore.addModel(redoResult, modelName, resultId);
        }
      });
      
      notifyModelChanged({ id: resultId, geometry: result, isVisible: true });
      return { 
        modelId: resultId, 
        success: true,
        message: `Rotated model ${modelId} by [${rotation.join(', ')}] degrees`
      };
    } catch (error) {
      console.error('Failed to rotate model:', error);
      return { success: false, error: error.message };
    }
  }
  
  toJscadCode() {
    const { modelId, rotation = [0, 0, 0] } = this.params;
    const rotationRad = rotation.map(angle => (angle * Math.PI / 180).toFixed(6));
    let code = `let rotated = model_${modelId};\n`;
    if (rotation[0] !== 0) {
      code += `rotated = jscad.transforms.rotateX(${rotationRad[0]}, rotated);\n`;
    }
    if (rotation[1] !== 0) {
      code += `rotated = jscad.transforms.rotateY(${rotationRad[1]}, rotated);\n`;
    }
    if (rotation[2] !== 0) {
      code += `rotated = jscad.transforms.rotateZ(${rotationRad[2]}, rotated);\n`;
    }
    return code;
  }
}

// ===========================
// Public API
// ===========================

// Export a unified interface for CAD operations
export const CADOperations = {
  // History operations
  undo: () => operationHistory.undo(),
  redo: () => operationHistory.redo(),
  getHistory: () => operationHistory.getOperations(),
  getHistoryIndex: () => operationHistory.getCurrentIndex(),
  
  // Primitive creation
  createCube: (params) => new CreateCubeOperation(params).execute(),
  createSphere: (params) => new CreateSphereOperation(params).execute(),
  createCylinder: (params) => new CreateCylinderOperation(params).execute(),
  
  // Sketch operations
  createSketch: (params) => new CreateSketchOperation(params).execute(),
  addSketchCircle: (params) => new AddSketchCircleOperation(params).execute(),
  addSketchRectangle: (params) => new AddSketchRectangleOperation(params).execute(),
  extrudeSketch: (params) => new ExtrudeSketchOperation(params).execute(),
  
  // Boolean operations
  union: (params) => new UnionOperation(params).execute(),
  subtract: (params) => new SubtractOperation(params).execute(),
  
  // Transformation operations
  translate: (params) => new TranslateOperation(params).execute(),
  rotate: (params) => new RotateOperation(params).execute(),
  
  // Get code representation
  getJscadCode: (operation) => {
    if (operation instanceof CADOperation) {
      return operation.toJscadCode();
    }
    return '// No JSCAD code available for this operation';
  }
};

export default CADOperations; 