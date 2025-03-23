import React from 'react';

/**
 * A DOM-based ViewCube component for orientation in CAD applications
 * This uses standard DOM elements with CSS 3D transforms instead of Three.js objects
 */
const DomViewCube = ({
  cameraRef,
  controlsRef,
  size = 80,
  position = { right: '20px', top: '20px' }
}) => {
  console.log('DomViewCube rendering');

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
    perspective: '300px',
    zIndex: 10,
    filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.3))'
  };

  const containerStyle = {
    transformStyle: 'preserve-3d',
    transform: 'rotateX(-15deg) rotateY(-30deg)',
    width: '100%',
    height: '100%',
    position: 'relative',
    transition: 'transform 0.3s ease-out',
  };

  const faceStyle = {
    position: 'absolute',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid rgba(255,255,255,0.9)',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '16px',
    transition: 'all 0.2s',
    color: 'white',
    textShadow: '0px 1px 2px rgba(0,0,0,0.5)',
    boxShadow: 'inset 0 0 10px rgba(255,255,255,0.3)'
  };

  const faces = [
    { name: 'front', label: 'Front', transform: `translateZ(${size / 2}px)`, color: 'rgba(66, 165, 245, 0.9)' },
    { name: 'back', label: 'Back', transform: `rotateY(180deg) translateZ(${size / 2}px)`, color: 'rgba(126, 87, 194, 0.9)' },
    { name: 'right', label: 'Right', transform: `rotateY(90deg) translateZ(${size / 2}px)`, color: 'rgba(239, 83, 80, 0.9)' },
    { name: 'left', label: 'Left', transform: `rotateY(-90deg) translateZ(${size / 2}px)`, color: 'rgba(236, 64, 122, 0.9)' },
    { name: 'top', label: 'Top', transform: `rotateX(90deg) translateZ(${size / 2}px)`, color: 'rgba(102, 187, 106, 0.9)' },
    { name: 'bottom', label: 'Bottom', transform: `rotateX(-90deg) translateZ(${size / 2}px)`, color: 'rgba(38, 166, 154, 0.9)' }
  ];

  return (
    <div style={cubeStyle} className="viewcube-container">
      <div
        style={containerStyle}
        className="viewcube-inner"
      >
        {faces.map((face) => (
          <div
            key={face.name}
            style={{
              ...faceStyle,
              transform: face.transform,
              backgroundColor: face.color,
            }}
            onClick={() => handleFaceClick(face.name)}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = face.color.replace('0.9', '1');
              e.currentTarget.style.transform = `${face.transform.split(')')[0]}) scale(1.05)`;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = face.color;
              e.currentTarget.style.transform = face.transform;
            }}
          >
            {face.label}
          </div>
        ))}
      </div>
      
      {/* Add a circular background behind the cube for better visibility */}
      <div style={{
        position: 'absolute',
        top: '-10px',
        left: '-10px',
        right: '-10px',
        bottom: '-10px',
        borderRadius: '50%',
        backgroundColor: 'rgba(255,255,255,0.7)',
        zIndex: -1
      }} />
    </div>
  );
};

export default DomViewCube; 