import React, { useState, useEffect } from 'react';
import { modelStore, notifyModelChanged } from '../lib/mcpTools';
import sketchManager from '../lib/sketchManager';
import { 
  ChevronDown, 
  ChevronRight, 
  Box as BoxIcon, 
  Square, 
  Circle, 
  CornerUpRight, 
  Layers, 
  Edit,
  Search,
  Pencil,
  ArrowUp
} from 'lucide-react';

/**
 * Sidebar component for the OpenShape CAD application with feature tree
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the sidebar is open
 * @param {Function} props.onClose - Function to call when the sidebar is closed
 */
const Sidebar = ({ isOpen, onClose }) => {
  const [models, setModels] = useState([]);
  const [activeModelId, setActiveModelId] = useState(null);
  const [sketches, setSketches] = useState([]);
  const [expandedSections, setExpandedSections] = useState({
    models: true,
    referenceGeometry: true,
    features: true,
    sketches: true,
    measurements: true,
    partsLibrary: true
  });
  const [expandedFeatures, setExpandedFeatures] = useState({});
  const [filterText, setFilterText] = useState('');
  const [selectedItemId, setSelectedItemId] = useState(null);

  // Load model data
  useEffect(() => {
    // Initial load of models
    const initialModels = modelStore.getAllModels();
    setModels(initialModels);
    
    const activeModel = modelStore.getActiveModel();
    if (activeModel) {
      setActiveModelId(activeModel.id);
    }
    
    // Get initial sketches
    const initialSketches = sketchManager.sketches ? Object.values(sketchManager.sketches) : [];
    setSketches(initialSketches);
    
    // Listen for model changes
    const handleModelChanged = (event) => {
      const { model } = event.detail;
      
      // If a model was deleted
      if (model && model.deleted) {
        setModels(prev => prev.filter(m => m.id !== model.id));
        return;
      }
      
      // Update models list
      setModels(modelStore.getAllModels());
      
      // Update active model
      const newActiveModel = modelStore.getActiveModel();
      if (newActiveModel) {
        setActiveModelId(newActiveModel.id);
      }
    };
    
    // Listen for sketch creation
    const handleSketchCreated = (event) => {
      const { sketchId } = event.detail;
      if (sketchManager.sketches && sketchManager.sketches[sketchId]) {
        setSketches(Object.values(sketchManager.sketches));
      }
    };
    
    // Listen for sketch mode changes
    const handleSketchModeChanged = (event) => {
      const { active } = event.detail;
      // Refresh sketches list
      setSketches(Object.values(sketchManager.sketches || {}));
    };
    
    window.addEventListener('openshape:modelChanged', handleModelChanged);
    window.addEventListener('openshape:sketchCreated', handleSketchCreated);
    window.addEventListener('openshape:sketchModeChanged', handleSketchModeChanged);
    
    return () => {
      window.removeEventListener('openshape:modelChanged', handleModelChanged);
      window.removeEventListener('openshape:sketchCreated', handleSketchCreated);
      window.removeEventListener('openshape:sketchModeChanged', handleSketchModeChanged);
    };
  }, []);
  
  // Toggle section expand/collapse
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  // Toggle individual feature expansion
  const toggleFeatureExpansion = (featureId) => {
    setExpandedFeatures(prev => ({
      ...prev,
      [featureId]: !prev[featureId]
    }));
  };
  
  // Handle item selection
  const handleItemClick = (id) => {
    setSelectedItemId(id);
    
    // If it's a model, set it as active
    if (id.startsWith('model_')) {
      modelStore.setActiveModel(id);
      // Notify that model was selected
      notifyModelChanged(modelStore.getModel(id));
    }
    
    // If it's a sketch, set it as active in sketch manager
    if (id.startsWith('sketch_')) {
      const sketch = sketchManager.sketches[id];
      if (sketch) {
        sketchManager.activeSketch = sketch;
        sketchManager.isInSketchMode = true;
        
        // Notify that sketch mode changed
        const event = new CustomEvent('openshape:sketchModeChanged', {
          detail: { active: true, sketch }
        });
        window.dispatchEvent(event);
      }
    }
    
    // Handle part library selection
    if (id === 'part_cube') {
      // Logic for selecting cube from library
    } else if (id === 'part_sphere') {
      // Logic for selecting sphere from library
    } else if (id === 'part_cylinder') {
      // Logic for selecting cylinder from library
    } else if (id === 'part_torus') {
      // Logic for selecting torus from library
    }
  };
  
  // Get appropriate icon for feature type
  const getFeatureIcon = (model) => {
    const name = model.name.toLowerCase();
    
    // Based on naming conventions and types
    if (name.includes('cube')) {
      return <BoxIcon size={16} className="text-blue-500" />;
    } else if (name.includes('cylinder')) {
      return <CornerUpRight size={16} className="text-blue-500" />;
    } else if (name.includes('sphere')) {
      return <Circle size={16} className="text-blue-500" />;
    } else if (name.includes('torus')) {
      return <Circle size={16} className="text-blue-500" />;
    } else if (name.includes('extrude') || name.includes('extrusion')) {
      return <ArrowUp size={16} className="text-green-600" />;
    } else if (name.includes('union')) {
      return <Layers size={16} className="text-purple-500" />;
    } else if (name.includes('subtract')) {
      return <Edit size={16} className="text-red-500" />;
    } else if (name.includes('sketch') && !name.includes('plane')) {
      return <Pencil size={16} className="text-blue-600" />;
    } else if (name.includes('plane')) {
      return <Square size={16} className="text-blue-400" />;
    } else if (name.includes('fillet')) {
      return <BoxIcon size={16} className="text-orange-500" />;
    } else {
      return <Layers size={16} className="text-gray-500" />;
    }
  };
  
  // Filter models based on search text
  const filteredModels = models.filter(model => 
    filterText === '' || model.name.toLowerCase().includes(filterText.toLowerCase())
  );
  
  // Get all sketches, make sure we're working with an array
  const allSketches = Array.isArray(sketches) ? sketches : [];
  
  // Filter features (separate from regular models)
  const features = filteredModels.filter(model => {
    const name = model.name.toLowerCase();
    return (
      name.includes('extrude') || 
      name.includes('fillet') ||
      name.includes('shell') ||
      name.includes('hole') ||
      name.includes('boolean') ||
      name.includes('union') ||
      name.includes('subtract') ||
      (name.includes('sketch') && !name.includes('plane'))
    );
  });
  
  // Group features by sketch
  const getSketchFeatures = (sketchId) => {
    return features.filter(feature => {
      const name = feature.name.toLowerCase();
      return name.includes(sketchId) || 
        (name.includes('extrude') && name.includes(sketchId.replace('sketch_', '')));
    });
  };
  
  // Filter regular parts (not features)
  const parts = filteredModels.filter(model => {
    const name = model.name.toLowerCase();
    return (
      !name.includes('extrude') && 
      !name.includes('fillet') &&
      !name.includes('shell') &&
      !name.includes('hole') &&
      !name.includes('boolean') &&
      !name.includes('union') &&
      !name.includes('subtract') &&
      !name.includes('sketch') &&
      !name.includes('plane')
    );
  });
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-blue-600">Model Browser</h2>
          <button 
            className="text-gray-500 hover:text-gray-800"
            onClick={onClose}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Search filter */}
        <div className="px-4 py-2 border-b border-gray-200">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search features..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>
        </div>

        {/* Feature tree content */}
        <div className="flex-1 overflow-y-auto">
          {/* Features Section */}
          <div className="border-b border-gray-200">
            <div 
              className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-100"
              onClick={() => toggleSection('features')}
            >
              <div className="flex items-center">
                {expandedSections.features ? 
                  <ChevronDown size={16} className="text-gray-500 mr-2" /> : 
                  <ChevronRight size={16} className="text-gray-500 mr-2" />
                }
                <span className="font-medium">Features</span>
              </div>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {features.length}
              </span>
            </div>
            
            {expandedSections.features && (
              <div className="pl-8 pr-4 pb-2 space-y-1">
                {/* Force display "No features yet" message if there are no real features from the model store */}
                {filteredModels.length === 0 || features.length === 0 ? (
                  <div className="text-sm text-gray-500 italic py-1">No features yet</div>
                ) : (
                  features.map(feature => (
                    <div 
                      key={feature.id}
                      className={`flex items-center py-1 px-2 rounded text-sm cursor-pointer ${
                        selectedItemId === feature.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                      }`}
                      onClick={() => handleItemClick(feature.id)}
                    >
                      <div className="mr-2">
                        {getFeatureIcon(feature)}
                      </div>
                      <span>
                        {feature.name}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          
          {/* Parts Section */}
          <div className="border-b border-gray-200">
            <div 
              className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-100"
              onClick={() => toggleSection('models')}
            >
              <div className="flex items-center">
                {expandedSections.models ? 
                  <ChevronDown size={16} className="text-gray-500 mr-2" /> : 
                  <ChevronRight size={16} className="text-gray-500 mr-2" />
                }
                <span className="font-medium">Parts</span>
              </div>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {parts.length}
              </span>
            </div>
            
            {expandedSections.models && (
              <div className="pl-8 pr-4 pb-2 space-y-1">
                {parts.length === 0 ? (
                  <div className="text-sm text-gray-500 italic py-1">No parts yet</div>
                ) : (
                  parts.map(model => (
                    <div 
                      key={model.id}
                      className={`flex items-center py-1 px-2 rounded text-sm cursor-pointer ${
                        selectedItemId === model.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                      }`}
                      onClick={() => handleItemClick(model.id)}
                    >
                      <div className="mr-2">
                        {getFeatureIcon(model)}
                      </div>
                      <span className={model.id === activeModelId ? 'font-medium' : ''}>
                        {model.name}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          
          {/* Parts Library Section */}
          <div className="border-b border-gray-200">
            <div 
              className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-100"
              onClick={() => toggleSection('partsLibrary')}
            >
              <div className="flex items-center">
                {expandedSections.partsLibrary ? 
                  <ChevronDown size={16} className="text-gray-500 mr-2" /> : 
                  <ChevronRight size={16} className="text-gray-500 mr-2" />
                }
                <span className="font-medium">Parts Library</span>
              </div>
            </div>
            
            {expandedSections.partsLibrary && (
              <div className="pl-8 pr-4 pb-2 space-y-1">
                <div 
                  className={`flex items-center py-1 px-2 rounded text-sm cursor-pointer ${
                    selectedItemId === 'part_cube' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                  }`}
                  onClick={() => handleItemClick('part_cube')}
                >
                  <BoxIcon size={16} className="text-blue-500 mr-2" />
                  <span>Cube</span>
                </div>
                <div 
                  className={`flex items-center py-1 px-2 rounded text-sm cursor-pointer ${
                    selectedItemId === 'part_sphere' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                  }`}
                  onClick={() => handleItemClick('part_sphere')}
                >
                  <Circle size={16} className="text-blue-500 mr-2" />
                  <span>Sphere</span>
                </div>
                <div 
                  className={`flex items-center py-1 px-2 rounded text-sm cursor-pointer ${
                    selectedItemId === 'part_cylinder' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                  }`}
                  onClick={() => handleItemClick('part_cylinder')}
                >
                  <CornerUpRight size={16} className="text-blue-500 mr-2" />
                  <span>Cylinder</span>
                </div>
                <div 
                  className={`flex items-center py-1 px-2 rounded text-sm cursor-pointer ${
                    selectedItemId === 'part_torus' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                  }`}
                  onClick={() => handleItemClick('part_torus')}
                >
                  <Circle size={16} className="text-blue-500 mr-2" />
                  <span>Torus</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Sketches Section */}
          <div className="border-b border-gray-200">
            <div 
              className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-100"
              onClick={() => toggleSection('sketches')}
            >
              <div className="flex items-center">
                {expandedSections.sketches ? 
                  <ChevronDown size={16} className="text-gray-500 mr-2" /> : 
                  <ChevronRight size={16} className="text-gray-500 mr-2" />
                }
                <span className="font-medium">Sketches</span>
              </div>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {allSketches.length}
              </span>
            </div>
            
            {expandedSections.sketches && (
              <div className="pl-8 pr-4 pb-2 space-y-1">
                {allSketches.length === 0 ? (
                  <div className="text-sm text-gray-500 italic py-1">No sketches yet</div>
                ) : (
                  allSketches.map(sketch => (
                    <div key={sketch.id} className="mb-1">
                      <div 
                        className={`flex items-center py-1 px-2 rounded text-sm cursor-pointer ${
                          selectedItemId === sketch.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                        }`}
                        onClick={() => {
                          handleItemClick(sketch.id);
                          toggleFeatureExpansion(sketch.id);
                        }}
                      >
                        <div className="mr-1">
                          {expandedFeatures[sketch.id] ? 
                            <ChevronDown size={14} className="text-gray-500" /> : 
                            <ChevronRight size={14} className="text-gray-500" />
                          }
                        </div>
                        <Pencil size={16} className="text-blue-600 mr-2" />
                        <span>{sketch.name}</span>
                      </div>
                      
                      {/* Sketch entities and operations */}
                      {expandedFeatures[sketch.id] && (
                        <div className="pl-7 mt-1 space-y-1">
                          {sketch.entities && sketch.entities.length > 0 ? (
                            sketch.entities.map(entity => (
                              <div 
                                key={entity.id}
                                className="flex items-center py-1 px-2 rounded text-sm text-gray-600"
                              >
                                <div className="w-4 h-4 flex items-center justify-center mr-2">
                                  {entity.type === 'point' && <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>}
                                  {entity.type === 'line' && <div className="w-3 h-0.5 bg-blue-500"></div>}
                                  {entity.type === 'circle' && <Circle size={14} className="text-blue-500" />}
                                  {entity.type === 'rectangle' && <Square size={14} className="text-blue-500" />}
                                </div>
                                <span>{entity.type}</span>
                              </div>
                            ))
                          ) : (
                            <div className="text-xs text-gray-500 italic py-1 pl-2">Empty sketch</div>
                          )}
                          
                          {/* Operations based on this sketch */}
                          {getSketchFeatures(sketch.id).map(feature => (
                            <div 
                              key={feature.id}
                              className={`flex items-center py-1 px-2 rounded text-sm cursor-pointer ${
                                selectedItemId === feature.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                              }`}
                              onClick={() => handleItemClick(feature.id)}
                            >
                              <div className="mr-2">
                                {getFeatureIcon(feature)}
                              </div>
                              <span>{feature.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          
          {/* Reference Geometry Section */}
          <div className="border-b border-gray-200">
            <div 
              className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-100"
              onClick={() => toggleSection('referenceGeometry')}
            >
              <div className="flex items-center">
                {expandedSections.referenceGeometry ? 
                  <ChevronDown size={16} className="text-gray-500 mr-2" /> : 
                  <ChevronRight size={16} className="text-gray-500 mr-2" />
                }
                <span className="font-medium">Reference Geometry</span>
              </div>
            </div>
            
            {expandedSections.referenceGeometry && (
              <div className="pl-8 pr-4 pb-2 space-y-1">
                <div 
                  className="flex items-center py-1 px-2 rounded text-sm cursor-pointer hover:bg-gray-100"
                  onClick={() => handleItemClick('plane_xy')}
                >
                  <Square size={16} className="text-blue-400 mr-2" />
                  <span>XY Plane (Front)</span>
                </div>
                <div 
                  className="flex items-center py-1 px-2 rounded text-sm cursor-pointer hover:bg-gray-100"
                  onClick={() => handleItemClick('plane_yz')}
                >
                  <Square size={16} className="text-green-400 mr-2" />
                  <span>YZ Plane (Right)</span>
                </div>
                <div 
                  className="flex items-center py-1 px-2 rounded text-sm cursor-pointer hover:bg-gray-100"
                  onClick={() => handleItemClick('plane_xz')}
                >
                  <Square size={16} className="text-red-400 mr-2" />
                  <span>XZ Plane (Top)</span>
                </div>
                <div 
                  className="flex items-center py-1 px-2 rounded text-sm cursor-pointer hover:bg-gray-100"
                  onClick={() => handleItemClick('origin')}
                >
                  <div className="h-3 w-3 rounded-full border-2 border-gray-400 mr-2"></div>
                  <span>Origin</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Measurements Section */}
          <div className="border-b border-gray-200">
            <div 
              className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-100"
              onClick={() => toggleSection('measurements')}
            >
              <div className="flex items-center">
                {expandedSections.measurements ? 
                  <ChevronDown size={16} className="text-gray-500 mr-2" /> : 
                  <ChevronRight size={16} className="text-gray-500 mr-2" />
                }
                <span className="font-medium">Measurements</span>
              </div>
            </div>
            
            {expandedSections.measurements && (
              <div className="pl-8 pr-4 pb-2">
                <div className="text-sm text-gray-500 italic py-1">No measurements yet</div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-auto p-4 border-t border-gray-200 text-xs text-gray-500">
          <div className="flex justify-between items-center">
            <div>
              <p>OpenShape v0.1.0</p>
              <p className="mt-1">Free and Open Source CAD</p>
            </div>
            <div className="bg-blue-100 px-2 py-1 rounded">
              {filteredModels.length} model{filteredModels.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 