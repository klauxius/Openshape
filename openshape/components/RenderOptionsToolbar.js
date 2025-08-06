import React, { useState, useEffect } from 'react';
import { Grid, Eye, EyeOff, Layers } from 'lucide-react';

/**
 * RenderOptionsToolbar - A floating toolbar for adjusting model rendering options
 * Positioned under the ViewCube to provide easy access to rendering controls
 */
const RenderOptionsToolbar = ({ 
  onRenderOptionsChange,
  initialOptions = {
    wireframe: false,
    transparency: 1.0,
    showEdges: false
  }
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [renderOptions, setRenderOptions] = useState(initialOptions);

  // Notify parent component when options change
  useEffect(() => {
    if (onRenderOptionsChange) {
      onRenderOptionsChange(renderOptions);
    }
  }, [renderOptions, onRenderOptionsChange]);

  const handleOptionChange = (option, value) => {
    setRenderOptions(prev => ({
      ...prev,
      [option]: value
    }));
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div 
      className="fixed z-30 transition-all duration-300 ease-in-out"
                   style={{
               right: '20px',
               top: '260px', // Position further down under the ViewCube (160px + 100px as requested)
             }}
    >
      {/* Main toggle button */}
      <div className="flex flex-col items-end space-y-2">
                       <button
                 onClick={toggleExpanded}
                 className="flex items-center justify-center w-10 h-10 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-lg shadow-lg border border-gray-200 transition-all duration-200 hover:shadow-xl"
                 title="Render Options"
               >
                 <Eye size={18} className="text-gray-700" />
               </button>

        {/* Expanded toolbar */}
        {isExpanded && (
          <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-3 min-w-[200px]">
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-700">Render Options</h3>
                <button
                  onClick={toggleExpanded}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ×
                </button>
              </div>

              {/* Wireframe Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Grid size={16} className="text-gray-600" />
                  <span className="text-sm text-gray-700">Wireframe</span>
                </div>
                <button
                  onClick={() => handleOptionChange('wireframe', !renderOptions.wireframe)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    renderOptions.wireframe ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      renderOptions.wireframe ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Transparency Slider */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Layers size={16} className="text-gray-600" />
                  <span className="text-sm text-gray-700">Transparency</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={renderOptions.transparency}
                    onChange={(e) => handleOptionChange('transparency', parseFloat(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <span className="text-xs text-gray-500 w-8 text-right">
                    {Math.round((1 - renderOptions.transparency) * 100)}%
                  </span>
                </div>
              </div>

              {/* Edges Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {renderOptions.showEdges ? (
                    <Eye size={16} className="text-gray-600" />
                  ) : (
                    <EyeOff size={16} className="text-gray-600" />
                  )}
                  <span className="text-sm text-gray-700">Show Edges</span>
                </div>
                <button
                  onClick={() => handleOptionChange('showEdges', !renderOptions.showEdges)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    renderOptions.showEdges ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      renderOptions.showEdges ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Quick Presets */}
              <div className="pt-2 border-t border-gray-200">
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => setRenderOptions({
                      wireframe: false,
                      transparency: 1.0,
                      showEdges: false
                    })}
                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  >
                    Solid
                  </button>
                  <button
                    onClick={() => setRenderOptions({
                      wireframe: true,
                      transparency: 1.0,
                      showEdges: false
                    })}
                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  >
                    Wireframe
                  </button>
                  <button
                    onClick={() => setRenderOptions({
                      wireframe: false,
                      transparency: 0.7,
                      showEdges: true
                    })}
                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  >
                    Transparent
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Custom styles for the range slider */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
};

export default RenderOptionsToolbar; 