import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

// Import THREE.js dynamically to avoid SSR issues
const ThreeJS = dynamic(() => import('three'), { ssr: false });
const ThreeOrbitControls = dynamic(
  () => import('three/examples/jsm/controls/OrbitControls').then(mod => mod.OrbitControls),
  { ssr: false }
);

// Import from the local jscad-fiber library
const createJSCADRenderer = dynamic(() => 
  import('@jscad-fiber').then(mod => {
    console.log('Available exports from @jscad-fiber:', Object.keys(mod));
    return mod.createJSCADRenderer;
  }), 
  { ssr: false }
);

const Cube = dynamic(() => 
  import('@jscad-fiber').then(mod => mod.Cube), 
  { ssr: false }
);

const ConvertCSGToThreeGeom = dynamic(() => 
  import('@jscad-fiber/convert-csg-to-three-geom').then(mod => {
    console.log('ConvertCSGToThreeGeom module:', mod);
    return mod.default;
  }), 
  { ssr: false }
);

// Import JSCAD modeling
const JSCADModeling = dynamic(() => 
  import('@jscad/modeling'), 
  { ssr: false }
);

// Error boundary component
function ErrorBoundary({ children }) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleError = (event) => {
      console.error('Error captured:', event.error);
      setError(event.error);
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div style={{ 
        padding: '20px', 
        color: 'red', 
        border: '1px solid red',
        background: '#ffeeee'
      }}>
        <h3>Error rendering 3D component</h3>
        <p>{error?.toString()}</p>
      </div>
    );
  }

  return children;
}

// Custom JSCAD view component using the renderer directly
const CustomJSCadView = ({ children }) => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const animationFrameRef = useRef(null);
  
  // Cleanup function for THREE.js resources
  const cleanup = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    if (controlsRef.current) {
      controlsRef.current.dispose();
    }
    
    if (rendererRef.current) {
      rendererRef.current.dispose();
    }
    
    if (containerRef.current && rendererRef.current) {
      try {
        const domElement = rendererRef.current.domElement;
        if (domElement.parentNode) {
          domElement.parentNode.removeChild(domElement);
        }
      } catch (e) {
        console.error("Error removing renderer:", e);
      }
    }
  };

  useEffect(() => {
    if (!containerRef.current || !createJSCADRenderer || !ThreeJS || !JSCADModeling || !ThreeOrbitControls || !Cube) {
      console.log('Dependencies not loaded yet:', {
        containerRef: !!containerRef.current,
        createJSCADRenderer: !!createJSCADRenderer,
        ThreeJS: !!ThreeJS,
        JSCADModeling: !!JSCADModeling,
        ThreeOrbitControls: !!ThreeOrbitControls,
        Cube: !!Cube
      });
      return;
    }
    
    // Clean up any previous renderer
    cleanup();
    
    try {
      console.log('Setting up JSCAD view with THREE.js');
      
      // Get container dimensions
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      // Following the implementation in the source code
      // createJSCADRenderer is a function that returns { createJSCADRoot }
      const renderer = createJSCADRenderer(JSCADModeling);
      
      // Create jscad geometries array
      const jscadGeoms = [];
      
      // Access createJSCADRoot as a property of the returned object
      const root = renderer.createJSCADRoot(jscadGeoms);
      
      // Create Three.js scene
      const scene = new ThreeJS.Scene();
      sceneRef.current = scene;
      
      // Create camera
      const camera = new ThreeJS.PerspectiveCamera(
        75,
        width / height,
        0.1,
        1000
      );
      camera.position.set(20, 20, 20);
      
      // Add lighting
      const ambientLight = new ThreeJS.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);
      
      const directionalLight = new ThreeJS.DirectionalLight(0xffffff, 0.5);
      directionalLight.position.set(100, 100, 100);
      scene.add(directionalLight);
      
      // Create renderer
      const webGLRenderer = new ThreeJS.WebGLRenderer();
      webGLRenderer.setSize(width, height);
      rendererRef.current = webGLRenderer;
      
      // Add renderer to DOM
      containerRef.current.appendChild(webGLRenderer.domElement);
      
      // Add orbit controls
      const controls = new ThreeOrbitControls(camera, webGLRenderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.25;
      controls.enableZoom = true;
      controlsRef.current = controls;
      
      // Render a cube using React.createElement
      console.log('Creating cube...');
      root.render(
        React.createElement(Cube, {
          size: 10,
          color: "blue",
          position: [0, 0, 0]
        })
      );
      
      // Process the JSCAD geometries
      console.log('Processing geometries:', jscadGeoms);
      
      // Animation loop
      const animate = () => {
        animationFrameRef.current = requestAnimationFrame(animate);
        controls.update();
        webGLRenderer.render(scene, camera);
      };
      
      animate();
      
      // Update renderer size on window resize
      const handleResize = () => {
        if (containerRef.current) {
          const newWidth = containerRef.current.clientWidth;
          const newHeight = containerRef.current.clientHeight;
          
          camera.aspect = newWidth / newHeight;
          camera.updateProjectionMatrix();
          
          webGLRenderer.setSize(newWidth, newHeight);
        }
      };
      
      window.addEventListener('resize', handleResize);
      
      // Cleanup on unmount
      return () => {
        window.removeEventListener('resize', handleResize);
        cleanup();
      };
    } catch (error) {
      console.error('Error setting up JSCAD view:', error);
    }
  }, [createJSCADRenderer, ThreeJS, JSCADModeling, ThreeOrbitControls, Cube]);

  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative'
      }}
    />
  );
};

export default function LocalRenderer() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    console.log('Component mounted');
  }, []);

  if (!mounted) {
    return <div style={{ padding: '20px' }}>Loading page...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Local JSCAD Renderer Test</h1>
      <p>Using createJSCADRenderer from the local library</p>
      
      <div style={{ 
        width: '600px', 
        height: '400px', 
        border: '1px solid #ccc',
        position: 'relative'
      }}>
        <ErrorBoundary>
          <CustomJSCadView />
        </ErrorBoundary>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <h3>Implementation Notes:</h3>
        <ul>
          <li>Directly importing <code>createJSCADRenderer</code> from <code>@jscad-fiber</code></li>
          <li>Using the local library sources</li>
          <li>The renderer is initialized with JSCADModeling</li>
          <li>A cube is created directly with root.render</li>
        </ul>
      </div>
    </div>
  );
} 