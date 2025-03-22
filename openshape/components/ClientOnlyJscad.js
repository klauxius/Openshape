import React, { useEffect, useState, useRef } from 'react'
import { JsCadView, Cube } from 'jscad-fiber'
import { useSSRSafeLayoutEffect } from '../lib/isomorphicHooks'

// This component will only run on the client side
const ClientOnlyJscad = ({ size = 10, color = 'blue', position = [0, 0, 0] }) => {
  const containerRef = useRef(null)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState(null)
  
  // Use safer effect hook that works with SSR
  useSSRSafeLayoutEffect(() => {
    try {
      setIsReady(true)
      console.log('ClientOnlyJscad mounted with:', { size, color, position })
    } catch (err) {
      console.error('Error in ClientOnlyJscad:', err)
      setError(err.message)
    }
  }, [size, color, position])
  
  // Handle errors gracefully
  if (error) {
    return (
      <div style={{ padding: '10px', color: 'red', background: '#ffeeee' }}>
        <h3>Error in 3D renderer:</h3>
        <p>{error}</p>
      </div>
    )
  }
  
  // Show nothing until the component is ready
  if (!isReady) {
    return <div>Preparing 3D view...</div>
  }
  
  // Return the actual component once it's ready
  return (
    <div 
      ref={containerRef}
      style={{ width: '100%', height: '100%', position: 'relative' }}
    >
      <JsCadView
        camera={{ position: [0, 0, 20], fov: 45 }}
        controls={{ autoRotate: true }}
        style={{ width: '100%', height: '100%' }}
      >
        <Cube 
          size={size} 
          color={color} 
          position={position} 
        />
      </JsCadView>
    </div>
  )
}

export default ClientOnlyJscad 