import { useState, useEffect } from 'react'
import Head from 'next/head'
import styles from '../styles/Home.module.css'
import dynamic from 'next/dynamic'
import FeatureToolbar from '../components/FeatureToolbar'
import ParameterControls from '../components/ParameterControls'
import { generatePrimitiveCode } from '../lib/jscadProcessor'
import ExportButton from '../components/ExportButton'

// Import JSCAD components dynamically to avoid SSR issues
const JSCADViewer = dynamic(() => import('../components/JSCADViewer'), { 
  ssr: false 
})

export default function Home() {
  const [code, setCode] = useState('// JSCAD model code here\nfunction main() {\n  return cube({size: 10});\n}')
  const [model, setModel] = useState(null)
  const [activeFeature, setActiveFeature] = useState('cube')

  const handleAddFeature = (featureId) => {
    setActiveFeature(featureId)
    const newCode = generatePrimitiveCode(featureId)
    setCode(newCode)
    setModel(newCode)
  }
  
  const handleParameterChange = (params) => {
    const newCode = generatePrimitiveCode(activeFeature, params)
    setCode(newCode)
    setModel(newCode)
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Browser CAD - OpenJSCAD Alternative</title>
        <meta name="description" content="Free browser-based CAD application" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>Browser CAD</h1>
        
        <FeatureToolbar onAddFeature={handleAddFeature} />
        
        <div className={styles.grid}>
          <div className={styles.leftPanel}>
            <div className={styles.codeEditor}>
              <textarea 
                value={code}
                onChange={(e) => setCode(e.target.value)}
                rows={15}
                cols={50}
              />
              <button onClick={() => setModel(code)}>
                Generate Model
              </button>
            </div>
            
            <ParameterControls 
              featureType={activeFeature} 
              onChange={handleParameterChange} 
            />
          </div>
          
          <div className={styles.viewer}>
            <JSCADViewer code={model} />
            <ExportButton code={model} />
          </div>
        </div>
      </main>
    </div>
  )
} 