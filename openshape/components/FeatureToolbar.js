import { useState } from 'react'
import styles from '../styles/FeatureToolbar.module.css'

const FeatureToolbar = ({ onAddFeature }) => {
  const features = [
    { id: 'cube', name: 'Cube' },
    { id: 'cylinder', name: 'Cylinder' },
    { id: 'sphere', name: 'Sphere' },
    { id: 'extrude', name: 'Extrude' },
    { id: 'union', name: 'Union' },
    { id: 'difference', name: 'Difference' },
    { id: 'intersection', name: 'Intersection' }
  ]
  
  return (
    <div className={styles.toolbar}>
      {features.map(feature => (
        <button 
          key={feature.id}
          onClick={() => onAddFeature(feature.id)}
          className={styles.button}
        >
          {feature.name}
        </button>
      ))}
    </div>
  )
}

export default FeatureToolbar 