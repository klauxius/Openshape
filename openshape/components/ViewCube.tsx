"use client"

import React from "react"
import { useEffect, useRef } from "react"
import * as THREE from "three"

/**
 * ViewCube component for 3D orientation in CAD applications
 * This provides a visual reference of the current orientation and allows
 * quick navigation to standard views by clicking on cube faces.
 * 
 * @param {Object} props
 * @param {React.RefObject<THREE.Camera>} props.cameraRef - Reference to the camera
 * @param {React.RefObject<any>} props.controlsRef - Reference to the OrbitControls
 * @param {number} [props.size=100] - Size of the view cube
 * @param {Object} [props.position] - Position of the view cube
 * @param {string} [props.position.right] - Right position
 * @param {string} [props.position.top] - Top position
 * @param {string} [props.position.bottom] - Bottom position
 * @param {string} [props.position.left] - Left position
 * @param {boolean} [props.debug=false] - Enable debug logging
 */
export default function ViewCube({
  cameraRef,
  controlsRef,
  size = 100,
  position = { right: "20px", top: "20px" },
  debug = false,
}) {
  const viewCubeRef = useRef<THREE.Group | null>(null)

  const log = (message: string, data?: any) => {
    if (debug) {
      console.log(`[ViewCube] ${message}`, data || "")
    }
  }

  // Integrated ViewCube - adds a view cube directly to the main scene
  useEffect(() => {
    log("Initializing ViewCube", {
      hasCamera: !!cameraRef?.current,
      hasControls: !!controlsRef?.current,
    })

    if (!cameraRef?.current || !controlsRef?.current) {
      log("Missing camera or controls refs")
      return
    }

    try {
      // Get the main scene from the camera
      const mainScene = cameraRef.current.parent

      if (!mainScene) {
        log("Cannot access main scene")
        return
      }

      // Create a group to hold our view cube
      const viewCubeGroup = new THREE.Group()
      viewCubeGroup.name = "viewCubeGroup"

      // Position the view cube in the top-right corner of the view
      viewCubeGroup.position.set(8, 8, 8)
      viewCubeGroup.scale.set(1.5, 1.5, 1.5)

      // Create the cube geometry
      const cubeGeometry = new THREE.BoxGeometry(1, 1, 1)

      // Create materials for each face with different colors for better orientation
      const cubeMaterials = [
        new THREE.MeshBasicMaterial({ color: 0xff5252, transparent: true, opacity: 0.9 }), // right - x+ (red)
        new THREE.MeshBasicMaterial({ color: 0xf48fb1, transparent: true, opacity: 0.9 }), // left - x- (pink)
        new THREE.MeshBasicMaterial({ color: 0x81c784, transparent: true, opacity: 0.9 }), // top - y+ (green)
        new THREE.MeshBasicMaterial({ color: 0x4db6ac, transparent: true, opacity: 0.9 }), // bottom - y- (teal)
        new THREE.MeshBasicMaterial({ color: 0x64b5f6, transparent: true, opacity: 0.9 }), // front - z+ (blue)
        new THREE.MeshBasicMaterial({ color: 0x9575cd, transparent: true, opacity: 0.9 }), // back - z- (purple)
      ]

      // Create the cube with materials
      const cube = new THREE.Mesh(cubeGeometry, cubeMaterials)
      cube.name = "viewCube"

      // Add edges to the cube for better visibility
      const edgesGeometry = new THREE.EdgesGeometry(cubeGeometry)
      const edgesMaterial = new THREE.LineBasicMaterial({
        color: 0x000000,
        linewidth: 1.5,
      })
      const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial)
      edges.name = "viewCubeEdges"
      cube.add(edges)

      // Add labels to the cube faces
      addLabelsToFaces(cube)

      // Add the cube to our group
      viewCubeGroup.add(cube)

      // Add a small axis helper
      const axisHelper = new THREE.AxesHelper(1.2)
      axisHelper.name = "viewCubeAxes"
      viewCubeGroup.add(axisHelper)

      // Add the view cube group to the scene
      mainScene.add(viewCubeGroup)
      viewCubeRef.current = viewCubeGroup

      log("ViewCube added to scene")

      // Set up raycaster for click detection
      const raycaster = new THREE.Raycaster()
      const mouse = new THREE.Vector2()

      // Add click event listener to the renderer's domElement
      const rendererEl = controlsRef.current.domElement

      const onDocumentMouseDown = (event) => {
        try {
          // Calculate mouse position in normalized device coordinates
          const rect = rendererEl.getBoundingClientRect()
          mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
          mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

          // Update the picking ray with the camera and mouse position
          raycaster.setFromCamera(mouse, cameraRef.current)

          // Calculate objects intersecting the picking ray, filtering for the view cube only
          const intersects = raycaster.intersectObject(cube, true)

          if (intersects && intersects.length > 0) {
            const intersection = intersects[0]

            // Check that we have a valid face with a normal before proceeding
            if (intersection && intersection.face && intersection.face.normal) {
              // Get the face that was clicked
              const face = intersection.face

              // Determine which face was clicked by the normal vector
              const normal = face.normal.clone()
              normal.transformDirection(cube.matrixWorld)

              // Set camera position based on which face was clicked
              setViewFromNormal(normal)

              // Prevent other click handlers from firing
              event.stopPropagation()
            }
          }
        } catch (error) {
          console.error("Error in ViewCube click handling:", error)
        }
      }

      rendererEl.addEventListener("mousedown", onDocumentMouseDown, false)

      // Helper function to set the view based on the face normal
      const setViewFromNormal = (normal: THREE.Vector3) => {
        // Standard view distance from origin
        const viewDistance = 20

        // Determine the most prominent direction of the normal
        let position: THREE.Vector3
        let up = new THREE.Vector3(0, 1, 0) // Default up vector
        let viewName = ""

        if (Math.abs(normal.x) > Math.abs(normal.y) && Math.abs(normal.x) > Math.abs(normal.z)) {
          // X-axis face was clicked
          if (normal.x > 0) {
            // Right view (X+)
            position = new THREE.Vector3(viewDistance, 0, 0)
            viewName = "Right"
          } else {
            // Left view (X-)
            position = new THREE.Vector3(-viewDistance, 0, 0)
            viewName = "Left"
          }
        } else if (Math.abs(normal.y) > Math.abs(normal.x) && Math.abs(normal.y) > Math.abs(normal.z)) {
          // Y-axis face was clicked
          if (normal.y > 0) {
            // Top view (Y+)
            position = new THREE.Vector3(0, viewDistance, 0)
            up = new THREE.Vector3(0, 0, -1) // Adjust up vector for top view
            viewName = "Top"
          } else {
            // Bottom view (Y-)
            position = new THREE.Vector3(0, -viewDistance, 0)
            up = new THREE.Vector3(0, 0, 1) // Adjust up vector for bottom view
            viewName = "Bottom"
          }
        } else {
          // Z-axis face was clicked
          if (normal.z > 0) {
            // Front view (Z+)
            position = new THREE.Vector3(0, 0, viewDistance)
            viewName = "Front"
          } else {
            // Back view (Z-)
            position = new THREE.Vector3(0, 0, -viewDistance)
            viewName = "Back"
          }
        }

        log(`Setting ${viewName} view`)

        // Update the camera position and orientation
        if (position && cameraRef.current && controlsRef.current) {
          // Animate the transition
          animateCameraMove(position, new THREE.Vector3(0, 0, 0), up)
        }
      }

      // Animate camera movement for smoother transitions
      const animateCameraMove = (
        targetPosition,
        targetLookAt,
        targetUp,
      ) => {
        const camera = cameraRef.current
        const controls = controlsRef.current

        if (!camera || !controls) return

        // Store initial values
        const startPosition = camera.position.clone()
        const startUp = camera.up.clone()

        // Animation parameters
        const duration = 500 // ms
        const startTime = Date.now()

        // Animation function
        function animate() {
          const now = Date.now()
          const elapsed = now - startTime
          const progress = Math.min(elapsed / duration, 1)

          // Ease function (ease-out cubic)
          const ease = 1 - Math.pow(1 - progress, 3)

          // Interpolate position
          camera.position.lerpVectors(startPosition, targetPosition, ease)

          // Interpolate up vector
          camera.up.lerpVectors(startUp, targetUp, ease)

          // Look at target
          camera.lookAt(targetLookAt)

          // Update controls
          controls.update()

          // Continue animation if not complete
          if (progress < 1) {
            requestAnimationFrame(animate)
          }
        }

        // Start animation
        animate()
      }

      // Helper function to add text labels to the cube faces
      function addLabelsToFaces(cube) {
        // Define labels for each face
        const labels = {
          right: "Right",
          left: "Left",
          top: "Top",
          bottom: "Bottom",
          front: "Front",
          back: "Back",
        }

        const addLabel = (text: string, position: [number, number, number]) => {
          // Create canvas for the label
          const canvas = document.createElement("canvas")
          canvas.width = 128
          canvas.height = 128
          const ctx = canvas.getContext("2d")

          if (!ctx) return

          // Clear canvas
          ctx.fillStyle = "rgba(255, 255, 255, 0)"
          ctx.fillRect(0, 0, canvas.width, canvas.height)

          // Draw text
          ctx.fillStyle = "#000000"
          ctx.font = "bold 24px Arial"
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          ctx.fillText(text, 64, 64)

          // Add an outline to the text for better visibility
          ctx.strokeStyle = "#ffffff"
          ctx.lineWidth = 2
          ctx.strokeText(text, 64, 64)

          // Create texture and material
          const texture = new THREE.CanvasTexture(canvas)
          texture.minFilter = THREE.LinearFilter

          const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 1.0,
          })

          // Create sprite and position it
          const sprite = new THREE.Sprite(material)
          sprite.scale.set(0.6, 0.6, 0.6)
          sprite.position.set(...position)

          cube.add(sprite)
        }

        // Add face labels
        addLabel(labels.right, [0.7, 0, 0])
        addLabel(labels.left, [-0.7, 0, 0])
        addLabel(labels.top, [0, 0.7, 0])
        addLabel(labels.bottom, [0, -0.7, 0])
        addLabel(labels.front, [0, 0, 0.7])
        addLabel(labels.back, [0, 0, -0.7])
      }

      // Clean up on unmount
      return () => {
        log("Cleaning up ViewCube")
        rendererEl.removeEventListener("mousedown", onDocumentMouseDown)

        // Remove the view cube group from the scene
        if (mainScene) {
          const cubeGroup = mainScene.getObjectByName("viewCubeGroup")
          if (cubeGroup) {
            // Dispose of geometries and materials
            cubeGroup.traverse((child) => {
              if (child instanceof THREE.Mesh) {
                if (child.geometry) child.geometry.dispose()
                if (Array.isArray(child.material)) {
                  child.material.forEach((material) => material.dispose())
                } else if (child.material) {
                  child.material.dispose()
                }
              }
            })

            mainScene.remove(cubeGroup)
          }
        }

        viewCubeRef.current = null
      }
    } catch (error) {
      console.error("Error setting up ViewCube:", error)
    }
  }, [cameraRef, controlsRef, debug])

  // This component doesn't render any DOM elements directly
  return null
}

