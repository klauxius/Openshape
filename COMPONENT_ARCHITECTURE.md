# OpenShape Component Architecture

## Table of Contents

1. [Component Hierarchy](#component-hierarchy)
2. [Core Components](#core-components)
3. [UI Components](#ui-components)
4. [3D Visualization Components](#3d-visualization-components)
5. [CAD-Specific Components](#cad-specific-components)
6. [State Management](#state-management)
7. [Component Communication](#component-communication)
8. [Performance Patterns](#performance-patterns)
9. [Component Lifecycle](#component-lifecycle)
10. [Testing Strategies](#testing-strategies)

---

## Component Hierarchy

```
OpenShape Application
├── pages/
│   ├── cad-interface.js (Main Application)
│   │   ├── Header Navigation
│   │   ├── Toolbar System
│   │   │   ├── SketchToolbar
│   │   │   ├── FeatureToolbar
│   │   │   └── MeasurementControls
│   │   ├── Main Layout
│   │   │   ├── SidebarFixed (Left Panel)
│   │   │   │   ├── FeatureTree
│   │   │   │   ├── ModelBrowser
│   │   │   │   └── PartsLibrary
│   │   │   ├── JscadThreeViewer (3D Canvas)
│   │   │   │   ├── ViewCube/DomViewCube
│   │   │   │   ├── MeasurementTool
│   │   │   │   └── ReferencePlanes
│   │   │   └── PropertyPanel (Right Panel)
│   │   ├── Modal System
│   │   │   ├── ImportModelDialog
│   │   │   ├── ExportModelDialog
│   │   │   ├── PlaneSelectionDialog
│   │   │   └── UserGuide
│   │   └── CodeTerminal (Bottom Panel)
│   └── index.js (Simple Interface)
│       ├── FeatureToolbar
│       ├── ParameterControls
│       ├── JSCADViewer
│       └── ExportButton
├── contexts/
│   └── UnitContext.js (Global State)
└── components/ (Reusable Components)
    ├── [All component files]
```

---

## Core Components

### 1. Main Application Container (`pages/cad-interface.js`)

**Purpose:** Primary application shell that orchestrates the entire CAD interface.

**Responsibilities:**
- Layout management and responsive design
- Tool state coordination
- Modal dialog management
- Event handling between major sections

**Key State Variables:**
```javascript
const [sidebarOpen, setSidebarOpen] = useState(true);
const [activeTab, setActiveTab] = useState('model');
const [selectedTool, setSelectedTool] = useState(null);
const [showImportDialog, setShowImportDialog] = useState(false);
const [showExportDialog, setShowExportDialog] = useState(false);
const [showPlaneDialog, setShowPlaneDialog] = useState(false);
const [showUserGuide, setShowUserGuide] = useState(false);
const [isSketchMode, setIsSketchMode] = useState(false);
```

**Component Structure:**
```jsx
export default function CADInterface() {
  return (
    <UnitProvider>
      <div className="flex flex-col h-screen">
        {/* Header Navigation */}
        <header>...</header>
        
        {/* Main Toolbar */}
        <ToolbarSystem 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          selectedTool={selectedTool}
          onToolSelect={setSelectedTool}
        />
        
        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden">
          <SidebarFixed 
            isOpen={sidebarOpen}
            onToggle={setSidebarOpen}
          />
          
          <main className="flex-1 relative">
            <JscadThreeViewer 
              selectedTool={selectedTool}
              isSketchMode={isSketchMode}
            />
          </main>
          
          <PropertyPanel />
        </div>
        
        {/* Modal Dialogs */}
        {showImportDialog && <ImportModelDialog />}
        {showExportDialog && <ExportModelDialog />}
        {showPlaneDialog && <PlaneSelectionDialog />}
        {showUserGuide && <UserGuide />}
        
        {/* Code Terminal */}
        <CodeTerminal />
      </div>
    </UnitProvider>
  );
}
```

### 2. 3D Viewer Container (`components/JscadThreeViewer.js`)

**Purpose:** Core 3D visualization engine handling JSCAD geometry rendering.

**Key Features:**
- Three.js scene management
- JSCAD geometry conversion
- Camera controls and navigation
- Object selection and highlighting
- Performance optimization

**Component Structure:**
```jsx
const JscadThreeViewer = forwardRef((props, ref) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  
  const [models, setModels] = useState([]);
  const [selectedObjects, setSelectedObjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Scene initialization
  useEffect(() => {
    initializeScene();
    setupLighting();
    setupControls();
    
    return () => {
      cleanup();
    };
  }, []);
  
  // Model updates
  useEffect(() => {
    updateSceneModels();
  }, [models]);
  
  return (
    <div className="relative w-full h-full">
      <canvas ref={mountRef} className="w-full h-full" />
      
      {/* UI Overlays */}
      <DomViewCube 
        camera={cameraRef.current}
        onViewChange={handleViewChange}
      />
      
      <MeasurementTool 
        scene={sceneRef.current}
        camera={cameraRef.current}
        selectedObjects={selectedObjects}
      />
      
      <ReferencePlanes 
        visible={showReferencePlanes}
        scene={sceneRef.current}
      />
      
      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      )}
    </div>
  );
});
```

**Performance Considerations:**
- Geometry caching and reuse
- Frustum culling for off-screen objects
- Level-of-detail (LOD) for complex models
- Debounced render calls

### 3. Sidebar System (`components/SidebarFixed.js`)

**Purpose:** Feature tree and model management interface.

**Key Sections:**
- Model tree with hierarchical display
- Feature history and operations
- Parts library browser
- Layer management
- Property inspector

**Component Structure:**
```jsx
const SidebarFixed = ({ isOpen, onToggle }) => {
  const [expandedSections, setExpandedSections] = useState({
    models: true,
    features: true,
    library: false,
    properties: true
  });
  
  const [filterText, setFilterText] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  
  return (
    <div className={`transition-all duration-300 ${isOpen ? 'w-64' : 'w-0'}`}>
      <div className="h-full bg-gray-50 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <SidebarHeader 
          onToggle={onToggle}
          filterText={filterText}
          onFilterChange={setFilterText}
        />
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <CollapsibleSection 
            title="Models"
            expanded={expandedSections.models}
            onToggle={() => toggleSection('models')}
          >
            <ModelTree 
              filter={filterText}
              selectedItem={selectedItem}
              onItemSelect={setSelectedItem}
            />
          </CollapsibleSection>
          
          <CollapsibleSection 
            title="Features"
            expanded={expandedSections.features}
            onToggle={() => toggleSection('features')}
          >
            <FeatureTree />
          </CollapsibleSection>
          
          <CollapsibleSection 
            title="Parts Library"
            expanded={expandedSections.library}
            onToggle={() => toggleSection('library')}
          >
            <PartsLibrary />
          </CollapsibleSection>
        </div>
        
        {/* Properties Panel */}
        <PropertyInspector 
          selectedItem={selectedItem}
          expanded={expandedSections.properties}
          onToggle={() => toggleSection('properties')}
        />
      </div>
    </div>
  );
};
```

---

## UI Components

### 1. Toolbar System

The toolbar provides context-sensitive tool access organized by tabs.

#### SketchToolbar (`components/SketchToolbar.js`)
```jsx
const SketchToolbar = ({ activeSketch, onToolSelect }) => {
  const sketchTools = [
    { id: 'line', icon: Pen, label: 'Line' },
    { id: 'circle', icon: Circle, label: 'Circle' },
    { id: 'rectangle', icon: Square, label: 'Rectangle' },
    { id: 'arc', icon: CornerUpRight, label: 'Arc' }
  ];
  
  return (
    <div className="flex items-center space-x-1 p-2">
      {sketchTools.map(tool => (
        <ToolButton 
          key={tool.id}
          tool={tool}
          onSelect={onToolSelect}
          disabled={!activeSketch}
        />
      ))}
      
      <div className="w-px h-6 bg-gray-300 mx-2" />
      
      <ConstraintTools />
      <DimensionTools />
    </div>
  );
};
```

#### FeatureToolbar (`components/FeatureToolbar.js`)
```jsx
const FeatureToolbar = ({ onFeatureAdd }) => {
  const primitives = [
    { id: 'cube', icon: Box, label: 'Cube' },
    { id: 'sphere', icon: Circle, label: 'Sphere' },
    { id: 'cylinder', icon: Layers, label: 'Cylinder' }
  ];
  
  const operations = [
    { id: 'union', icon: Plus, label: 'Union' },
    { id: 'subtract', icon: Minus, label: 'Subtract' },
    { id: 'intersect', icon: Intersect, label: 'Intersect' }
  ];
  
  return (
    <div className="flex items-center space-x-1 p-2">
      <ToolGroup label="Primitives" tools={primitives} onSelect={onFeatureAdd} />
      <ToolGroup label="Operations" tools={operations} onSelect={onFeatureAdd} />
    </div>
  );
};
```

### 2. Modal Components

#### ImportModelDialog (`components/ImportModelDialog.js`)
```jsx
const ImportModelDialog = ({ isOpen, onClose }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [importProgress, setImportProgress] = useState(0);
  
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    const supportedFiles = files.filter(file => 
      file.name.match(/\.(stl|obj|ply|3mf)$/i)
    );
    
    setSelectedFiles(supportedFiles);
  }, []);
  
  const handleImport = async () => {
    for (const file of selectedFiles) {
      try {
        const geometry = await importModel(file);
        const modelId = modelStore.addModel(geometry, file.name);
        setImportProgress(prev => prev + (100 / selectedFiles.length));
      } catch (error) {
        console.error('Import failed:', error);
      }
    }
    
    onClose();
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import Model">
      <div 
        className={`border-2 border-dashed rounded-lg p-8 text-center ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={() => setDragActive(true)}
        onDragLeave={() => setDragActive(false)}
      >
        {selectedFiles.length > 0 ? (
          <FileList files={selectedFiles} onRemove={removeFile} />
        ) : (
          <DropZone />
        )}
      </div>
      
      <div className="flex justify-end space-x-2 mt-4">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button 
          variant="primary" 
          onClick={handleImport}
          disabled={selectedFiles.length === 0}
        >
          Import
        </Button>
      </div>
    </Modal>
  );
};
```

### 3. Navigation Components

#### ViewCube (`components/ViewCube.tsx`)
```tsx
interface ViewCubeProps {
  camera: THREE.Camera;
  onViewChange: (view: string) => void;
  size?: number;
}

const ViewCube: React.FC<ViewCubeProps> = ({ 
  camera, 
  onViewChange, 
  size = 120 
}) => {
  const [hoveredFace, setHoveredFace] = useState<string | null>(null);
  
  const viewDirections = {
    front: [0, 0, 1],
    back: [0, 0, -1],
    left: [-1, 0, 0],
    right: [1, 0, 0],
    top: [0, 1, 0],
    bottom: [0, -1, 0]
  };
  
  const handleFaceClick = (face: string) => {
    const direction = viewDirections[face];
    animateCameraToView(camera, direction);
    onViewChange(face);
  };
  
  return (
    <div 
      className="absolute top-4 right-4 pointer-events-auto"
      style={{ width: size, height: size }}
    >
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 120 120"
        className="cursor-pointer"
      >
        {Object.entries(viewDirections).map(([face, direction]) => (
          <CubeFace
            key={face}
            face={face}
            direction={direction}
            isHovered={hoveredFace === face}
            onHover={setHoveredFace}
            onClick={handleFaceClick}
          />
        ))}
      </svg>
    </div>
  );
};
```

---

## 3D Visualization Components

### 1. Geometry Rendering

#### GeometryMesh (Internal Component)
```jsx
const GeometryMesh = ({ geometry, material, position, rotation, scale }) => {
  const meshRef = useRef();
  const [bufferGeometry, setBufferGeometry] = useState(null);
  
  // Convert JSCAD geometry to Three.js BufferGeometry
  useEffect(() => {
    if (geometry) {
      const threeGeometry = convertJSCADToThree(geometry);
      setBufferGeometry(threeGeometry);
    }
  }, [geometry]);
  
  // Update transform
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.position.set(...position);
      meshRef.current.rotation.set(...rotation);
      meshRef.current.scale.set(...scale);
    }
  }, [position, rotation, scale]);
  
  return bufferGeometry ? (
    <mesh ref={meshRef} geometry={bufferGeometry} material={material} />
  ) : null;
};
```

### 2. Camera Controls

#### CameraControls (`components/CameraControls.js`)
```jsx
const CameraControls = ({ camera, domElement, onChange }) => {
  const controlsRef = useRef();
  
  useEffect(() => {
    const controls = new OrbitControls(camera, domElement);
    
    // Configure controls
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.enableRotate = true;
    
    // Set limits
    controls.maxDistance = 1000;
    controls.minDistance = 1;
    controls.maxPolarAngle = Math.PI;
    
    // Event handlers
    controls.addEventListener('change', onChange);
    
    controlsRef.current = controls;
    
    return () => {
      controls.dispose();
    };
  }, [camera, domElement, onChange]);
  
  // Animation loop
  useFrame(() => {
    if (controlsRef.current) {
      controlsRef.current.update();
    }
  });
  
  return null;
};
```

### 3. Measurement Visualization

#### MeasurementTool (`components/measurements/MeasurementTool.js`)
```jsx
const MeasurementTool = ({ scene, camera, selectedObjects }) => {
  const [measurements, setMeasurements] = useState([]);
  const [activeMeasurement, setActiveMeasurement] = useState(null);
  const [measurementType, setMeasurementType] = useState('distance');
  
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  
  const handleMouseClick = useCallback((event) => {
    updateMousePosition(event);
    
    raycaster.current.setFromCamera(mouse.current, camera);
    const intersects = raycaster.current.intersectObjects(selectedObjects);
    
    if (intersects.length > 0) {
      const point = intersects[0].point;
      addMeasurementPoint(point);
    }
  }, [camera, selectedObjects]);
  
  const addMeasurementPoint = (point) => {
    if (!activeMeasurement) {
      // Start new measurement
      const newMeasurement = {
        id: generateId(),
        type: measurementType,
        points: [point],
        complete: false
      };
      setActiveMeasurement(newMeasurement);
    } else {
      // Complete measurement
      const completedMeasurement = {
        ...activeMeasurement,
        points: [...activeMeasurement.points, point],
        complete: true,
        value: calculateMeasurementValue(activeMeasurement.points, point)
      };
      
      setMeasurements(prev => [...prev, completedMeasurement]);
      setActiveMeasurement(null);
    }
  };
  
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Measurement overlays */}
      {measurements.map(measurement => (
        <MeasurementOverlay 
          key={measurement.id}
          measurement={measurement}
          camera={camera}
        />
      ))}
      
      {/* Active measurement preview */}
      {activeMeasurement && (
        <MeasurementPreview 
          measurement={activeMeasurement}
          camera={camera}
        />
      )}
    </div>
  );
};
```

---

## CAD-Specific Components

### 1. Sketch Interface

#### SketchCanvas (2D Drawing Interface)
```jsx
const SketchCanvas = ({ sketchId, plane, onEntityAdd }) => {
  const canvasRef = useRef();
  const [activeTool, setActiveTool] = useState('line');
  const [currentPath, setCurrentPath] = useState([]);
  const [entities, setEntities] = useState([]);
  
  const drawingModes = {
    line: LineDrawingMode,
    circle: CircleDrawingMode,
    rectangle: RectangleDrawingMode,
    arc: ArcDrawingMode
  };
  
  const ActiveDrawingMode = drawingModes[activeTool];
  
  return (
    <div className="relative w-full h-full">
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
      
      <ActiveDrawingMode 
        canvas={canvasRef.current}
        onComplete={(entity) => {
          setEntities(prev => [...prev, entity]);
          onEntityAdd(entity);
        }}
      />
      
      {/* Constraint overlays */}
      <ConstraintOverlay entities={entities} />
      
      {/* Dimension annotations */}
      <DimensionOverlay entities={entities} />
    </div>
  );
};
```

### 2. Feature Tree

#### FeatureTree (`components/FeatureTree.js`)
```jsx
const FeatureTree = () => {
  const [features, setFeatures] = useState([]);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  
  const toggleNodeExpansion = (nodeId) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };
  
  const renderFeatureNode = (feature, depth = 0) => {
    const hasChildren = feature.children && feature.children.length > 0;
    const isExpanded = expandedNodes.has(feature.id);
    const isSelected = selectedFeature?.id === feature.id;
    
    return (
      <div key={feature.id}>
        <div 
          className={`flex items-center py-1 px-2 cursor-pointer hover:bg-gray-100 ${
            isSelected ? 'bg-blue-100 border-l-2 border-blue-500' : ''
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => setSelectedFeature(feature)}
        >
          {hasChildren && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                toggleNodeExpansion(feature.id);
              }}
              className="mr-1 p-0.5 hover:bg-gray-200 rounded"
            >
              {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>
          )}
          
          <FeatureIcon type={feature.type} />
          <span className="ml-2 text-sm truncate">{feature.name}</span>
          
          {feature.visible !== undefined && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                toggleFeatureVisibility(feature.id);
              }}
              className="ml-auto p-0.5 hover:bg-gray-200 rounded"
            >
              {feature.visible ? <Eye size={12} /> : <EyeOff size={12} />}
            </button>
          )}
        </div>
        
        {hasChildren && isExpanded && (
          <div>
            {feature.children.map(child => 
              renderFeatureNode(child, depth + 1)
            )}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="w-full">
      {features.map(feature => renderFeatureNode(feature))}
    </div>
  );
};
```

---

## State Management

### 1. Context Providers

#### UnitContext (`contexts/UnitContext.js`)
```jsx
const UnitContext = createContext();

export const UnitProvider = ({ children }) => {
  const [units, setUnits] = useState({
    length: 'mm',
    angle: 'deg',
    mass: 'kg'
  });
  
  const [precision, setPrecision] = useState({
    length: 2,
    angle: 1,
    mass: 3
  });
  
  const convertValue = useCallback((value, fromUnit, toUnit) => {
    return convertUnits(value, fromUnit, toUnit);
  }, []);
  
  const formatValue = useCallback((value, unit, customPrecision) => {
    const prec = customPrecision ?? precision[getUnitType(unit)];
    return `${value.toFixed(prec)} ${unit}`;
  }, [precision]);
  
  const contextValue = {
    units,
    setUnits,
    precision,
    setPrecision,
    convertValue,
    formatValue
  };
  
  return (
    <UnitContext.Provider value={contextValue}>
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

### 2. Custom Hooks

#### useModelStore
```jsx
export const useModelStore = () => {
  const [models, setModels] = useState([]);
  const [activeModelId, setActiveModelId] = useState(null);
  
  useEffect(() => {
    // Subscribe to model store changes
    const unsubscribe = modelStore.subscribe((newModels) => {
      setModels(newModels);
    });
    
    // Initial load
    setModels(modelStore.getAllModels());
    
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
    setActiveModelId(id);
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

#### useThreeScene
```jsx
export const useThreeScene = () => {
  const sceneRef = useRef();
  const rendererRef = useRef();
  const cameraRef = useRef();
  
  const initializeScene = useCallback((container) => {
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    
    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      50,
      container.offsetWidth / container.offsetHeight,
      0.1,
      2000
    );
    camera.position.set(50, 50, 50);
    
    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    container.appendChild(renderer.domElement);
    
    sceneRef.current = scene;
    rendererRef.current = renderer;
    cameraRef.current = camera;
    
    return { scene, camera, renderer };
  }, []);
  
  const cleanup = useCallback(() => {
    if (rendererRef.current) {
      rendererRef.current.dispose();
    }
  }, []);
  
  return {
    scene: sceneRef.current,
    camera: cameraRef.current,
    renderer: rendererRef.current,
    initializeScene,
    cleanup
  };
};
```

---

## Component Communication

### 1. Event-Driven Architecture

Components communicate through a centralized event system:

```jsx
// Event emitter for component communication
import { EventEmitter } from 'events';

class ComponentEventBus extends EventEmitter {
  // Model events
  emitModelAdded(model) {
    this.emit('model:added', model);
  }
  
  emitModelSelected(modelId) {
    this.emit('model:selected', modelId);
  }
  
  // Tool events
  emitToolChanged(toolId) {
    this.emit('tool:changed', toolId);
  }
  
  // View events
  emitViewChanged(viewData) {
    this.emit('view:changed', viewData);
  }
}

export const componentBus = new ComponentEventBus();
```

### 2. Cross-Component Data Flow

```jsx
// Example: Selection synchronization between sidebar and 3D viewer
const ModelBrowser = () => {
  const [selectedModel, setSelectedModel] = useState(null);
  
  useEffect(() => {
    const handleViewerSelection = (modelId) => {
      setSelectedModel(modelId);
    };
    
    componentBus.on('model:selected', handleViewerSelection);
    
    return () => {
      componentBus.off('model:selected', handleViewerSelection);
    };
  }, []);
  
  const handleModelClick = (modelId) => {
    setSelectedModel(modelId);
    componentBus.emitModelSelected(modelId);
  };
  
  // Component render...
};

const JscadViewer = () => {
  useEffect(() => {
    const handleModelSelection = (modelId) => {
      highlightModel(modelId);
    };
    
    componentBus.on('model:selected', handleModelSelection);
    
    return () => {
      componentBus.off('model:selected', handleModelSelection);
    };
  }, []);
  
  // Component implementation...
};
```

---

## Performance Patterns

### 1. Memoization

```jsx
// Expensive component memoization
const ModelTree = React.memo(({ models, filter, onSelect }) => {
  const filteredModels = useMemo(() => {
    return models.filter(model => 
      model.name.toLowerCase().includes(filter.toLowerCase())
    );
  }, [models, filter]);
  
  return (
    <div>
      {filteredModels.map(model => (
        <ModelTreeNode 
          key={model.id} 
          model={model} 
          onSelect={onSelect} 
        />
      ))}
    </div>
  );
});

// Callback memoization
const ToolButton = ({ tool, onSelect, isActive }) => {
  const handleClick = useCallback(() => {
    onSelect(tool.id);
  }, [tool.id, onSelect]);
  
  return (
    <button 
      onClick={handleClick}
      className={`p-2 rounded ${isActive ? 'bg-blue-500' : 'bg-gray-200'}`}
    >
      <tool.icon size={16} />
    </button>
  );
};
```

### 2. Virtual Scrolling

```jsx
// Large list optimization
const VirtualModelList = ({ models }) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
  const containerRef = useRef();
  
  useEffect(() => {
    const handleScroll = () => {
      const container = containerRef.current;
      const scrollTop = container.scrollTop;
      const itemHeight = 40;
      const viewportHeight = container.clientHeight;
      
      const start = Math.floor(scrollTop / itemHeight);
      const end = Math.min(
        start + Math.ceil(viewportHeight / itemHeight) + 5,
        models.length
      );
      
      setVisibleRange({ start, end });
    };
    
    const container = containerRef.current;
    container.addEventListener('scroll', handleScroll);
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [models.length]);
  
  const visibleModels = models.slice(visibleRange.start, visibleRange.end);
  
  return (
    <div 
      ref={containerRef}
      className="h-full overflow-y-auto"
      style={{ 
        height: models.length * 40,
        paddingTop: visibleRange.start * 40 
      }}
    >
      {visibleModels.map((model, index) => (
        <ModelItem 
          key={model.id}
          model={model}
          style={{ 
            position: 'absolute',
            top: (visibleRange.start + index) * 40,
            height: 40
          }}
        />
      ))}
    </div>
  );
};
```

---

## Component Lifecycle

### 1. Initialization Pattern

```jsx
const CADComponent = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState(null);
  
  useEffect(() => {
    const initializeComponent = async () => {
      try {
        // Heavy initialization logic
        await loadGeometryEngine();
        await setupRenderingContext();
        await loadUserPreferences();
        
        setIsInitialized(true);
      } catch (error) {
        setInitError(error);
      }
    };
    
    initializeComponent();
  }, []);
  
  if (initError) {
    return <ErrorBoundary error={initError} />;
  }
  
  if (!isInitialized) {
    return <LoadingSpinner />;
  }
  
  return <MainComponent />;
};
```

### 2. Cleanup Pattern

```jsx
const ThreeJSComponent = () => {
  const resourcesRef = useRef({
    geometries: [],
    materials: [],
    textures: []
  });
  
  useEffect(() => {
    return () => {
      // Cleanup Three.js resources
      resourcesRef.current.geometries.forEach(geom => geom.dispose());
      resourcesRef.current.materials.forEach(mat => mat.dispose());
      resourcesRef.current.textures.forEach(tex => tex.dispose());
    };
  }, []);
  
  const addGeometry = useCallback((geometry) => {
    resourcesRef.current.geometries.push(geometry);
  }, []);
  
  // Component implementation...
};
```

---

## Testing Strategies

### 1. Component Testing

```jsx
// ModelTree.test.js
import { render, fireEvent, screen } from '@testing-library/react';
import { ModelTree } from '../ModelTree';

describe('ModelTree', () => {
  const mockModels = [
    { id: '1', name: 'Cube', type: 'primitive' },
    { id: '2', name: 'Sphere', type: 'primitive' }
  ];
  
  test('renders model list', () => {
    render(<ModelTree models={mockModels} onSelect={jest.fn()} />);
    
    expect(screen.getByText('Cube')).toBeInTheDocument();
    expect(screen.getByText('Sphere')).toBeInTheDocument();
  });
  
  test('handles model selection', () => {
    const onSelect = jest.fn();
    render(<ModelTree models={mockModels} onSelect={onSelect} />);
    
    fireEvent.click(screen.getByText('Cube'));
    
    expect(onSelect).toHaveBeenCalledWith('1');
  });
  
  test('filters models by name', () => {
    render(
      <ModelTree 
        models={mockModels} 
        filter="cube" 
        onSelect={jest.fn()} 
      />
    );
    
    expect(screen.getByText('Cube')).toBeInTheDocument();
    expect(screen.queryByText('Sphere')).not.toBeInTheDocument();
  });
});
```

### 2. Integration Testing

```jsx
// CADInterface.integration.test.js
import { render, fireEvent, waitFor } from '@testing-library/react';
import { CADInterface } from '../CADInterface';
import { modelStore } from '../../lib/mcpTools';

describe('CAD Interface Integration', () => {
  test('creates and displays new model', async () => {
    const { container } = render(<CADInterface />);
    
    // Add a cube
    fireEvent.click(screen.getByLabelText('Add Cube'));
    
    await waitFor(() => {
      const models = modelStore.getAllModels();
      expect(models).toHaveLength(1);
      expect(models[0].name).toContain('Cube');
    });
    
    // Verify it appears in sidebar
    expect(screen.getByText(/Cube/)).toBeInTheDocument();
  });
  
  test('tool selection updates interface', () => {
    render(<CADInterface />);
    
    // Switch to sketch mode
    fireEvent.click(screen.getByText('Sketch'));
    
    expect(screen.getByText('Line')).toBeInTheDocument();
    expect(screen.getByText('Circle')).toBeInTheDocument();
  });
});
```

This component architecture documentation provides a comprehensive guide to understanding the structure, relationships, and patterns used throughout the OpenShape application. The modular design and clear separation of concerns make it easy to maintain and extend the application with new features.