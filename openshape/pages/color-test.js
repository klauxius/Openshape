import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { modelStore } from '../lib/mcpTools';

// Dynamically import the viewer to avoid SSR issues
const JscadThreeViewer = dynamic(() => import('../components/JscadThreeViewer'), {
  ssr: false,
  loading: () => <div>Loading 3D Viewer...</div>
});

export default function ColorTest() {
  const [defaultColor, setDefaultColor] = useState('#94a6b5');
  const [models, setModels] = useState([]);

  useEffect(() => {
    // Get the current default color
    setDefaultColor(modelStore.getDefaultColor());
    
    // Get all models
    setModels(modelStore.getAllModels());
  }, []);

  const handleSetDefaultColor = async (color) => {
    try {
      // Set the default color
      modelStore.setDefaultColor(color);
      setDefaultColor(color);
      
      // Update models list
      setModels(modelStore.getAllModels());
      
      console.log(`Default color set to ${color}`);
    } catch (error) {
      console.error('Error setting default color:', error);
    }
  };

  const createTestCube = async () => {
    try {
      // Import the parts library
      const partsLibrary = await import('../lib/partsLibrary');
      
      // Create a test cube
      const result = partsLibrary.createCube({
        width: 10,
        height: 10,
        depth: 10,
        name: 'Test Cube'
      });
      
      if (result.success) {
        setModels(modelStore.getAllModels());
        console.log('Test cube created:', result);
      } else {
        console.error('Failed to create test cube:', result.error);
      }
    } catch (error) {
      console.error('Error creating test cube:', error);
    }
  };

  const createTestSphere = async () => {
    try {
      // Import the parts library
      const partsLibrary = await import('../lib/partsLibrary');
      
      // Create a test sphere
      const result = partsLibrary.createSphere({
        radius: 5,
        name: 'Test Sphere'
      });
      
      if (result.success) {
        setModels(modelStore.getAllModels());
        console.log('Test sphere created:', result);
      } else {
        console.error('Failed to create test sphere:', result.error);
      }
    } catch (error) {
      console.error('Error creating test sphere:', error);
    }
  };

  const clearModels = () => {
    modelStore.clear();
    setModels([]);
  };

  return (
    <div className="flex h-screen">
      {/* Left Panel - Controls */}
      <div className="w-80 bg-gray-100 p-6 overflow-y-auto">
        <h1 className="text-2xl font-bold mb-6">Model Color Test</h1>
        
        {/* Default Color Section */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Default Color</h2>
          <div className="flex items-center gap-3 mb-3">
            <div 
              className="w-8 h-8 rounded border"
              style={{ backgroundColor: defaultColor }}
            ></div>
            <span className="font-mono">{defaultColor}</span>
          </div>
          
          <div className="space-y-2">
            <button
              onClick={() => handleSetDefaultColor('#94a6b5')}
              className="w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Set to Default (#94a6b5)
            </button>
            <button
              onClick={() => handleSetDefaultColor('#ff6b6b')}
              className="w-full px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Set to Red (#ff6b6b)
            </button>
            <button
              onClick={() => handleSetDefaultColor('#4ecdc4')}
              className="w-full px-3 py-2 bg-teal-500 text-white rounded hover:bg-teal-600"
            >
              Set to Teal (#4ecdc4)
            </button>
            <button
              onClick={() => handleSetDefaultColor('#45b7d1')}
              className="w-full px-3 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600"
            >
              Set to Cyan (#45b7d1)
            </button>
          </div>
        </div>

        {/* Model Creation Section */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Create Test Models</h2>
          <div className="space-y-2">
            <button
              onClick={createTestCube}
              className="w-full px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Create Test Cube
            </button>
            <button
              onClick={createTestSphere}
              className="w-full px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Create Test Sphere
            </button>
            <button
              onClick={clearModels}
              className="w-full px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Clear All Models
            </button>
          </div>
        </div>

        {/* Models List */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Models ({models.length})</h2>
          <div className="space-y-2">
            {models.map((model) => (
              <div key={model.id} className="flex items-center gap-3 p-2 bg-white rounded border">
                <div 
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: model.color || defaultColor }}
                ></div>
                <span className="text-sm">{model.name}</span>
                <span className="text-xs text-gray-500">({model.id})</span>
              </div>
            ))}
            {models.length === 0 && (
              <p className="text-gray-500 text-sm">No models created yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel - 3D Viewer */}
      <div className="flex-1">
        <JscadThreeViewer />
      </div>
    </div>
  );
} 