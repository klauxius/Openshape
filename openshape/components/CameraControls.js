import { useRef, useEffect } from 'react'

const CameraControls = ({ containerRef, camera, renderer }) => {
  const stateRef = useRef({
    dragging: false,
    rotating: false,
    lastX: 0,
    lastY: 0,
    distance: 100,
    theta: 0,
    phi: Math.PI / 4
  })
  
  useEffect(() => {
    if (!containerRef.current || !camera) return
    
    const container = containerRef.current
    const state = stateRef.current
    
    // Update camera position based on spherical coordinates
    const updateCameraPosition = () => {
      const { distance, theta, phi } = state
      
      camera.position = [
        distance * Math.sin(phi) * Math.sin(theta),
        distance * Math.cos(phi),
        distance * Math.sin(phi) * Math.cos(theta)
      ]
    }
    
    // Mouse event handlers
    const onMouseDown = (e) => {
      const state = stateRef.current
      
      if (e.button === 0) { // Left mouse button - rotate
        state.rotating = true
      } else if (e.button === 1 || e.button === 2) { // Middle or right mouse button - pan
        state.dragging = true
      }
      
      state.lastX = e.clientX
      state.lastY = e.clientY
      
      e.preventDefault()
    }
    
    const onMouseMove = (e) => {
      const state = stateRef.current
      
      const deltaX = e.clientX - state.lastX
      const deltaY = e.clientY - state.lastY
      
      if (state.rotating) {
        // Rotate camera
        state.theta -= deltaX * 0.01
        state.phi = Math.max(0.1, Math.min(Math.PI - 0.1, state.phi - deltaY * 0.01))
        updateCameraPosition()
      } else if (state.dragging) {
        // Pan camera (more complex, would need to adjust target)
        // Simplified version - just adjust the camera target
        const right = [
          Math.sin(state.theta - Math.PI/2),
          0,
          Math.cos(state.theta - Math.PI/2)
        ]
        
        const up = [0, 1, 0]
        
        // Scale the movement
        const factor = state.distance * 0.001
        
        // Move the target in the right direction
        camera.target = [
          camera.target[0] - right[0] * deltaX * factor,
          camera.target[1] + up[1] * deltaY * factor,
          camera.target[2] - right[2] * deltaX * factor
        ]
      }
      
      state.lastX = e.clientX
      state.lastY = e.clientY
    }
    
    const onMouseUp = () => {
      const state = stateRef.current
      state.dragging = false
      state.rotating = false
    }
    
    const onWheel = (e) => {
      const state = stateRef.current
      
      // Zoom in/out
      state.distance = Math.max(10, state.distance + e.deltaY * 0.1)
      updateCameraPosition()
      
      e.preventDefault()
    }
    
    const onContextMenu = (e) => {
      e.preventDefault() // Prevent context menu on right-click
    }
    
    // Add event listeners
    container.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    container.addEventListener('wheel', onWheel)
    container.addEventListener('contextmenu', onContextMenu)
    
    // Initialize camera position
    updateCameraPosition()
    
    // Cleanup
    return () => {
      container.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      container.removeEventListener('wheel', onWheel)
      container.removeEventListener('contextmenu', onContextMenu)
    }
  }, [containerRef, camera, renderer])
  
  return null // This is a non-visual component
}

export default CameraControls 