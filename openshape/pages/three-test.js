import React, { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'

// Import Three.js dynamically to avoid SSR issues
const ThreeComponent = dynamic(() => import('../components/ThreeComponent'), {
  ssr: false,
  loading: () => <div>Loading Three.js components...</div>
})

export default function ThreeTest() {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) {
    return <div style={{ padding: '20px' }}>Loading page...</div>
  }
  
  return (
    <div style={{ padding: '20px' }}>
      <h1>Three.js Basic Test</h1>
      <p>This page tests if basic Three.js rendering works in your browser.</p>
      
      <div style={{ width: '600px', height: '400px', border: '1px solid #ccc', overflow: 'hidden' }}>
        <ThreeComponent />
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <h3>What This Means:</h3>
        <p>If you see a rotating blue cube, Three.js is working correctly.</p>
        <p>If you don't see anything or get an error, there might be an issue with Three.js in your browser.</p>
      </div>
    </div>
  )
} 