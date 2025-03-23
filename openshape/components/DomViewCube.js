import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

/**
 * A DOM-based ViewCube component for orientation in CAD applications
 * This uses standard DOM elements with CSS 3D transforms instead of Three.js objects
 * Synchronizes with camera orientation and provides axis indicators
 */
const DomViewCube = ({
  cameraRef,
  controlsRef,
  size = 40,
  position = { right: '20px', top: '70px' }
}) => {
  const [cameraRotation, setCameraRotation] = useState({ x: -15, y: -30 });
  const containerRef = useRef(null);
  const animationFrameId = useRef(null);
  const [cameraControlsReady, setCameraControlsReady] = useState(false);
  
  // Utility function to update cube orientation based on camera
  const updateCubeOrientation = () => {
    if (!cameraRef?.current || !containerRef.current) return;
    
    const camera = cameraRef.current;
    
    // We need to extract rotation that exactly matches CAD standard views
    // This requires creating a direction vector for where the camera is looking
    const lookDir = new THREE.Vector3(0, 0, -1);
    lookDir.applyQuaternion(camera.quaternion);
    
    // Get camera up vector
    const upVector = camera.up.clone();
    
    // Calculate absolute magnitudes for each axis to determine main direction
    const absX = Math.abs(lookDir.x);
    const absY = Math.abs(lookDir.y);
    const absZ = Math.abs(lookDir.z);
    
    // Find dominant axis and direction
    let rotX = 0, rotY = 0, rotZ = 0;
    
    // First handle standard orthographic views (along principal axes)
    if (absX > absY && absX > absZ) {
      // Looking primarily along X-axis
      rotY = lookDir.x > 0 ? -90 : 90; // Right or Left view
    } else if (absY > absX && absY > absZ) {
      // Looking primarily along Y-axis
      rotX = lookDir.y > 0 ? 90 : -90; // Bottom or Top view
    } else {
      // Looking primarily along Z-axis
      rotY = lookDir.z > 0 ? 180 : 0;  // Back or Front view
    }
    
    // For non-standard views, fall back to basic Euler angle conversion
    if (rotX === 0 && rotY === 0 && rotZ === 0) {
      const euler = new THREE.Euler().setFromQuaternion(camera.quaternion, 'XYZ');
      rotX = THREE.MathUtils.radToDeg(euler.x);
      rotY = THREE.MathUtils.radToDeg(euler.y);
      rotZ = THREE.MathUtils.radToDeg(euler.z);
    }
    
    // Update cube rotation, negating to counter-rotate from camera
    setCameraRotation({
      x: -rotX,
      y: -rotY,
      z: -rotZ
    });
  };
  
  // First, check when camera and controls become available
  useEffect(() => {
    // Create a function to check if camera and controls are ready
    const checkReferences = () => {
      if (cameraRef?.current && controlsRef?.current) {
        setCameraControlsReady(true);
        return true;
      }
      return false;
    };
    
    // Check immediately
    if (!checkReferences()) {
      // If not ready, set up an interval to check periodically
      const intervalId = setInterval(() => {
        if (checkReferences()) {
          clearInterval(intervalId);
        }
      }, 500); // Check every 500ms
      
      // Clean up interval on unmount
      return () => clearInterval(intervalId);
    }
  }, [cameraRef, controlsRef]);
  
  // Handle camera orientation tracking once camera and controls are ready
  useEffect(() => {
    // Only proceed if we've confirmed camera and controls are ready
    if (!cameraControlsReady) return;
    
    const camera = cameraRef.current;
    
    // Track camera orientation and update the cube accordingly
    const animateUpdates = () => {
      if (camera.userData && camera.userData.viewJustSet) {
        // Skip this update if we just set the view manually
        camera.userData.viewJustSet = false;
      } else {
        updateCubeOrientation();
      }
      animationFrameId.current = requestAnimationFrame(animateUpdates);
    };
    
    animateUpdates();
    
    // Clean up animation frame on unmount
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [cameraControlsReady, cameraRef, controlsRef]);

  const handleFaceClick = (view) => {
    if (!cameraRef?.current || !controlsRef?.current) {
      console.warn('Cannot set view: missing camera or controls');
      return;
    }

    const camera = cameraRef.current;
    const controls = controlsRef.current;
    
    // Save original state to restore properties after view change
    const originalPosition = camera.position.clone();
    const originalTarget = controls.target ? controls.target.clone() : new THREE.Vector3(0, 0, 0);

    // Set standard view distance, keeping any existing zoom level
    const distance = 20;
    const currentDistance = originalPosition.distanceTo(originalTarget);
    const zoomFactor = currentDistance > 0 ? currentDistance / distance : 1;
    
    // Begin with a clean slate
    controls.target.set(0, 0, 0);
    
    // Set precise view orientations using strict CAD standard directions
    switch (view) {
      case 'front': // Looking along negative Z
        camera.position.set(0, 0, distance);
        camera.up.set(0, 1, 0);
        camera.lookAt(0, 0, 0);
        break;
      case 'back': // Looking along positive Z
        camera.position.set(0, 0, -distance);
        camera.up.set(0, 1, 0);
        camera.lookAt(0, 0, 0);
        break;
      case 'right': // Looking along positive X
        camera.position.set(distance, 0, 0);
        camera.up.set(0, 1, 0);
        camera.lookAt(0, 0, 0);
        break;
      case 'left': // Looking along negative X
        camera.position.set(-distance, 0, 0);
        camera.up.set(0, 1, 0);
        camera.lookAt(0, 0, 0);
        break;
      case 'top': // Looking along negative Y
        camera.position.set(0, distance, 0);
        camera.up.set(0, 0, -1);
        camera.lookAt(0, 0, 0);
        break;
      case 'bottom': // Looking along positive Y
        camera.position.set(0, -distance, 0);
        camera.up.set(0, 0, 1);
        camera.lookAt(0, 0, 0);
        break;
      default:
        return;
    }
    
    // Force camera matrix updates
    camera.updateProjectionMatrix();
    camera.updateMatrix();
    camera.updateMatrixWorld(true);
    
    // Complete reset of controls to prevent any lingering state
    if (typeof controls.reset === 'function') {
      controls.reset();
    }
    
    // Completely clear any control state
    if (controls.target) {
      controls.target.set(0, 0, 0);
    }
    
    if (controls.object && controls.object.position) {
      // Make sure the controls object (usually camera) has the right position
      controls.object.position.copy(camera.position);
    }
    
    // Preserve any zoom level by scaling position
    if (zoomFactor !== 1) {
      camera.position.multiplyScalar(zoomFactor);
    }
    
    // Disable damping temporarily for immediate response
    const originalDamping = controls.enableDamping;
    controls.enableDamping = false;
    
    // Force multiple control updates to ensure changes take effect
    controls.update();
    controls.update(); // Second update to be sure
    
    // Restore damping setting
    controls.enableDamping = originalDamping;
    
    // Set the flag to skip the next camera update in the animation loop
    camera.userData.viewJustSet = true;
    
    // Immediately update cube to match exact view
    const lookDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const absX = Math.abs(lookDir.x);
    const absY = Math.abs(lookDir.y);
    const absZ = Math.abs(lookDir.z);
    
    let x = 0, y = 0, z = 0;
    
    if (absX > absY && absX > absZ) {
      y = lookDir.x > 0 ? -90 : 90;
    } else if (absY > absX && absY > absZ) {
      x = lookDir.y > 0 ? 90 : -90;
    } else {
      y = lookDir.z > 0 ? 180 : 0;
    }
    
    setCameraRotation({
      x: -x,
      y: -y,
      z: -z
    });
  };

  const cubeStyle = {
    position: 'absolute',
    top: position.top,
    right: position.right,
    width: `${size}px`,
    height: `${size}px`,
    perspective: '500px',
    zIndex: 10,
    pointerEvents: 'none' // Make container transparent to mouse events
  };

  const containerStyle = {
    transformStyle: 'preserve-3d',
    transform: `rotateX(${cameraRotation.x}deg) rotateY(${cameraRotation.y}deg) rotateZ(${cameraRotation.z || 0}deg)`,
    width: '100%',
    height: '100%',
    position: 'relative',
    transition: 'transform 0.05s ease-out',
    pointerEvents: 'auto' // Re-enable mouse events for the cube
  };

  const faceStyle = {
    position: 'absolute',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(0,0,0,0.3)',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '10px',
    transition: 'background-color 0.2s', // Only transition the background color
    color: '#333',
    backgroundColor: 'rgba(230, 230, 230, 0.7)',
    backdropFilter: 'blur(2px)',
  };

  // Main axes colors - standard CAD colors
  const axisColors = {
    x: '#e74c3c', // Red
    y: '#2ecc71', // Green
    z: '#3498db'  // Blue
  };

  // Blue hover color to match OnShape
  const hoverColor = 'rgba(160, 210, 255, 0.9)';

  const faces = [
    { name: 'front', label: 'Front', transform: `translateZ(${size / 2}px)` },
    { name: 'back', label: 'Back', transform: `rotateY(180deg) translateZ(${size / 2}px)` },
    { name: 'right', label: 'Right', transform: `rotateY(90deg) translateZ(${size / 2}px)` },
    { name: 'left', label: 'Left', transform: `rotateY(-90deg) translateZ(${size / 2}px)` },
    { name: 'top', label: 'Top', transform: `rotateX(90deg) translateZ(${size / 2}px)` },
    { name: 'bottom', label: 'Bottom', transform: `rotateX(-90deg) translateZ(${size / 2}px)` }
  ];

  // Adjusted axis indicator dimensions for smaller cube
  const axisLength = size * 0.7; // Slightly reduced proportion
  const axisWidth = 1.5; // Thinner for smaller cube
  const arrowSize = 4; // Smaller arrows

  // Helper function to create rotation arrows
  const createRotationArrows = () => {
    const arrowSize = size / 10; // Smaller arrows for smaller cube
    const thickness = 1.5; // Thinner lines
    
    return (
      <>
        {/* X-axis rotation arrows */}
        <div style={{
          position: 'absolute',
          width: `${arrowSize}px`,
          height: `${arrowSize}px`,
          top: `-${arrowSize/2}px`,
          left: `calc(50% - ${arrowSize/2}px)`,
          borderTop: `${thickness}px solid ${axisColors.x}`,
          borderLeft: `${thickness}px solid ${axisColors.x}`,
          transform: 'rotate(45deg)',
          pointerEvents: 'none',
          zIndex: 20,
        }} />
        <div style={{
          position: 'absolute',
          width: `${arrowSize}px`,
          height: `${arrowSize}px`,
          bottom: `-${arrowSize/2}px`,
          left: `calc(50% - ${arrowSize/2}px)`,
          borderBottom: `${thickness}px solid ${axisColors.x}`,
          borderRight: `${thickness}px solid ${axisColors.x}`,
          transform: 'rotate(45deg)',
          pointerEvents: 'none',
          zIndex: 20,
        }} />

        {/* Y-axis rotation arrows */}
        <div style={{
          position: 'absolute',
          width: `${arrowSize}px`,
          height: `${arrowSize}px`,
          top: `calc(50% - ${arrowSize/2}px)`,
          right: `-${arrowSize/2}px`,
          borderTop: `${thickness}px solid ${axisColors.y}`,
          borderRight: `${thickness}px solid ${axisColors.y}`,
          transform: 'rotate(45deg)',
          pointerEvents: 'none',
          zIndex: 20,
        }} />
        <div style={{
          position: 'absolute',
          width: `${arrowSize}px`,
          height: `${arrowSize}px`,
          top: `calc(50% - ${arrowSize/2}px)`,
          left: `-${arrowSize/2}px`,
          borderBottom: `${thickness}px solid ${axisColors.y}`,
          borderLeft: `${thickness}px solid ${axisColors.y}`,
          transform: 'rotate(45deg)',
          pointerEvents: 'none',
          zIndex: 20,
        }} />
      </>
    );
  };

  return (
    <div style={cubeStyle} className="viewcube-container">
      {/* Rotation indicator arrows */}
      {createRotationArrows()}
      
      {/* Circular background */}
      <div style={{
        position: 'absolute',
        top: '-5px',
        left: '-5px',
        right: '-5px',
        bottom: '-5px',
        borderRadius: '50%',
        backgroundColor: 'rgba(255,255,255,0.8)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        zIndex: -1,
        pointerEvents: 'none'
      }} />
      
      {/* Cube container */}
      <div
        ref={containerRef}
        style={containerStyle}
        className="viewcube-inner"
      >
        {/* Cube faces */}
        {faces.map((face) => (
          <div
            key={face.name}
            style={{
              ...faceStyle,
              transform: face.transform,
            }}
            onClick={() => handleFaceClick(face.name)}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = hoverColor;
              // No scale transform on hover - just color change
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(230, 230, 230, 0.7)';
            }}
          >
            {face.label}
          </div>
        ))}
        
        {/* X Axis (Red) */}
        <div style={{
          position: 'absolute',
          width: `${axisLength}px`,
          height: `${axisWidth}px`,
          backgroundColor: axisColors.x,
          transform: `rotateY(90deg) translateX(${size/4}px) translateZ(${-axisWidth/2}px)`,
          transformOrigin: 'left center',
          zIndex: 20,
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          width: 0,
          height: 0,
          borderTop: `${arrowSize}px solid transparent`,
          borderBottom: `${arrowSize}px solid transparent`,
          borderLeft: `${arrowSize}px solid ${axisColors.x}`,
          transform: `rotateY(90deg) translateX(${axisLength + size/4 - arrowSize}px) translateZ(${-arrowSize + axisWidth/2}px)`,
          transformOrigin: 'left center',
          zIndex: 20,
          pointerEvents: 'none'
        }} />
        {/* Improved X-axis label alignment */}
        <div style={{
          position: 'absolute',
          color: axisColors.x,
          fontWeight: 'bold',
          fontSize: '10px',
          transform: `rotateY(90deg) translateX(${axisLength + size/4 + 2}px) translateZ(${-arrowSize}px)`,
          transformOrigin: 'left center',
          zIndex: 20,
          pointerEvents: 'none',
          textAlign: 'center'
        }}>X</div>
        
        {/* Y Axis (Green) */}
        <div style={{
          position: 'absolute',
          width: `${axisWidth}px`,
          height: `${axisLength}px`,
          backgroundColor: axisColors.y,
          transform: `rotateX(-90deg) translateY(${size/4}px) translateZ(${-axisWidth/2}px)`,
          transformOrigin: 'center top',
          zIndex: 20,
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          width: 0,
          height: 0,
          borderLeft: `${arrowSize}px solid transparent`,
          borderRight: `${arrowSize}px solid transparent`,
          borderTop: `${arrowSize}px solid ${axisColors.y}`,
          transform: `rotateX(-90deg) translateY(${axisLength + size/4 - arrowSize}px) translateX(${-arrowSize + axisWidth/2}px)`,
          transformOrigin: 'center top',
          zIndex: 20,
          pointerEvents: 'none'
        }} />
        {/* Improved Y-axis label alignment */}
        <div style={{
          position: 'absolute',
          color: axisColors.y,
          fontWeight: 'bold',
          fontSize: '10px',
          transform: `rotateX(-90deg) translateY(${axisLength + size/4 + 2}px) translateX(${-arrowSize/2}px)`,
          transformOrigin: 'center top',
          zIndex: 20,
          pointerEvents: 'none',
          textAlign: 'center'
        }}>Y</div>
        
        {/* Z Axis (Blue) */}
        <div style={{
          position: 'absolute',
          width: `${axisWidth}px`,
          height: `${axisLength}px`,
          backgroundColor: axisColors.z,
          transform: `translateZ(${size/4}px) translateX(${size/2 - axisWidth/2}px)`,
          zIndex: 20,
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          width: 0,
          height: 0,
          borderLeft: `${arrowSize}px solid transparent`,
          borderRight: `${arrowSize}px solid transparent`,
          borderBottom: `${arrowSize}px solid ${axisColors.z}`,
          transform: `translateZ(${axisLength + size/4 - arrowSize}px) translateX(${size/2 - arrowSize}px)`,
          zIndex: 20,
          pointerEvents: 'none'
        }} />
        {/* Improved Z-axis label alignment */}
        <div style={{
          position: 'absolute',
          color: axisColors.z,
          fontWeight: 'bold',
          fontSize: '10px',
          transform: `translateZ(${axisLength + size/4 + 2}px) translateX(${size/2 - 3}px)`,
          zIndex: 20,
          pointerEvents: 'none',
          textAlign: 'center'
        }}>Z</div>
      </div>
    </div>
  );
};

export default DomViewCube; 