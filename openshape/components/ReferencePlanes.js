import * as THREE from 'three';

/**
 * Creates and manages reference planes for CAD applications
 * 
 * This component creates Front, Top, and Right reference planes that are:
 * 1. Semi-transparent with a subtle blue color
 * 2. Include distinct borders for clear visualization
 * 3. Have labels to identify each plane
 * 4. Support highlighting on hover/selection
 */
const ReferencePlanes = ({
  scene,
  size = 20,
  opacity = 0.1, // Reduced opacity for subtler appearance
  gridDivisions = 10,
}) => {
  // Reference to all plane objects for manipulation
  const planeObjects = {
    front: null,
    top: null,
    right: null
  };
  
  // Use a single color scheme for all planes
  const planeColor = 0xc8e1ff; // Faint blue for all planes
  const borderColor = 0x4287f5; // Stronger blue for borders
  
  /**
   * Creates and adds reference planes to the scene
   */
  const createPlanes = () => {
    // Create all three standard reference planes
    createPlane('front', new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0));
    createPlane('top', new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0));
    createPlane('right', new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0));
    
    // Return cleanup function
    return () => {
      removePlanes();
    };
  };
  
  /**
   * Creates a single reference plane
   * @param {string} name - Name of the plane (front, top, right)
   * @param {THREE.Vector3} normal - Normal vector of the plane
   * @param {THREE.Vector3} position - Position of the plane
   */
  const createPlane = (name, normal, position) => {
    // Create a group to hold the plane and its decorations
    const planeGroup = new THREE.Group();
    planeGroup.name = `${name}Plane`;
    
    // Create the plane geometry aligned to the normal
    const planeGeometry = new THREE.PlaneGeometry(size, size);
    
    // Rotate the plane to align with the given normal
    alignPlaneToNormal(planeGeometry, normal);
    
    // Create semi-transparent material with the standard plane color
    const planeMaterial = new THREE.MeshBasicMaterial({
      color: planeColor,
      transparent: true,
      opacity: opacity,
      side: THREE.DoubleSide,
    });
    
    // Create the plane mesh
    const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
    planeMesh.position.copy(position);
    planeMesh.name = `${name}PlaneMesh`;
    
    // Add to group
    planeGroup.add(planeMesh);
    
    // Add border to the plane
    const border = createPlaneBorder(name, normal, position);
    planeGroup.add(border);
    
    // Add plane label
    const label = createPlaneLabel(name, normal, position);
    planeGroup.add(label);
    
    // Add to scene
    scene.add(planeGroup);
    
    // Store reference for later manipulation
    planeObjects[name] = planeGroup;
    
    // Enable hover highlighting
    planeMesh.userData.highlightable = true;
    planeMesh.userData.type = 'referencePlane';
    planeMesh.userData.planeName = name;
    
    return planeGroup;
  };
  
  /**
   * Creates a border for the plane
   */
  const createPlaneBorder = (name, normal, position) => {
    // Create a wireframe border using line segments
    const borderGeometry = new THREE.EdgesGeometry(new THREE.PlaneGeometry(size, size));
    const borderMaterial = new THREE.LineBasicMaterial({ 
      color: borderColor, 
      linewidth: 2 
    });
    
    const border = new THREE.LineSegments(borderGeometry, borderMaterial);
    border.name = `${name}PlaneBorder`;
    
    // Align the border with the plane
    alignPlaneToNormal(border.geometry, normal);
    border.position.copy(position);
    
    // Add a small offset to avoid z-fighting
    if (normal.equals(new THREE.Vector3(0, 0, 1))) {
      border.position.z += 0.01;
    } else if (normal.equals(new THREE.Vector3(0, 1, 0))) {
      border.position.y += 0.01;
    } else if (normal.equals(new THREE.Vector3(1, 0, 0))) {
      border.position.x += 0.01;
    }
    
    return border;
  };
  
  /**
   * Aligns a plane geometry to the specified normal
   */
  const alignPlaneToNormal = (geometry, normal) => {
    // Create a rotation matrix that aligns the plane with the normal
    if (normal.equals(new THREE.Vector3(1, 0, 0))) {
      // Right plane - rotated 90 degrees around Y
      geometry.rotateY(Math.PI / 2);
    } else if (normal.equals(new THREE.Vector3(0, 1, 0))) {
      // Top plane - rotated 90 degrees around X
      geometry.rotateX(-Math.PI / 2);
    }
    // Front plane is already aligned with Z axis by default
  };
  
  /**
   * Creates a text label for the plane
   */
  const createPlaneLabel = (name, normal, position) => {
    // Create canvas for the text
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    
    // Clear canvas
    context.fillStyle = 'rgba(255, 255, 255, 0)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw text
    context.font = 'Bold 60px Arial';
    context.fillStyle = new THREE.Color(borderColor).getStyle(); // Use border color for text
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(name.charAt(0).toUpperCase() + name.slice(1), 128, 128);
    
    // Create texture and sprite
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 0.9 // Make label slightly more visible
    });
    
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(4, 4, 1); // Smaller scale for less dominance
    
    // Position the label in the corner of each plane
    if (name === 'front') {
      sprite.position.set(size/2 - 2, size/2 - 2, 0.1);
    } else if (name === 'top') {
      sprite.position.set(size/2 - 2, 0.1, size/2 - 2);
    } else if (name === 'right') {
      sprite.position.set(0.1, size/2 - 2, size/2 - 2);
    }
    
    return sprite;
  };
  
  /**
   * Highlights the specified plane
   */
  const highlightPlane = (name, highlight = true) => {
    if (!planeObjects[name]) return;
    
    const planeMesh = planeObjects[name].children.find(
      child => child.name === `${name}PlaneMesh`
    );
    
    if (planeMesh && planeMesh.material) {
      if (highlight) {
        // Store original opacity if not already stored
        if (!planeMesh.userData.originalOpacity) {
          planeMesh.userData.originalOpacity = planeMesh.material.opacity;
        }
        // Increase opacity for highlighting
        planeMesh.material.opacity = Math.min(opacity * 3, 0.3);
      } else {
        // Restore original opacity
        planeMesh.material.opacity = 
          planeMesh.userData.originalOpacity || opacity;
      }
    }
  };
  
  /**
   * Toggles visibility of reference planes
   */
  const togglePlaneVisibility = (name, visible) => {
    if (planeObjects[name]) {
      planeObjects[name].visible = visible;
    }
  };
  
  /**
   * Toggles visibility of all planes
   */
  const toggleAllPlanesVisibility = (visible) => {
    Object.keys(planeObjects).forEach(name => {
      if (planeObjects[name]) {
        planeObjects[name].visible = visible;
      }
    });
  };
  
  /**
   * Removes all planes from the scene
   */
  const removePlanes = () => {
    Object.keys(planeObjects).forEach(name => {
      if (planeObjects[name]) {
        // Dispose of geometries and materials
        planeObjects[name].traverse(obj => {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material.forEach(material => material.dispose());
            } else {
              obj.material.dispose();
            }
          }
        });
        
        // Remove from scene
        scene.remove(planeObjects[name]);
        planeObjects[name] = null;
      }
    });
  };
  
  // Return the API
  return {
    createPlanes,
    highlightPlane,
    togglePlaneVisibility,
    toggleAllPlanesVisibility,
    removePlanes,
    get planeObjects() { return { ...planeObjects }; }
  };
};

export default ReferencePlanes; 