# Feature Development Patterns for OpenShape

## 🎯 Purpose

This document provides step-by-step patterns for implementing common types of features in OpenShape. It's designed to help LLMs understand the established workflows and maintain consistency when adding new functionality.

## 📚 Table of Contents

1. [Adding New CAD Primitives](#adding-new-cad-primitives)
2. [Implementing Boolean Operations](#implementing-boolean-operations)
3. [Creating UI Components](#creating-ui-components)
4. [Adding Measurement Tools](#adding-measurement-tools)
5. [Implementing Import/Export Features](#implementing-importexport-features)
6. [Adding Interactive Tools](#adding-interactive-tools)
7. [Performance Optimization Patterns](#performance-optimization-patterns)
8. [Testing Implementation Patterns](#testing-implementation-patterns)

---

## Adding New CAD Primitives

### Pattern Overview
Adding a new primitive (like torus, cone, etc.) follows a consistent 4-step pattern:
1. Core geometry creation
2. Model store integration
3. UI controls
4. Parts library registration

### Step 1: Core Geometry Function

**File**: `lib/partsLibrary.js`

```javascript
// Pattern: Create[PrimitiveName] function
export const createTorus = (params = {}) => {
  try {
    // 1. Extract and validate parameters
    const outerRadius = Math.max(params.outerRadius || 10, 0.1);
    const innerRadius = Math.max(params.innerRadius || 5, 0.1);
    const segments = Math.max(params.segments || 32, 8);
    const position = params.position || [0, 0, 0];
    const name = params.name || `Torus`;

    // 2. Validate parameter relationships
    if (innerRadius >= outerRadius) {
      throw new Error('Inner radius must be smaller than outer radius');
    }

    // 3. Create JSCAD geometry
    const torus = jscad.primitives.torus({
      outerRadius,
      innerRadius,
      outerSegments: segments,
      innerSegments: segments / 2
    });

    // 4. Apply position transformation if needed
    const positionedTorus = position[0] !== 0 || position[1] !== 0 || position[2] !== 0
      ? jscad.transforms.translate(position, torus)
      : torus;

    // 5. Add to model store with metadata
    const modelId = modelStore.addModel(positionedTorus, name, {
      type: 'primitive',
      primitive: 'torus',
      parameters: { outerRadius, innerRadius, segments, position },
      created: Date.now()
    });

    // 6. Return standardized result
    return {
      success: true,
      modelId,
      model: positionedTorus,
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

### Step 2: UI Integration

**File**: Update the appropriate toolbar component

```javascript
// In FeatureToolbar.js or similar
const primitiveTools = [
  { id: 'cube', icon: <Box />, label: 'Cube', action: () => createCube() },
  { id: 'sphere', icon: <Circle />, label: 'Sphere', action: () => createSphere() },
  { id: 'cylinder', icon: <Cylinder />, label: 'Cylinder', action: () => createCylinder() },
  // Add new primitive
  { id: 'torus', icon: <Donut />, label: 'Torus', action: () => showTorusDialog() }
];

// Parameter input dialog
const TorusParameterDialog = ({ isOpen, onClose, onConfirm }) => {
  const [outerRadius, setOuterRadius] = useState(10);
  const [innerRadius, setInnerRadius] = useState(5);
  const [segments, setSegments] = useState(32);

  const handleConfirm = () => {
    const result = createTorus({
      outerRadius,
      innerRadius,
      segments,
      name: `Torus (${outerRadius}/${innerRadius})`
    });
    
    if (result.success) {
      onConfirm(result);
    } else {
      alert(result.error);
    }
  };

  // ... dialog UI implementation
};
```

### Step 3: Parts Library Registration

**File**: Register in the parts library system

```javascript
// In partsLibrary.js
export const primitiveLibrary = {
  cube: createCube,
  sphere: createSphere,
  cylinder: createCylinder,
  torus: createTorus, // Add new primitive
  // ... other primitives
};

// Export for UI consumption
export const primitiveDefinitions = [
  {
    id: 'torus',
    name: 'Torus',
    description: 'A donut-shaped object',
    icon: 'donut',
    parameters: [
      { name: 'outerRadius', type: 'number', default: 10, min: 0.1 },
      { name: 'innerRadius', type: 'number', default: 5, min: 0.1 },
      { name: 'segments', type: 'number', default: 32, min: 8, max: 128 }
    ],
    createFunction: createTorus
  }
];
```

---

## Implementing Boolean Operations

### Pattern Overview
Boolean operations follow a 3-step pattern:
1. Selection validation
2. Geometry operation
3. Result integration

### Step 1: Core Operation Function

**File**: `lib/cadOperations.js`

```javascript
// Pattern: perform[OperationName] function
export const performDifference = (modelIds) => {
  try {
    // 1. Validate input
    if (!Array.isArray(modelIds) || modelIds.length < 2) {
      throw new Error('Difference operation requires at least 2 models');
    }

    // 2. Get base model (first in selection)
    const baseModel = modelStore.getModel(modelIds[0]);
    if (!baseModel) {
      throw new Error(`Base model ${modelIds[0]} not found`);
    }

    // 3. Get subtraction models
    const subtractionGeometries = [];
    for (let i = 1; i < modelIds.length; i++) {
      const model = modelStore.getModel(modelIds[i]);
      if (!model) {
        throw new Error(`Model ${modelIds[i]} not found`);
      }
      subtractionGeometries.push(model.geometry);
    }

    // 4. Perform JSCAD operation
    let result = baseModel.geometry;
    for (const geometry of subtractionGeometries) {
      result = jscad.booleans.subtract(result, geometry);
    }

    // 5. Create meaningful name
    const resultName = `Difference (${modelIds.length} objects)`;

    // 6. Add result to model store
    const resultId = modelStore.addModel(result, resultName, {
      type: 'boolean',
      operation: 'difference',
      sourceModels: modelIds,
      baseModel: modelIds[0]
    });

    // 7. Optionally hide source models
    modelIds.forEach(id => {
      const model = modelStore.getModel(id);
      if (model) {
        model.visible = false;
      }
    });

    return {
      success: true,
      modelId: resultId,
      sourceModels: modelIds,
      message: `Difference operation completed successfully`
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};
```

### Step 2: UI Integration

```javascript
// In appropriate toolbar
const booleanOperations = [
  { 
    id: 'union', 
    icon: <Plus />, 
    label: 'Union',
    action: () => performBooleanOperation('union'),
    requiresMultiple: true
  },
  { 
    id: 'difference', 
    icon: <Minus />, 
    label: 'Difference',
    action: () => performBooleanOperation('difference'),
    requiresMultiple: true
  }
];

const performBooleanOperation = (operation) => {
  const selectedModels = getSelectedModels();
  
  if (selectedModels.length < 2) {
    alert('Please select at least 2 models for boolean operations');
    return;
  }

  let result;
  switch (operation) {
    case 'union':
      result = performUnion(selectedModels);
      break;
    case 'difference':
      result = performDifference(selectedModels);
      break;
    // ... other operations
  }

  if (result.success) {
    // Update UI to show result
    setActiveModel(result.modelId);
    clearSelection();
  } else {
    alert(`Operation failed: ${result.error}`);
  }
};
```

---

## Creating UI Components

### Pattern Overview
UI components follow React best practices with OpenShape-specific patterns:
1. Props interface definition
2. State management
3. Event handling
4. Integration with global state

### Step 1: Component Structure

```javascript
// Pattern: Component with props, state, and effects
const ModelPropertyPanel = ({ 
  selectedModelId, 
  onModelUpdate, 
  onClose 
}) => {
  // 1. State management
  const [model, setModel] = useState(null);
  const [parameters, setParameters] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // 2. Load model data
  useEffect(() => {
    if (!selectedModelId) {
      setModel(null);
      return;
    }

    const modelData = modelStore.getModel(selectedModelId);
    if (modelData) {
      setModel(modelData);
      setParameters(modelData.metadata.parameters || {});
      setHasChanges(false);
    }
  }, [selectedModelId]);

  // 3. Handle parameter changes
  const handleParameterChange = useCallback((paramName, value) => {
    setParameters(prev => ({
      ...prev,
      [paramName]: value
    }));
    setHasChanges(true);
  }, []);

  // 4. Apply changes
  const handleApplyChanges = async () => {
    if (!model || !hasChanges) return;

    setIsLoading(true);
    try {
      // Regenerate geometry with new parameters
      const regenerateFunction = primitiveLibrary[model.metadata.primitive];
      if (!regenerateFunction) {
        throw new Error('Cannot regenerate this model type');
      }

      const result = regenerateFunction(parameters);
      if (!result.success) {
        throw new Error(result.error);
      }

      // Update model in store
      model.geometry = result.model;
      model.metadata.parameters = parameters;
      model.modified = Date.now();

      notifyModelChanged({ id: model.id, action: 'update' });
      onModelUpdate?.(model.id);
      setHasChanges(false);

    } catch (error) {
      alert(`Failed to update model: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Render component
  return (
    <div className="bg-white border-l w-80 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Properties</h3>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
          <X size={16} />
        </button>
      </div>

      {model ? (
        <div className="space-y-4">
          {/* Model info */}
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={model.name}
              onChange={(e) => {
                model.name = e.target.value;
                setHasChanges(true);
              }}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {/* Parameters */}
          {Object.entries(parameters).map(([key, value]) => (
            <ParameterInput
              key={key}
              name={key}
              value={value}
              onChange={(val) => handleParameterChange(key, val)}
            />
          ))}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleApplyChanges}
              disabled={!hasChanges || isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
            >
              {isLoading ? 'Applying...' : 'Apply Changes'}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 py-8">
          No model selected
        </div>
      )}
    </div>
  );
};
```

### Step 2: Parameter Input Component

```javascript
// Reusable parameter input component
const ParameterInput = ({ name, value, onChange, type = 'number' }) => {
  const { formatValue, units } = useUnits();

  const handleChange = (e) => {
    const newValue = type === 'number' 
      ? parseFloat(e.target.value) || 0 
      : e.target.value;
    onChange(newValue);
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-1 capitalize">
        {name.replace(/([A-Z])/g, ' $1').trim()}
      </label>
      <div className="flex items-center gap-2">
        <input
          type={type}
          value={value}
          onChange={handleChange}
          className="flex-1 border rounded px-3 py-2"
          step={type === 'number' ? 0.1 : undefined}
        />
        {type === 'number' && (
          <span className="text-sm text-gray-500">{units.length}</span>
        )}
      </div>
    </div>
  );
};
```

---

## Adding Measurement Tools

### Pattern Overview
Measurement tools follow a 4-step pattern:
1. Geometry calculation
2. Visual representation
3. UI controls
4. Data export

### Step 1: Measurement Calculation

**File**: `utils/measurementUtils.js`

```javascript
// Pattern: calculate[MeasurementType] function
export const calculateSurfaceArea = (geometry) => {
  try {
    // 1. Validate input
    if (!geometry || !geometry.polygons) {
      throw new Error('Invalid geometry for surface area calculation');
    }

    // 2. Calculate area for each polygon
    let totalArea = 0;
    
    for (const polygon of geometry.polygons) {
      if (!polygon.vertices || polygon.vertices.length < 3) {
        continue; // Skip invalid polygons
      }

      // 3. Calculate polygon area using cross product method
      const area = calculatePolygonArea(polygon.vertices);
      totalArea += area;
    }

    // 4. Return result with metadata
    return {
      success: true,
      value: totalArea,
      unit: 'mm²', // Default unit
      precision: 2,
      timestamp: Date.now()
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Helper function for polygon area calculation
const calculatePolygonArea = (vertices) => {
  if (vertices.length < 3) return 0;

  // Use the shoelace formula for 3D polygons
  let area = 0;
  const n = vertices.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const cross = crossProduct(vertices[i], vertices[j]);
    area += vectorLength(cross);
  }

  return area / 2;
};
```

### Step 2: Measurement Component

**File**: `components/measurements/SurfaceAreaMeasurement.js`

```javascript
const SurfaceAreaMeasurement = ({ 
  selectedModelId, 
  onMeasurementComplete 
}) => {
  const [measurement, setMeasurement] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const { formatValue, convertValue, units } = useUnits();

  const handleCalculate = async () => {
    if (!selectedModelId) {
      alert('Please select a model to measure');
      return;
    }

    setIsCalculating(true);
    try {
      const model = modelStore.getModel(selectedModelId);
      if (!model) {
        throw new Error('Model not found');
      }

      const result = calculateSurfaceArea(model.geometry);
      if (!result.success) {
        throw new Error(result.error);
      }

      // Convert to current units
      const convertedValue = convertValue(
        result.value, 
        'mm²', 
        `${units.length}²`
      );

      const measurementData = {
        id: generateId(),
        type: 'surface_area',
        modelId: selectedModelId,
        value: convertedValue,
        unit: `${units.length}²`,
        timestamp: Date.now(),
        formatted: formatValue(convertedValue, `${units.length}²`)
      };

      setMeasurement(measurementData);
      onMeasurementComplete?.(measurementData);

    } catch (error) {
      alert(`Measurement failed: ${error.message}`);
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="bg-white border rounded p-4">
      <h4 className="font-medium mb-3">Surface Area Measurement</h4>
      
      <button
        onClick={handleCalculate}
        disabled={!selectedModelId || isCalculating}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 mb-3"
      >
        {isCalculating ? 'Calculating...' : 'Calculate Surface Area'}
      </button>

      {measurement && (
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium">Area:</span>
            <span className="text-sm">{measurement.formatted}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm font-medium">Model:</span>
            <span className="text-sm">{
              modelStore.getModel(measurement.modelId)?.name
            }</span>
          </div>

          <div className="flex gap-2 mt-3">
            <button
              onClick={() => copyToClipboard(measurement.formatted)}
              className="flex-1 px-3 py-1 text-sm border rounded hover:bg-gray-50"
            >
              Copy
            </button>
            <button
              onClick={() => exportMeasurement(measurement)}
              className="flex-1 px-3 py-1 text-sm border rounded hover:bg-gray-50"
            >
              Export
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
```

---

## Adding Interactive Tools

### Pattern Overview
Interactive tools follow a state machine pattern:
1. Tool activation
2. User interaction handling
3. Visual feedback
4. Result application

### Step 1: Tool State Management

```javascript
// Pattern: Interactive tool with state machine
export const useSketchTool = (toolType) => {
  const [toolState, setToolState] = useState('idle');
  const [currentPoints, setCurrentPoints] = useState([]);
  const [previewGeometry, setPreviewGeometry] = useState(null);

  // State machine transitions
  const states = {
    idle: {
      onActivate: () => setToolState('active'),
      allowedActions: ['activate']
    },
    active: {
      onMouseDown: (point) => {
        setCurrentPoints([point]);
        setToolState('drawing');
      },
      onCancel: () => setToolState('idle'),
      allowedActions: ['mouseDown', 'cancel']
    },
    drawing: {
      onMouseMove: (point) => {
        if (toolType === 'line') {
          const preview = createLinePreview(currentPoints[0], point);
          setPreviewGeometry(preview);
        }
      },
      onMouseUp: (point) => {
        const finalPoints = [...currentPoints, point];
        const geometry = createFinalGeometry(toolType, finalPoints);
        setToolState('complete');
        return geometry;
      },
      onCancel: () => {
        setToolState('idle');
        setCurrentPoints([]);
        setPreviewGeometry(null);
      },
      allowedActions: ['mouseMove', 'mouseUp', 'cancel']
    },
    complete: {
      onConfirm: (geometry) => {
        // Add to sketch manager
        setToolState('idle');
        setCurrentPoints([]);
        setPreviewGeometry(null);
        return true;
      },
      onCancel: () => setToolState('drawing'),
      allowedActions: ['confirm', 'cancel']
    }
  };

  const executeAction = (action, ...args) => {
    const currentState = states[toolState];
    if (currentState.allowedActions.includes(action)) {
      return currentState[`on${action.charAt(0).toUpperCase() + action.slice(1)}`]?.(...args);
    }
    console.warn(`Action ${action} not allowed in state ${toolState}`);
  };

  return {
    toolState,
    currentPoints,
    previewGeometry,
    executeAction
  };
};
```

### Step 2: Tool Integration

```javascript
// Interactive tool component
const SketchLineTool = ({ isActive, onGeometryCreated }) => {
  const { toolState, currentPoints, previewGeometry, executeAction } = useSketchTool('line');
  const canvasRef = useRef(null);

  // Handle mouse events
  useEffect(() => {
    if (!isActive || !canvasRef.current) return;

    const canvas = canvasRef.current;
    
    const handleMouseDown = (event) => {
      const point = getCanvasPoint(event, canvas);
      executeAction('mouseDown', point);
    };

    const handleMouseMove = (event) => {
      if (toolState === 'drawing') {
        const point = getCanvasPoint(event, canvas);
        executeAction('mouseMove', point);
      }
    };

    const handleMouseUp = (event) => {
      if (toolState === 'drawing') {
        const point = getCanvasPoint(event, canvas);
        const geometry = executeAction('mouseUp', point);
        if (geometry) {
          onGeometryCreated(geometry);
        }
      }
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isActive, toolState, executeAction]);

  // Activate tool when becoming active
  useEffect(() => {
    if (isActive && toolState === 'idle') {
      executeAction('activate');
    }
  }, [isActive]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className={`w-full h-full ${isActive ? 'cursor-crosshair' : 'cursor-default'}`}
      />
      
      {toolState === 'drawing' && (
        <div className="absolute top-2 left-2 bg-yellow-100 px-2 py-1 rounded text-sm">
          Click to set end point
        </div>
      )}
      
      {toolState === 'complete' && (
        <div className="absolute top-2 left-2 bg-green-100 px-2 py-1 rounded text-sm">
          Press Enter to confirm, Escape to cancel
        </div>
      )}
    </div>
  );
};
```

---

## Performance Optimization Patterns

### Pattern Overview
Performance optimizations focus on:
1. React rendering optimization
2. 3D geometry optimization
3. Memory management
4. Computation optimization

### Step 1: React Performance

```javascript
// Memoization patterns
const OptimizedModelList = React.memo(({ models, onModelSelect }) => {
  // Memoize expensive calculations
  const sortedModels = useMemo(() => {
    return models.sort((a, b) => a.name.localeCompare(b.name));
  }, [models]);

  // Memoize callbacks
  const handleModelSelect = useCallback((modelId) => {
    onModelSelect(modelId);
  }, [onModelSelect]);

  return (
    <div className="space-y-1">
      {sortedModels.map(model => (
        <OptimizedModelItem
          key={model.id}
          model={model}
          onSelect={handleModelSelect}
        />
      ))}
    </div>
  );
});

// Item-level memoization
const OptimizedModelItem = React.memo(({ model, onSelect }) => {
  const handleClick = useCallback(() => {
    onSelect(model.id);
  }, [model.id, onSelect]);

  return (
    <div onClick={handleClick} className="p-2 hover:bg-gray-50">
      {model.name}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for fine-grained control
  return prevProps.model.id === nextProps.model.id &&
         prevProps.model.name === nextProps.model.name &&
         prevProps.model.visible === nextProps.model.visible;
});
```

### Step 2: 3D Optimization

```javascript
// Geometry optimization patterns
const optimizeGeometry = (geometry) => {
  // 1. Simplify if too complex
  if (geometry.polygons && geometry.polygons.length > 10000) {
    return simplifyGeometry(geometry, 0.1); // 10% reduction
  }

  // 2. Merge coplanar faces
  return mergeFaces(geometry);
};

// Level of Detail system
const LODManager = {
  levels: new Map(),
  
  generateLOD(geometry, distances = [10, 50, 100]) {
    const lods = [geometry]; // Original at distance 0
    
    for (const distance of distances) {
      const simplificationFactor = Math.min(distance / 100, 0.9);
      const simplifiedGeometry = simplifyGeometry(geometry, simplificationFactor);
      lods.push(simplifiedGeometry);
    }
    
    return lods;
  },

  selectLOD(geometryId, cameraDistance) {
    const lods = this.levels.get(geometryId);
    if (!lods) return null;

    if (cameraDistance < 10) return lods[0];
    if (cameraDistance < 50) return lods[1];
    if (cameraDistance < 100) return lods[2];
    return lods[3];
  }
};
```

---

**For LLMs**: These patterns provide proven approaches for implementing common features in OpenShape. Always follow the established patterns to maintain consistency and reliability. Consider performance implications and test thoroughly before deployment.