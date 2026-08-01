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
  const [selection, setSelection] = useState([]);
  const [distanceValue, setDistanceValue] = useState(10);
  
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

  // Track which sketch elements are selected (via Ctrl+click in the viewer).
  useEffect(() => {
    const handler = (event) => setSelection((event.detail && event.detail.selection) || []);
    window.addEventListener('openshape:sketchSelectionChanged', handler);
    return () => window.removeEventListener('openshape:sketchSelectionChanged', handler);
  }, []);
  
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

  // Selected points / lines drive which relations are available.
  const selPoints = selection.filter(s => s.type === 'point');
  const selLines = selection.filter(s => s.type === 'line');

  const relationEnabled = {
    coincident: selPoints.length >= 2,
    horizontal: selLines.length >= 1 || selPoints.length >= 2,
    vertical: selLines.length >= 1 || selPoints.length >= 2,
    parallel: selLines.length >= 2,
    perpendicular: selLines.length >= 2,
    equal: selLines.length >= 2,
    distance: selLines.length >= 1,
    fixed: selPoints.length >= 1
  };

  const applyRelation = (type) => {
    const pts = selPoints.map(s => s.entityId);
    const lines = selLines.map(s => s.entityId);
    let entities = [];
    let value;
    switch (type) {
      case 'coincident':
        entities = pts.slice(0, 2);
        break;
      case 'horizontal':
      case 'vertical':
        entities = lines.length >= 1 ? [lines[0]] : pts.slice(0, 2);
        break;
      case 'parallel':
      case 'perpendicular':
      case 'equal':
        entities = lines.slice(0, 2);
        break;
      case 'distance':
        entities = [lines[0]];
        value = Number(distanceValue);
        break;
      case 'fixed':
        entities = [pts[0]];
        break;
      default:
        break;
    }
    try {
      sketchManager.addConstraint(type, entities, value);
    } catch (err) {
      console.error('Failed to add constraint:', err);
      alert(`Could not add ${type} relation: ${err.message}`);
    }
    // Clear the selection in the viewer after applying.
    window.dispatchEvent(new CustomEvent('openshape:clearSketchSelection'));
  };

  const relationButton = (type, label) => (
    <button
      key={type}
      disabled={!relationEnabled[type]}
      onClick={() => applyRelation(type)}
      title={label}
      className={`px-2 py-0.5 text-xs rounded border ${
        relationEnabled[type]
          ? 'border-blue-300 text-blue-700 hover:bg-blue-50'
          : 'border-gray-200 text-gray-300 cursor-not-allowed'
      }`}
    >
      {label}
    </button>
  );

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

      {/* Relation builder: Ctrl+click elements in the viewport, then apply a relation */}
      <div className="px-2 pb-2 pt-1 flex items-center flex-wrap gap-1 border-t border-gray-200">
        <span className="text-xs font-medium text-gray-600 mr-1">Relations</span>
        <span className="text-[10px] text-gray-400 mr-2">(Ctrl+click elements)</span>
        <span className="text-xs text-blue-600 mr-2">{selLines.length}L / {selPoints.length}P selected</span>
        {relationButton('coincident', 'Coincident')}
        {relationButton('horizontal', 'Horizontal')}
        {relationButton('vertical', 'Vertical')}
        {relationButton('parallel', 'Parallel')}
        {relationButton('perpendicular', 'Perpendicular')}
        {relationButton('equal', 'Equal')}
        {relationButton('fixed', 'Fix')}
        <span className="mx-1 h-5 border-l border-gray-300" />
        {relationButton('distance', 'Distance')}
        <input
          type="number"
          value={distanceValue}
          onChange={(e) => setDistanceValue(e.target.value)}
          className="w-16 px-1 py-0.5 border border-gray-300 rounded text-xs"
          title="Distance value"
        />
      </div>
    </div>
  );
};

export default SketchToolbar; 