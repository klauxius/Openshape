/**
 * MeasurementTool component for handling measurements in the 3D scene
 * 
 * This component provides functionality for measuring distances and angles
 * between points in 3D space, and visualizing these measurements.
 */

import * as THREE from 'three';
import measurementUtils from '../../utils/measurementUtils';

/**
 * Factory function to create a measurement tool
 * @param {object} options - Configuration options
 * @param {object} options.sceneRef - Reference to the Three.js scene
 * @param {object} options.cameraRef - Reference to the camera
 * @param {object} options.controlsRef - Reference to the orbit controls
 * @param {object} options.unitSystem - The current unit system
 * @param {function} options.onMeasurementComplete - Callback when measurement is complete
 * @returns {object} The measurement tool instance
 */
const MeasurementTool = ({
  sceneRef,
  cameraRef,
  controlsRef,
  unitSystem,
  onMeasurementComplete = () => {}
}) => {
  // Internal state
  let activeMeasurementPoints = [];
  let activeMeasurementObjects = null;
  let measurementType = 'distance';
  let measurements = [];
  
  /**
   * Create a point marker at the specified position
   * @param {THREE.Vector3} position - The position for the marker
   * @param {string} color - Color of the marker
   * @returns {THREE.Mesh} The point marker mesh
   */
  const createPointMarker = (position, color = '#ff5722') => {
    const geometry = new THREE.SphereGeometry(0.1, 16, 16);
    const material = new THREE.MeshBasicMaterial({ 
      color: new THREE.Color(color),
      depthTest: false
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.renderOrder = 1000; // Ensure it renders on top
    return mesh;
  };
  
  /**
   * Create a line between two points
   * @param {THREE.Vector3} point1 - First point
   * @param {THREE.Vector3} point2 - Second point
   * @param {string} color - Color of the line
   * @returns {THREE.Line} The line object
   */
  const createLine = (point1, point2, color = '#2196f3') => {
    const geometry = new THREE.BufferGeometry().setFromPoints([point1, point2]);
    const material = new THREE.LineBasicMaterial({ 
      color: new THREE.Color(color),
      depthTest: false,
      linewidth: 2
    });
    const line = new THREE.Line(geometry, material);
    line.renderOrder = 999; // Ensure it renders on top
    return line;
  };
  
  /**
   * Update the active measurement visualization
   */
  const updateMeasurementVisualization = () => {
    // Clear any existing visualization
    if (activeMeasurementObjects) {
      if (sceneRef.current) {
        activeMeasurementObjects.children.forEach((obj) => {
          sceneRef.current.remove(obj);
        });
      }
      activeMeasurementObjects = null;
    }
    
    // Create new visualization group
    activeMeasurementObjects = new THREE.Group();
    
    // Add points to the visualization
    activeMeasurementPoints.forEach((point, index) => {
      const marker = createPointMarker(point);
      activeMeasurementObjects.add(marker);
    });
    
    // For distance measurement (need 2 points)
    if (measurementType === 'distance' && activeMeasurementPoints.length >= 2) {
      const point1 = activeMeasurementPoints[0];
      const point2 = activeMeasurementPoints[1];
      
      // Create line between points
      const line = createLine(point1, point2);
      activeMeasurementObjects.add(line);
      
      // Calculate and display distance
      const distance = measurementUtils.calculateDistance(point1, point2);
      const formattedDistance = measurementUtils.formatDistance(distance, unitSystem);
      
      // Create text sprite at midpoint
      const midpoint = measurementUtils.findMidpoint(point1, point2);
      const textSprite = measurementUtils.createTextSprite(formattedDistance);
      textSprite.position.copy(midpoint);
      textSprite.position.y += 0.2; // Offset above the line
      activeMeasurementObjects.add(textSprite);
      
      // If we have exactly 2 points, measurement is complete
      if (activeMeasurementPoints.length === 2) {
        const measurementData = measurementUtils.createMeasurementData(
          'distance',
          activeMeasurementPoints,
          distance,
          unitSystem
        );
        
        // Notify about completed measurement
        onMeasurementComplete(measurementData);
        
        // Store the measurement
        measurements.push({
          type: 'distance',
          points: activeMeasurementPoints.map(p => p.clone()),
          distance,
          formattedValue: formattedDistance
        });
        
        // Reset for next measurement
        activeMeasurementPoints = [];
      }
    }
    
    // For angle measurement (need 3 points)
    if (measurementType === 'angle' && activeMeasurementPoints.length >= 3) {
      const point1 = activeMeasurementPoints[0];
      const point2 = activeMeasurementPoints[1]; // Vertex point
      const point3 = activeMeasurementPoints[2];
      
      // Create lines between points
      const line1 = createLine(point1, point2);
      const line2 = createLine(point2, point3);
      activeMeasurementObjects.add(line1);
      activeMeasurementObjects.add(line2);
      
      // Calculate and display angle
      const angle = measurementUtils.calculateAngle(point1, point2, point3);
      const formattedAngle = measurementUtils.formatAngle(angle, true);
      
      // Position text at the vertex with a small offset
      const direction1 = new THREE.Vector3().subVectors(point1, point2).normalize();
      const direction2 = new THREE.Vector3().subVectors(point3, point2).normalize();
      const textDirection = new THREE.Vector3().addVectors(direction1, direction2).normalize();
      
      const textPosition = new THREE.Vector3().copy(point2).addScaledVector(textDirection, 0.5);
      const textSprite = measurementUtils.createTextSprite(formattedAngle);
      textSprite.position.copy(textPosition);
      activeMeasurementObjects.add(textSprite);
      
      // If we have exactly 3 points, measurement is complete
      if (activeMeasurementPoints.length === 3) {
        const measurementData = measurementUtils.createMeasurementData(
          'angle',
          activeMeasurementPoints,
          angle,
          unitSystem
        );
        
        // Notify about completed measurement
        onMeasurementComplete(measurementData);
        
        // Store the measurement
        measurements.push({
          type: 'angle',
          points: activeMeasurementPoints.map(p => p.clone()),
          angle,
          formattedValue: formattedAngle
        });
        
        // Reset for next measurement
        activeMeasurementPoints = [];
      }
    }
    
    // Add the group to the scene
    if (sceneRef.current) {
      sceneRef.current.add(activeMeasurementObjects);
    }
  };
  
  /**
   * Add a measurement point
   * @param {THREE.Vector3} point - The point to add
   */
  const addMeasurementPoint = (point) => {
    // Add the point to the active points
    activeMeasurementPoints.push(point.clone());
    
    // Check if we have enough points for the current measurement type
    const requiredPoints = measurementType === 'distance' ? 2 : 3;
    
    // Update the visualization
    updateMeasurementVisualization();
    
    // If we have enough points, complete the measurement
    if (activeMeasurementPoints.length > requiredPoints) {
      activeMeasurementPoints = []; // Reset for next measurement
    }
  };
  
  /**
   * Set the measurement type to distance
   */
  const setDistanceMeasurement = () => {
    measurementType = 'distance';
    activeMeasurementPoints = [];
    updateMeasurementVisualization();
  };
  
  /**
   * Set the measurement type to angle
   */
  const setAngleMeasurement = () => {
    measurementType = 'angle';
    activeMeasurementPoints = [];
    updateMeasurementVisualization();
  };
  
  /**
   * Clear all measurements
   */
  const clearMeasurements = () => {
    activeMeasurementPoints = [];
    
    // Remove visualizations
    if (sceneRef.current) {
      if (activeMeasurementObjects) {
        activeMeasurementObjects.children.forEach((obj) => {
          sceneRef.current.remove(obj);
        });
      }
      
      // Remove all persistent measurements
      measurements.forEach((measurement) => {
        if (measurement.visualObjects) {
          measurement.visualObjects.forEach((obj) => {
            sceneRef.current.remove(obj);
          });
        }
      });
    }
    
    measurements = [];
    activeMeasurementObjects = null;
  };
  
  /**
   * Cancel the current measurement in progress
   * This clears the active points but keeps saved measurements
   */
  const cancelCurrentMeasurement = () => {
    // Clear active points
    activeMeasurementPoints = [];
    
    // Remove active visualization
    if (sceneRef.current && activeMeasurementObjects) {
      activeMeasurementObjects.children.forEach((obj) => {
        sceneRef.current.remove(obj);
      });
      activeMeasurementObjects = null;
    }
    
    // Update visualization
    updateMeasurementVisualization();
  };
  
  /**
   * Update the unit system for measurements
   * @param {object} newUnitSystem - The new unit system
   */
  const updateUnitSystem = (newUnitSystem) => {
    unitSystem = newUnitSystem;
    
    // Update any active visualizations
    updateMeasurementVisualization();
  };
  
  // Return the public API
  return {
    addMeasurementPoint,
    setDistanceMeasurement,
    setAngleMeasurement,
    clearMeasurements,
    cancelCurrentMeasurement,
    updateUnitSystem,
    get measurementType() { return measurementType; },
    get measurements() { return [...measurements]; }
  };
};

export default MeasurementTool; 