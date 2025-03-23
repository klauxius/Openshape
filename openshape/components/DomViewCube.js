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
    const controls = controlsRef.current;
    
    // Track camera orientation and update the cube accordingly
    const updateCubeOrientation = () => {
      if (!camera || !containerRef.current) return;
      
      // Get the camera quaternion and convert to Euler angles
      const quaternion = camera.quaternion.clone();
      const euler = new THREE.Euler().setFromQuaternion(quaternion, 'XYZ');
      
      // Convert to degrees and normalize
      const xDeg = THREE.MathUtils.radToDeg(euler.x);
      const yDeg = THREE.MathUtils.radToDeg(euler.y);
      const zDeg = THREE.MathUtils.radToDeg(euler.z);
      
      // Update the cube's orientation by inverting the camera rotation
      setCameraRotation({
        x: -xDeg,
        y: -yDeg,
        z: -zDeg
      });
    };
    
    // Set up animation loop to track camera changes
    const animate = () => {
      updateCubeOrientation();
      animationFrameId.current = requestAnimationFrame(animate);
    };
    
    animate();
    
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

    // Set camera position based on the clicked face
    const distance = 20;
    
    switch (view) {
      case 'front':
        cameraRef.current.position.set(0, 0, distance);
        cameraRef.current.up.set(0, 1, 0);
        break;
      case 'back':
        cameraRef.current.position.set(0, 0, -distance);
        cameraRef.current.up.set(0, 1, 0);
        break;
      case 'left':
        cameraRef.current.position.set(-distance, 0, 0);
        cameraRef.current.up.set(0, 1, 0);
        break;
      case 'right':
        cameraRef.current.position.set(distance, 0, 0);
        cameraRef.current.up.set(0, 1, 0);
        break;
      case 'top':
        cameraRef.current.position.set(0, distance, 0);
        cameraRef.current.up.set(0, 0, -1);
        break;
      case 'bottom':
        cameraRef.current.position.set(0, -distance, 0);
        cameraRef.current.up.set(0, 0, 1);
        break;
      default:
        return;
    }
    
    cameraRef.current.lookAt(0, 0, 0);
    controlsRef.current.update();
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
    transition: 'all 0.2s',
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
              e.currentTarget.style.transform = `${face.transform.split(')')[0]}) scale(1.03)`;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(230, 230, 230, 0.7)';
              e.currentTarget.style.transform = face.transform;
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
        <div style={{
          position: 'absolute',
          color: axisColors.x,
          fontWeight: 'bold',
          fontSize: '10px',
          transform: `rotateY(90deg) translateX(${axisLength + size/4}px) translateZ(${-arrowSize*2}px)`,
          transformOrigin: 'left center',
          zIndex: 20,
          pointerEvents: 'none'
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
        <div style={{
          position: 'absolute',
          color: axisColors.y,
          fontWeight: 'bold',
          fontSize: '10px',
          transform: `rotateX(-90deg) translateY(${axisLength + size/4}px) translateX(${-arrowSize}px)`,
          transformOrigin: 'center top',
          zIndex: 20,
          pointerEvents: 'none'
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
        <div style={{
          position: 'absolute',
          color: axisColors.z,
          fontWeight: 'bold',
          fontSize: '10px',
          transform: `translateZ(${axisLength + size/4}px) translateX(${size/2 - axisWidth}px)`,
          zIndex: 20,
          pointerEvents: 'none'
        }}>Z</div>
      </div>
    </div>
  );
};

export default DomViewCube; 