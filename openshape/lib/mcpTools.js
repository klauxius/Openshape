// Model Context Protocol (MCP) Tools Registration
// This module registers CAD operation tools with the MCP client

import mcpClient from './mcpClient';
import * as jscad from '@jscad/modeling';
import partsLibrary from './partsLibrary';

// Store created models for reference and operations
const modelStore = {
  models: {},
  activeModelId: null,
  nextId: 1,
  
  addModel: function(model, name) {
    const id = `model_${this.nextId++}`;
    this.models[id] = {
      id,
      name: name || `Model ${this.nextId-1}`,
      geometry: model,
      isVisible: true,
      createdAt: new Date()
    };
    this.activeModelId = id;
    return id;
  },
  
  getModel: function(id) {
    return this.models[id] || null;
  },
  
  getAllModels: function() {
    return Object.values(this.models);
  },
  
  getActiveModel: function() {
    return this.models[this.activeModelId] || null;
  },
  
  setActiveModel: function(id) {
    if (this.models[id]) {
      this.activeModelId = id;
      return true;
    }
    return false;
  },
  
  removeModel: function(id) {
    if (this.models[id]) {
      const wasActive = (id === this.activeModelId);
      delete this.models[id];
      
      if (wasActive) {
        const modelIds = Object.keys(this.models);
        this.activeModelId = modelIds.length > 0 ? modelIds[0] : null;
      }
      
      return true;
    }
    return false;
  }
};

// Notify the viewer that a model has changed
const notifyModelChanged = (modelData) => {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('openshape:modelChanged', { 
      detail: { model: modelData }
    });
    window.dispatchEvent(event);
  }
};

/**
 * Initialize and register all MCP tools
 */
const initializeTools = () => {
  // Register common CAD operation tools
  registerShapeCreationTools();
  registerManipulationTools();
  registerBooleanOperationTools();
  registerUtilityTools();
  registerSketchingTools(); // Register 2D sketching tools
};

/**
 * Register tools for creating basic shapes
 * Uses partsLibrary to avoid code duplication
 */
const registerShapeCreationTools = () => {
  // Create Cube tool
  mcpClient.registerTool({
    name: 'create_cube',
    description: 'Creates a cube (box) in the 3D scene',
    parameters: {
      type: 'object',
      properties: {
        width: {
          type: 'number',
          description: 'Width of the cube in current units'
        },
        height: {
          type: 'number',
          description: 'Height of the cube in current units'
        },
        depth: {
          type: 'number',
          description: 'Depth of the cube in current units'
        },
        position: {
          type: 'array',
          description: 'Center position of the cube [x, y, z]',
          items: {
            type: 'number'
          }
        },
        name: {
          type: 'string',
          description: 'Optional name for the cube'
        }
      },
      required: ['width', 'height', 'depth']
    },
    execute: async (params) => {
      console.log('Creating cube with params:', params);
      // Use the partsLibrary instead of duplicating code
      return partsLibrary.createCube(params);
    }
  });

  // Create Cylinder tool
  mcpClient.registerTool({
    name: 'create_cylinder',
    description: 'Creates a cylinder in the 3D scene',
    parameters: {
      type: 'object',
      properties: {
        radius: {
          type: 'number',
          description: 'Radius of the cylinder in current units'
        },
        height: {
          type: 'number',
          description: 'Height of the cylinder in current units'
        },
        position: {
          type: 'array',
          description: 'Center position of the cylinder [x, y, z]',
          items: {
            type: 'number'
          }
        },
        segments: {
          type: 'number',
          description: 'Number of segments (resolution) of the cylinder'
        },
        name: {
          type: 'string',
          description: 'Optional name for the cylinder'
        }
      },
      required: ['radius', 'height']
    },
    execute: async (params) => {
      console.log('Creating cylinder with params:', params);
      // Use the partsLibrary instead of duplicating code
      return partsLibrary.createCylinder(params);
    }
  });

  // Create Sphere tool
  mcpClient.registerTool({
    name: 'create_sphere',
    description: 'Creates a sphere in the 3D scene',
    parameters: {
      type: 'object',
      properties: {
        radius: {
          type: 'number',
          description: 'Radius of the sphere in current units'
        },
        position: {
          type: 'array',
          description: 'Center position of the sphere [x, y, z]',
          items: {
            type: 'number'
          }
        },
        segments: {
          type: 'number',
          description: 'Number of segments (resolution) of the sphere'
        },
        name: {
          type: 'string',
          description: 'Optional name for the sphere'
        }
      },
      required: ['radius']
    },
    execute: async (params) => {
      console.log('Creating sphere with params:', params);
      // Use the partsLibrary instead of duplicating code
      return partsLibrary.createSphere(params);
    }
  });

  // Create Torus tool
  mcpClient.registerTool({
    name: 'create_torus',
    description: 'Creates a torus (donut shape) in the 3D scene',
    parameters: {
      type: 'object',
      properties: {
        innerRadius: {
          type: 'number',
          description: 'Inner radius of the torus in current units'
        },
        outerRadius: {
          type: 'number',
          description: 'Outer radius of the torus in current units'
        },
        position: {
          type: 'array',
          description: 'Center position of the torus [x, y, z]',
          items: {
            type: 'number'
          }
        },
        segments: {
          type: 'number',
          description: 'Number of segments (resolution) of the torus'
        },
        name: {
          type: 'string',
          description: 'Optional name for the torus'
        }
      },
      required: ['innerRadius', 'outerRadius']
    },
    execute: async (params) => {
      console.log('Creating torus with params:', params);
      // Use the partsLibrary instead of duplicating code
      return partsLibrary.createTorus(params);
    }
  });
};

/**
 * Register tools for manipulating shapes
 */
const registerManipulationTools = () => {
  // Translate (Move) Shape tool
  mcpClient.registerTool({
    name: 'translate_shape',
    description: 'Moves a shape to a new position',
    parameters: {
      type: 'object',
      properties: {
        modelId: {
          type: 'string',
          description: 'ID of the model to move'
        },
        translation: {
          type: 'array',
          description: 'Translation vector [x, y, z]',
          items: {
            type: 'number'
          }
        }
      },
      required: ['modelId', 'translation']
    },
    execute: async (params) => {
      console.log('Translating shape with params:', params);
      
      try {
        // Get the model from store
        const modelData = modelStore.getModel(params.modelId);
        if (!modelData) {
          throw new Error(`Model with ID ${params.modelId} not found`);
        }
        
        // Use JSCAD to translate the geometry
        const translatedGeometry = jscad.transforms.translate(
          params.translation,
          modelData.geometry
        );
        
        // Update the model
        modelData.geometry = translatedGeometry;
        
        // Notify the viewer
        notifyModelChanged(modelData);
        
        return {
          success: true,
          modelId: params.modelId,
          model: modelData,
          message: `Moved model ${modelData.name} by [${params.translation.join(', ')}]`
        };
      } catch (error) {
        console.error('Error translating shape:', error);
        return {
          success: false,
          error: error.message
        };
      }
    }
  });

  // Rotate Shape tool
  mcpClient.registerTool({
    name: 'rotate_shape',
    description: 'Rotates a shape around an axis',
    parameters: {
      type: 'object',
      properties: {
        modelId: {
          type: 'string',
          description: 'ID of the model to rotate'
        },
        axis: {
          type: 'array',
          description: 'Rotation axis [x, y, z]',
          items: {
            type: 'number'
          }
        },
        angle: {
          type: 'number',
          description: 'Rotation angle in degrees'
        }
      },
      required: ['modelId', 'angle']
    },
    execute: async (params) => {
      console.log('Rotating shape with params:', params);
      
      try {
        // Get the model from store
        const modelData = modelStore.getModel(params.modelId);
        if (!modelData) {
          throw new Error(`Model with ID ${params.modelId} not found`);
        }
        
        // Default axis if not provided
        const axis = params.axis || [0, 0, 1]; // Default to Z-axis
        
        // Convert angle to radians
        const angleInRadians = (params.angle * Math.PI) / 180;
        
        // Use JSCAD to rotate the geometry
        const rotatedGeometry = jscad.transforms.rotate(
          axis, 
          angleInRadians, 
          modelData.geometry
        );
        
        // Update the model
        modelData.geometry = rotatedGeometry;
        
        // Notify the viewer
        notifyModelChanged(modelData);
        
        return {
          success: true,
          modelId: params.modelId,
          model: modelData,
          message: `Rotated model ${modelData.name} by ${params.angle} degrees around [${axis.join(', ')}]`
        };
      } catch (error) {
        console.error('Error rotating shape:', error);
        return {
          success: false,
          error: error.message
        };
      }
    }
  });

  // Scale Shape tool
  mcpClient.registerTool({
    name: 'scale_shape',
    description: 'Scales a shape by a factor',
    parameters: {
      type: 'object',
      properties: {
        modelId: {
          type: 'string',
          description: 'ID of the model to scale'
        },
        scale: {
          oneOf: [
            {
              type: 'number',
              description: 'Uniform scale factor'
            },
            {
              type: 'array',
              description: 'Scale factors [x, y, z]',
              items: {
                type: 'number'
              }
            }
          ]
        }
      },
      required: ['modelId', 'scale']
    },
    execute: async (params) => {
      console.log('Scaling shape with params:', params);
      
      try {
        // Get the model from store
        const modelData = modelStore.getModel(params.modelId);
        if (!modelData) {
          throw new Error(`Model with ID ${params.modelId} not found`);
        }
        
        // Convert uniform scale to array if needed
        const scaleFactors = typeof params.scale === 'number' 
          ? [params.scale, params.scale, params.scale] 
          : params.scale;
        
        // Use JSCAD to scale the geometry
        const scaledGeometry = jscad.transforms.scale(
          scaleFactors, 
          modelData.geometry
        );
        
        // Update the model
        modelData.geometry = scaledGeometry;
        
        // Notify the viewer
        notifyModelChanged(modelData);
        
        const scaleDesc = typeof params.scale === 'number' 
          ? params.scale 
          : `[${params.scale.join(', ')}]`;
        
        return {
          success: true,
          modelId: params.modelId,
          model: modelData,
          message: `Scaled model ${modelData.name} by ${scaleDesc}`
        };
      } catch (error) {
        console.error('Error scaling shape:', error);
        return {
          success: false,
          error: error.message
        };
      }
    }
  });
};

/**
 * Register tools for boolean operations between shapes
 */
const registerBooleanOperationTools = () => {
  // Union tool
  mcpClient.registerTool({
    name: 'union_shapes',
    description: 'Combines two or more shapes using boolean union',
    parameters: {
      type: 'object',
      properties: {
        modelIds: {
          type: 'array',
          description: 'Array of model IDs to union',
          items: {
            type: 'string'
          }
        },
        name: {
          type: 'string',
          description: 'Optional name for the resulting model'
        }
      },
      required: ['modelIds']
    },
    execute: async (params) => {
      console.log('Union shapes with params:', params);
      
      try {
        if (!params.modelIds || params.modelIds.length < 2) {
          throw new Error('At least two models are required for a union operation');
        }
        
        // Get all models and their geometries
        const geometries = [];
        const modelNames = [];
        
        for (const modelId of params.modelIds) {
          const modelData = modelStore.getModel(modelId);
          if (!modelData) {
            throw new Error(`Model with ID ${modelId} not found`);
          }
          geometries.push(modelData.geometry);
          modelNames.push(modelData.name);
        }
        
        // Perform the union operation
        const unionGeometry = jscad.booleans.union(geometries);
        
        // Create a name for the result if not provided
        const resultName = params.name || `Union ${modelNames.join(' + ')}`;
        
        // Add to model store
        const resultModelId = modelStore.addModel(unionGeometry, resultName);
        const resultModel = modelStore.getModel(resultModelId);
        
        // Notify the viewer
        notifyModelChanged(resultModel);
        
        return {
          success: true,
          modelId: resultModelId,
          model: resultModel,
          message: `Created union of models: ${modelNames.join(', ')}`
        };
      } catch (error) {
        console.error('Error performing union:', error);
        return {
          success: false,
          error: error.message
        };
      }
    }
  });

  // Difference tool
  mcpClient.registerTool({
    name: 'subtract_shapes',
    description: 'Subtracts shapes from a base shape using boolean difference',
    parameters: {
      type: 'object',
      properties: {
        baseModelId: {
          type: 'string',
          description: 'ID of the base model'
        },
        subtractModelIds: {
          type: 'array',
          description: 'Array of model IDs to subtract from the base model',
          items: {
            type: 'string'
          }
        },
        name: {
          type: 'string',
          description: 'Optional name for the resulting model'
        }
      },
      required: ['baseModelId', 'subtractModelIds']
    },
    execute: async (params) => {
      console.log('Subtract shapes with params:', params);
      
      try {
        if (!params.subtractModelIds || params.subtractModelIds.length < 1) {
          throw new Error('At least one model is required to subtract');
        }
        
        // Get base model
        const baseModel = modelStore.getModel(params.baseModelId);
        if (!baseModel) {
          throw new Error(`Base model with ID ${params.baseModelId} not found`);
        }
        
        // Get all subtract models
        const subtractGeometries = [];
        const subtractNames = [];
        
        for (const modelId of params.subtractModelIds) {
          const modelData = modelStore.getModel(modelId);
          if (!modelData) {
            throw new Error(`Model with ID ${modelId} not found`);
          }
          subtractGeometries.push(modelData.geometry);
          subtractNames.push(modelData.name);
        }
        
        // Perform the subtraction operation
        const differenceGeometry = jscad.booleans.subtract(baseModel.geometry, subtractGeometries);
        
        // Create a name for the result if not provided
        const resultName = params.name || `${baseModel.name} - ${subtractNames.join(' - ')}`;
        
        // Add to model store
        const resultModelId = modelStore.addModel(differenceGeometry, resultName);
        const resultModel = modelStore.getModel(resultModelId);
        
        // Notify the viewer
        notifyModelChanged(resultModel);
        
        return {
          success: true,
          modelId: resultModelId,
          model: resultModel,
          message: `Subtracted models ${subtractNames.join(', ')} from ${baseModel.name}`
        };
      } catch (error) {
        console.error('Error performing subtraction:', error);
        return {
          success: false,
          error: error.message
        };
      }
    }
  });

  // Intersection tool
  mcpClient.registerTool({
    name: 'intersect_shapes',
    description: 'Creates the intersection of two or more shapes using boolean intersection',
    parameters: {
      type: 'object',
      properties: {
        modelIds: {
          type: 'array',
          description: 'Array of model IDs to intersect',
          items: {
            type: 'string'
          }
        },
        name: {
          type: 'string',
          description: 'Optional name for the resulting model'
        }
      },
      required: ['modelIds']
    },
    execute: async (params) => {
      console.log('Intersect shapes with params:', params);
      
      try {
        if (!params.modelIds || params.modelIds.length < 2) {
          throw new Error('At least two models are required for an intersection operation');
        }
        
        // Get all models and their geometries
        const geometries = [];
        const modelNames = [];
        
        for (const modelId of params.modelIds) {
          const modelData = modelStore.getModel(modelId);
          if (!modelData) {
            throw new Error(`Model with ID ${modelId} not found`);
          }
          geometries.push(modelData.geometry);
          modelNames.push(modelData.name);
        }
        
        // Perform the intersection operation
        const intersectionGeometry = jscad.booleans.intersect(geometries);
        
        // Create a name for the result if not provided
        const resultName = params.name || `Intersection ${modelNames.join(' ∩ ')}`;
        
        // Add to model store
        const resultModelId = modelStore.addModel(intersectionGeometry, resultName);
        const resultModel = modelStore.getModel(resultModelId);
        
        // Notify the viewer
        notifyModelChanged(resultModel);
        
        return {
          success: true,
          modelId: resultModelId,
          model: resultModel,
          message: `Created intersection of models: ${modelNames.join(', ')}`
        };
      } catch (error) {
        console.error('Error performing intersection:', error);
        return {
          success: false,
          error: error.message
        };
      }
    }
  });
};

/**
 * Register utility tools for model management
 */
const registerUtilityTools = () => {
  // List Models tool
  mcpClient.registerTool({
    name: 'list_models',
    description: 'Lists all models in the scene',
    parameters: {
      type: 'object',
      properties: {}
    },
    execute: async () => {
      try {
        const models = modelStore.getAllModels();
        const activeModel = modelStore.getActiveModel();
        
        return {
          success: true,
          models: models.map(model => ({
            id: model.id,
            name: model.name,
            isActive: activeModel && model.id === activeModel.id,
            createdAt: model.createdAt
          })),
          activeModelId: activeModel ? activeModel.id : null,
          message: `Found ${models.length} models in the scene`
        };
      } catch (error) {
        console.error('Error listing models:', error);
        return {
          success: false,
          error: error.message
        };
      }
    }
  });
  
  // Delete Model tool
  mcpClient.registerTool({
    name: 'delete_model',
    description: 'Deletes a model from the scene',
    parameters: {
      type: 'object',
      properties: {
        modelId: {
          type: 'string',
          description: 'ID of the model to delete'
        }
      },
      required: ['modelId']
    },
    execute: async (params) => {
      try {
        const model = modelStore.getModel(params.modelId);
        if (!model) {
          throw new Error(`Model with ID ${params.modelId} not found`);
        }
        
        const modelName = model.name;
        const success = modelStore.removeModel(params.modelId);
        
        if (!success) {
          throw new Error(`Failed to delete model with ID ${params.modelId}`);
        }
        
        // Notify about the model deletion
        notifyModelChanged({ deleted: true, id: params.modelId });
        
        return {
          success: true,
          deletedModelId: params.modelId,
          message: `Deleted model: ${modelName}`
        };
      } catch (error) {
        console.error('Error deleting model:', error);
        return {
          success: false,
          error: error.message
        };
      }
    }
  });
  
  // Set Active Model tool
  mcpClient.registerTool({
    name: 'set_active_model',
    description: 'Sets a model as the active one for operations',
    parameters: {
      type: 'object',
      properties: {
        modelId: {
          type: 'string',
          description: 'ID of the model to set as active'
        }
      },
      required: ['modelId']
    },
    execute: async (params) => {
      try {
        const model = modelStore.getModel(params.modelId);
        if (!model) {
          throw new Error(`Model with ID ${params.modelId} not found`);
        }
        
        const success = modelStore.setActiveModel(params.modelId);
        
        if (!success) {
          throw new Error(`Failed to set model with ID ${params.modelId} as active`);
        }
        
        return {
          success: true,
          activeModelId: params.modelId,
          modelName: model.name,
          message: `Set ${model.name} as the active model`
        };
      } catch (error) {
        console.error('Error setting active model:', error);
        return {
          success: false,
          error: error.message
        };
      }
    }
  });
};

/**
 * Register tools for 2D sketching operations
 * These tools create 2D shapes that can be used as a basis for 3D operations
 */
const registerSketchingTools = () => {
  // Create a line tool
  mcpClient.registerTool({
    name: 'create_line',
    description: 'Creates a straight line between two points',
    parameters: {
      type: 'object',
      properties: {
        startPoint: {
          type: 'array',
          description: 'Starting point of the line [x, y]',
          items: {
            type: 'number'
          }
        },
        endPoint: {
          type: 'array',
          description: 'Ending point of the line [x, y]',
          items: {
            type: 'number'
          }
        },
        thickness: {
          type: 'number',
          description: 'Thickness of the line when extruded'
        },
        height: {
          type: 'number',
          description: 'Height to extrude the line'
        },
        name: {
          type: 'string',
          description: 'Optional name for the line'
        }
      },
      required: ['startPoint', 'endPoint']
    },
    execute: async (params) => {
      console.log('Creating line with params:', params);
      
      try {
        // Default values
        const thickness = params.thickness || 0.5;
        const height = params.height || 1;
        
        // Create a path for the line
        const points = [
          [params.startPoint[0], params.startPoint[1]],
          [params.endPoint[0], params.endPoint[1]]
        ];
        
        // Create a path geometry
        const path = jscad.geometries.path2.fromPoints({}, points);
        
        // Expand the path to create a 2D shape with thickness
        const expanded = jscad.expansions.expand({
          delta: thickness,
          corners: 'round',
          segments: 16
        }, path);
        
        // Extrude to create a 3D shape
        const extruded = jscad.extrusions.extrudeLinear({ height }, expanded);
        
        // Add to model store
        const modelId = modelStore.addModel(extruded, params.name || 'Line');
        const modelData = modelStore.getModel(modelId);
        
        // Notify the viewer
        notifyModelChanged(modelData);
        
        return {
          success: true,
          modelId: modelId,
          model: modelData,
          message: `Created a line from [${params.startPoint}] to [${params.endPoint}]`
        };
      } catch (error) {
        console.error('Error creating line:', error);
        return {
          success: false,
          error: error.message
        };
      }
    }
  });

  // Create a rectangle tool
  mcpClient.registerTool({
    name: 'create_rectangle',
    description: 'Creates a rectangle in the specified plane',
    parameters: {
      type: 'object',
      properties: {
        width: {
          type: 'number',
          description: 'Width of the rectangle'
        },
        height: {
          type: 'number',
          description: 'Height of the rectangle'
        },
        center: {
          type: 'array',
          description: 'Center position of the rectangle [x, y]',
          items: {
            type: 'number'
          }
        },
        extrudeHeight: {
          type: 'number',
          description: 'Height to extrude the rectangle (0 for 2D only)'
        },
        name: {
          type: 'string',
          description: 'Optional name for the rectangle'
        }
      },
      required: ['width', 'height']
    },
    execute: async (params) => {
      console.log('Creating rectangle with params:', params);
      
      try {
        // Default values
        const center = params.center || [0, 0];
        const extrudeHeight = params.extrudeHeight || 0; // Default to 2D
        
        // Create a rectangle
        const rectangle = jscad.primitives.rectangle({
          size: [params.width, params.height],
          center: [center[0], center[1]]
        });
        
        let finalGeometry = rectangle;
        
        // Extrude if height is specified
        if (extrudeHeight > 0) {
          finalGeometry = jscad.extrusions.extrudeLinear({ height: extrudeHeight }, rectangle);
        }
        
        // Add to model store
        const modelId = modelStore.addModel(finalGeometry, params.name || 'Rectangle');
        const modelData = modelStore.getModel(modelId);
        
        // Notify the viewer
        notifyModelChanged(modelData);
        
        return {
          success: true,
          modelId: modelId,
          model: modelData,
          message: extrudeHeight > 0 
            ? `Created an extruded rectangle with dimensions ${params.width}×${params.height}×${extrudeHeight}`
            : `Created a rectangle with dimensions ${params.width}×${params.height}`
        };
      } catch (error) {
        console.error('Error creating rectangle:', error);
        return {
          success: false,
          error: error.message
        };
      }
    }
  });

  // Create a circle tool
  mcpClient.registerTool({
    name: 'create_circle',
    description: 'Creates a circle in the specified plane',
    parameters: {
      type: 'object',
      properties: {
        radius: {
          type: 'number',
          description: 'Radius of the circle'
        },
        center: {
          type: 'array',
          description: 'Center position of the circle [x, y]',
          items: {
            type: 'number'
          }
        },
        segments: {
          type: 'number',
          description: 'Number of segments for the circle (resolution)'
        },
        extrudeHeight: {
          type: 'number',
          description: 'Height to extrude the circle (0 for 2D only)'
        },
        name: {
          type: 'string',
          description: 'Optional name for the circle'
        }
      },
      required: ['radius']
    },
    execute: async (params) => {
      console.log('Creating circle with params:', params);
      
      try {
        // Default values
        const center = params.center || [0, 0];
        const segments = params.segments || 32; // Default resolution
        const extrudeHeight = params.extrudeHeight || 0; // Default to 2D
        
        // Create a circle
        const circle = jscad.primitives.circle({
          radius: params.radius,
          segments: segments,
          center: [center[0], center[1]]
        });
        
        let finalGeometry = circle;
        
        // Extrude if height is specified
        if (extrudeHeight > 0) {
          finalGeometry = jscad.extrusions.extrudeLinear({ height: extrudeHeight }, circle);
        }
        
        // Add to model store
        const modelId = modelStore.addModel(finalGeometry, params.name || 'Circle');
        const modelData = modelStore.getModel(modelId);
        
        // Notify the viewer
        notifyModelChanged(modelData);
        
        return {
          success: true,
          modelId: modelId,
          model: modelData,
          message: extrudeHeight > 0 
            ? `Created an extruded circle with radius ${params.radius} and height ${extrudeHeight}`
            : `Created a circle with radius ${params.radius}`
        };
      } catch (error) {
        console.error('Error creating circle:', error);
        return {
          success: false,
          error: error.message
        };
      }
    }
  });

  // Create a polygon tool
  mcpClient.registerTool({
    name: 'create_polygon',
    description: 'Creates a polygon with the specified points',
    parameters: {
      type: 'object',
      properties: {
        points: {
          type: 'array',
          description: 'Array of points defining the polygon [[x1, y1], [x2, y2], ...]',
          items: {
            type: 'array',
            items: {
              type: 'number'
            }
          }
        },
        extrudeHeight: {
          type: 'number',
          description: 'Height to extrude the polygon (0 for 2D only)'
        },
        name: {
          type: 'string',
          description: 'Optional name for the polygon'
        }
      },
      required: ['points']
    },
    execute: async (params) => {
      console.log('Creating polygon with params:', params);
      
      try {
        // Default values
        const extrudeHeight = params.extrudeHeight || 0; // Default to 2D
        
        // Create a polygon
        const polygon = jscad.primitives.polygon({
          points: params.points
        });
        
        let finalGeometry = polygon;
        
        // Extrude if height is specified
        if (extrudeHeight > 0) {
          finalGeometry = jscad.extrusions.extrudeLinear({ height: extrudeHeight }, polygon);
        }
        
        // Add to model store
        const modelId = modelStore.addModel(finalGeometry, params.name || 'Polygon');
        const modelData = modelStore.getModel(modelId);
        
        // Notify the viewer
        notifyModelChanged(modelData);
        
        return {
          success: true,
          modelId: modelId,
          model: modelData,
          message: extrudeHeight > 0 
            ? `Created an extruded polygon with ${params.points.length} points and height ${extrudeHeight}`
            : `Created a polygon with ${params.points.length} points`
        };
      } catch (error) {
        console.error('Error creating polygon:', error);
        return {
          success: false,
          error: error.message
        };
      }
    }
  });
  
  // Extrude shape tool
  mcpClient.registerTool({
    name: 'extrude_shape',
    description: 'Extrudes a 2D shape to create a 3D object',
    parameters: {
      type: 'object',
      properties: {
        modelId: {
          type: 'string',
          description: 'ID of the 2D shape to extrude'
        },
        height: {
          type: 'number',
          description: 'Height to extrude the shape'
        },
        name: {
          type: 'string',
          description: 'Optional name for the resulting model'
        }
      },
      required: ['modelId', 'height']
    },
    execute: async (params) => {
      console.log('Extruding shape with params:', params);
      
      try {
        // Get the model to extrude
        const modelData = modelStore.getModel(params.modelId);
        if (!modelData) {
          throw new Error(`Model with ID ${params.modelId} not found`);
        }
        
        // Extrude the shape
        const extruded = jscad.extrusions.extrudeLinear({ 
          height: params.height 
        }, modelData.geometry);
        
        // Create a name for the result if not provided
        const resultName = params.name || `Extruded ${modelData.name}`;
        
        // Add to model store
        const resultModelId = modelStore.addModel(extruded, resultName);
        const resultModel = modelStore.getModel(resultModelId);
        
        // Notify the viewer
        notifyModelChanged(resultModel);
        
        return {
          success: true,
          modelId: resultModelId,
          model: resultModel,
          message: `Extruded ${modelData.name} to height ${params.height}`
        };
      } catch (error) {
        console.error('Error extruding shape:', error);
        return {
          success: false,
          error: error.message
        };
      }
    }
  });
};

// Export modelStore and notifyModelChanged as named exports
export { modelStore, notifyModelChanged };

// Export initializeTools as the default export
export default initializeTools; 