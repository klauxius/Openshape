// OpenShape Parts Library
// This module provides standard parts that can be inserted into the 3D scene

import * as jscad from '@jscad/modeling';
import { modelStore, notifyModelChanged } from './mcpTools';

/**
 * Creates a standard cube/box part
 * @param {Object} params - Parameters for the cube
 * @param {number} params.width - Width of the cube
 * @param {number} params.height - Height of the cube
 * @param {number} params.depth - Depth of the cube
 * @param {Array} params.position - Position of the cube center [x, y, z]
 * @param {string} params.name - Optional name for the part
 * @returns {Object} Result with modelId and model data
 */
export const createCube = (params = {}) => {
  const width = params.width || 10;
  const height = params.height || 10;
  const depth = params.depth || 10;
  const position = params.position || [0, 0, 0];
  const name = params.name || 'Cube';
  
  try {
    // Create the cube using JSCAD
    const cube = jscad.primitives.cuboid({
      size: [width, height, depth],
      center: position
    });
    
    // Add to model store
    const modelId = modelStore.addModel(cube, name);
    const modelData = modelStore.getModel(modelId);
    
    // Notify the viewer
    notifyModelChanged(modelData);
    
    return {
      success: true,
      modelId: modelId,
      model: modelData,
      message: `Created a cube with dimensions ${width}×${height}×${depth}`
    };
  } catch (error) {
    console.error('Error creating cube:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Creates a standard sphere part
 * @param {Object} params - Parameters for the sphere
 * @param {number} params.radius - Radius of the sphere
 * @param {Array} params.position - Position of the sphere center [x, y, z]
 * @param {number} params.segments - Number of segments for the sphere (resolution)
 * @param {string} params.name - Optional name for the part
 * @returns {Object} Result with modelId and model data
 */
export const createSphere = (params = {}) => {
  const radius = params.radius || 5;
  const position = params.position || [0, 0, 0];
  const segments = params.segments || 32;
  const name = params.name || 'Sphere';
  
  try {
    // Create the sphere using JSCAD
    const sphere = jscad.primitives.sphere({
      radius: radius,
      segments: segments,
      center: position
    });
    
    // Add to model store
    const modelId = modelStore.addModel(sphere, name);
    const modelData = modelStore.getModel(modelId);
    
    // Notify the viewer
    notifyModelChanged(modelData);
    
    return {
      success: true,
      modelId: modelId,
      model: modelData,
      message: `Created a sphere with radius ${radius}`
    };
  } catch (error) {
    console.error('Error creating sphere:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Creates a standard cylinder part
 * @param {Object} params - Parameters for the cylinder
 * @param {number} params.radius - Radius of the cylinder
 * @param {number} params.height - Height of the cylinder
 * @param {Array} params.position - Position of the cylinder center [x, y, z]
 * @param {number} params.segments - Number of segments for the cylinder (resolution)
 * @param {string} params.name - Optional name for the part
 * @returns {Object} Result with modelId and model data
 */
export const createCylinder = (params = {}) => {
  const radius = params.radius || 5;
  const height = params.height || 10;
  const position = params.position || [0, 0, 0];
  const segments = params.segments || 32;
  const name = params.name || 'Cylinder';
  
  try {
    // Create the cylinder using JSCAD
    const cylinder = jscad.primitives.cylinder({
      radius: radius,
      height: height,
      segments: segments,
      center: [position[0], position[1], position[2]]
    });
    
    // Add to model store
    const modelId = modelStore.addModel(cylinder, name);
    const modelData = modelStore.getModel(modelId);
    
    // Notify the viewer
    notifyModelChanged(modelData);
    
    return {
      success: true,
      modelId: modelId,
      model: modelData,
      message: `Created a cylinder with radius ${radius} and height ${height}`
    };
  } catch (error) {
    console.error('Error creating cylinder:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Creates a standard torus part
 * @param {Object} params - Parameters for the torus
 * @param {number} params.innerRadius - Inner radius of the torus
 * @param {number} params.outerRadius - Outer radius of the torus
 * @param {Array} params.position - Position of the torus center [x, y, z]
 * @param {number} params.segments - Number of segments for the torus (resolution)
 * @param {string} params.name - Optional name for the part
 * @returns {Object} Result with modelId and model data
 */
export const createTorus = (params = {}) => {
  const innerRadius = params.innerRadius || 2;
  const outerRadius = params.outerRadius || 5;
  const position = params.position || [0, 0, 0];
  const segments = params.segments || 32;
  const name = params.name || 'Torus';
  
  try {
    // Create the torus using JSCAD
    const torus = jscad.primitives.torus({
      innerRadius: innerRadius,
      outerRadius: outerRadius,
      segments: segments,
      center: [position[0], position[1], position[2]]
    });
    
    // Add to model store
    const modelId = modelStore.addModel(torus, name);
    const modelData = modelStore.getModel(modelId);
    
    // Notify the viewer
    notifyModelChanged(modelData);
    
    return {
      success: true,
      modelId: modelId,
      model: modelData,
      message: `Created a torus with inner radius ${innerRadius} and outer radius ${outerRadius}`
    };
  } catch (error) {
    console.error('Error creating torus:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Additional standard parts can be added here, such as:
// - Nuts and bolts
// - Standard profiles (I-beam, T-beam, etc.)
// - Common mechanical components

/**
 * Insert a standard part into the scene
 * @param {string} partType - Type of part to insert ('cube', 'sphere', 'cylinder', 'torus')
 * @param {Object} params - Parameters for the part
 * @returns {Object} Result with modelId and model data
 */
export const insertStandardPart = (partType, params = {}) => {
  switch (partType.toLowerCase()) {
    case 'cube':
      return createCube(params);
    case 'sphere':
      return createSphere(params);
    case 'cylinder':
      return createCylinder(params);
    case 'torus':
      return createTorus(params);
    default:
      return {
        success: false,
        error: `Unknown part type: ${partType}`
      };
  }
};

// Export the parts library
export default {
  createCube,
  createSphere,
  createCylinder,
  createTorus,
  insertStandardPart
}; 