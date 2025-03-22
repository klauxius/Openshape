import { useState, useEffect } from 'react'
import styles from '../styles/ParameterControls.module.css'

const ParameterControls = ({ featureType, onChange }) => {
  const [params, setParams] = useState({})
  
  // Set default parameters based on feature type
  useEffect(() => {
    switch (featureType) {
      case 'cube':
        setParams({ size: 10 })
        break
      case 'sphere':
        setParams({ radius: 10 })
        break
      case 'cylinder':
        setParams({ radius: 5, height: 10 })
        break
      case 'extrude':
        setParams({ height: 10 })
        break
      default:
        setParams({})
    }
  }, [featureType])
  
  const handleParamChange = (param, value) => {
    const newParams = { ...params, [param]: parseFloat(value) }
    setParams(newParams)
    onChange(newParams)
  }
  
  if (!featureType || !['cube', 'sphere', 'cylinder', 'extrude'].includes(featureType)) {
    return null
  }
  
  return (
    <div className={styles.parameterControls}>
      <h3>Parameters</h3>
      
      {featureType === 'cube' && (
        <div className={styles.paramGroup}>
          <label>Size:</label>
          <input 
            type="number" 
            value={params.size || 10} 
            onChange={(e) => handleParamChange('size', e.target.value)}
            min="0.1"
            step="0.1"
          />
        </div>
      )}
      
      {featureType === 'sphere' && (
        <div className={styles.paramGroup}>
          <label>Radius:</label>
          <input 
            type="number" 
            value={params.radius || 10} 
            onChange={(e) => handleParamChange('radius', e.target.value)}
            min="0.1"
            step="0.1"
          />
        </div>
      )}
      
      {featureType === 'cylinder' && (
        <>
          <div className={styles.paramGroup}>
            <label>Radius:</label>
            <input 
              type="number" 
              value={params.radius || 5} 
              onChange={(e) => handleParamChange('radius', e.target.value)}
              min="0.1"
              step="0.1"
            />
          </div>
          <div className={styles.paramGroup}>
            <label>Height:</label>
            <input 
              type="number" 
              value={params.height || 10} 
              onChange={(e) => handleParamChange('height', e.target.value)}
              min="0.1"
              step="0.1"
            />
          </div>
        </>
      )}
      
      {featureType === 'extrude' && (
        <div className={styles.paramGroup}>
          <label>Height:</label>
          <input 
            type="number" 
            value={params.height || 10} 
            onChange={(e) => handleParamChange('height', e.target.value)}
            min="0.1"
            step="0.1"
          />
        </div>
      )}
    </div>
  )
}

export default ParameterControls 