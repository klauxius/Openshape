import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

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
    console.error('Error in JSCAD-Three component:', error, errorInfo);
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
  const [modelType, setModelType] = useState('cube');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        scene.background = new THREE.Color(0xf5f5f5);
        
        // Get dimensions
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;
        
        // Create camera
        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        camera.position.set(15, 15, 15);
        camera.lookAt(0, 0, 0);
        
        // Create renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        mountRef.current.appendChild(renderer.domElement);
        
        // Create orbit controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.25;
        
        // Add lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(2, 4, 3);
        scene.add(directionalLight);
        
        // Add a grid helper
        const gridHelper = new THREE.GridHelper(20, 20);
        scene.add(gridHelper);
        
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
        
        // Colorize the geometry
        const colorized = colorize([0.1, 0.4, 0.9], jscadGeometry);
        
        // Convert JSCAD geometry to Three.js geometry
        const threeGeometry = jscadToThreeGeometry(colorized);
        
        // Create material
        const material = new THREE.MeshStandardMaterial({
          color: 0x0088ff,
          metalness: 0.1,
          roughness: 0.5,
          side: THREE.DoubleSide
        });
        
        // Create mesh and add to scene
        const mesh = new THREE.Mesh(threeGeometry, material);
        scene.add(mesh);
        
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

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {loading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255,255,255,0.8)',
          zIndex: 10
        }}>
          <p>Loading JSCAD model...</p>
        </div>
      )}
      
      {error && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          padding: '15px',
          backgroundColor: '#fff0f0',
          color: '#800',
          border: '1px solid #f00',
          borderRadius: '4px',
          zIndex: 20
        }}>
          <h3>Error rendering model</h3>
          <p>{error}</p>
        </div>
      )}
      
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 5 }}>
        <select 
          value={modelType} 
          onChange={handleModelChange}
          style={{
            padding: '5px 10px',
            borderRadius: '4px',
            border: '1px solid #ccc'
          }}
        >
          <option value="cube">Cube</option>
          <option value="sphere">Sphere</option>
          <option value="cylinder">Cylinder</option>
          <option value="complex">Complex (Subtract)</option>
          <option value="fixed-complex">Better Complex (Subtract)</option>
          <option value="union">Union</option>
          <option value="extrusion">Extrusion</option>
          <option value="rotated">Rotated</option>
          <option value="advanced">Advanced CSG</option>
        </select>
      </div>
      
      <div 
        ref={mountRef} 
        style={{ width: '100%', height: '100%' }}
      />
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