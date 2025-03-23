import React, { useState, useEffect } from 'react';
import { 
  MousePointer, 
  Line, 
  Circle, 
  Square, 
  Hexagon, 
  Type, 
  ArrowUp, 
  X 
} from 'lucide-react';
import sketchManager from '../lib/sketchManager';

/**
 * Toolbar component that appears when in sketch mode
 * @param {Object} props - Component props
 * @param {Function} props.onExit - Function to call when exiting sketch mode
 * @param {Function} props.onExtrude - Function to call when extruding the sketch
 */
const SketchToolbar = ({ onExit, onExtrude }) => {
  const [activeTool, setActiveTool] = useState('select');
  const [activeSketch, setActiveSketch] = useState(null);
  
  useEffect(() => {
    // Get active sketch on mount
    const sketch = sketchManager.getActiveSketch();
    setActiveSketch(sketch);
    
    // Listen for sketch mode changes
    const handleSketchModeChanged = (event) => {
      const { active, sketch } = event.detail;
      setActiveSketch(active ? sketch : null);
    };
    
    window.addEventListener('openshape:sketchModeChanged', handleSketchModeChanged);
    
    return () => {
      window.removeEventListener('openshape:sketchModeChanged', handleSketchModeChanged);
    };
  }, []);
  
  if (!activeSketch) return null;
  
  const handleToolSelect = (tool) => {
    setActiveTool(tool);
    // TODO: Implement tool-specific interactions based on selected tool
  };
  
  const handleExtrudeClick = () => {
    // Show a dialog to get the extrusion height
    const height = window.prompt('Enter extrusion height:', '10');
    
    if (height !== null) {
      try {
        const parsedHeight = parseFloat(height);
        if (isNaN(parsedHeight) || parsedHeight <= 0) {
          throw new Error('Invalid height');
        }
        
        const modelId = sketchManager.extrudeActiveSketch(parsedHeight);
        
        if (onExtrude) {
          onExtrude(modelId);
        }
      } catch (error) {
        alert(`Failed to extrude sketch: ${error.message}`);
      }
    }
  };
  
  const handleExitClick = () => {
    sketchManager.exitSketchMode();
    
    if (onExit) {
      onExit();
    }
  };
  
  return (
    <div className="fixed top-0 left-1/2 transform -translate-x-1/2 z-40 bg-white rounded-b-lg shadow-lg border border-gray-300">
      <div className="p-2 flex items-center">
        <div className="mr-4 font-medium text-blue-600">
          Sketch Mode: {activeSketch.name}
        </div>
        
        <div className="border-r border-gray-300 h-8 mx-2"></div>
        
        <div className="flex space-x-1">
          <button
            className={`p-2 rounded ${activeTool === 'select' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            onClick={() => handleToolSelect('select')}
            title="Select"
          >
            <MousePointer size={20} />
          </button>
          
          <button
            className={`p-2 rounded ${activeTool === 'line' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            onClick={() => handleToolSelect('line')}
            title="Line"
          >
            <Line size={20} />
          </button>
          
          <button
            className={`p-2 rounded ${activeTool === 'rectangle' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            onClick={() => handleToolSelect('rectangle')}
            title="Rectangle"
          >
            <Square size={20} />
          </button>
          
          <button
            className={`p-2 rounded ${activeTool === 'circle' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            onClick={() => handleToolSelect('circle')}
            title="Circle"
          >
            <Circle size={20} />
          </button>
          
          <button
            className={`p-2 rounded ${activeTool === 'polygon' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            onClick={() => handleToolSelect('polygon')}
            title="Polygon"
          >
            <Hexagon size={20} />
          </button>
          
          <button
            className={`p-2 rounded ${activeTool === 'text' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            onClick={() => handleToolSelect('text')}
            title="Text"
          >
            <Type size={20} />
          </button>
        </div>
        
        <div className="border-r border-gray-300 h-8 mx-2"></div>
        
        <button
          className="px-3 py-1 bg-green-600 text-white rounded flex items-center hover:bg-green-700"
          onClick={handleExtrudeClick}
          title="Extrude Sketch"
        >
          <ArrowUp size={16} className="mr-1" />
          <span>Extrude</span>
        </button>
        
        <button
          className="p-2 text-gray-500 hover:text-red-600 ml-3"
          onClick={handleExitClick}
          title="Exit Sketch Mode"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
};

export default SketchToolbar; 