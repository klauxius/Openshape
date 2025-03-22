import React, { useEffect, useState, useRef } from 'react'
import { JsCadView, Cube } from 'jscad-fiber'

// This is a client-only component that safely wraps jscad-fiber
const JscadSafeWrapper = ({ size = 10, color = 'blue' }) => {
  const containerRef = useRef(null)
  const [error, setError] = useState(null)
  
  // Ensure we only run this on the client
  useEffect(() => {
    try {
      // Log that we're rendering the component
      console.log('Rendering JscadSafeWrapper', { size, color })
      
      // Log the container dimensions if available
      if (containerRef.current) {
        const width = containerRef.current.clientWidth
        const height = containerRef.current.clientHeight
        console.log('Container dimensions:', width, height)
      }
    } catch (err) {
      console.error('Error in JscadSafeWrapper:', err)
      setError(err.message)
    }
  }, [size, color])
  
  if (error) {
    return (
      <div style={{ 
        padding: '10px', 
        color: 'red', 
        border: '1px solid red', 
        background: '#ffeeee'
      }}>
        <h3>Error rendering 3D view</h3>
        <p>{error}</p>
      </div>
    )
  }
  
  // Return the JSCAD component wrapped in a div with the ref
  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: '100%', 
        height: '100%',
        position: 'relative'
      }}
    >
      <JsCadView
        camera={{ position: [0, 0, 20], fov: 45 }}
        style={{ width: '100%', height: '100%' }}
      >
        <Cube 
          size={size} 
          color={color} 
          position={[0, 0, 0]} 
        />
      </JsCadView>
    </div>
  )
}

export default JscadSafeWrapper 