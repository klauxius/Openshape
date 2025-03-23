import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Head from 'next/head';
import ViewCube from '../components/ViewCube';
import DomViewCube from '../components/DomViewCube';

export default function ViewCubeTest() {
  const containerRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    console.log('Setting up Three.js scene for ViewCube test');
    
    // Initialize Three.js scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);
    
    // Get container dimensions
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    
    // Create camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;
    
    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    containerRef.current.appendChild(renderer.domElement);
    
    // Add orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controlsRef.current = controls;
    
    // Add a simple cube to the scene
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({
      color: 0x3388ff,
      wireframe: true
    });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
    
    // Add grid helper
    const gridHelper = new THREE.GridHelper(10, 10);
    scene.add(gridHelper);
    
    // Add axes helper
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);
    
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    
    animate();
    setIsLoaded(true);
    
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
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);
  
  return (
    <div>
      <Head>
        <title>ViewCube Test</title>
      </Head>
      
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">ViewCube Test Page</h1>
        <p className="mb-4">This page tests the ViewCube component in isolation.</p>
        
        <div className="flex gap-4">
          <div className="w-1/2">
            <h2 className="text-xl font-semibold mb-2">Three.js ViewCube</h2>
            <div
              ref={containerRef}
              style={{ width: '100%', height: '400px', position: 'relative' }}
              className="border border-gray-300 rounded"
            >
              {isLoaded && (
                <ViewCube
                  cameraRef={cameraRef}
                  controlsRef={controlsRef}
                  size={80}
                  position={{ top: '20px', right: '20px' }}
                />
              )}
            </div>
          </div>
          
          <div className="w-1/2">
            <h2 className="text-xl font-semibold mb-2">DOM-based ViewCube</h2>
            <div
              style={{ width: '100%', height: '400px', position: 'relative' }}
              className="border border-gray-300 rounded"
            >
              {isLoaded && (
                <DomViewCube
                  cameraRef={cameraRef}
                  controlsRef={controlsRef}
                  size={80}
                  position={{ top: '20px', right: '20px' }}
                />
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <h3 className="text-lg font-semibold">Debug Information:</h3>
          <pre className="bg-gray-100 p-2 rounded">
            Camera Ref: {cameraRef.current ? 'Available' : 'Not Available'}<br />
            Controls Ref: {controlsRef.current ? 'Available' : 'Not Available'}<br />
            Scene Loaded: {isLoaded ? 'Yes' : 'No'}
          </pre>
        </div>
      </div>
    </div>
  );
} 