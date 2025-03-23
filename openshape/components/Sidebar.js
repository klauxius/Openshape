import React, { useState, useEffect } from 'react';
import { modelStore, notifyModelChanged } from '../lib/mcpTools';
import { 
  ChevronDown, 
  ChevronRight, 
  Cube, 
  Square, 
  Circle, 
  ChevronsUp, 
  Box, 
  XOctagon, 
  Combine,
  Layers,
  Search,
  Pencil
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
  const [expandedSections, setExpandedSections] = useState({
    models: true,
    referenceGeometry: true,
    features: true,
    measurements: true
  });
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
    
    // Listen for model changes
    const handleModelChanged = (event) => {
      const { model } = event.detail;
      
      // If a model was deleted
      if (model.deleted) {
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
    
    window.addEventListener('openshape:modelChanged', handleModelChanged);
    
    return () => {
      window.removeEventListener('openshape:modelChanged', handleModelChanged);
    };
  }, []);
  
  // Toggle section expand/collapse
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
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
  };
  
  // Get appropriate icon for feature type
  const getFeatureIcon = (model) => {
    // Based on naming conventions for now
    if (model.name.includes('Cube') || model.name.includes('cube')) {
      return <Cube size={16} className="text-blue-500" />;
    } else if (model.name.includes('Cylinder') || model.name.includes('cylinder')) {
      return <ChevronsUp size={16} className="text-blue-500" />;
    } else if (model.name.includes('Sphere') || model.name.includes('sphere')) {
      return <Circle size={16} className="text-blue-500" />;
    } else if (model.name.includes('Torus') || model.name.includes('torus')) {
      return <Circle size={16} className="text-blue-500" />;
    } else if (model.name.includes('Extrude') || model.name.includes('extrude')) {
      return <Box size={16} className="text-green-600" />;
    } else if (model.name.includes('Union') || model.name.includes('union')) {
      return <Combine size={16} className="text-purple-500" />;
    } else if (model.name.includes('Subtract') || model.name.includes('subtract')) {
      return <XOctagon size={16} className="text-red-500" />;
    } else if (model.name.includes('Sketch') || model.name.includes('sketch')) {
      return <Pencil size={16} className="text-green-600" />;
    } else if (model.name.includes('plane')) {
      return <Square size={16} className="text-blue-400" />;
    } else {
      return <Layers size={16} className="text-gray-500" />;
    }
  };
  
  // Filter models based on search text
  const filteredModels = models.filter(model => 
    filterText === '' || model.name.toLowerCase().includes(filterText.toLowerCase())
  );
  
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
          {/* Models Section */}
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
                <span className="font-medium">Parts & Models</span>
              </div>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {filteredModels.length}
              </span>
            </div>
            
            {expandedSections.models && (
              <div className="pl-8 pr-4 pb-2 space-y-1">
                {filteredModels.length === 0 ? (
                  <div className="text-sm text-gray-500 italic py-1">No models yet</div>
                ) : (
                  filteredModels.map(model => (
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
            </div>
            
            {expandedSections.features && (
              <div className="pl-8 pr-4 pb-2 space-y-1">
                {/* Filter models to only show those that look like features */}
                {filteredModels
                  .filter(model => 
                    model.name.includes('Sketch') || 
                    model.name.includes('Extrude') || 
                    model.name.includes('Fillet') ||
                    model.name.includes('Shell') ||
                    model.name.includes('Hole')
                  )
                  .map(feature => (
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
                  ))}
                  
                {filteredModels.filter(model => 
                  model.name.includes('Sketch') || 
                  model.name.includes('Extrude') || 
                  model.name.includes('Fillet') ||
                  model.name.includes('Shell') ||
                  model.name.includes('Hole')
                ).length === 0 && (
                  <div className="text-sm text-gray-500 italic py-1">No features yet</div>
                )}
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