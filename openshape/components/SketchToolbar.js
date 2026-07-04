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
    
    return () => {
      window.removeEventListener('openshape:sketchModeChanged', handleSketchModeChanged);
      // Reset the drawing tool in the viewer when leaving sketch mode
      window.dispatchEvent(new CustomEvent('openshape:sketchToolChanged', { detail: { tool: 'select' } }));
      if (document.body) document.body.style.cursor = 'auto';
    };
  }, []);

  // Broadcast the active drawing tool so the 3D viewer can turn canvas clicks
  // into sketch geometry on the active plane.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('openshape:sketchToolChanged', { detail: { tool: activeTool } }));
  }, [activeTool]);
  
  if (!activeSketch) return null;
  
  const handleToolSelect = (tool) => {
    setActiveTool(tool);
    
    // Update cursor style based on selected tool
    if (document.body) {
      switch (tool) {
        case 'point':
        case 'line':
        case 'rectangle':
        case 'circle':
          document.body.style.cursor = 'crosshair';
          break;
        default:
          document.body.style.cursor = 'default';
      }
    }
  };

  // Short instruction shown for the active tool
  const toolHints = {
    select: 'Pick a tool, draw a closed profile, then Extrude',
    point: 'Click on the plane to place a point',
    line: 'Click start point, then end point',
    rectangle: 'Click two opposite corners',
    circle: 'Click the center, then a point on the radius',
    polygon: 'Polygon tool not yet available',
    text: 'Text tool not yet available'
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
          <span className="ml-2 text-xs text-gray-500 font-normal">{toolHints[activeTool] || '(Camera rotation locked)'}</span>
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