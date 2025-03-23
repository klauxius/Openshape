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
        // Standard view distance from origin
        const viewDistance = 20;
        
        // Determine the most prominent direction of the normal
        let position;
        let up = new THREE.Vector3(0, 1, 0); // Default up vector
        
        if (Math.abs(normal.x) > Math.abs(normal.y) && Math.abs(normal.x) > Math.abs(normal.z)) {
          // X-axis face was clicked
          if (normal.x > 0) {
            // Right view (X+)
            position = new THREE.Vector3(viewDistance, 0, 0);
            console.log('Setting Right view');
          } else {
            // Left view (X-)
            position = new THREE.Vector3(-viewDistance, 0, 0);
            console.log('Setting Left view');
          }
        } else if (Math.abs(normal.y) > Math.abs(normal.x) && Math.abs(normal.y) > Math.abs(normal.z)) {
          // Y-axis face was clicked
          if (normal.y > 0) {
            // Top view (Y+)
            position = new THREE.Vector3(0, viewDistance, 0);
            up = new THREE.Vector3(0, 0, -1); // Adjust up vector for top view
            console.log('Setting Top view');
          } else {
            // Bottom view (Y-)
            position = new THREE.Vector3(0, -viewDistance, 0);
            up = new THREE.Vector3(0, 0, 1); // Adjust up vector for bottom view
            console.log('Setting Bottom view');
          }
        } else {
          // Z-axis face was clicked
          if (normal.z > 0) {
            // Front view (Z+)
            position = new THREE.Vector3(0, 0, viewDistance);
            console.log('Setting Front view');
          } else {
            // Back view (Z-)
            position = new THREE.Vector3(0, 0, -viewDistance);
            console.log('Setting Back view');
          }
        }
        
        // Update the camera position and orientation
        if (position && cameraRef.current && controlsRef.current) {
          // Set the camera position
          cameraRef.current.position.copy(position);
          
          // Look at the origin
          cameraRef.current.lookAt(0, 0, 0);
          
          // Set the up vector to ensure correct orientation
          cameraRef.current.up.copy(up);
          
          // Update the controls to apply changes
          controlsRef.current.update();
        }
      };
      
      // Helper function to add text labels to the cube faces
      function addLabelsToFaces(cube) {
        // Define more descriptive labels for each face
        const labels = {
          right: 'Right',
          left: 'Left', 
          top: 'Top',
          bottom: 'Bottom',
          front: 'Front',
          back: 'Back'
        };
        
        const addLabel = (text, position, rotation = [0, 0, 0]) => {
          // Create canvas for the label
          const canvas = document.createElement('canvas');
          canvas.width = 96;
          canvas.height = 96;
          const ctx = canvas.getContext('2d');
          
          // Clear canvas
          ctx.fillStyle = 'rgba(255, 255, 255, 0)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Draw text
          ctx.fillStyle = '#000000'; // Keep black for best contrast
          ctx.font = 'bold 20px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(text, 48, 48);
          
          // Add an outline to the text for better visibility
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.strokeText(text, 48, 48);
          
          // Create texture and material
          const texture = new THREE.CanvasTexture(canvas);
          texture.minFilter = THREE.LinearFilter; // Improves text readability
          
          const material = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true,
            opacity: 1.0
          });
          
          // Create sprite and position it
          const sprite = new THREE.Sprite(material);
          sprite.scale.set(0.5, 0.5, 0.5);
          sprite.position.set(...position);
          
          cube.add(sprite);
        };
        
        // Add face labels with more descriptive text
        addLabel(labels.right, [0.7, 0, 0]);
        addLabel(labels.left, [-0.7, 0, 0]);
        addLabel(labels.top, [0, 0.7, 0]);
        addLabel(labels.bottom, [0, -0.7, 0]);
        addLabel(labels.front, [0, 0, 0.7]);
        addLabel(labels.back, [0, 0, -0.7]);
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
  return null;
} 