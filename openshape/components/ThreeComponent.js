import React, { useRef, useEffect } from 'react'
import * as THREE from 'three'

export default function ThreeComponent() {
  const containerRef = useRef(null)
  
  useEffect(() => {
    if (!containerRef.current) return
    
    // Create a renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight
    renderer.setSize(width, height)
    container.appendChild(renderer.domElement)
    
    // Create a scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf0f0f0)
    
    // Create a camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
    camera.position.z = 5
    
    // Create a cube
    const geometry = new THREE.BoxGeometry(2, 2, 2)
    const material = new THREE.MeshBasicMaterial({ color: 0x0088ff, wireframe: false })
    const cube = new THREE.Mesh(geometry, material)
    scene.add(cube)
    
    // Add some lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
    directionalLight.position.set(0, 1, 1)
    scene.add(directionalLight)
    
    // Handle window resize
    const handleResize = () => {
      const newWidth = container.clientWidth
      const newHeight = container.clientHeight
      camera.aspect = newWidth / newHeight
      camera.updateProjectionMatrix()
      renderer.setSize(newWidth, newHeight)
    }
    
    window.addEventListener('resize', handleResize)
    
    // Animation function
    const animate = () => {
      requestAnimationFrame(animate)
      
      // Rotate the cube
      cube.rotation.x += 0.01
      cube.rotation.y += 0.01
      
      renderer.render(scene, camera)
    }
    
    // Start animation
    animate()
    
    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize)
      container.removeChild(renderer.domElement)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
    }
  }, [])
  
  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
} 