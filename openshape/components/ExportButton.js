import { useState } from 'react'
import { stlSerializer } from '@jscad/stl-serializer'
import { evaluateJSCAD } from '../lib/jscadProcessor'
import styles from '../styles/ExportButton.module.css'

const ExportButton = ({ code }) => {
  const [exporting, setExporting] = useState(false)
  
  const exportToSTL = async () => {
    try {
      setExporting(true)
      
      // Generate the geometry from the JSCAD code
      const geometry = evaluateJSCAD(code)
      
      if (!geometry) {
        throw new Error('Failed to generate model')
      }
      
      // Serialize to STL format
      const rawData = await stlSerializer.serialize({ binary: true }, [geometry])
      
      // Create a blob and download link
      const blob = new Blob([rawData], { type: 'application/octet-stream' })
      const url = URL.createObjectURL(blob)
      
      // Trigger download
      const a = document.createElement('a')
      a.href = url
      a.download = 'model.stl'
      document.body.appendChild(a)
      a.click()
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        setExporting(false)
      }, 100)
    } catch (error) {
      console.error('Error exporting STL:', error)
      alert('Failed to export model: ' + error.message)
      setExporting(false)
    }
  }
  
  return (
    <button 
      className={styles.exportButton} 
      onClick={exportToSTL}
      disabled={exporting}
    >
      {exporting ? 'Exporting...' : 'Export STL'}
    </button>
  )
}

export default ExportButton 