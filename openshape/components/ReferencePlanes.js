import * as THREE from 'three';

/**
 * Creates and manages reference planes for CAD applications
 * 
 * This component creates Front, Top, and Right reference planes that are:
 * 1. Semi-transparent with distinct colors
 * 2. Include a grid pattern for better visualization
 * 3. Have labels to identify each plane
 * 4. Support highlighting on hover/selection
 */
const ReferencePlanes = ({
  scene,
  size = 20,
  opacity = 0.2,
  gridDivisions = 10,
}) => {
  // Reference to all plane objects for manipulation
  const planeObjects = {
    front: null,
    top: null,
    right: null
  };
  
  // Color scheme for different planes
  const planeColors = {
    front: 0x4a90e2, // Blue
    top: 0x50e3c2,   // Teal/Green
    right: 0xe84a5f  // Red
  };
  
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
    
    // Create semi-transparent material with the plane's color
    const planeMaterial = new THREE.MeshBasicMaterial({
      color: planeColors[name],
      transparent: true,
      opacity: opacity,
      side: THREE.DoubleSide,
    });
    
    // Create the plane mesh
    const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
    planeMesh.position.copy(position);
    planeMesh.name = `${name}PlaneMesh`;
    
    // Add grid lines to the plane
    const gridHelper = createGridForPlane(name, normal, position);
    
    // Add plane label
    const label = createPlaneLabel(name, normal, position);
    
    // Add everything to the group
    planeGroup.add(planeMesh);
    planeGroup.add(gridHelper);
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
   * Creates a grid to overlay on the plane
   */
  const createGridForPlane = (name, normal, position) => {
    // Create a grid helper appropriate for the plane orientation
    let gridHelper;
    
    if (normal.equals(new THREE.Vector3(0, 1, 0))) {
      // Top plane - XZ grid
      gridHelper = new THREE.GridHelper(size, gridDivisions);
      gridHelper.position.set(0, 0.01, 0); // Slight offset to avoid Z-fighting
    } 
    else if (normal.equals(new THREE.Vector3(1, 0, 0))) {
      // Right plane - YZ grid
      gridHelper = new THREE.GridHelper(size, gridDivisions);
      gridHelper.rotation.z = Math.PI / 2;
      gridHelper.position.set(0.01, 0, 0); // Slight offset
    }
    else {
      // Front plane - XY grid
      gridHelper = new THREE.GridHelper(size, gridDivisions);
      gridHelper.rotation.x = Math.PI / 2;
      gridHelper.position.set(0, 0, 0.01); // Slight offset
    }
    
    // Use the plane color for grid lines
    gridHelper.material.color.set(new THREE.Color(planeColors[name]));
    gridHelper.material.opacity = 0.6;
    gridHelper.material.transparent = true;
    
    return gridHelper;
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
    context.fillStyle = new THREE.Color(planeColors[name]).getStyle();
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(name.charAt(0).toUpperCase() + name.slice(1), 128, 128);
    
    // Create texture and sprite
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 1.0
    });
    
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(5, 5, 1);
    
    // Position the label
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
        planeMesh.material.opacity = Math.min(opacity * 2, 0.6);
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