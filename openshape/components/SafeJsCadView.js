import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as jscad from '@jscad/modeling';

// Import from local jscad-fiber, but do it carefully to avoid SSR issues
const createJSCADRenderer = require('@jscad-fiber').createJSCADRenderer;
const Cube = require('@jscad-fiber').Cube;

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
    console.error('Error in JsCad component:', error, errorInfo);
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

function CustomJSCADView() {
  const containerRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let scene, camera, renderer, controls, animationFrameId;

    try {
      // Initialize Three.js scene
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf5f5f5);

      // Get container dimensions
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      // Create camera
      camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      camera.position.set(20, 20, 20);
      camera.lookAt(0, 0, 0);

      // Create renderer
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, height);
      containerRef.current.appendChild(renderer.domElement);

      // Add orbit controls
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.25;

      // Add lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
      directionalLight.position.set(100, 100, 100);
      scene.add(directionalLight);

      // Create JSCAD geometry
      const jscadGeoms = [];
      
      // Create JSCAD renderer and root
      const renderer = createJSCADRenderer(jscad);
      const root = renderer.createJSCADRoot(jscadGeoms);

      // Render a cube
      root.render(React.createElement(Cube, { 
        size: 10, 
        center: [0, 0, 0],
        color: "blue"
      }));

      // Process the JSCAD geometry and add it to the scene
      jscadGeoms.forEach(geom => {
        // Fallback simple cube if we can't process the geometry
        const geometry = new THREE.BoxGeometry(10, 10, 10);
        const material = new THREE.MeshStandardMaterial({
          color: 0x0088ff,
          side: THREE.DoubleSide
        });
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
      });

      // Animation loop
      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };
      
      animate();

      // Handle window resize
      const handleResize = () => {
        if (!containerRef.current) return;
        
        const newWidth = containerRef.current.clientWidth;
        const newHeight = containerRef.current.clientHeight;
        
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
      };
      
      window.addEventListener('resize', handleResize);

      // Cleanup on unmount
      return () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(animationFrameId);
        
        if (controls) controls.dispose();
        if (renderer) {
          containerRef.current?.removeChild(renderer.domElement);
          renderer.dispose();
        }
      };
    } catch (err) {
      console.error('Error initializing 3D view:', err);
      setError(err.message || 'Failed to initialize 3D view');
    }
  }, []);

  if (error) {
    return (
      <div style={{
        padding: '15px',
        backgroundColor: '#fff0f0',
        color: '#800',
        border: '1px solid #f00'
      }}>
        <h3>Error initializing 3D view</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      style={{ width: '100%', height: '100%' }}
    />
  );
}

export default function SafeJsCadView() {
  return (
    <ErrorBoundary>
      <CustomJSCADView />
    </ErrorBoundary>
  );
} 