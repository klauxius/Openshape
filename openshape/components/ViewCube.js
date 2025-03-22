import React, { useEffect } from 'react';
import * as THREE from 'three';

/**
 * ViewCube component for 3D orientation in CAD applications
 * This provides a visual reference of the current orientation and allows
 * quick navigation to standard views by clicking on cube faces.
 */
export default function ViewCube({ 
  cameraRef, 
  controlsRef, 
  size = 100,
  position = { right: '20px', top: '20px' }
}) {
  console.log('ViewCube component rendering', { 
    hasCamera: !!cameraRef?.current, 
    hasControls: !!controlsRef?.current
  });

  // Integrated ViewCube - adds a view cube directly to the main scene
  useEffect(() => {
    if (!cameraRef?.current || !controlsRef?.current) {
      console.warn('ViewCube: Missing camera or controls refs');
      return;
    }
    
    console.log('ViewCube: Setting up integrated view cube');
    
    try {
      // Get the main scene from the camera
      const mainScene = cameraRef.current.parent;
      if (!mainScene) {
        console.warn('ViewCube: Cannot access main scene');
        return;
      }
      
      // Create a group to hold our view cube
      const viewCubeGroup = new THREE.Group();
      viewCubeGroup.name = 'viewCubeGroup';
      
      // Position the view cube in the top-right corner of the view
      viewCubeGroup.position.set(7, 7, 7); // Adjusted position for better visibility
      viewCubeGroup.scale.set(1.2, 1.2, 1.2); // Increased size for better visibility
      
      // Create the cube geometry slightly smaller than the standard cube
      const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
      
      // Create materials for each face with different colors for better orientation
      const cubeMaterials = [
        new THREE.MeshBasicMaterial({ color: 0xd2d8e1, transparent: true, opacity: 0.9 }), // right - x+ (lighter grey-blue)
        new THREE.MeshBasicMaterial({ color: 0xc0cad9, transparent: true, opacity: 0.9 }), // left - x- (lighter grey-blue)
        new THREE.MeshBasicMaterial({ color: 0xe1e8f0, transparent: true, opacity: 0.9 }), // top - y+ (lighter grey-blue)
        new THREE.MeshBasicMaterial({ color: 0xb3bfcf, transparent: true, opacity: 0.9 }), // bottom - y- (lighter grey-blue)
        new THREE.MeshBasicMaterial({ color: 0xd8e0ec, transparent: true, opacity: 0.9 }), // front - z+ (lighter grey-blue)
        new THREE.MeshBasicMaterial({ color: 0xadbcd0, transparent: true, opacity: 0.9 })  // back - z- (lighter grey-blue)
      ];
      
      // Create the cube with materials
      const cube = new THREE.Mesh(cubeGeometry, cubeMaterials);
      cube.name = 'viewCube';
      
      // Add edges to the cube for better visibility
      const edgesGeometry = new THREE.EdgesGeometry(cubeGeometry);
      const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
      const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
      edges.name = 'viewCubeEdges';
      cube.add(edges);
      
      // Add labels to the cube faces
      addLabelsToFaces(cube);
      
      // Add the cube to our group
      viewCubeGroup.add(cube);
      
      // Add a small axis helper
      const axisHelper = new THREE.AxesHelper(1.2);
      axisHelper.name = 'viewCubeAxes';
      viewCubeGroup.add(axisHelper);
      
      // Add the view cube group to the scene
      mainScene.add(viewCubeGroup);
      
      // Set up raycaster for click detection
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();
      
      // Add click event listener to the renderer's domElement
      const rendererEl = controlsRef.current.domElement;
      
      const onDocumentMouseDown = (event) => {
        try {
          // Calculate mouse position in normalized device coordinates
          const rect = rendererEl.getBoundingClientRect();
          mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
          mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
          
          // Update the picking ray with the camera and mouse position
          raycaster.setFromCamera(mouse, cameraRef.current);
          
          // Calculate objects intersecting the picking ray, filtering for the view cube only
          const intersects = raycaster.intersectObject(cube, true);
          
          if (intersects && intersects.length > 0) {
            const intersection = intersects[0];
            
            // Check that we have a valid face with a normal before proceeding
            if (intersection && intersection.face && intersection.face.normal) {
              // Get the face that was clicked
              const face = intersection.face;
              
              // Determine which face was clicked by the normal vector
              const normal = face.normal.clone();
              normal.transformDirection(cube.matrixWorld);
              
              // Set camera position based on which face was clicked
              setViewFromNormal(normal);
            }
          }
        } catch (error) {
          console.error('Error in ViewCube click handling:', error);
        }
      };
      
      rendererEl.addEventListener('mousedown', onDocumentMouseDown, false);
      
      // Helper function to set the view based on the face normal
      const setViewFromNormal = (normal) => {
        // Determine the most prominent direction of the normal
        let position;
        
        if (Math.abs(normal.x) > Math.abs(normal.y) && Math.abs(normal.x) > Math.abs(normal.z)) {
          // X-axis face was clicked
          if (normal.x > 0) {
            // Right view (X+)
            position = [15, 0, 0]; // Increased distance for better view
            console.log('Setting Right view');
          } else {
            // Left view (X-)
            position = [-15, 0, 0]; // Increased distance for better view
            console.log('Setting Left view');
          }
        } else if (Math.abs(normal.y) > Math.abs(normal.x) && Math.abs(normal.y) > Math.abs(normal.z)) {
          // Y-axis face was clicked
          if (normal.y > 0) {
            // Top view (Y+)
            position = [0, 15, 0]; // Increased distance for better view
            console.log('Setting Top view');
          } else {
            // Bottom view (Y-)
            position = [0, -15, 0]; // Increased distance for better view
            console.log('Setting Bottom view');
          }
        } else {
          // Z-axis face was clicked
          if (normal.z > 0) {
            // Front view (Z+)
            position = [0, 0, 15]; // Increased distance for better view
            console.log('Setting Front view');
          } else {
            // Back view (Z-)
            position = [0, 0, -15]; // Increased distance for better view
            console.log('Setting Back view');
          }
        }
        
        // Update the camera position
        if (position && cameraRef.current && controlsRef.current) {
          cameraRef.current.position.set(...position);
          cameraRef.current.lookAt(0, 0, 0);
          controlsRef.current.update();
        }
      };
      
      // Helper function to add text labels to the cube faces
      function addLabelsToFaces(cube) {
        const addLabel = (text, position) => {
          // Create canvas for the label
          const canvas = document.createElement('canvas');
          canvas.width = 64;
          canvas.height = 64;
          const ctx = canvas.getContext('2d');
          
          // Draw text
          ctx.fillStyle = '#000000'; // Keep black for best contrast
          ctx.font = 'bold 32px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(text, 32, 32);
          
          // Add an outline to the text for better visibility
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.strokeText(text, 32, 32);
          
          // Create texture and material
          const texture = new THREE.CanvasTexture(canvas);
          const material = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true,
            opacity: 1.0  // Increased opacity for better visibility
          });
          
          // Create sprite and position it
          const sprite = new THREE.Sprite(material);
          sprite.scale.set(0.6, 0.6, 0.6);  // Slightly larger for better visibility
          sprite.position.set(...position);
          
          cube.add(sprite);
        };
        
        // Add labels with clearer positioning
        addLabel('X', [0.7, 0, 0]); // Right
        addLabel('X', [-0.7, 0, 0]); // Left
        addLabel('Y', [0, 0.7, 0]); // Top
        addLabel('Y', [0, -0.7, 0]); // Bottom
        addLabel('Z', [0, 0, 0.7]); // Front
        addLabel('Z', [0, 0, -0.7]); // Back
      }
      
      // Clean up on unmount
      return () => {
        console.log('ViewCube: Cleaning up');
        rendererEl.removeEventListener('mousedown', onDocumentMouseDown);
        
        // Remove the view cube group from the scene
        if (mainScene) {
          const cubeGroup = mainScene.getObjectByName('viewCubeGroup');
          if (cubeGroup) {
            // Dispose of geometries and materials
            cubeGroup.traverse((child) => {
              if (child instanceof THREE.Mesh) {
                if (child.geometry) child.geometry.dispose();
                if (Array.isArray(child.material)) {
                  child.material.forEach(material => material.dispose());
                } else if (child.material) {
                  child.material.dispose();
                }
              }
            });
            
            mainScene.remove(cubeGroup);
          }
        }
      };
    } catch (error) {
      console.error('Error setting up ViewCube:', error);
    }
  }, [cameraRef, controlsRef]);
  
  // This component doesn't render any DOM elements directly
  // Instead, it adds 3D objects to the existing scene
  return null;
} 