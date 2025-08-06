# Code Examples Catalog for OpenShape

## 🎯 Purpose

This catalog provides working code examples from the OpenShape codebase that LLMs can reference, understand, and adapt when implementing new features. Each example includes context, explanation, and usage patterns.

## 📚 Table of Contents

1. [Model Management Examples](#model-management-examples)
2. [JSCAD Operations Examples](#jscad-operations-examples)
3. [React Component Examples](#react-component-examples)
4. [Three.js Integration Examples](#threejs-integration-examples)
5. [UI Pattern Examples](#ui-pattern-examples)
6. [State Management Examples](#state-management-examples)
7. [Event Handling Examples](#event-handling-examples)
8. [Performance Optimization Examples](#performance-optimization-examples)

---

## Model Management Examples

### Adding a New Model to the Store

**Source**: `lib/partsLibrary.js`

```javascript
// Example: Creating a cube and adding it to the model store
export const createCube = (params = {}) => {
  try {
    // Extract parameters with defaults
    const width = params.width || 10;
    const height = params.height || 10;
    const depth = params.depth || 10;
    const position = params.position || [0, 0, 0];
    const name = params.name || 'Cube';

    // Create JSCAD geometry
    const cube = jscad.primitives.cuboid({
      size: [width, height, depth],
      center: position
    });

    // Add to model store and get ID
    const modelId = modelStore.addModel(cube, name, {
      type: 'primitive',
      primitive: 'cube',
      parameters: { width, height, depth, position }
    });

    // Return success result
    return { 
      success: true, 
      modelId, 
      model: cube,
      message: `Created ${name} successfully`
    };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
};
```

**Usage Pattern**: Follow this pattern for any new primitive creation function.

### Model Store Operations

**Source**: `lib/mcpTools.js`

```javascript
// Model Store implementation pattern
export const modelStore = {
  models: new Map(),
  activeModelId: null,
  listeners: new Set(),

  // Add model with validation
  addModel(geometry, name, metadata = {}) {
    const id = generateId();
    const model = {
      id,
      name,
      geometry,
      visible: true,
      created: Date.now(),
      metadata: {
        type: 'unknown',
        ...metadata
      }
    };

    this.models.set(id, model);
    this.notifyListeners('model-added', { id, model });
    return id;
  },

  // Get model with error handling
  getModel(id) {
    const model = this.models.get(id);
    if (!model) {
      console.warn(`Model with id ${id} not found`);
      return null;
    }
    return model;
  },

  // Delete model with cleanup
  deleteModel(id) {
    const model = this.models.get(id);
    if (!model) return false;

    this.models.delete(id);
    if (this.activeModelId === id) {
      this.activeModelId = null;
    }
    
    this.notifyListeners('model-deleted', { id });
    return true;
  }
};
```

---

## JSCAD Operations Examples

### Boolean Operations

**Source**: `lib/cadOperations.js`

```javascript
// Union operation example
export const performUnion = (modelIds) => {
  try {
    if (!Array.isArray(modelIds) || modelIds.length < 2) {
      throw new Error('Union requires at least 2 models');
    }

    // Get geometries from model store
    const geometries = modelIds.map(id => {
      const model = modelStore.getModel(id);
      if (!model) throw new Error(`Model ${id} not found`);
      return model.geometry;
    });

    // Perform JSCAD union operation
    const result = jscad.booleans.union(...geometries);

    // Create name for result
    const resultName = `Union of ${modelIds.length} objects`;

    // Add result to model store
    const resultId = modelStore.addModel(result, resultName, {
      type: 'boolean',
      operation: 'union',
      sourceModels: modelIds
    });

    return {
      success: true,
      modelId: resultId,
      message: `Union operation completed successfully`
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};
```

### JSCAD Code Evaluation

**Source**: `lib/jscadProcessor.js`

```javascript
// Safe JSCAD code evaluation
export const evaluateJSCAD = (code) => {
  try {
    // Create sandboxed context with JSCAD functions
    const context = {
      // Primitives
      cube: jscad.primitives.cube,
      cuboid: jscad.primitives.cuboid,
      sphere: jscad.primitives.sphere,
      cylinder: jscad.primitives.cylinder,
      
      // Boolean operations
      union: jscad.booleans.union,
      subtract: jscad.booleans.subtract,
      intersect: jscad.booleans.intersect,
      
      // Transformations
      translate: jscad.transforms.translate,
      rotate: jscad.transforms.rotate,
      scale: jscad.transforms.scale,
      
      // Math utilities
      Math: Math,
      console: {
        log: (...args) => console.log('[JSCAD]', ...args)
      }
    };

    // Create function with context
    const contextKeys = Object.keys(context);
    const contextValues = Object.values(context);
    
    const evalFunction = new Function(
      ...contextKeys,
      `${code}; return typeof main === 'function' ? main() : null;`
    );

    // Execute with error handling
    const result = evalFunction(...contextValues);
    
    if (!result) {
      throw new Error('JSCAD code must export a main() function');
    }

    return result;
  } catch (error) {
    throw new Error(`JSCAD evaluation failed: ${error.message}`);
  }
};
```

---

## React Component Examples

### Component with Three.js Integration

**Source**: `components/JscadThreeViewer.js`

```javascript
const JscadThreeViewer = forwardRef((props, ref) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);

  // State management
  const [models, setModels] = useState([]);
  const [selectedObjects, setSelectedObjects] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current || isInitialized) return;

    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(15, 15, 15);

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: PERFORMANCE_CONFIG.antialias 
    });
    renderer.setSize(
      mountRef.current.clientWidth, 
      mountRef.current.clientHeight
    );
    renderer.setPixelRatio(PERFORMANCE_CONFIG.pixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    scene.add(directionalLight);

    // Setup orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Store references
    sceneRef.current = scene;
    rendererRef.current = renderer;
    cameraRef.current = camera;
    controlsRef.current = controls;

    setIsInitialized(true);

    // Cleanup on unmount
    return () => {
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      controls.dispose();
    };
  }, []);

  // Animation loop
  useEffect(() => {
    if (!isInitialized) return;

    const animate = () => {
      requestAnimationFrame(animate);
      controlsRef.current.update();
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };

    animate();
  }, [isInitialized]);

  // Component render
  return (
    <div 
      ref={mountRef} 
      className="w-full h-full relative"
      style={{ minHeight: '400px' }}
    />
  );
});
```

### Modal Dialog Component

**Source**: `components/ExportModelDialog.js`

```javascript
const ExportModelDialog = ({ isOpen, onClose, selectedModels = [] }) => {
  const [format, setFormat] = useState('stl');
  const [filename, setFilename] = useState('model');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!selectedModels.length) {
      alert('Please select models to export');
      return;
    }

    setIsExporting(true);
    
    try {
      // Export logic
      const result = await exportModels(selectedModels, format, filename);
      
      if (result.success) {
        // Trigger download
        downloadFile(result.data, `${filename}.${format}`);
        onClose();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert(`Export failed: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h2 className="text-xl font-bold mb-4">Export Models</h2>
        
        {/* Format selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Format:</label>
          <select 
            value={format} 
            onChange={(e) => setFormat(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="stl">STL</option>
            <option value="obj">OBJ</option>
            <option value="ply">PLY</option>
          </select>
        </div>

        {/* Filename input */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Filename:</label>
          <input
            type="text"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="Enter filename"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-gray-50"
            disabled={isExporting}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            disabled={isExporting}
          >
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

## UI Pattern Examples

### Toolbar Component Pattern

**Source**: `components/SketchToolbar.js`

```javascript
const SketchToolbar = ({ selectedTool, onToolSelect, isActive }) => {
  const tools = [
    { id: 'line', icon: <Line size={20} />, label: 'Line' },
    { id: 'rectangle', icon: <Square size={20} />, label: 'Rectangle' },
    { id: 'circle', icon: <Circle size={20} />, label: 'Circle' },
    { id: 'arc', icon: <RotateCcw size={20} />, label: 'Arc' }
  ];

  const handleToolClick = (toolId) => {
    // Toggle tool selection
    if (selectedTool === toolId) {
      onToolSelect(null);
    } else {
      onToolSelect(toolId);
    }
  };

  return (
    <div className={`flex items-center gap-1 p-2 bg-white border-b ${
      isActive ? 'border-blue-500' : 'border-gray-200'
    }`}>
      <span className="text-sm font-medium mr-2">Sketch:</span>
      
      {tools.map(tool => (
        <button
          key={tool.id}
          onClick={() => handleToolClick(tool.id)}
          className={`p-2 rounded hover:bg-gray-100 transition-colors ${
            selectedTool === tool.id 
              ? 'bg-blue-100 text-blue-600' 
              : 'text-gray-600'
          }`}
          title={tool.label}
        >
          {tool.icon}
        </button>
      ))}
    </div>
  );
};
```

### Collapsible Sidebar Pattern

**Source**: `components/SidebarFixed.js`

```javascript
const SidebarFixed = ({ isOpen, onToggle }) => {
  const [activeTab, setActiveTab] = useState('models');
  const [expandedSections, setExpandedSections] = useState(new Set(['models']));

  const toggleSection = (sectionId) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  return (
    <div className={`bg-white border-r transition-all duration-300 ${
      isOpen ? 'w-80' : 'w-12'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        {isOpen && <h2 className="font-semibold">Design Tree</h2>}
        <button
          onClick={onToggle}
          className="p-1 hover:bg-gray-100 rounded"
        >
          {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      {/* Content */}
      {isOpen && (
        <div className="flex-1 overflow-y-auto">
          {/* Tab navigation */}
          <div className="flex border-b">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-3 py-2 text-sm ${
                  activeTab === tab.id
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-3">
            {activeTab === 'models' && <ModelTree />}
            {activeTab === 'parts' && <PartsLibrary />}
            {activeTab === 'history' && <DesignHistory />}
          </div>
        </div>
      )}
    </div>
  );
};
```

---

## State Management Examples

### Unit Context Provider

**Source**: `contexts/UnitContext.js`

```javascript
const UnitContext = createContext();

export const UnitProvider = ({ children }) => {
  const [units, setUnits] = useState({
    length: 'mm',
    angle: 'degrees',
    precision: 2
  });

  const convertValue = useCallback((value, fromUnit, toUnit) => {
    if (fromUnit === toUnit) return value;
    
    const conversions = {
      'mm-m': 0.001,
      'm-mm': 1000,
      'mm-in': 0.0393701,
      'in-mm': 25.4,
      // Add more conversions as needed
    };

    const conversionKey = `${fromUnit}-${toUnit}`;
    const factor = conversions[conversionKey];
    
    if (!factor) {
      console.warn(`Conversion from ${fromUnit} to ${toUnit} not supported`);
      return value;
    }

    return value * factor;
  }, []);

  const formatValue = useCallback((value, unit = units.length) => {
    return `${value.toFixed(units.precision)} ${unit}`;
  }, [units]);

  const value = {
    units,
    setUnits,
    convertValue,
    formatValue
  };

  return (
    <UnitContext.Provider value={value}>
      {children}
    </UnitContext.Provider>
  );
};

export const useUnits = () => {
  const context = useContext(UnitContext);
  if (!context) {
    throw new Error('useUnits must be used within a UnitProvider');
  }
  return context;
};
```

### Custom Hook for Model Store

```javascript
// Custom hook for model store integration
export const useModelStore = () => {
  const [models, setModels] = useState([]);
  const [activeModelId, setActiveModelId] = useState(null);

  useEffect(() => {
    // Initial load
    setModels(modelStore.getAllModels());
    setActiveModelId(modelStore.activeModelId);

    // Listen for changes
    const handleModelChange = (event) => {
      setModels(modelStore.getAllModels());
      setActiveModelId(modelStore.activeModelId);
    };

    // Subscribe to events
    const unsubscribe = modelStore.addListener(handleModelChange);

    return unsubscribe;
  }, []);

  const addModel = useCallback((geometry, name, metadata) => {
    return modelStore.addModel(geometry, name, metadata);
  }, []);

  const deleteModel = useCallback((id) => {
    return modelStore.deleteModel(id);
  }, []);

  const setActiveModel = useCallback((id) => {
    modelStore.setActiveModel(id);
  }, []);

  return {
    models,
    activeModelId,
    addModel,
    deleteModel,
    setActiveModel
  };
};
```

---

## Event Handling Examples

### Mouse Interaction in 3D

**Source**: `components/JscadThreeViewer.js`

```javascript
// Mouse event handling for 3D object selection
useEffect(() => {
  if (!rendererRef.current || !cameraRef.current || !sceneRef.current) return;

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let lastClickTime = 0;

  const handleMouseClick = (event) => {
    const currentTime = Date.now();
    const isDoubleClick = currentTime - lastClickTime < 300;
    lastClickTime = currentTime;

    // Calculate mouse position in normalized device coordinates
    const rect = rendererRef.current.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Cast ray from camera through mouse position
    raycaster.setFromCamera(mouse, cameraRef.current);
    const intersects = raycaster.intersectObjects(sceneRef.current.children, true);

    if (intersects.length > 0) {
      const selectedObject = intersects[0].object;
      
      if (isDoubleClick) {
        // Double-click: focus on object
        focusOnObject(selectedObject);
      } else {
        // Single-click: select object
        selectObject(selectedObject);
      }
    } else {
      // Click on empty space: clear selection
      clearSelection();
    }
  };

  const canvas = rendererRef.current.domElement;
  canvas.addEventListener('click', handleMouseClick);

  return () => {
    canvas.removeEventListener('click', handleMouseClick);
  };
}, [isInitialized]);
```

### Keyboard Shortcuts

```javascript
// Keyboard shortcut handling
useEffect(() => {
  const handleKeyDown = (event) => {
    // Prevent shortcuts when input is focused
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
      return;
    }

    const { key, ctrlKey, metaKey, shiftKey } = event;
    const modifier = ctrlKey || metaKey;

    switch (key.toLowerCase()) {
      case 'delete':
      case 'backspace':
        if (selectedObjects.length > 0) {
          deleteSelectedObjects();
          event.preventDefault();
        }
        break;

      case 'a':
        if (modifier) {
          selectAllObjects();
          event.preventDefault();
        }
        break;

      case 'z':
        if (modifier && !shiftKey) {
          undo();
          event.preventDefault();
        } else if (modifier && shiftKey) {
          redo();
          event.preventDefault();
        }
        break;

      case 'c':
        if (modifier) {
          copySelectedObjects();
          event.preventDefault();
        }
        break;

      case 'v':
        if (modifier) {
          pasteObjects();
          event.preventDefault();
        }
        break;

      case 'escape':
        clearSelection();
        setSelectedTool(null);
        break;
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [selectedObjects, selectedTool]);
```

---

## Performance Optimization Examples

### Memoized Component

```javascript
// Memoized component to prevent unnecessary re-renders
const ModelListItem = React.memo(({ model, isSelected, onSelect, onToggleVisibility }) => {
  const handleClick = useCallback(() => {
    onSelect(model.id);
  }, [model.id, onSelect]);

  const handleVisibilityToggle = useCallback((event) => {
    event.stopPropagation();
    onToggleVisibility(model.id);
  }, [model.id, onToggleVisibility]);

  return (
    <div 
      className={`flex items-center justify-between p-2 rounded cursor-pointer ${
        isSelected ? 'bg-blue-100' : 'hover:bg-gray-50'
      }`}
      onClick={handleClick}
    >
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded ${
          model.visible ? 'bg-green-500' : 'bg-gray-300'
        }`} />
        <span className="text-sm">{model.name}</span>
      </div>
      
      <button
        onClick={handleVisibilityToggle}
        className="p-1 hover:bg-gray-200 rounded"
      >
        {model.visible ? <Eye size={14} /> : <EyeOff size={14} />}
      </button>
    </div>
  );
});
```

### Throttled Updates

```javascript
// Throttled update pattern for performance
const useThrottledUpdate = (callback, delay) => {
  const timeoutRef = useRef(null);
  const lastCallRef = useRef(0);

  return useCallback((...args) => {
    const now = Date.now();
    const elapsed = now - lastCallRef.current;

    if (elapsed >= delay) {
      // Execute immediately if enough time has passed
      lastCallRef.current = now;
      callback(...args);
    } else {
      // Schedule for later
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        lastCallRef.current = Date.now();
        callback(...args);
      }, delay - elapsed);
    }
  }, [callback, delay]);
};

// Usage example
const throttledUpdateModels = useThrottledUpdate(() => {
  setModels(modelStore.getAllModels());
}, 100); // Max 10 updates per second
```

---

**For LLMs**: These examples provide proven patterns and working code that can be adapted for new features. Always maintain the same error handling, performance considerations, and code structure when implementing similar functionality.