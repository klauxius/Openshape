"use client"

import { useState } from 'react'
import Head from 'next/head'
import dynamic from 'next/dynamic'

// Import the Render Options Toolbar component
const RenderOptionsToolbar = dynamic(() => import('../components/RenderOptionsToolbar'), {
  ssr: false,
})

export default function RenderOptionsTest() {
  const [renderOptions, setRenderOptions] = useState({
    wireframe: false,
    transparency: 1.0,
    showEdges: false
  });

  return (
    <>
      <Head>
        <title>Render Options Test - OpenShape</title>
      </Head>
      
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Render Options Toolbar Test</h1>
          
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Current Render Options</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded">
                <div className="font-medium text-gray-700">Wireframe</div>
                <div className="text-2xl font-bold text-blue-600">
                  {renderOptions.wireframe ? 'ON' : 'OFF'}
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded">
                <div className="font-medium text-gray-700">Transparency</div>
                <div className="text-2xl font-bold text-green-600">
                  {Math.round((1 - renderOptions.transparency) * 100)}%
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded">
                <div className="font-medium text-gray-700">Show Edges</div>
                <div className="text-2xl font-bold text-purple-600">
                  {renderOptions.showEdges ? 'ON' : 'OFF'}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Instructions</h2>
            <ul className="space-y-2 text-gray-700">
              <li>• Look for the settings icon (⚙️) in the top-right corner of the screen</li>
              <li>• Click it to expand the render options toolbar</li>
              <li>• Try toggling wireframe mode, adjusting transparency, and showing edges</li>
              <li>• Watch the values update in the "Current Render Options" section above</li>
              <li>• Try the quick preset buttons (Solid, Wireframe, Transparent)</li>
            </ul>
          </div>
        </div>

        {/* Render Options Toolbar - positioned in top-right */}
        <RenderOptionsToolbar 
          onRenderOptionsChange={setRenderOptions}
          initialOptions={renderOptions}
        />
      </div>
    </>
  )
} 