import React, { useState, useEffect } from 'react';
import { 
  MousePointer, 
  Minus as LineIcon, 
  Circle, 
  Square, 
  Hexagon, 
  Type, 
  ArrowUp, 
  X,
  CircleDot,
  RotateCcw
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
    
    // Set up tool-specific event handling
    const handleCanvasClick = (event) => {
      // Only handle clicks if we're in a sketch tool mode that requires point selection
      if (!['point', 'line', 'circle'].includes(activeTool)) return;
      
      // Convert screen coordinates to model coordinates
      const viewer = document.getElementById('jscad-three-viewer');
      if (!viewer || !viewer.__jscadViewer) return;
      
      const viewerRect = viewer.getBoundingClientRect();
      const x = ((event.clientX - viewerRect.left) / viewerRect.width) * 2 - 1;
      const y = -((event.clientY - viewerRect.top) / viewerRect.height) * 2 + 1;
      
      // Scale to model space - using a factor of 10 to make points more visible
      const modelX = x * 10;
      const modelY = y * 10;
      
      try {
        if (activeTool === 'point') {
          // Add a point at the clicked position
          sketchManager.addEntity('point', {
            position: [modelX, modelY, 0],
            size: 0.2
          });
        } else if (activeTool === 'line') {
          // Handle line tool (to be implemented)
          // This would need to track first point, then second point
        } else if (activeTool === 'circle') {
          // For circle tool implementation
          // This simple version creates a circle at the clicked position with a fixed radius
          // A more advanced version would let the user click for center, then drag for radius
          sketchManager.addEntity('circle', {
            center: [modelX, modelY],
            radius: 3 // Default radius of 3 units
          });
          
          console.log(`Created circle at [${modelX}, ${modelY}] with radius 3`);
        }
      } catch (error) {
        console.error(`Failed to add ${activeTool}:`, error);
      }
    };
    
    document.addEventListener('click', handleCanvasClick);
    
    return () => {
      window.removeEventListener('openshape:sketchModeChanged', handleSketchModeChanged);
      document.removeEventListener('click', handleCanvasClick);
    };
  }, [activeTool]);
  
  if (!activeSketch) return null;
  
  const handleToolSelect = (tool) => {
    setActiveTool(tool);
    
    // Reset any active operations
    const viewer = document.getElementById('jscad-three-viewer');
    if (viewer && viewer.__jscadViewer) {
      // Clear any temporary entities or guides
    }
    
    // Update cursor style based on selected tool
    if (document.body) {
      // Reset cursor style
      document.body.style.cursor = 'auto';
      
      // Set appropriate cursor for each tool
      switch (tool) {
        case 'select':
          document.body.style.cursor = 'default';
          break;
        case 'point':
          document.body.style.cursor = 'crosshair';
          break;
        case 'line':
          document.body.style.cursor = 'crosshair';
          break;
        case 'circle':
          document.body.style.cursor = 'crosshair';
          break;
        default:
          document.body.style.cursor = 'default';
      }
    }
    
    console.log(`Selected tool: ${tool}`);
  };
  
  const handleExtrudeClick = () => {
    if (!activeSketch) return;
    
    // Show extrude dialog or directly extrude
    try {
      // For now, extrude by a fixed amount
      const extrudedModelId = sketchManager.extrudeActiveSketch(5); // 5mm extrusion
      if (extrudedModelId && onExtrude) {
        onExtrude(extrudedModelId);
      }
      
      // Exit sketch mode after extrusion
      handleExitClick();
    } catch (error) {
      console.error('Failed to extrude sketch:', error);
    }
  };
  
  const handleExitClick = () => {
    if (sketchManager.isInSketchMode) {
      sketchManager.exitSketchMode();
    }
    
    if (onExit) {
      onExit();
    }
  };
  
  // Add new function to reset camera view
  const handleResetView = () => {
    // Dispatch event to reset camera view
    const event = new CustomEvent('openshape:resetSketchView', {
      detail: { 
        sketchId: activeSketch?.id,
        plane: activeSketch?.plane || 'xy'
      }
    });
    window.dispatchEvent(event);
  };
  
  return (
    <div className="fixed top-0 left-1/2 transform -translate-x-1/2 z-40 bg-white rounded-b-lg shadow-lg border border-gray-300">
      <div className="p-2 flex items-center">
        <div className="mr-4 font-medium text-blue-600">
          Sketch Mode: {activeSketch.name}
          <span className="ml-2 text-xs text-gray-500">(Camera rotation locked)</span>
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
            className={`p-2 rounded ${activeTool === 'point' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            onClick={() => handleToolSelect('point')}
            title="Point"
          >
            <CircleDot size={20} />
          </button>
          
          <button
            className={`p-2 rounded ${activeTool === 'line' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            onClick={() => handleToolSelect('line')}
            title="Line"
          >
            <LineIcon size={20} />
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
          className="p-2 rounded hover:bg-gray-100"
          onClick={handleResetView}
          title="Reset View"
        >
          <RotateCcw size={20} className="text-blue-600" />
        </button>
        
        <div className="border-r border-gray-300 h-8 mx-2"></div>
        
        <button
          className="p-2 rounded hover:bg-gray-100"
          onClick={handleExtrudeClick}
          title="Extrude Sketch"
        >
          <ArrowUp size={20} className="text-green-600" />
        </button>
        
        <div className="border-r border-gray-300 h-8 mx-2"></div>
        
        <button
          className="p-2 rounded hover:bg-gray-100"
          onClick={handleExitClick}
          title="Exit Sketch Mode"
        >
          <X size={20} className="text-red-600" />
        </button>
      </div>
    </div>
  );
};

export default SketchToolbar; 