import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as jscad from '@jscad/modeling';
import ViewCube from './ViewCube';
import ExportModelDialog from './ExportModelDialog';
import ImportModelDialog from './ImportModelDialog';
import UnitSelector from './UnitSelector';
import { useUnits } from '../contexts/UnitContext';

// Import JSCAD primitives and operations
const { primitives, transforms, booleans } = jscad;
const { cube, sphere, cylinder, rectangle } = primitives;
const { translate, rotate, scale } = transforms;
const { subtract, union } = booleans;
const { extrudeLinear } = jscad.extrusions;
const { colorize } = jscad.colors;

// Error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error in JSCAD component:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '15px',
          backgroundColor: '#fff0f0',
          color: '#800',
          border: '1px solid #f00'
        }}>
          <h3>Error rendering 3D view</h3>
          <p>{this.state.error?.toString() || 'Unknown error'}</p>
        </div>
      );
    }

    return this.props.children;
  }
}

// This function converts JSCAD geometry polygons to a Three.js BufferGeometry
function jscadToThreeGeometry(jscadGeometry) {
  // Extract vertices and faces from JSCAD geometry
  const positions = [];
  const normals = [];
  const indices = [];
  
  let vertexIndex = 0;
  
  // Process each polygon in the JSCAD geometry
  jscadGeometry.polygons.forEach(polygon => {
    // Get vertices of this polygon
    const vertices = polygon.vertices.map(v => [v[0], v[1], v[2]]);
    
    if (vertices.length < 3) return; // Skip invalid polygons
    
    // Calculate normal
    const v0 = new THREE.Vector3(...vertices[0]);
    const v1 = new THREE.Vector3(...vertices[1]);
    const v2 = new THREE.Vector3(...vertices[2]);
    
    const edge1 = new THREE.Vector3().subVectors(v1, v0);
    const edge2 = new THREE.Vector3().subVectors(v2, v0);
    const normal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();
    
    // For faces with more than 3 vertices, we need to triangulate
    for (let i = 0; i < vertices.length - 2; i++) {
      // Add vertices to positions array
      positions.push(...vertices[0], ...vertices[i+1], ...vertices[i+2]);
      
      // Add normal for each vertex
      normals.push(
        normal.x, normal.y, normal.z,
        normal.x, normal.y, normal.z,
        normal.x, normal.y, normal.z
      );
      
      // Add triangle indices
      indices.push(vertexIndex, vertexIndex + 1, vertexIndex + 2);
      vertexIndex += 3;
    }
  });
  
  // Create Three.js BufferGeometry
  const geometry = new THREE.BufferGeometry();
  
  // Add attributes
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setIndex(indices);
  
  return geometry;
}

function JscadThreeScene() {
  const mountRef = useRef(null);
  const controlsRef = useRef(null);
  const [modelType, setModelType] = useState('cube');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentGeometry, setCurrentGeometry] = useState(null);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0, z: 0 });
  
  // Get unit system from context
  const { unitSystem, setUnitSystem, format } = useUnits();
  
  // Store references to Three.js objects for view controls
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    // Early return if the ref isn't set yet
    if (!mountRef.current) return;

    // Clean up any previous content
    while (mountRef.current.firstChild) {
      mountRef.current.removeChild(mountRef.current.firstChild);
    }

    // Dynamic import of JSCAD modules to avoid SSR issues
    const importJscad = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Import JSCAD modeling modules
        const jscadModeling = await import('@jscad/modeling');
        const { cube, sphere, cylinder } = jscadModeling.primitives;
        const { subtract, union, intersect } = jscadModeling.booleans;
        const { translate, rotate, scale } = jscadModeling.transforms;
        const { colorize } = jscadModeling.colors;
        const { extrudeLinear } = jscadModeling.extrusions;
        const { circle, rectangle, polygon } = jscadModeling.primitives;
        
        // Initialize Three.js
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf2f4f7); // Subtle light grey-blue background
        sceneRef.current = scene;
        
        // Get dimensions
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;
        
        // Create camera
        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        camera.position.set(15, 15, 15);
        camera.lookAt(0, 0, 0);
        cameraRef.current = camera;
        
        // Create renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        mountRef.current.appendChild(renderer.domElement);
        
        // Create orbit controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.25;
        
        // Configure mouse buttons for standard CAD interaction
        controls.mouseButtons = {
          LEFT: THREE.MOUSE.ROTATE,      // Left mouse button: Rotate
          MIDDLE: THREE.MOUSE.ROTATE,    // Middle mouse button: Rotate (industry standard)
          RIGHT: THREE.MOUSE.PAN         // Right mouse button: Pan
        };
        
        // Enable zoom with mouse wheel
        controls.enableZoom = true;
        controls.zoomSpeed = 1.2;
        
        // Adjust rotation and pan speed
        controls.rotateSpeed = 1.0;
        controls.panSpeed = 1.2;
        
        // Set limits for better user experience
        controls.minDistance = 2;       // Prevent zooming too close
        controls.maxDistance = 100;     // Prevent zooming too far
        
        // Save controls reference for external access
        controlsRef.current = controls;
        
        // Add lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(2, 4, 3);
        scene.add(directionalLight);
        
        // Add a grid helper with colors matching the design theme
        const gridHelper = new THREE.GridHelper(20, 20, 0x8c9cb0, 0xd9dee6);
        scene.add(gridHelper);
        
        // Add axes helper - shows XYZ axes with standard colors
        const axesHelper = new THREE.AxesHelper(10);
        scene.add(axesHelper);
        
        // Create geometry based on model type
        let jscadGeometry;
        
        if (modelType === 'cube') {
          // Create a simple cube
          jscadGeometry = cube({ size: 5 });
        } 
        else if (modelType === 'cylinder') {
          // Create a cylinder
          jscadGeometry = cylinder({ radius: 2, height: 6 });
        }
        else if (modelType === 'complex') {
          // Create a more complex shape - cylinder with a cube hole
          const mainCylinder = cylinder({ radius: 4, height: 6 });
          
          // For the hole, create a simple cube that definitely has a positive size
          // Then scale and translate it to the desired position
          const baseCube = cube({ size: 1 }); // Using 1 as a safe positive value
          
          // Scale the cube to create the desired hole shape (wider than the cylinder)
          const scaledCube = scale([3, 3, 10], baseCube);
          
          // Subtract the cube from the cylinder to create a hole
          jscadGeometry = subtract(mainCylinder, scaledCube);
        }
        else if (modelType === 'fixed-complex') {
          // Create a more complex shape - cylinder with a rectangular hole
          const mainCylinder = cylinder({ radius: 3.5, height: 5 });
          
          // Create a rectangular hole by starting with a simple cube
          const baseCube = cube({ size: 1 }); // Start with a single unit cube
          
          // Scale it to make a rectangular prism (longer than the cylinder diameter)
          const scaledCube = scale([2, 2, 8], baseCube);
          
          // Position the rectangular prism to clearly cut through the cylinder
          // Offset it slightly from the center to make the hole more visible
          const positionedCube = translate([1, 0, 0], scaledCube);
          
          // Subtract the cube from the cylinder to create a rectangular hole
          jscadGeometry = subtract(mainCylinder, positionedCube);
        }
        else if (modelType === 'union') {
          // Create a union of shapes
          const baseCube = translate([0, 0, 0], cube({ size: 4 }));
          const topSphere = translate([0, 0, 3], sphere({ radius: 2, segments: 32 }));
          jscadGeometry = union(baseCube, topSphere);
        }
        else if (modelType === 'extrusion') {
          // Create an extruded shape
          const shape = rectangle({ size: [5, 5] });
          jscadGeometry = extrudeLinear({ height: 3 }, shape);
        }
        else if (modelType === 'rotated') {
          // Create a rotated cube
          const baseCube = cube({ size: 4 });
          jscadGeometry = rotate([Math.PI/4, Math.PI/4, 0], baseCube);
        }
        else if (modelType === 'advanced') {
          // Advanced CSG example with multiple operations
          
          // Base shape - a cylinder
          const base = cylinder({ radius: 4, height: 2 });
          
          // Create some holes - three cylinders positioned in a triangle
          const holeRadius = 1;
          const holeDistance = 2;
          const hole1 = translate([holeDistance, 0, 0], 
                       cylinder({ radius: holeRadius, height: 5 }));
          const hole2 = translate([-holeDistance/2, holeDistance*0.866, 0], 
                       cylinder({ radius: holeRadius, height: 5 }));
          const hole3 = translate([-holeDistance/2, -holeDistance*0.866, 0], 
                       cylinder({ radius: holeRadius, height: 5 }));
          
          // Create a central cutout
          const centralCutout = translate([0, 0, 1],
                              cylinder({ radius: 2, height: 1 }));
          
          // Add some details on top
          const topDetail = translate([0, 0, 1],
                           cylinder({ radius: 1.5, height: 0.5 }));
          
          // Create small spheres to place at the corners
          const sphere1 = translate([holeDistance, 0, 0], 
                        sphere({ radius: 0.7, segments: 16 }));
          const sphere2 = translate([-holeDistance/2, holeDistance*0.866, 0], 
                        sphere({ radius: 0.7, segments: 16 }));
          const sphere3 = translate([-holeDistance/2, -holeDistance*0.866, 0], 
                        sphere({ radius: 0.7, segments: 16 }));
          
          // Combine everything using boolean operations
          // 1. Subtract the holes and central cutout from the base
          const baseWithHoles = subtract(
            base,
            hole1, hole2, hole3,
            centralCutout
          );
          
          // 2. Union the base with the top detail and decorative spheres
          jscadGeometry = union(
            baseWithHoles,
            topDetail,
            sphere1, sphere2, sphere3
          );
        }
        else {
          // Default to sphere
          jscadGeometry = sphere({ radius: 3, segments: 32 });
        }
        
        // Store the current geometry for export functionality
        setCurrentGeometry(jscadGeometry);
        
        // Colorize the geometry with greyish-blue color
        // [R, G, B] values from 0-1, creating a professional greyish-blue tone
        const colorized = colorize([0.4, 0.5, 0.6], jscadGeometry);
        
        // Convert JSCAD geometry to Three.js geometry
        const threeGeometry = jscadToThreeGeometry(colorized);
        
        // Create material with matching greyish-blue color
        const material = new THREE.MeshStandardMaterial({
          color: 0x6682a0,  // Hexadecimal equivalent of greyish-blue
          metalness: 0.2,
          roughness: 0.4,
          side: THREE.DoubleSide
        });
        
        // Create mesh and add to scene
        const mesh = new THREE.Mesh(threeGeometry, material);
        scene.add(mesh);
        
        // Configure touch controls
        controls.touches = {
          ONE: THREE.TOUCH.ROTATE,
          TWO: THREE.TOUCH.DOLLY_PAN
        };
        
        // Improve touch sensitivity
        controls.touchRotateSpeed = 1.0;
        controls.screenSpacePanning = true; // Panning relative to cursor instead of camera
        
        // Add a raycaster for mouse position tracking
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        
        // Track mouse position
        const onMouseMove = (event) => {
          // Calculate mouse position in normalized device coordinates
          const rect = renderer.domElement.getBoundingClientRect();
          mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
          mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
          
          // Update the picking ray with the camera and mouse position
          raycaster.setFromCamera(mouse, camera);
          
          // Calculate objects intersecting the picking ray
          const intersects = raycaster.intersectObjects(scene.children, true);
          
          if (intersects.length > 0) {
            // Get the intersection point coordinates
            const point = intersects[0].point;
            setMousePosition({
              x: point.x,
              y: point.y,
              z: point.z
            });
          }
        };
        
        renderer.domElement.addEventListener('mousemove', onMouseMove);
        
        // Animation loop
        const animate = () => {
          const animationFrameId = requestAnimationFrame(animate);
          controls.update();
          renderer.render(scene, camera);
          
          // Cleanup
          return () => {
            cancelAnimationFrame(animationFrameId);
            
            if (controls) controls.dispose();
            
            if (mesh) {
              if (mesh.geometry) mesh.geometry.dispose();
              if (mesh.material) mesh.material.dispose();
            }
            
            if (renderer) {
              if (mountRef.current) {
                try {
                  mountRef.current.removeChild(renderer.domElement);
                } catch (e) {
                  console.warn('Could not remove renderer from DOM', e);
                }
              }
              renderer.dispose();
            }
          };
        };
        
        // Start animation
        const cleanup = animate();
        
        // Handle window resize
        const handleResize = () => {
          if (!mountRef.current) return;
          
          const newWidth = mountRef.current.clientWidth;
          const newHeight = mountRef.current.clientHeight;
          
          camera.aspect = newWidth / newHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(newWidth, newHeight);
        };
        
        window.addEventListener('resize', handleResize);
        
        setLoading(false);
        
        // Return cleanup function
        return () => {
          window.removeEventListener('resize', handleResize);
          renderer.domElement.removeEventListener('mousemove', onMouseMove);
          cleanup();
        };
      } catch (error) {
        console.error('Failed to initialize JSCAD/Three.js:', error);
        setLoading(false);
        setError(`Error: ${error.message}`);
      }
    };
    
    importJscad();
  }, [modelType]);

  const handleModelChange = (event) => {
    setModelType(event.target.value);
  };

  // Set standard view functions
  const setFrontView = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(0, 0, 15);
      cameraRef.current.lookAt(0, 0, 0);
      controlsRef.current.update();
    }
  };

  const setTopView = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(0, 15, 0);
      cameraRef.current.lookAt(0, 0, 0);
      controlsRef.current.update();
    }
  };

  const setRightView = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(15, 0, 0);
      cameraRef.current.lookAt(0, 0, 0);
      controlsRef.current.update();
    }
  };

  const setIsometricView = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(15, 15, 15);
      cameraRef.current.lookAt(0, 0, 0);
      controlsRef.current.update();
    }
  };

  const handleImport = (importedData) => {
    // Handle the imported model data
    console.log('Imported model:', importedData);
    
    if (importedData.type === 'json' && importedData.geometry) {
      // If we have valid JSON geometry, we could apply it
      // This would require additional processing to convert to JSCAD format
      // For now, just log that we'd use this data
      console.log('Would apply imported JSON geometry');
    } else if (importedData.type === 'stl' && importedData.rawData) {
      // For STL, we would need a proper parser
      console.log('Would parse and apply STL data');
    }
  };

  // Handle unit system change
  const handleUnitChange = (newUnitSystem) => {
    setUnitSystem(newUnitSystem);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {loading && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          Loading...
        </div>
      )}
      
      {error && (
        <div style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          padding: '10px',
          backgroundColor: '#fff0f0',
          border: '1px solid #f00'
        }}>
          {error}
        </div>
      )}
      
      {/* Import/Export Dialogs */}
      <ExportModelDialog 
        isOpen={showExportDialog} 
        onClose={() => setShowExportDialog(false)} 
        geometry={currentGeometry} 
      />
      
      <ImportModelDialog 
        isOpen={showImportDialog} 
        onClose={() => setShowImportDialog(false)} 
        onImport={handleImport} 
      />
      
      {/* Model Controls */}
      <div style={{ 
        position: 'absolute', 
        top: '10px', 
        left: '10px', 
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        color: '#333'
      }}>
        <select 
          value={modelType} 
          onChange={handleModelChange}
          style={{
            padding: '5px 10px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            color: '#333'
          }}
        >
          <option value="cube">Cube</option>
          <option value="cylinder">Cylinder</option>
          <option value="complex">Complex (Subtract)</option>
          <option value="fixed-complex">Better Complex (Subtract)</option>
          <option value="union">Union</option>
          <option value="extrusion">Extrusion</option>
          <option value="rotated">Rotated</option>
          <option value="advanced">Advanced CSG</option>
        </select>
        
        {/* Navigation Help */}
        <div style={{
          fontSize: '12px',
          color: '#555',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          padding: '4px 8px',
          borderRadius: '4px',
          border: '1px solid #ddd',
          display: 'inline-block'
        }}>
          <span style={{ fontWeight: 'bold' }}>Navigation: </span>
          <span title="Industry standard CAD navigation">Middle/Left Mouse: Rotate | Right Mouse: Pan | Scroll: Zoom</span>
        </div>
        
        {/* Import/Export Buttons */}
        <div style={{ display: 'flex', gap: '5px' }}>
          <button
            onClick={() => setShowImportDialog(true)}
            style={{
              padding: '5px 10px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              background: '#fff',
              cursor: 'pointer',
              fontSize: '12px',
              color: '#333',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Import Model"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '4px' }}>
              <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm3.5 7.5a.5.5 0 0 1 0 1H5.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5H11.5z"/>
            </svg>
            Import
          </button>
          
          <button
            onClick={() => setShowExportDialog(true)}
            disabled={!currentGeometry}
            style={{
              padding: '5px 10px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              background: '#fff',
              cursor: currentGeometry ? 'pointer' : 'not-allowed',
              fontSize: '12px',
              color: currentGeometry ? '#333' : '#999',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Export Model"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '4px' }}>
              <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zm3.5 7.5a.5.5 0 0 0 0 1H5.707l2.147 2.146a.5.5 0 0 0-.708.708l-3-3a.5.5 0 0 0 0-.708l3-3a.5.5 0 1 0 .708.708L5.707 7.5H11.5z"/>
            </svg>
            Export
          </button>
        </div>
        
        {/* Unit Selector */}
        <UnitSelector 
          currentUnit={unitSystem}
          onUnitChange={handleUnitChange}
        />
      </div>
      
      {/* View Controls */}
      <div style={{ 
        position: 'absolute', 
        top: '10px', 
        right: '10px', 
        zIndex: 10,
        display: 'flex',
        gap: '5px',
        color: '#333'
      }}>
        <button 
          onClick={setFrontView}
          style={{
            padding: '5px 10px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            background: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            color: '#333'
          }}
          title="Front View"
        >
          Front
        </button>
        
        <button 
          onClick={setTopView}
          style={{
            padding: '5px 10px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            background: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            color: '#333'
          }}
          title="Top View"
        >
          Top
        </button>
        
        <button 
          onClick={setRightView}
          style={{
            padding: '5px 10px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            background: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            color: '#333'
          }}
          title="Right View"
        >
          Right
        </button>
        
        <button 
          onClick={setIsometricView}
          style={{
            padding: '5px 10px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            background: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            color: '#333'
          }}
          title="Isometric View"
        >
          Iso
        </button>
      </div>
      
      {/* ViewCube component for 3D orientation */}
      {cameraRef.current && controlsRef.current && (
        <ViewCube 
          cameraRef={cameraRef} 
          controlsRef={controlsRef}
          position={{ right: '20px', top: '60px' }}
        />
      )}
      
      <div 
        ref={mountRef} 
        style={{ width: '100%', height: '100%' }}
      />
      
      {/* Status bar with coordinates in the selected unit system */}
      <div style={{ 
        position: 'absolute',
        left: '0',
        right: '0',
        bottom: '0',
        background: 'rgba(33, 33, 33, 0.8)',
        color: 'white',
        padding: '6px 12px',
        fontSize: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        zIndex: 5
      }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span>X: {format(mousePosition.x)}</span>
          <span>Y: {format(mousePosition.y)}</span>
          <span>Z: {format(mousePosition.z)}</span>
        </div>
        <div>
          <span>Units: {unitSystem.name}</span>
        </div>
      </div>
    </div>
  );
}

// Export wrapped in error boundary
export default function JscadThreeViewer() {
  // Client-side check to ensure we're in the browser
  if (typeof window === 'undefined') {
    return <div>Loading...</div>;
  }
  
  return (
    <ErrorBoundary>
      <JscadThreeScene />
    </ErrorBoundary>
  );
} 