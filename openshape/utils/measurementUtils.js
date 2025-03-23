/**
 * Measurement utilities for OpenShape CAD
 * 
 * This module provides utilities for measuring distances, angles, 
 * and other geometry in 3D space.
 */

import * as THREE from 'three';
import { convertFromMm, formatValueWithUnit } from './unitUtils';

/**
 * Calculate the distance between two points in 3D space
 * @param {THREE.Vector3} point1 - The first point
 * @param {THREE.Vector3} point2 - The second point
 * @returns {number} The distance in millimeters (internal units)
 */
export const calculateDistance = (point1, point2) => {
  return point1.distanceTo(point2);
};

/**
 * Calculate the angle between three points in 3D space
 * @param {THREE.Vector3} point1 - The first point
 * @param {THREE.Vector3} point2 - The center point (vertex of angle)
 * @param {THREE.Vector3} point3 - The third point
 * @returns {number} The angle in radians
 */
export const calculateAngle = (point1, point2, point3) => {
  // Create vectors from the vertex to the other points
  const v1 = new THREE.Vector3().subVectors(point1, point2);
  const v2 = new THREE.Vector3().subVectors(point3, point2);
  
  // Normalize the vectors
  v1.normalize();
  v2.normalize();
  
  // Calculate the dot product and clamp it to avoid precision issues
  const dot = Math.max(-1, Math.min(1, v1.dot(v2)));
  
  // Return the angle in radians
  return Math.acos(dot);
};

/**
 * Format a distance value according to the current unit system
 * @param {number} distance - The distance in millimeters (internal units)
 * @param {object} unitSystem - The current unit system object
 * @returns {string} The formatted distance with unit
 */
export const formatDistance = (distance, unitSystem) => {
  // Convert the distance from mm to the current unit system
  const convertedValue = convertFromMm(distance, unitSystem);
  
  // Format the value with the appropriate precision
  const formattedValue = convertedValue.toFixed(2);
  
  // Return the formatted value with unit abbreviation
  return `${formattedValue} ${unitSystem.abbreviation}`;
};

/**
 * Format an angle value for display
 * @param {number} angle - The angle in radians
 * @param {boolean} useDegrees - Whether to use degrees (true) or radians (false)
 * @returns {string} The formatted angle with unit
 */
export const formatAngle = (angle, useDegrees = true) => {
  if (useDegrees) {
    // Convert radians to degrees
    const degrees = (angle * 180) / Math.PI;
    return `${degrees.toFixed(1)}°`;
  } else {
    return `${angle.toFixed(2)} rad`;
  }
};

/**
 * Create a text sprite for displaying measurement values in the 3D scene
 * @param {string} text - The text to display
 * @param {object} options - Options for the text sprite (position, color, etc.)
 * @returns {THREE.Sprite} A sprite containing the text
 */
export const createTextSprite = (text, options = {}) => {
  const {
    fontFace = 'Arial',
    fontSize = 24,
    fontColor = '#ffffff',
    backgroundColor = '#000000',
    padding = 4,
    opacity = 0.75,
  } = options;

  // Create a canvas to draw the text
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  // Set font properties
  context.font = `${fontSize}px ${fontFace}`;
  
  // Measure the text width
  const textWidth = context.measureText(text).width;
  
  // Set canvas dimensions with padding
  canvas.width = textWidth + padding * 2;
  canvas.height = fontSize + padding * 2;
  
  // Draw background
  context.fillStyle = backgroundColor;
  context.globalAlpha = opacity;
  context.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw text
  context.globalAlpha = 1.0;
  context.fillStyle = fontColor;
  context.font = `${fontSize}px ${fontFace}`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, canvas.width / 2, canvas.height / 2);
  
  // Create texture from canvas
  const texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;
  
  // Create sprite material
  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
  });
  
  // Create and return the sprite
  const sprite = new THREE.Sprite(spriteMaterial);
  
  // Scale the sprite based on canvas dimensions
  const scaleFactor = 0.01; // Adjust as needed
  sprite.scale.set(
    canvas.width * scaleFactor,
    canvas.height * scaleFactor,
    1
  );
  
  return sprite;
};

/**
 * Generate measurement data object
 * @param {string} type - The measurement type ('distance' or 'angle')
 * @param {Array<THREE.Vector3>} points - The points involved in the measurement
 * @param {number} value - The calculated measurement value
 * @param {object} unitSystem - The current unit system
 * @returns {object} The measurement data object
 */
export const createMeasurementData = (type, points, value, unitSystem) => {
  let formattedValue;
  
  if (type === 'distance') {
    formattedValue = formatDistance(value, unitSystem);
  } else if (type === 'angle') {
    formattedValue = formatAngle(value, true);
  }
  
  return {
    id: `measurement-${Date.now()}`,
    type,
    points: points.map(p => p.clone()),
    value,
    formattedValue,
    timestamp: new Date(),
  };
};

/**
 * Find the midpoint between two points
 * @param {THREE.Vector3} point1 - The first point
 * @param {THREE.Vector3} point2 - The second point
 * @returns {THREE.Vector3} The midpoint
 */
export const findMidpoint = (point1, point2) => {
  return new THREE.Vector3().addVectors(point1, point2).multiplyScalar(0.5);
};

export default {
  calculateDistance,
  calculateAngle,
  formatDistance,
  formatAngle,
  createTextSprite,
  createMeasurementData,
  findMidpoint,
}; 