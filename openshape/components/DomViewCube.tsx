"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import * as THREE from "three"

interface DomViewCubeProps {
  cameraRef: React.RefObject<THREE.Camera>
  controlsRef: React.RefObject<any> // OrbitControls type
  size?: number
  position?: {
    right?: string
    top?: string
    bottom?: string
    left?: string
  }
  debug?: boolean
}

/**
 * A DOM-based ViewCube component for orientation in CAD applications
 * This uses standard DOM elements with CSS 3D transforms instead of Three.js objects
 * Synchronizes with camera orientation and provides axis indicators
 */
const DomViewCube: React.FC<DomViewCubeProps> = ({
  cameraRef,
  controlsRef,
  size = 80,
  position = { right: "20px", top: "70px" },
  debug = false,
}) => {
  const [cameraRotation, setCameraRotation] = useState({ x: -15, y: -30, z: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const animationFrameId = useRef<number | null>(null)
  const [cameraControlsReady, setCameraControlsReady] = useState(false)

  const log = (message: string, data?: any) => {
    if (debug) {
      console.log(`[DomViewCube] ${message}`, data || "")
    }
  }

  // Utility function to update cube orientation based on camera
  const updateCubeOrientation = () => {
    if (!cameraRef?.current || !containerRef.current) return

    const camera = cameraRef.current

    // First check if we're at or very close to a standard view
    // If so, snap to exact standard view rotations for better alignment
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).normalize();
    const up = camera.up.clone().normalize();
    
    // Check for standard views with a tolerance
    const tolerance = 0.98; // Dot product tolerance (close to 1.0 means vectors are aligned)
    
    // Check main axes alignments
    if (Math.abs(forward.x) > tolerance) {
      // Looking along X axis
      if (forward.x > 0) {
        // Right view (+X)
        setCameraRotation({ x: 0, y: -90, z: 0 });
        return;
      } else {
        // Left view (-X)
        setCameraRotation({ x: 0, y: 90, z: 0 });
        return;
      }
    } else if (Math.abs(forward.y) > tolerance) {
      // Looking along Y axis
      if (forward.y > 0) {
        // Bottom view (+Y)
        setCameraRotation({ x: 90, y: 0, z: 0 });
        return;
      } else {
        // Top view (-Y)
        setCameraRotation({ x: -90, y: 0, z: 0 });
        return;
      }
    } else if (Math.abs(forward.z) > tolerance) {
      // Looking along Z axis
      if (forward.z > 0) {
        // Back view (+Z)
        setCameraRotation({ x: 0, y: 180, z: 0 });
        return;
      } else {
        // Front view (-Z)
        setCameraRotation({ x: 0, y: 0, z: 0 });
        return;
      }
    }
    
    // If not at a standard view, use quaternion-based rotation
    const quaternion = camera.quaternion.clone();
    const euler = new THREE.Euler().setFromQuaternion(quaternion, "XYZ");
    
    // Convert to degrees and apply with reversed signs to counter-rotate
    const rotX = THREE.MathUtils.radToDeg(euler.x) * -1;
    const rotY = THREE.MathUtils.radToDeg(euler.y) * -1;
    const rotZ = THREE.MathUtils.radToDeg(euler.z) * -1;

    // Limit update frequency to prevent constant recalculation
    // Only update if the rotation changed significantly
    const currentRotation = { x: rotX, y: rotY, z: rotZ };
    const threshold = 0.5;
    
    if (
      Math.abs(currentRotation.x - cameraRotation.x) > threshold ||
      Math.abs(currentRotation.y - cameraRotation.y) > threshold ||
      Math.abs(currentRotation.z - cameraRotation.z) > threshold
    ) {
      setCameraRotation(currentRotation);
    }
  }

  // First, check when camera and controls become available
  useEffect(() => {
    // Create a function to check if camera and controls are ready
    const checkReferences = () => {
      if (cameraRef?.current && controlsRef?.current) {
        setCameraControlsReady(true)
        log("Camera and controls are ready")
        return true
      }
      return false
    }

    // Check immediately
    if (!checkReferences()) {
      log("Camera or controls not ready, setting up interval check")
      // If not ready, set up an interval to check periodically
      const intervalId = setInterval(() => {
        if (checkReferences()) {
          clearInterval(intervalId)
        }
      }, 500) // Check every 500ms

      // Clean up interval on unmount
      return () => clearInterval(intervalId)
    }
  }, [cameraRef, controlsRef, debug])

  // Handle camera orientation tracking once camera and controls are ready
  useEffect(() => {
    // Only proceed if we've confirmed camera and controls are ready
    if (!cameraControlsReady) return

    log("Setting up camera orientation tracking")
    const camera = cameraRef.current
    
    // Use a lower frequency for updates to prevent performance issues
    let lastUpdateTime = 0
    const updateInterval = 100 // ms between updates
    
    // Track camera orientation and update the cube accordingly
    const animateUpdates = () => {
      if (!camera) return
      
      const now = Date.now()
      
      if (camera.userData && camera.userData.viewJustSet) {
        // Skip this update if we just set the view manually
        camera.userData.viewJustSet = false
      } else if (now - lastUpdateTime > updateInterval) {
        // Only update at specified intervals
        updateCubeOrientation()
        lastUpdateTime = now
      }
      
      animationFrameId.current = requestAnimationFrame(animateUpdates)
    }

    animateUpdates()

    // Clean up animation frame on unmount
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current)
      }
      log("Cleaning up animation frame")
    }
  }, [cameraControlsReady, cameraRef, controlsRef, debug])

  const handleFaceClick = (view: string) => {
    if (!cameraRef?.current || !controlsRef?.current) {
      log("Cannot set view: missing camera or controls", { view })
      return
    }

    log(`Setting view: ${view}`)
    const camera = cameraRef.current
    const controls = controlsRef.current

    // Save original distance to maintain zoom level
    const targetPosition = new THREE.Vector3(0, 0, 0)
    const originalDistance = camera.position.distanceTo(targetPosition)
    
    // Reset control target to origin
    if (controls.target) {
      controls.target.set(0, 0, 0)
    }

    // Set standard view distance
    const distance = originalDistance || 20

    // Define exact positions and up vectors for standard views
    switch (view) {
      case "front": // Looking along negative Z (standard front view)
        camera.position.set(0, 0, distance)
        camera.up.set(0, 1, 0)
        break
      case "back": // Looking along positive Z
        camera.position.set(0, 0, -distance)
        camera.up.set(0, 1, 0)
        break
      case "right": // Looking along positive X
        camera.position.set(distance, 0, 0)
        camera.up.set(0, 1, 0) 
        break
      case "left": // Looking along negative X
        camera.position.set(-distance, 0, 0)
        camera.up.set(0, 1, 0)
        break
      case "top": // Looking along negative Y
        camera.position.set(0, distance, 0)
        camera.up.set(0, 0, -1) // Important for correct top view orientation
        break
      case "bottom": // Looking along positive Y
        camera.position.set(0, -distance, 0)
        camera.up.set(0, 0, 1) // Important for correct bottom view orientation
        break
      default:
        return
    }

    // Always make camera look at origin
    camera.lookAt(0, 0, 0)
    
    // Force camera matrix updates
    camera.updateMatrix()
    camera.updateMatrixWorld(true)
    camera.updateProjectionMatrix()

    // Ensure controls are updated
    if (typeof controls.update === 'function') {
      // Temporarily disable damping for immediate response
      const originalDamping = controls.enableDamping
      controls.enableDamping = false
      
      // Force multiple updates to ensure changes take effect
      controls.update()
      controls.update() // Second update to be sure
      
      // Restore original damping setting
      controls.enableDamping = originalDamping
    }

    // Calculate the exact rotation values for the view cube based on view
    let x = 0, y = 0, z = 0
    
    switch (view) {
      case "front":
        x = 0; y = 0; z = 0;
        break;
      case "back":
        x = 0; y = 180; z = 0;
        break;
      case "right":
        x = 0; y = -90; z = 0; 
        break;
      case "left":
        x = 0; y = 90; z = 0;
        break;
      case "top":
        x = -90; y = 0; z = 0;
        break;
      case "bottom":
        x = 90; y = 0; z = 0;
        break;
    }
    
    // Directly set the view cube rotation
    setCameraRotation({ x, y, z });
    
    // Set a flag to skip the next automatic camera update
    // This prevents the view cube from jumping due to small quaternion differences
    camera.userData.viewJustSet = true;
    
    // Force immediate update of camera rotation in the UI
    updateCubeOrientation();
  }

  const cubeStyle: React.CSSProperties = {
    position: "absolute",
    top: position.top,
    right: position.right,
    bottom: position.bottom,
    left: position.left,
    width: `${size}px`,
    height: `${size}px`,
    perspective: "500px",
    zIndex: 10,
    pointerEvents: "none", // Make container transparent to mouse events
  }

  const containerStyle: React.CSSProperties = {
    transformStyle: "preserve-3d",
    transform: `rotateX(${cameraRotation.x}deg) rotateY(${cameraRotation.y}deg) rotateZ(${cameraRotation.z || 0}deg)`,
    width: "100%",
    height: "100%",
    position: "relative",
    transition: "transform 0.02s linear",
    pointerEvents: "auto", // Re-enable mouse events for the cube
  }

  const faceStyle: React.CSSProperties = {
    position: "absolute",
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid rgba(0,0,0,0.3)",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "10px",
    transition: "background-color 0.2s", // Only transition the background color
    color: "#333",
    backgroundColor: "rgba(230, 230, 230, 0.7)",
    backdropFilter: "blur(2px)",
  }

  // Main axes colors - standard CAD colors
  const axisColors = {
    x: "#e74c3c", // Red
    y: "#2ecc71", // Green
    z: "#3498db", // Blue
  }

  // Blue hover color to match OnShape
  const hoverColor = "rgba(160, 210, 255, 0.9)"

  const faces = [
    { name: "front", label: "Front", transform: `translateZ(${size / 2}px)` },
    { name: "back", label: "Back", transform: `rotateY(180deg) translateZ(${size / 2}px)` },
    { name: "right", label: "Right", transform: `rotateY(90deg) translateZ(${size / 2}px)` },
    { name: "left", label: "Left", transform: `rotateY(-90deg) translateZ(${size / 2}px)` },
    { name: "top", label: "Top", transform: `rotateX(90deg) translateZ(${size / 2}px)` },
    { name: "bottom", label: "Bottom", transform: `rotateX(-90deg) translateZ(${size / 2}px)` },
  ]

  // Adjusted axis indicator dimensions for smaller cube
  const axisLength = size * 0.7 // Slightly reduced proportion
  const axisWidth = 1.5 // Thinner for smaller cube
  const arrowSize = 4 // Smaller arrows

  // Helper function to create rotation arrows
  const createRotationArrows = () => {
    const arrowSize = size / 10 // Smaller arrows for smaller cube
    const thickness = 1.5 // Thinner lines

    return (
      <>
        {/* X-axis rotation arrows */}
        <div
          style={{
            position: "absolute",
            width: `${arrowSize}px`,
            height: `${arrowSize}px`,
            top: `-${arrowSize / 2}px`,
            left: `calc(50% - ${arrowSize / 2}px)`,
            borderTop: `${thickness}px solid ${axisColors.x}`,
            borderLeft: `${thickness}px solid ${axisColors.x}`,
            transform: "rotate(45deg)",
            pointerEvents: "none",
            zIndex: 20,
          }}
        />
        <div
          style={{
            position: "absolute",
            width: `${arrowSize}px`,
            height: `${arrowSize}px`,
            bottom: `-${arrowSize / 2}px`,
            left: `calc(50% - ${arrowSize / 2}px)`,
            borderBottom: `${thickness}px solid ${axisColors.x}`,
            borderRight: `${thickness}px solid ${axisColors.x}`,
            transform: "rotate(45deg)",
            pointerEvents: "none",
            zIndex: 20,
          }}
        />

        {/* Y-axis rotation arrows */}
        <div
          style={{
            position: "absolute",
            width: `${arrowSize}px`,
            height: `${arrowSize}px`,
            top: `calc(50% - ${arrowSize / 2}px)`,
            right: `-${arrowSize / 2}px`,
            borderTop: `${thickness}px solid ${axisColors.y}`,
            borderRight: `${thickness}px solid ${axisColors.y}`,
            transform: "rotate(45deg)",
            pointerEvents: "none",
            zIndex: 20,
          }}
        />
        <div
          style={{
            position: "absolute",
            width: `${arrowSize}px`,
            height: `${arrowSize}px`,
            top: `calc(50% - ${arrowSize / 2}px)`,
            left: `-${arrowSize / 2}px`,
            borderBottom: `${thickness}px solid ${axisColors.y}`,
            borderLeft: `${thickness}px solid ${axisColors.y}`,
            transform: "rotate(45deg)",
            pointerEvents: "none",
            zIndex: 20,
          }}
        />
      </>
    )
  }

  return (
    <div style={cubeStyle} className="viewcube-container">
      {/* Rotation indicator arrows */}
      {createRotationArrows()}

      {/* Circular background */}
      <div
        style={{
          position: "absolute",
          top: "-5px",
          left: "-5px",
          right: "-5px",
          bottom: "-5px",
          borderRadius: "50%",
          backgroundColor: "rgba(255,255,255,0.8)",
          boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
          zIndex: -1,
          pointerEvents: "none",
        }}
      />

      {/* Cube container */}
      <div ref={containerRef} style={containerStyle} className="viewcube-inner">
        {/* Cube faces */}
        {faces.map((face) => (
          <div
            key={face.name}
            style={{
              ...faceStyle,
              transform: face.transform,
            }}
            onClick={() => handleFaceClick(face.name)}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = hoverColor
              // No scale transform on hover - just color change
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(230, 230, 230, 0.7)"
            }}
          >
            {face.label}
          </div>
        ))}

        {/* X Axis (Red) */}
        <div
          style={{
            position: "absolute",
            width: `${axisLength}px`,
            height: `${axisWidth}px`,
            backgroundColor: axisColors.x,
            transform: `rotateY(90deg) translateX(${size / 4}px) translateZ(${-axisWidth / 2}px)`,
            transformOrigin: "left center",
            zIndex: 20,
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 0,
            height: 0,
            borderTop: `${arrowSize}px solid transparent`,
            borderBottom: `${arrowSize}px solid transparent`,
            borderLeft: `${arrowSize}px solid ${axisColors.x}`,
            transform: `rotateY(90deg) translateX(${axisLength + size / 4 - arrowSize}px) translateZ(${-arrowSize + axisWidth / 2}px)`,
            transformOrigin: "left center",
            zIndex: 20,
            pointerEvents: "none",
          }}
        />
        {/* Improved X-axis label alignment */}
        <div
          style={{
            position: "absolute",
            color: axisColors.x,
            fontWeight: "bold",
            fontSize: "10px",
            transform: `rotateY(90deg) translateX(${axisLength + size / 4 + 2}px) translateZ(${-arrowSize}px)`,
            transformOrigin: "left center",
            zIndex: 20,
            pointerEvents: "none",
            textAlign: "center",
          }}
        >
          X
        </div>

        {/* Y Axis (Green) */}
        <div
          style={{
            position: "absolute",
            width: `${axisWidth}px`,
            height: `${axisLength}px`,
            backgroundColor: axisColors.y,
            transform: `rotateX(-90deg) translateY(${size / 4}px) translateZ(${-axisWidth / 2}px)`,
            transformOrigin: "center top",
            zIndex: 20,
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 0,
            height: 0,
            borderLeft: `${arrowSize}px solid transparent`,
            borderRight: `${arrowSize}px solid transparent`,
            borderTop: `${arrowSize}px solid ${axisColors.y}`,
            transform: `rotateX(-90deg) translateY(${axisLength + size / 4 - arrowSize}px) translateX(${-arrowSize + axisWidth / 2}px)`,
            transformOrigin: "center top",
            zIndex: 20,
            pointerEvents: "none",
          }}
        />
        {/* Improved Y-axis label alignment */}
        <div
          style={{
            position: "absolute",
            color: axisColors.y,
            fontWeight: "bold",
            fontSize: "10px",
            transform: `rotateX(-90deg) translateY(${axisLength + size / 4 + 2}px) translateX(${-arrowSize / 2}px)`,
            transformOrigin: "center top",
            zIndex: 20,
            pointerEvents: "none",
            textAlign: "center",
          }}
        >
          Y
        </div>

        {/* Z Axis (Blue) */}
        <div
          style={{
            position: "absolute",
            width: `${axisWidth}px`,
            height: `${axisLength}px`,
            backgroundColor: axisColors.z,
            transform: `translateZ(${size / 4}px) translateX(${size / 2 - axisWidth / 2}px)`,
            zIndex: 20,
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 0,
            height: 0,
            borderLeft: `${arrowSize}px solid transparent`,
            borderRight: `${arrowSize}px solid transparent`,
            borderBottom: `${arrowSize}px solid ${axisColors.z}`,
            transform: `translateZ(${axisLength + size / 4 - arrowSize}px) translateX(${size / 2 - arrowSize}px)`,
            zIndex: 20,
            pointerEvents: "none",
          }}
        />
        {/* Improved Z-axis label alignment */}
        <div
          style={{
            position: "absolute",
            color: axisColors.z,
            fontWeight: "bold",
            fontSize: "10px",
            transform: `translateZ(${axisLength + size / 4 + 2}px) translateX(${size / 2 - 3}px)`,
            zIndex: 20,
            pointerEvents: "none",
            textAlign: "center",
          }}
        >
          Z
        </div>
      </div>
    </div>
  )
}

export default DomViewCube

