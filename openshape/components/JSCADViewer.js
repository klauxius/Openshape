import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import ElectronJscadBridge from './ElectronJscadBridge'

// Import JsCadView with dynamic import
const JsCadView = dynamic(
  () => import('jscad-fiber').then((mod) => mod.JsCadView),
  { ssr: false }
)

// Import utility controls dynamically
const Controls = dynamic(
  () => import('jscad-fiber').then((mod) => mod.Controls),
  { ssr: false }
)

// This component will parse JSCAD code and render it
const JSCADViewer = ({ code, onCodeChange }) => {
  const [geometryComponent, setGeometryComponent] = useState(null)
  const [error, setError] = useState(null)
  const [modelData, setModelData] = useState(null)
  const [isExporting, setIsExporting] = useState(false)

  // Handle file operations via the Electron bridge
  const handleFileLoaded = useCallback((filePath) => {
    // In a real implementation, you would read the file and update the code
    console.log('File loaded from:', filePath)
    // Notify parent that a file has been loaded
    if (onCodeChange) {
      // This is a placeholder - in a real app, you'd parse the file and extract code
      onCodeChange(`// Code loaded from ${filePath}\n// Implement actual file loading logic here`)
    }
  }, [onCodeChange])

  const handleFileSaved = useCallback((filePath) => {
    console.log('File saved to:', filePath)
    setIsExporting(false)
    // Here you would actually write the modelData to the file
    // In a real implementation, this would be handled by the main process
  }, [])

  const handleError = useCallback((errorMessage) => {
    console.error('Error in file operation:', errorMessage)
    setError(errorMessage)
    setIsExporting(false)
  }, [])

  // Get methods from the bridge
  const { saveModelToFile, openModelFromFile, isElectron } = ElectronJscadBridge({
    onFileLoaded: handleFileLoaded,
    onFileSaved: handleFileSaved,
    onError: handleError
  })

  // Export the current model
  const exportModel = useCallback(() => {
    if (!modelData) {
      setError('No model data to export')
      return
    }

    setIsExporting(true)
    try {
      saveModelToFile(modelData)
    } catch (err) {
      console.error('Error exporting model:', err)
      setError('Failed to export model: ' + err.message)
      setIsExporting(false)
    }
  }, [modelData, saveModelToFile])

  // Import a model
  const importModel = useCallback(() => {
    try {
      openModelFromFile()
    } catch (err) {
      console.error('Error importing model:', err)
      setError('Failed to import model: ' + err.message)
    }
  }, [openModelFromFile])

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
          // In a real app, you'd generate actual model data from the geometry
          setModelData({ type: 'cube', size: 10 })
        })
      } else if (code.includes('sphere')) {
        import('jscad-fiber').then(({ Sphere }) => {
          setGeometryComponent(<Sphere radius={10} color="coral" />)
          setModelData({ type: 'sphere', radius: 10 })
        })
      } else if (code.includes('cylinder')) {
        import('jscad-fiber').then(({ Cylinder }) => {
          setGeometryComponent(<Cylinder radius={5} height={10} color="seagreen" />)
          setModelData({ type: 'cylinder', radius: 5, height: 10 })
        })
      } else {
        setError('Unsupported geometry type')
        setModelData(null)
      }
    } catch (err) {
      console.error('Error parsing JSCAD code:', err)
      setError('Failed to parse model code: ' + err.message)
      setModelData(null)
    }
  }, [code])

  return (
    <div style={{ width: '100%', height: '500px', position: 'relative' }}>
      {geometryComponent && (
        <JsCadView>
          {geometryComponent}
          <Controls />
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

      {/* File operation buttons */}
      <div style={{ 
        position: 'absolute', 
        bottom: '10px', 
        right: '10px', 
        display: 'flex',
        gap: '10px'
      }}>
        <button 
          onClick={importModel}
          disabled={isExporting}
          style={{
            padding: '8px 16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isExporting ? 'not-allowed' : 'pointer'
          }}
        >
          Import
        </button>
        <button 
          onClick={exportModel}
          disabled={!modelData || isExporting}
          style={{
            padding: '8px 16px',
            backgroundColor: modelData ? '#2196F3' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: (!modelData || isExporting) ? 'not-allowed' : 'pointer'
          }}
        >
          {isExporting ? 'Exporting...' : 'Export'}
        </button>
      </div>
      
      {/* Electron status indicator */}
      {isElectron && (
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          padding: '4px 8px',
          backgroundColor: 'rgba(0,0,0,0.5)',
          color: 'white',
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          Electron Mode
        </div>
      )}
    </div>
  )
}

export default JSCADViewer 