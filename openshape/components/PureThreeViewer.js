import React, { useRef, useEffect } from 'react';
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
    console.error('Error in Three.js component:', error, errorInfo);
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

// Pure Three.js component
function ThreeScene() {
  const mountRef = useRef(null);

  useEffect(() => {
    // Early return if the ref isn't set yet
    if (!mountRef.current) return;

    let scene, camera, renderer, cube, controls, animationFrameId;

    try {
      // Initialize scene
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf5f5f5);

      // Get dimensions
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;

      // Create camera
      camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      camera.position.set(5, 5, 5);
      camera.lookAt(0, 0, 0);

      // Create renderer
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, height);
      mountRef.current.appendChild(renderer.domElement);

      // Create orbit controls
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.25;

      // Add lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(2, 4, 3);
      scene.add(directionalLight);

      // Create a simple blue cube
      const geometry = new THREE.BoxGeometry(2, 2, 2);
      const material = new THREE.MeshStandardMaterial({ 
        color: 0x0088ff,
        metalness: 0.1,
        roughness: 0.5
      });
      cube = new THREE.Mesh(geometry, material);
      scene.add(cube);

      // Add a grid helper
      const gridHelper = new THREE.GridHelper(10, 10);
      scene.add(gridHelper);

      // Animation loop
      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        
        // Rotate the cube slowly
        cube.rotation.x += 0.005;
        cube.rotation.y += 0.005;
        
        controls.update();
        renderer.render(scene, camera);
      };
      
      // Start animation
      animate();

      // Handle resize
      const handleResize = () => {
        if (!mountRef.current) return;
        
        const newWidth = mountRef.current.clientWidth;
        const newHeight = mountRef.current.clientHeight;
        
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
      };
      
      window.addEventListener('resize', handleResize);

      // Cleanup function
      return () => {
        console.log('Cleaning up Three.js resources');
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(animationFrameId);
        
        // Dispose of resources
        if (controls) controls.dispose();
        
        if (cube) {
          if (cube.geometry) cube.geometry.dispose();
          if (cube.material) cube.material.dispose();
        }
        
        if (renderer) {
          if (mountRef.current) {
            mountRef.current.removeChild(renderer.domElement);
          }
          renderer.dispose();
        }

        // Clear references
        scene = null;
        camera = null;
        renderer = null;
        controls = null;
        cube = null;
      };
    } catch (error) {
      console.error('Failed to initialize Three.js:', error);
      
      // Clean up any partial initialization
      if (renderer && mountRef.current) {
        try {
          mountRef.current.removeChild(renderer.domElement);
        } catch (e) {
          console.error('Error during cleanup:', e);
        }
      }
    }
  }, []);

  return (
    <div 
      ref={mountRef} 
      style={{ width: '100%', height: '100%' }}
    />
  );
}

// Export wrapped in error boundary
export default function PureThreeViewer() {
  // Client-side check to ensure we're in the browser
  if (typeof window === 'undefined') {
    return <div>Loading...</div>;
  }
  
  return (
    <ErrorBoundary>
      <ThreeScene />
    </ErrorBoundary>
  );
} 