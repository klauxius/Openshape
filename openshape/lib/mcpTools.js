// Model Context Protocol (MCP) Tools Registration
// This module registers CAD operation tools with the MCP client

import mcpClient from './mcpClient';

/**
 * Initialize and register all MCP tools
 * This will make them available to the AI assistant
 */
const initializeTools = () => {
  // Register common CAD operation tools
  registerShapeCreationTools();
  registerManipulationTools();
  registerBooleanOperationTools();
};

/**
 * Register tools for creating basic shapes
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
        }
      },
      required: ['width', 'height', 'depth']
    },
    execute: async (params) => {
      console.log('Creating cube with params:', params);
      // This would call the actual JSCAD API to create a cube
      // For now, just return a success message
      return {
        success: true,
        shape: 'cube',
        parameters: params,
        message: `Created a cube with dimensions ${params.width}×${params.height}×${params.depth}`
      };
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
          description: 'Number of segments for the cylinder (resolution)'
        }
      },
      required: ['radius', 'height']
    },
    execute: async (params) => {
      console.log('Creating cylinder with params:', params);
      // This would call the actual JSCAD API to create a cylinder
      return {
        success: true,
        shape: 'cylinder',
        parameters: params,
        message: `Created a cylinder with radius ${params.radius} and height ${params.height}`
      };
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
          description: 'Number of segments for the sphere (resolution)'
        }
      },
      required: ['radius']
    },
    execute: async (params) => {
      console.log('Creating sphere with params:', params);
      // This would call the actual JSCAD API to create a sphere
      return {
        success: true,
        shape: 'sphere',
        parameters: params,
        message: `Created a sphere with radius ${params.radius}`
      };
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
        shapeId: {
          type: 'string',
          description: 'ID of the shape to move'
        },
        translation: {
          type: 'array',
          description: 'Translation vector [x, y, z]',
          items: {
            type: 'number'
          }
        }
      },
      required: ['shapeId', 'translation']
    },
    execute: async (params) => {
      console.log('Translating shape with params:', params);
      // This would call the actual JSCAD API to translate a shape
      return {
        success: true,
        operation: 'translate',
        parameters: params,
        message: `Moved shape ${params.shapeId} by [${params.translation.join(', ')}]`
      };
    }
  });

  // Rotate Shape tool
  mcpClient.registerTool({
    name: 'rotate_shape',
    description: 'Rotates a shape around an axis',
    parameters: {
      type: 'object',
      properties: {
        shapeId: {
          type: 'string',
          description: 'ID of the shape to rotate'
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
      required: ['shapeId', 'angle']
    },
    execute: async (params) => {
      console.log('Rotating shape with params:', params);
      // This would call the actual JSCAD API to rotate a shape
      return {
        success: true,
        operation: 'rotate',
        parameters: params,
        message: `Rotated shape ${params.shapeId} by ${params.angle} degrees`
      };
    }
  });

  // Scale Shape tool
  mcpClient.registerTool({
    name: 'scale_shape',
    description: 'Scales a shape by a factor',
    parameters: {
      type: 'object',
      properties: {
        shapeId: {
          type: 'string',
          description: 'ID of the shape to scale'
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
      required: ['shapeId', 'scale']
    },
    execute: async (params) => {
      console.log('Scaling shape with params:', params);
      // This would call the actual JSCAD API to scale a shape
      return {
        success: true,
        operation: 'scale',
        parameters: params,
        message: `Scaled shape ${params.shapeId} by ${
          typeof params.scale === 'number' 
            ? params.scale 
            : `[${params.scale.join(', ')}]`
        }`
      };
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
        shapeIds: {
          type: 'array',
          description: 'Array of shape IDs to union',
          items: {
            type: 'string'
          }
        }
      },
      required: ['shapeIds']
    },
    execute: async (params) => {
      console.log('Union shapes with params:', params);
      // This would call the actual JSCAD API to union shapes
      return {
        success: true,
        operation: 'union',
        parameters: params,
        message: `Created union of shapes: ${params.shapeIds.join(', ')}`
      };
    }
  });

  // Difference tool
  mcpClient.registerTool({
    name: 'subtract_shapes',
    description: 'Subtracts shapes from a base shape using boolean difference',
    parameters: {
      type: 'object',
      properties: {
        baseShapeId: {
          type: 'string',
          description: 'ID of the base shape'
        },
        subtractShapeIds: {
          type: 'array',
          description: 'Array of shape IDs to subtract from the base shape',
          items: {
            type: 'string'
          }
        }
      },
      required: ['baseShapeId', 'subtractShapeIds']
    },
    execute: async (params) => {
      console.log('Subtract shapes with params:', params);
      // This would call the actual JSCAD API to subtract shapes
      return {
        success: true,
        operation: 'subtract',
        parameters: params,
        message: `Subtracted shapes ${params.subtractShapeIds.join(', ')} from ${params.baseShapeId}`
      };
    }
  });

  // Intersection tool
  mcpClient.registerTool({
    name: 'intersect_shapes',
    description: 'Creates the intersection of two or more shapes using boolean intersection',
    parameters: {
      type: 'object',
      properties: {
        shapeIds: {
          type: 'array',
          description: 'Array of shape IDs to intersect',
          items: {
            type: 'string'
          }
        }
      },
      required: ['shapeIds']
    },
    execute: async (params) => {
      console.log('Intersect shapes with params:', params);
      // This would call the actual JSCAD API to intersect shapes
      return {
        success: true,
        operation: 'intersect',
        parameters: params,
        message: `Created intersection of shapes: ${params.shapeIds.join(', ')}`
      };
    }
  });
};

// Export the initialization function
export default initializeTools; 