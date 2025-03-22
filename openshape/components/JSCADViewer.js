import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

// Import JsCadView with dynamic import
const JsCadView = dynamic(
  () => import('jscad-fiber').then((mod) => mod.JsCadView),
  { ssr: false }
)

// This component will parse JSCAD code and render it
const JSCADViewer = ({ code }) => {
  const [geometryComponent, setGeometryComponent] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!code) return
    
    try {
      // For a real implementation, you would need to parse the JSCAD code
      // and convert it to appropriate jscad-fiber components
      // For now, we'll just check for keywords and render basic shapes
      
      if (code.includes('cube')) {
        // Import dynamically to avoid SSR issues
        import('jscad-fiber').then(({ Cube }) => {
          setGeometryComponent(<Cube size={10} color="steelblue" />)
        })
      } else if (code.includes('sphere')) {
        import('jscad-fiber').then(({ Sphere }) => {
          setGeometryComponent(<Sphere radius={10} color="coral" />)
        })
      } else if (code.includes('cylinder')) {
        import('jscad-fiber').then(({ Cylinder }) => {
          setGeometryComponent(<Cylinder radius={5} height={10} color="seagreen" />)
        })
      } else {
        setError('Unsupported geometry type')
      }
    } catch (err) {
      console.error('Error parsing JSCAD code:', err)
      setError('Failed to parse model code: ' + err.message)
    }
  }, [code])

  return (
    <div style={{ width: '100%', height: '500px', position: 'relative' }}>
      {geometryComponent && (
        <JsCadView>
          {geometryComponent}
        </JsCadView>
      )}
      
      {error && (
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          padding: '10px', 
          backgroundColor: 'rgba(255,0,0,0.7)',
          color: 'white'
        }}>
          {error}
        </div>
      )}
    </div>
  )
}

export default JSCADViewer 