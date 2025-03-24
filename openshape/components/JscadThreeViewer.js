import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as jscad from '@jscad/modeling';
import DomViewCube from './DomViewCube';
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

// Create a sprite material for the origin point indicator
const createOriginIndicatorSprite = (radius = 5, color = 0x000000) => {
  // Create a canvas for drawing the origin indicator
  const canvas = document.createElement('canvas');
  canvas.width = 64; // Smaller canvas size
  canvas.height = 64;
  const context = canvas.getContext('2d');
  
  // Clear canvas with transparent background
  context.clearRect(0, 0, canvas.width, canvas.height);
  
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  
  // Draw outer circle (dark)
  const outerRadius = canvas.width / 3;
  context.beginPath();
  context.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI, false);
  context.fillStyle = 'rgba(0, 0, 0, 0.9)'; // Dark black with high opacity
  context.fill();
  
  // Draw inner circle (white)
  const innerRadius = outerRadius / 3;
  context.beginPath();
  context.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI, false);
  context.fillStyle = 'rgba(255, 255, 255, 0.9)'; // White center
  context.fill();
  
  // Create texture from canvas
  const texture = new THREE.CanvasTexture(canvas);
  
  // Create sprite material
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,  // Important - ensures it's always visible through objects
    depthWrite: false, // Don't write to depth buffer
    sizeAttenuation: false // Important - makes size independent of distance
  });
  
  return material;
};

// Create a simple origin indicator
const createOriginIndicator = () => {
  const originGroup = new THREE.Group();
  originGroup.name = "originIndicator";
  
  // Create single origin point (dark with white center)
  const centerSprite = new THREE.Sprite(createOriginIndicatorSprite());
  centerSprite.scale.set(0.03, 0.03, 1); // Make it smaller overall
  centerSprite.renderOrder = 1001; // Ensure it renders on top of everything
  originGroup.add(centerSprite);
  
  return originGroup;
};

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
  console.log('[JscadThreeViewer] Converting JSCAD geometry to Three.js geometry:', jscadGeometry);
  
  // Validate input
  if (!jscadGeometry) {
    console.error('[JscadThreeViewer] Invalid geometry:', jscadGeometry);
    // Return a simple placeholder geometry
    return new THREE.BoxGeometry(1, 1, 1);
  }
  
  // Handle native JSCAD 2D shapes (like circles) that use 'sides' instead of 'points'
  if (jscadGeometry.sides && Array.isArray(jscadGeometry.sides)) {
    try {
      console.log('[JscadThreeViewer] Processing JSCAD 2D geometry with sides array');
      
      const positions = [];
      const indices = [];
      
      // Extract all points from the sides (each side is a line segment [startPoint, endPoint])
      jscadGeometry.sides.forEach((side, i) => {
        // Each side has two points [start, end]
        const startPoint = side[0];
        
        // Add Z coordinate as 0 for 2D shapes
        positions.push(startPoint[0], startPoint[1], 0);
      });
      
      // Create indices for line segments forming a loop
      for (let i = 0; i < jscadGeometry.sides.length; i++) {
        indices.push(i, (i + 1) % jscadGeometry.sides.length);
      }
      
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setIndex(indices);
      
      console.log(`[JscadThreeViewer] Created line geometry from ${jscadGeometry.sides.length} sides`);
      return geometry;
    } catch (error) {
      console.error('[JscadThreeViewer] Error converting JSCAD 2D geometry:', error);
      return new THREE.BoxGeometry(1, 1, 1); // Fallback
    }
  }
  
  // Handle sketch geometry (2D shapes) that use 'points' instead of 'polygons'
  if (jscadGeometry.points && Array.isArray(jscadGeometry.points)) {
    try {
      console.log('[JscadThreeViewer] Processing sketch geometry with points array');
      
      const positions = [];
      const indices = [];
      
      // Extract points (2D) and add Z coordinate for 3D space
      const offset = jscadGeometry.metadata?.sketchOffset || 0;
      const points3D = jscadGeometry.points.map(p => [p[0], p[1], offset]);
      
      // For sketch entities like circles, we want to create a line loop
      for (let i = 0; i < points3D.length; i++) {
        positions.push(...points3D[i]);
      }
      
      // Create indices for line segments
      for (let i = 0; i < points3D.length; i++) {
        indices.push(i, (i + 1) % points3D.length);
      }
      
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setIndex(indices);
      
      console.log(`[JscadThreeViewer] Created line geometry from ${points3D.length} points`);
      return geometry;
    } catch (error) {
      console.error('[JscadThreeViewer] Error converting sketch geometry:', error);
      return new THREE.BoxGeometry(1, 1, 1); // Fallback
    }
  }
  
  if (!jscadGeometry.polygons || !Array.isArray(jscadGeometry.polygons)) {
    console.error('[JscadThreeViewer] Geometry has no polygons array:', jscadGeometry);
    // Return a simple placeholder geometry
    return new THREE.BoxGeometry(1, 1, 1);
  }
  
  // Extract vertices and faces from JSCAD geometry
  const positions = [];
  const normals = [];
  const indices = [];
  
  let vertexIndex = 0;
  let polygonCount = 0;
  
  try {
    // Process each polygon in the JSCAD geometry
    jscadGeometry.polygons.forEach(polygon => {
      // Validate polygon
      if (!polygon || !polygon.vertices || !Array.isArray(polygon.vertices)) {
        console.warn('[JscadThreeViewer] Invalid polygon:', polygon);
        return;
      }
      
      // Get vertices of this polygon
      const vertices = polygon.vertices.map(v => [v[0], v[1], v[2]]);
      
      if (vertices.length < 3) {
        console.warn('[JscadThreeViewer] Polygon has fewer than 3 vertices:', vertices);
        return; // Skip invalid polygons
      }
      
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
      
      polygonCount++;
    });
    
    console.log(`[JscadThreeViewer] Processed ${polygonCount} polygons, created ${indices.length / 3} triangles`);
    
    // Create Three.js BufferGeometry
    const geometry = new THREE.BufferGeometry();
    
    // Add attributes
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setIndex(indices);
    
    // Center the geometry if it's not centered
    geometry.computeBoundingSphere();
    console.log('[JscadThreeViewer] Geometry bounding sphere:', geometry.boundingSphere);
    
    return geometry;
  } catch (error) {
    console.error('[JscadThreeViewer] Error converting geometry:', error);
    return new THREE.BoxGeometry(1, 1, 1); // Fallback
  }
}

const JscadThreeViewer = forwardRef(({ onModelChange, ...props }, ref) => {
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
  
  // Store MCP models
  const [mcpModels, setMcpModels] = useState({});
  const meshesRef = useRef({});

  // Add sketch mode state to track when rotation should be disabled
  const [inSketchMode, setInSketchMode] = useState(false);
  // Remember the active sketch plane for view orientation
  const [activeSketchPlane, setActiveSketchPlane] = useState(null);
  // Store camera positions for each sketch to restore them when switching
  const sketchCameraPositionsRef = useRef({});

  // Define standard camera positions for each plane type
  const standardCameraPositions = {
    xy: { position: [0, 0, 15], target: [0, 0, 0] },
    yz: { position: [15, 0, 0], target: [0, 0, 0] },
    xz: { position: [0, 15, 0], target: [0, 0, 0] },
    custom: { position: [0, 0, 15], target: [0, 0, 0] }
  };

  // Add a separate useEffect to handle MCP model change events
  useEffect(() => {
    // Handler for MCP model change events
    const handleMcpModelChange = (event) => {
      // Extract model data from the event
      const modelData = event.detail;
      console.log(`[JscadThreeViewer] MCP model change received: ${modelData.id}`, modelData);
      
      // Add to the models tracking state
      setMcpModels(prev => ({
        ...prev,
        [modelData.id]: modelData
      }));
      
      // If this is our first model, reset the camera to a good view
      if (Object.keys(mcpModels).length === 0 && cameraRef.current && controlsRef.current) {
        // Use a local resetView function instead of trying to access one from outer scope
        const resetCamera = () => {
          console.log('[JscadThreeViewer] Resetting camera to isometric view');
          cameraRef.current.position.set(30, 30, 30);
          cameraRef.current.lookAt(0, 0, 0);
          controlsRef.current.update();
        };
        resetCamera();
      }
      
      // If we have a scene, update the visual representation
      if (sceneRef.current && modelData.geometry) {
        try {
          // If we already have a mesh for this model, remove it
          if (meshesRef.current[modelData.id]) {
            sceneRef.current.remove(meshesRef.current[modelData.id]);
          }
          
          // Check if this is a sketch entity (has points array) or JSCAD 2D geometry (has sides array)
          const isSketchEntity = modelData.geometry.points && Array.isArray(modelData.geometry.points);
          const isJscad2D = modelData.geometry.sides && Array.isArray(modelData.geometry.sides);
          
          console.log(`[JscadThreeViewer] Processing geometry for model ${modelData.id}:`, {
            type: isSketchEntity ? '2D sketch entity' : isJscad2D ? '2D JSCAD geometry' : '3D model',
            hasPoints: !!modelData.geometry.points,
            hasSides: !!modelData.geometry.sides,
            hasPolygons: !!modelData.geometry.polygons,
            metadata: modelData.geometry.metadata || 'none'
          });

          // Convert JSCAD geometry to Three.js geometry
          const threeGeometry = jscadToThreeGeometry(modelData.geometry);
          
          // Create material based on the type of geometry
          let material;
          
          if (isSketchEntity || isJscad2D) {
            // For sketch entities or JSCAD 2D shapes (like circles), use a line material
            const modelIndex = Object.keys(mcpModels).length;
            const hue = (modelIndex * 137.5) % 360; // Golden angle to distribute colors
            material = new THREE.LineBasicMaterial({
              color: new THREE.Color(`hsl(${hue}, 70%, 60%)`),
              linewidth: 2, // Note: linewidth > 1 only works in WebGL 2
            });
          } else {
            // For 3D models, use a standard material
            const modelIndex = Object.keys(mcpModels).length;
            const hue = (modelIndex * 137.5) % 360; // Golden angle to distribute colors
            material = new THREE.MeshStandardMaterial({
              color: new THREE.Color(`hsl(${hue}, 70%, 60%)`),
              metalness: 0.2,
              roughness: 0.5,
            });
          }
          
          // Create appropriate mesh or line based on geometry type
          let object;
          
          if (isSketchEntity || isJscad2D) {
            // For sketch entities or JSCAD 2D shapes, create a line loop
            object = new THREE.LineLoop(threeGeometry, material);
          } else {
            // For 3D models, create a regular mesh
            object = new THREE.Mesh(threeGeometry, material);
          }
          
          // Add to scene
          sceneRef.current.add(object);
          
          // Store reference to the object
          meshesRef.current[modelData.id] = object;
        } catch (error) {
          console.error('Error updating MCP model visualization:', error);
        }
      }
    };
    
    // Add event listener
    if (typeof window !== 'undefined') {
      window.addEventListener('openshape:modelChanged', handleMcpModelChange);
    }
    
    // Cleanup event listener
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('openshape:modelChanged', handleMcpModelChange);
      }
    };
  }, [mcpModels]);

  // Add this useEffect to handle sketch mode change events
  useEffect(() => {
    const handleSketchModeChanged = (event) => {
      const { active, sketch, plane } = event.detail;
      setInSketchMode(active);
      
      // If controls aren't set up yet, just update the state
      if (!controlsRef.current || !cameraRef.current) return;
      
      if (active) {
        // Disable rotation and zooming in sketch mode - only allow panning
        controlsRef.current.enableRotate = false;
        controlsRef.current.enableZoom = false;  // Disable zooming in sketch mode
        controlsRef.current.enablePan = true;    // Allow panning for positioning
        
        // Store the sketch plane for reference
        const sketchPlane = plane || (sketch ? sketch.plane : 'xy');
        setActiveSketchPlane(sketchPlane);
        
        // Determine if we have a stored camera position for this sketch
        const sketchId = sketch ? sketch.id : null;
        const hasStoredPosition = sketchId && sketchCameraPositionsRef.current[sketchId];
        
        if (hasStoredPosition) {
          // Restore the previously saved camera position for this sketch
          const savedPosition = sketchCameraPositionsRef.current[sketchId];
          cameraRef.current.position.set(
            savedPosition.position[0],
            savedPosition.position[1],
            savedPosition.position[2]
          );
          cameraRef.current.lookAt(
            savedPosition.target[0],
            savedPosition.target[1],
            savedPosition.target[2]
          );
        } else {
          // Set standard camera position based on the sketch plane
          const standardPosition = standardCameraPositions[sketchPlane] || standardCameraPositions.xy;
          
          cameraRef.current.position.set(
            standardPosition.position[0],
            standardPosition.position[1],
            standardPosition.position[2]
          );
          cameraRef.current.lookAt(
            standardPosition.target[0],
            standardPosition.target[1],
            standardPosition.target[2]
          );
          
          // Store this position for future reference if we have a sketch ID
          if (sketchId) {
            sketchCameraPositionsRef.current[sketchId] = {
              position: [...standardPosition.position],
              target: [...standardPosition.target]
            };
          }
        }
        
        // Update controls to reflect camera changes
        controlsRef.current.update();
        
        console.log('Camera positioned normal to sketch plane:', sketchPlane);
      } else {
        // Re-enable all controls when exiting sketch mode
        controlsRef.current.enableRotate = true;
        controlsRef.current.enableZoom = true;   // Re-enable zooming
        controlsRef.current.enablePan = true;    // Keep panning enabled
        
        // Save the current camera position for this sketch before exiting
        if (sketch && sketch.id) {
          sketchCameraPositionsRef.current[sketch.id] = {
            position: [
              cameraRef.current.position.x,
              cameraRef.current.position.y,
              cameraRef.current.position.z
            ],
            target: [0, 0, 0] // Always looking at origin
          };
        }
        
        console.log('Camera controls fully re-enabled');
      }
    };
    
    window.addEventListener('openshape:sketchModeChanged', handleSketchModeChanged);
    
    return () => {
      window.removeEventListener('openshape:sketchModeChanged', handleSketchModeChanged);
    };
  }, []);

  // Handle the sketch creation event to orient camera correctly
  useEffect(() => {
    const handleSketchCreated = (event) => {
      const { plane, sketchId, cameraView, sketch } = event.detail;
      
      // Update state tracking
      setActiveSketchPlane(plane);
      setInSketchMode(true);
      
      // If camera and controls are ready, set the view and disable rotation
      if (cameraRef.current && controlsRef.current) {
        // Get the standard position for this plane type
        const standardPosition = standardCameraPositions[plane] || standardCameraPositions.xy;
        
        // Set camera position and orientation
        cameraRef.current.position.set(
          standardPosition.position[0],
          standardPosition.position[1],
          standardPosition.position[2]
        );
        cameraRef.current.lookAt(
          standardPosition.target[0],
          standardPosition.target[1],
          standardPosition.target[2]
        );
        
        // Store this position for future reference
        if (sketchId) {
          sketchCameraPositionsRef.current[sketchId] = {
            position: [...standardPosition.position],
            target: [...standardPosition.target]
          };
        }
        
        // Disable rotation and zooming controls, but allow panning
        controlsRef.current.enableRotate = false;
        controlsRef.current.enableZoom = false;  // Disable zooming in sketch mode
        controlsRef.current.enablePan = true;    // Allow panning for positioning
        controlsRef.current.update();
        
        console.log('Sketch created - Camera positioned normal to plane:', plane);
        console.log('Camera rotation and zooming disabled for sketch mode');
      }
    };
    
    window.addEventListener('openshape:sketchCreated', handleSketchCreated);
    
    return () => {
      window.removeEventListener('openshape:sketchCreated', handleSketchCreated);
    };
  }, []);

  // Add keyboard shortcut to reset camera view for active sketch
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Reset camera view with 'R' key when in sketch mode
      if (inSketchMode && event.key.toLowerCase() === 'r') {
        if (cameraRef.current && controlsRef.current && activeSketchPlane) {
          const standardPosition = standardCameraPositions[activeSketchPlane] || standardCameraPositions.xy;
          
          cameraRef.current.position.set(
            standardPosition.position[0],
            standardPosition.position[1],
            standardPosition.position[2]
          );
          cameraRef.current.lookAt(
            standardPosition.target[0],
            standardPosition.target[1],
            standardPosition.target[2]
          );
          
          controlsRef.current.update();
          console.log('Camera view reset to normal position for sketch plane:', activeSketchPlane);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [inSketchMode, activeSketchPlane]);

  // Add listener for the reset sketch view event
  useEffect(() => {
    const handleResetSketchView = (event) => {
      const { sketchId, plane } = event.detail;
      
      if (!cameraRef.current || !controlsRef.current) return;
      
      // Get the standard camera position for this plane
      const sketchPlane = plane || activeSketchPlane || 'xy';
      const standardPosition = standardCameraPositions[sketchPlane] || standardCameraPositions.xy;
      
      // Reset camera to standard position for this plane
      cameraRef.current.position.set(
        standardPosition.position[0],
        standardPosition.position[1],
        standardPosition.position[2]
      );
      cameraRef.current.lookAt(
        standardPosition.target[0],
        standardPosition.target[1],
        standardPosition.target[2]
      );
      
      // Make sure sketch mode constraints remain in place
      if (inSketchMode) {
        controlsRef.current.enableRotate = false;
        controlsRef.current.enableZoom = false;
        controlsRef.current.enablePan = true;
      }
      
      // Update controls and store this position
      controlsRef.current.update();
      
      // Update stored position if we have a sketch ID
      if (sketchId) {
        sketchCameraPositionsRef.current[sketchId] = {
          position: [...standardPosition.position],
          target: [...standardPosition.target]
        };
      }
      
      console.log('Camera view reset for sketch plane:', sketchPlane);
    };
    
    window.addEventListener('openshape:resetSketchView', handleResetSketchView);
    return () => {
      window.removeEventListener('openshape:resetSketchView', handleResetSketchView);
    };
  }, [activeSketchPlane, inSketchMode]);

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
        
        // Camera adjustment for better view of geometries
        // Position camera to view objects more clearly
        camera.position.set(30, 30, 30);
        camera.lookAt(0, 0, 0);
        
        // Store camera reference for external access
        cameraRef.current = camera;
        
        // Create renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        mountRef.current.appendChild(renderer.domElement);
        
        // Create and configure OrbitControls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.25;
        
        // Set initial camera view for a better viewing angle
        controls.update();
        
        // Add a function to reset the view to isometric position
        const resetView = () => {
          console.log('[JscadThreeViewer] Resetting camera to isometric view');
          camera.position.set(30, 30, 30);
          camera.lookAt(0, 0, 0);
          controls.update();
        };
        
        // Reset the view after 500ms to ensure models are visible
        setTimeout(resetView, 500);
        
        // Define button mappings (which mouse buttons do what)
        controls.mouseButtons = {
          LEFT: THREE.MOUSE.ROTATE,      // Left mouse button: Rotate (when not in sketch mode)
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
        
        // Add constant-size origin indicator
        const originIndicator = createOriginIndicator();
        scene.add(originIndicator);
        
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
        
        // Store the current geometry for export functionality
        setCurrentGeometry(null);
        
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
          
          // Update origin indicator to maintain constant screen size
          if (originIndicator) {
            // Calculate the proper scale to maintain constant screen size
            // The approach is to scale based on camera distance
            const cameraDistance = camera.position.distanceTo(new THREE.Vector3(0, 0, 0));
            
            // Scale factor calculation - adjust multiplier for desired size
            // This makes the indicator slightly larger when camera is further away
            // Reduced scale factor for smaller appearance
            const scaleFactor = Math.max(0.02, Math.min(0.06, cameraDistance * 0.002));
            
            // Update the sprite scale - simpler now that we have just one sprite
            originIndicator.children[0].scale.set(scaleFactor, scaleFactor, 1);
          }
          
          renderer.render(scene, camera);
          
          // Cleanup
          return () => {
            cancelAnimationFrame(animationFrameId);
            
            if (controls) controls.dispose();
            
            // Clean up any meshes created from MCP models
            Object.values(meshesRef.current).forEach(mesh => {
              if (mesh) {
                if (mesh.geometry) mesh.geometry.dispose();
                if (mesh.material) mesh.material.dispose();
                scene.remove(mesh);
              }
            });
            
            // Clean up the origin indicator
            if (originIndicator) {
              originIndicator.children.forEach(sprite => {
                if (sprite.material && sprite.material.map) {
                  sprite.material.map.dispose();
                }
                if (sprite.material) sprite.material.dispose();
              });
              scene.remove(originIndicator);
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
        
        // Handle keyboard events for measurement tool and resetting view
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
          
          // Add key handler for resetting view to be normal to sketch plane
          if (inSketchMode && event.key === 'r') {
            // Reset view to be normal to active sketch plane
            if (activeSketchPlane) {
              switch(activeSketchPlane) {
                case 'xy':
                  setFrontView();
                  break;
                case 'yz':
                  setRightView();
                  break;
                case 'xz':
                  setTopView();
                  break;
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
  }, [modelType, measurementMode, unitSystem, showPlanes, inSketchMode, activeSketchPlane]);

  const handleModelChange = (event) => {
    setModelType(event.target.value);
  };

  // Expose methods to parent components
  useImperativeHandle(ref, () => ({
    setFrontView: () => {
      if (cameraRef.current && controlsRef.current) {
        cameraRef.current.position.set(0, 0, 15);
        cameraRef.current.lookAt(0, 0, 0);
        controlsRef.current.update();
      }
    },
    setTopView: () => {
      if (cameraRef.current && controlsRef.current) {
        cameraRef.current.position.set(0, 15, 0);
        cameraRef.current.lookAt(0, 0, 0);
        controlsRef.current.update();
      }
    },
    setRightView: () => {
      if (cameraRef.current && controlsRef.current) {
        cameraRef.current.position.set(15, 0, 0);
        cameraRef.current.lookAt(0, 0, 0);
        controlsRef.current.update();
      }
    },
    setIsometricView: () => {
      if (cameraRef.current && controlsRef.current) {
        cameraRef.current.position.set(15, 15, 15);
        cameraRef.current.lookAt(0, 0, 0);
        controlsRef.current.update();
      }
    }
  }));

  // When defining these functions within the component, keep them for internal use
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
        style={{ touchAction: 'none', cursor: measurementMode ? 'crosshair' : 'default' }}
      />

      {/* DOM-based ViewCube component */}
      <DomViewCube 
        cameraRef={cameraRef}
        controlsRef={controlsRef}
        size={40}
        position={{ top: '70px', right: '20px' }}
      />

      {/* Navigation help with updated text for sketch mode */}
      <div className="absolute bottom-16 left-4 text-xs text-gray-600 bg-white bg-opacity-70 p-2 rounded">
        {inSketchMode ? (
          <>
            <div>Sketch Mode - View locked to plane</div>
            <div>Right Click - Pan</div>
            <div>Scroll - Zoom</div>
            <div>Press R - Reset view</div>
          </>
        ) : (
          <>
            <div>Left Click - Rotate</div>
            <div>Right Click - Pan</div>
            <div>Scroll - Zoom</div>
          </>
        )}
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
});

export default JscadThreeViewer; 