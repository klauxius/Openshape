import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as jscad from '@jscad/modeling';
import ViewCube from './ViewCube';
import ExportModelDialog from './ExportModelDialog';
import ImportModelDialog from './ImportModelDialog';
import UnitSelector from './UnitSelector';
import { useUnits } from '../contexts/UnitContext';
import MeasurementTool from './measurements/MeasurementTool';
import MeasurementControls from './measurements/MeasurementControls';
import ReferencePlanes from './ReferencePlanes';
import { Ruler, Layers } from 'lucide-react';

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
  
  // Measurement tool state
  const [measurementMode, setMeasurementMode] = useState(false);
  const [savedMeasurements, setSavedMeasurements] = useState([]);
  const measurementToolRef = useRef(null);
  
  // Reference planes state
  const [showPlanes, setShowPlanes] = useState(true);
  const [hoveredPlane, setHoveredPlane] = useState(null);
  const referencePlanesRef = useRef(null);
  
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
        
        // Create reference planes
        referencePlanesRef.current = ReferencePlanes({
          scene,
          size: 20,
          opacity: 0.2,
          gridDivisions: 10
        });
        
        // Initialize the reference planes
        const cleanupPlanes = referencePlanesRef.current.createPlanes();
        
        // Set planes visibility based on state
        referencePlanesRef.current.toggleAllPlanesVisibility(showPlanes);
        
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
        
        // Add a raycaster for mouse position tracking, measurements, and plane highlighting
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        
        // Initialize measurement tool
        measurementToolRef.current = MeasurementTool({
          sceneRef: sceneRef,
          cameraRef: cameraRef,
          controlsRef: controlsRef,
          unitSystem,
          onMeasurementComplete: (measurementData) => {
            setSavedMeasurements(prev => [...prev, measurementData]);
          }
        });
        
        // Enhanced mouse move handler for both measurements and plane highlighting
        const onMouseMove = (event) => {
          // Calculate mouse position in normalized device coordinates
          const rect = renderer.domElement.getBoundingClientRect();
          mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
          mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
          
          // Update the picking ray with the camera and mouse position
          raycaster.setFromCamera(mouse, camera);
          
          // Calculate objects intersecting the picking ray
          const intersects = raycaster.intersectObjects(scene.children, true);
          
          // Reset any previously hovered plane
          if (hoveredPlane && referencePlanesRef.current) {
            referencePlanesRef.current.highlightPlane(hoveredPlane, false);
            setHoveredPlane(null);
          }
          
          if (intersects.length > 0) {
            // Get the intersection point coordinates for mouse position
            const point = intersects[0].point;
            setMousePosition({
              x: point.x,
              y: point.y,
              z: point.z
            });
            
            // Check if we're hovering over a reference plane
            const planeObj = intersects.find(obj => 
              obj.object.userData &&
              obj.object.userData.type === 'referencePlane'
            );
            
            if (planeObj && referencePlanesRef.current) {
              const planeName = planeObj.object.userData.planeName;
              referencePlanesRef.current.highlightPlane(planeName, true);
              setHoveredPlane(planeName);
            }
          }
        };

        // Handle mouse clicks for measurements
        const onMouseClick = (event) => {
          if (!measurementMode || !measurementToolRef.current) return;
          
          // Calculate mouse position in normalized device coordinates
          const rect = renderer.domElement.getBoundingClientRect();
          mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
          mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
          
          // Update the picking ray with the camera and mouse position
          raycaster.setFromCamera(mouse, camera);
          
          // Calculate objects intersecting the picking ray
          const intersects = raycaster.intersectObjects(scene.children, true);
          
          if (intersects.length > 0) {
            // Get the intersection point coordinates and add to measurement
            const point = intersects[0].point.clone();
            measurementToolRef.current.addMeasurementPoint(point);
          }
        };
        
        renderer.domElement.addEventListener('mousemove', onMouseMove);
        renderer.domElement.addEventListener('click', onMouseClick);
        
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
        
        // Handle keyboard events for measurement tool
        const handleKeyDown = (event) => {
          if (event.key === 'Escape') {
            // Cancel current measurement
            if (measurementMode) {
              if (measurementToolRef.current) {
                measurementToolRef.current.cancelCurrentMeasurement();
              }
              
              // If user presses Escape twice, exit measurement mode entirely
              if (savedMeasurements.length === 0) {
                setMeasurementMode(false);
              }
            }
          }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        
        setLoading(false);
        
        // Return cleanup function
        return () => {
          window.removeEventListener('resize', handleResize);
          window.removeEventListener('keydown', handleKeyDown);
          renderer.domElement.removeEventListener('mousemove', onMouseMove);
          renderer.domElement.removeEventListener('click', onMouseClick);
          
          // Clean up reference planes
          if (cleanupPlanes) cleanupPlanes();
          
          cleanup();
        };
      } catch (error) {
        console.error('Failed to initialize JSCAD/Three.js:', error);
        setLoading(false);
        setError(`Error: ${error.message}`);
      }
    };
    
    importJscad();
  }, [modelType, measurementMode, unitSystem, showPlanes]);

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

  // Measurement tool functions
  const toggleMeasurementMode = () => {
    setMeasurementMode(prev => !prev);
  };

  const handleSetDistanceMeasurement = () => {
    if (measurementToolRef.current) {
      measurementToolRef.current.setDistanceMeasurement();
    }
  };

  const handleSetAngleMeasurement = () => {
    if (measurementToolRef.current) {
      measurementToolRef.current.setAngleMeasurement();
    }
  };

  const handleClearMeasurements = () => {
    if (measurementToolRef.current) {
      measurementToolRef.current.clearMeasurements();
      setSavedMeasurements([]);
    }
  };

  // Toggle planes visibility
  const togglePlanesVisibility = () => {
    setShowPlanes(prevShow => !prevShow);
  };

  return (
    <div className="w-full h-full relative">
      {/* Top toolbar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-2 bg-white bg-opacity-80 z-10">
        <div className="flex items-center space-x-2">
          <select 
            value={modelType} 
            onChange={handleModelChange}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value="cube">Cube</option>
            <option value="sphere">Sphere</option>
            <option value="cylinder">Cylinder</option>
            <option value="complex">Complex (Subtract)</option>
            <option value="better-complex">Better Complex (Subtract)</option>
            <option value="union">Union</option>
            <option value="extrusion">Extrusion</option>
            <option value="rotated">Rotated</option>
            <option value="advanced-csg">Advanced CSG</option>
          </select>
          
          <button 
            onClick={() => setShowImportDialog(true)}
            className="flex items-center px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
            title="Import Model"
          >
            Import
          </button>
          
          <button 
            onClick={() => setShowExportDialog(true)}
            className="flex items-center px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
            title="Export Model"
          >
            Export
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            className={`flex items-center px-3 py-1 rounded text-sm ${
              measurementMode ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
            onClick={toggleMeasurementMode}
            title={measurementMode ? 'Exit Measurement Mode' : 'Enter Measurement Mode'}
          >
            <Ruler className="mr-1.5" size={14} />
            {measurementMode ? 'Exit Measurement' : 'Measure'}
          </button>
          
          <button
            className={`flex items-center px-3 py-1 rounded text-sm ${
              showPlanes ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
            onClick={togglePlanesVisibility}
            title={showPlanes ? 'Hide Reference Planes' : 'Show Reference Planes'}
          >
            <Layers className="mr-1.5" size={14} />
            {showPlanes ? 'Hide Planes' : 'Show Planes'}
          </button>
          
          <UnitSelector 
            currentUnit={unitSystem} 
            onUnitChange={setUnitSystem}
            className="ml-2" 
          />
        </div>
      </div>

      {/* 3D viewport */}
      <div 
        ref={mountRef} 
        className="w-full h-full"
        style={{ touchAction: 'none', cursor: measurementMode ? 'crosshair' : 'grab' }}
      />

      {/* View cube */}
      <ViewCube 
        cameraRef={cameraRef}
        controlsRef={controlsRef}
        size={80}
        position={{ top: '60px', right: '20px' }}
      />

      {/* Navigation help */}
      <div className="absolute bottom-16 left-4 text-xs text-gray-600 bg-white bg-opacity-70 p-2 rounded">
        <div>Left Click - Rotate</div>
        <div>Right Click - Pan</div>
        <div>Scroll - Zoom</div>
      </div>

      {/* Status bar with coordinates */}
      <div className="absolute left-0 right-0 bottom-0 flex items-center justify-between px-3 py-1 bg-gray-800 bg-opacity-80 text-white text-xs">
        <div className="flex items-center space-x-4">
          <span>X: {format(mousePosition.x)}</span>
          <span>Y: {format(mousePosition.y)}</span>
          <span>Z: {format(mousePosition.z)}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span>Units: {unitSystem.abbreviation}</span>
        </div>
      </div>

      {/* Measurement controls panel */}
      {measurementMode && (
        <div className="absolute top-16 right-4 w-64 z-10">
          <MeasurementControls
            isActive={measurementMode}
            measurementType={measurementToolRef.current?.measurementType || 'distance'}
            onActivate={toggleMeasurementMode}
            onDeactivate={toggleMeasurementMode}
            onSetDistanceMeasurement={handleSetDistanceMeasurement}
            onSetAngleMeasurement={handleSetAngleMeasurement}
            onClearMeasurements={handleClearMeasurements}
            measurements={savedMeasurements}
          />
        </div>
      )}

      {/* Dialogs */}
      {showExportDialog && (
        <ExportModelDialog
          geometry={currentGeometry}
          isOpen={showExportDialog}
          onClose={() => setShowExportDialog(false)}
        />
      )}
      
      {showImportDialog && (
        <ImportModelDialog
          isOpen={showImportDialog}
          onClose={() => setShowImportDialog(false)}
          onModelImported={(model) => {
            if (handleModelChange) {
              handleModelChange({ target: { value: model } });
            }
          }}
        />
      )}
      
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
            <div>Loading 3D viewer...</div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90">
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded max-w-md">
            <h3 className="font-bold mb-2">Error loading 3D viewer</h3>
            <p>{error}</p>
          </div>
        </div>
      )}
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