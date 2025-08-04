# OpenShape Development Guide

## Table of Contents

1. [Development Environment Setup](#development-environment-setup)
2. [Project Structure & Conventions](#project-structure--conventions)
3. [Coding Standards](#coding-standards)
4. [Development Workflow](#development-workflow)
5. [Testing Guidelines](#testing-guidelines)
6. [Performance Best Practices](#performance-best-practices)
7. [Debugging & Troubleshooting](#debugging--troubleshooting)
8. [Contribution Guidelines](#contribution-guidelines)
9. [Release Process](#release-process)
10. [Advanced Development Topics](#advanced-development-topics)

---

## Development Environment Setup

### Prerequisites

**Required Software:**
- Node.js (v18+ recommended)
- npm (v8+ or yarn v1.22+)
- Git
- Modern web browser with WebGL support

**Recommended Tools:**
- Visual Studio Code with extensions:
  - ES7+ React/Redux/React-Native snippets
  - TypeScript and JavaScript Language Features
  - Tailwind CSS IntelliSense
  - Three.js snippets
  - GitLens
  - Prettier - Code formatter
  - ESLint

### Initial Setup

1. **Clone the Repository:**
```bash
git clone <repository-url>
cd openshape
```

2. **Install Dependencies:**
```bash
npm install
# or
yarn install
```

3. **Environment Configuration:**
```bash
# Copy environment template
cp .env.example .env.local

# Edit environment variables
# NEXT_PUBLIC_API_URL=http://localhost:3000/api
# NEXT_PUBLIC_ENABLE_DEV_TOOLS=true
```

4. **Start Development Server:**
```bash
npm run dev
# or
yarn dev
```

5. **Verify Installation:**
   - Open http://localhost:3000
   - Check browser console for errors
   - Test 3D viewer functionality
   - Verify JSCAD code evaluation works

### Development Scripts

```bash
# Development
npm run dev          # Start development server
npm run dev:turbo    # Start with Turbopack (experimental)

# Building
npm run build        # Production build
npm run start        # Serve production build

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix auto-fixable issues
npm run type-check   # TypeScript checking

# Testing
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage

# Maintenance
npm run clean        # Clean build artifacts
npm run analyze      # Bundle analysis
```

---

## Project Structure & Conventions

### Directory Organization

```
openshape/
├── components/           # Reusable UI components
│   ├── ui/              # Basic UI components (buttons, inputs)
│   ├── cad/             # CAD-specific components
│   ├── 3d/              # 3D visualization components
│   └── layout/          # Layout components
├── contexts/            # React Context providers
├── hooks/               # Custom React hooks
├── lib/                 # Core business logic
│   ├── cad/             # CAD operations and utilities
│   ├── 3d/              # 3D rendering utilities
│   └── utils/           # General utilities
├── pages/               # Next.js pages/routes
│   ├── api/             # API routes
│   └── _app.js          # App configuration
├── public/              # Static assets
├── styles/              # Global styles and Tailwind config
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
└── __tests__/           # Test files
```

### File Naming Conventions

**Components:**
- PascalCase for component files: `ModelViewer.js`
- camelCase for utility components: `useModelStore.js`

**Pages:**
- kebab-case: `cad-interface.js`
- Use descriptive names: `model-browser.js`

**Utilities and Libraries:**
- camelCase: `geometryUtils.js`
- Group related functions: `cadOperations.js`

**Constants:**
- UPPER_SNAKE_CASE: `API_ENDPOINTS.js`
- Group by domain: `CAD_CONSTANTS.js`

### Import Organization

**Order imports in this sequence:**
```javascript
// 1. External libraries
import React, { useState, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// 2. Internal modules (absolute imports)
import { modelStore } from '@/lib/mcpTools';
import { evaluateJSCAD } from '@/lib/jscadProcessor';

// 3. Relative imports
import Sidebar from '../components/Sidebar';
import { formatValue } from '../utils/unitUtils';

// 4. Type imports (if using TypeScript)
import type { ModelData, GeometryConfig } from '../types/cad';
```

---

## Coding Standards

### JavaScript/TypeScript Style

**General Principles:**
- Use meaningful variable and function names
- Prefer const over let, avoid var
- Use arrow functions for callbacks and short functions
- Implement proper error handling
- Write self-documenting code with minimal comments

**Function Declarations:**
```javascript
// Preferred: Arrow functions for pure functions
const calculateVolume = (geometry) => {
  return geometry.vertices.length * 0.5; // Simplified example
};

// Use function declarations for hoisted functions
function initializeCADEngine() {
  // Initialization logic
}

// Async functions with proper error handling
const loadModel = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load model: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Model loading error:', error);
    throw error;
  }
};
```

**Object and Array Handling:**
```javascript
// Use destructuring
const { models, activeModelId } = useModelStore();
const [geometry, setGeometry] = useState(null);

// Spread operator for immutable updates
const updatedModels = [...models, newModel];
const updatedConfig = { ...config, precision: 2 };

// Optional chaining and nullish coalescing
const modelName = model?.metadata?.name ?? 'Untitled';
```

### React Component Patterns

**Functional Components with Hooks:**
```javascript
const ModelViewer = ({ modelId, onModelSelect }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const modelRef = useRef(null);
  
  // Custom hooks for complex logic
  const { models, addModel } = useModelStore();
  const { scene, camera, renderer } = useThreeScene();
  
  // Effect with cleanup
  useEffect(() => {
    const handleResize = () => {
      // Resize logic
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Memoized callbacks
  const handleModelClick = useCallback((id) => {
    onModelSelect?.(id);
  }, [onModelSelect]);
  
  // Conditional rendering
  if (error) {
    return <ErrorDisplay error={error} onRetry={() => setError(null)} />;
  }
  
  return (
    <div className="model-viewer">
      {/* Component content */}
    </div>
  );
};

// PropTypes or TypeScript interfaces
ModelViewer.propTypes = {
  modelId: PropTypes.string,
  onModelSelect: PropTypes.func
};
```

**Performance Optimization:**
```javascript
// Memoize expensive components
const ExpensiveModelList = React.memo(({ models, filter }) => {
  const filteredModels = useMemo(() => 
    models.filter(model => model.name.includes(filter)), 
    [models, filter]
  );
  
  return (
    <div>
      {filteredModels.map(model => (
        <ModelItem key={model.id} model={model} />
      ))}
    </div>
  );
});

// Stable references for callbacks
const useStableCallback = (callback, deps) => {
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  return useCallback((...args) => {
    return callbackRef.current(...args);
  }, deps);
};
```

### Error Handling Patterns

**Component Error Boundaries:**
```javascript
class CADErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('CAD Error:', error, errorInfo);
    // Send to error reporting service
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Something went wrong with the CAD engine</h2>
          <details>
            <summary>Error details</summary>
            <pre>{this.state.error?.toString()}</pre>
          </details>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

**Async Error Handling:**
```javascript
// Custom hook for async operations
const useAsyncOperation = () => {
  const [state, setState] = useState({
    data: null,
    loading: false,
    error: null
  });
  
  const execute = useCallback(async (asyncFn) => {
    setState({ data: null, loading: true, error: null });
    
    try {
      const result = await asyncFn();
      setState({ data: result, loading: false, error: null });
      return result;
    } catch (error) {
      setState({ data: null, loading: false, error });
      throw error;
    }
  }, []);
  
  return { ...state, execute };
};
```

### CAD-Specific Patterns

**JSCAD Code Evaluation:**
```javascript
const evaluateCADCode = (code, context = {}) => {
  // Validation
  if (!code || typeof code !== 'string') {
    throw new Error('Invalid CAD code provided');
  }
  
  // Security check - basic validation
  if (code.includes('eval') || code.includes('Function')) {
    throw new Error('Potentially unsafe code detected');
  }
  
  try {
    // Create sandboxed execution context
    const safeContext = {
      ...defaultJSCADContext,
      ...context
    };
    
    const evalFunction = new Function(
      ...Object.keys(safeContext),
      `${code}; return typeof main === 'function' ? main() : null;`
    );
    
    const result = evalFunction(...Object.values(safeContext));
    
    // Validate result
    if (!result || typeof result !== 'object') {
      throw new Error('CAD code must return a valid geometry object');
    }
    
    return result;
  } catch (error) {
    console.error('CAD evaluation error:', error);
    throw new Error(`CAD code evaluation failed: ${error.message}`);
  }
};
```

**3D Resource Management:**
```javascript
const useThreeResources = () => {
  const resourcesRef = useRef({
    geometries: new Set(),
    materials: new Set(),
    textures: new Set()
  });
  
  const addResource = useCallback((resource, type) => {
    resourcesRef.current[type].add(resource);
  }, []);
  
  const cleanup = useCallback(() => {
    Object.values(resourcesRef.current).forEach(resourceSet => {
      resourceSet.forEach(resource => {
        if (resource.dispose) {
          resource.dispose();
        }
      });
      resourceSet.clear();
    });
  }, []);
  
  useEffect(() => {
    return cleanup;
  }, [cleanup]);
  
  return { addResource, cleanup };
};
```

---

## Development Workflow

### Git Workflow

**Branch Naming:**
- `feature/component-name` - New features
- `fix/issue-description` - Bug fixes
- `refactor/module-name` - Code refactoring
- `docs/section-name` - Documentation updates

**Commit Message Format:**
```
type(scope): brief description

Longer description if needed

- List specific changes
- Reference issue numbers: #123
- Break down complex changes

Co-authored-by: Name <email@example.com>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Example Commits:**
```
feat(3d-viewer): add mesh selection highlighting

- Implement raycasting for object selection
- Add outline effect for selected objects  
- Update selection state in model store
- Closes #45

fix(jscad): handle invalid geometry gracefully

- Add validation before Three.js conversion
- Show user-friendly error messages
- Prevent app crashes from malformed geometry
- Fixes #67
```

### Development Process

**1. Feature Development:**
```bash
# Create feature branch
git checkout -b feature/measurement-tools

# Work on feature with frequent commits
git add .
git commit -m "feat(measurements): add distance measurement tool"

# Keep branch updated
git fetch origin
git rebase origin/main

# Push feature branch
git push origin feature/measurement-tools

# Create pull request
```

**2. Code Review Checklist:**
- [ ] Code follows style guidelines
- [ ] All tests pass
- [ ] No console errors or warnings
- [ ] Performance impact considered
- [ ] Documentation updated if needed
- [ ] Accessibility considerations
- [ ] Cross-browser compatibility

**3. Local Testing:**
```bash
# Run full test suite
npm run test

# Type checking
npm run type-check

# Linting
npm run lint

# Build verification
npm run build

# Manual testing checklist:
# - Basic CAD operations work
# - 3D viewer renders correctly
# - No memory leaks in dev tools
# - Error handling works as expected
```

### Hot Reloading & Development Server

**Optimization for faster development:**
```javascript
// next.config.js additions for development
const nextConfig = {
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Enable source maps for better debugging
      config.devtool = 'eval-source-map';
      
      // Optimize for development speed
      config.optimization = {
        ...config.optimization,
        usedExports: false,
        sideEffects: false
      };
    }
    
    return config;
  }
};
```

**Development Environment Variables:**
```bash
# .env.local
NEXT_PUBLIC_DEV_MODE=true
NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING=true
NEXT_PUBLIC_LOG_LEVEL=debug
```

---

## Testing Guidelines

### Testing Strategy

**Testing Pyramid:**
1. **Unit Tests (70%)**: Individual functions and components
2. **Integration Tests (20%)**: Component interactions
3. **E2E Tests (10%)**: Complete user workflows

### Unit Testing

**Component Testing with React Testing Library:**
```javascript
// ModelViewer.test.js
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModelViewer } from '../ModelViewer';
import { modelStore } from '../../lib/mcpTools';

// Mock external dependencies
jest.mock('../../lib/mcpTools');
jest.mock('three', () => ({
  Scene: jest.fn(),
  PerspectiveCamera: jest.fn(),
  WebGLRenderer: jest.fn(() => ({
    setSize: jest.fn(),
    render: jest.fn(),
    domElement: document.createElement('canvas')
  }))
}));

describe('ModelViewer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders loading state initially', () => {
    render(<ModelViewer />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
  
  test('displays model when loaded', async () => {
    const mockModel = { id: '1', name: 'Test Cube', geometry: {} };
    modelStore.getModel.mockResolvedValue(mockModel);
    
    render(<ModelViewer modelId="1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Cube')).toBeInTheDocument();
    });
  });
  
  test('handles selection events', async () => {
    const onSelect = jest.fn();
    const user = userEvent.setup();
    
    render(<ModelViewer modelId="1" onModelSelect={onSelect} />);
    
    const canvas = screen.getByRole('img'); // canvas has img role
    await user.click(canvas);
    
    expect(onSelect).toHaveBeenCalledWith('1');
  });
});
```

**Utility Function Testing:**
```javascript
// geometryUtils.test.js
import { calculateVolume, validateGeometry } from '../geometryUtils';

describe('geometryUtils', () => {
  describe('calculateVolume', () => {
    test('calculates volume for valid geometry', () => {
      const geometry = {
        vertices: [[0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]],
        faces: [[0, 1, 2], [0, 1, 3], [0, 2, 3], [1, 2, 3]]
      };
      
      const volume = calculateVolume(geometry);
      expect(volume).toBeCloseTo(0.166667, 5);
    });
    
    test('throws error for invalid geometry', () => {
      expect(() => calculateVolume(null)).toThrow('Invalid geometry');
      expect(() => calculateVolume({})).toThrow('Missing vertices');
    });
  });
});
```

### Integration Testing

**Component Integration:**
```javascript
// CADWorkspace.integration.test.js
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CADWorkspace } from '../CADWorkspace';
import { UnitProvider } from '../../contexts/UnitContext';

const renderWithProviders = (component) => {
  return render(
    <UnitProvider>
      {component}
    </UnitProvider>
  );
};

describe('CAD Workspace Integration', () => {
  test('creates model and updates UI', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(<CADWorkspace />);
    
    // Add a cube primitive
    const addCubeButton = screen.getByLabelText('Add Cube');
    await user.click(addCubeButton);
    
    // Verify model appears in sidebar
    await waitFor(() => {
      expect(screen.getByText(/cube/i)).toBeInTheDocument();
    });
    
    // Verify 3D viewer updates
    const canvas = screen.getByRole('img');
    expect(canvas).toBeInTheDocument();
    
    // Check model store state
    const models = modelStore.getAllModels();
    expect(models).toHaveLength(1);
    expect(models[0].name).toContain('Cube');
  });
  
  test('sketch workflow', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(<CADWorkspace />);
    
    // Enter sketch mode
    await user.click(screen.getByText('Sketch'));
    
    // Select line tool
    await user.click(screen.getByLabelText('Line Tool'));
    
    // Draw on canvas
    const canvas = screen.getByRole('img');
    await user.click(canvas, { clientX: 100, clientY: 100 });
    await user.click(canvas, { clientX: 200, clientY: 100 });
    
    // Verify sketch entity created
    await waitFor(() => {
      const sketches = sketchManager.getAllSketches();
      expect(sketches).toHaveLength(1);
      expect(sketches[0].entities).toHaveLength(1);
    });
  });
});
```

### E2E Testing with Playwright

```javascript
// e2e/cad-workflow.spec.js
import { test, expect } from '@playwright/test';

test.describe('CAD Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/cad-interface');
    await page.waitForLoadState('networkidle');
  });
  
  test('complete model creation workflow', async ({ page }) => {
    // Create a cube
    await page.click('[aria-label="Add Cube"]');
    
    // Verify model in sidebar
    await expect(page.locator('.sidebar')).toContainText('Cube');
    
    // Modify parameters
    await page.fill('[data-testid="width-input"]', '20');
    await page.press('[data-testid="width-input"]', 'Enter');
    
    // Export model
    await page.click('[aria-label="Export Model"]');
    await page.selectOption('[data-testid="format-select"]', 'stl');
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-button"]');
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toMatch(/\.stl$/);
  });
  
  test('error handling', async ({ page }) => {
    // Test invalid JSCAD code
    await page.click('[data-testid="code-editor"]');
    await page.fill('[data-testid="code-editor"]', 'invalid code');
    await page.click('[data-testid="evaluate-button"]');
    
    // Verify error message
    await expect(page.locator('.error-message')).toContainText('evaluation failed');
  });
});
```

### Testing CAD-Specific Functionality

**JSCAD Evaluation Testing:**
```javascript
// jscadProcessor.test.js
import { evaluateJSCAD } from '../jscadProcessor';

describe('JSCAD Processor', () => {
  test('evaluates valid JSCAD code', () => {
    const code = `
      function main() {
        return cube({ size: 10 });
      }
    `;
    
    const result = evaluateJSCAD(code);
    expect(result).toBeDefined();
    expect(result.polygons).toBeDefined();
  });
  
  test('handles syntax errors gracefully', () => {
    const invalidCode = 'function main() { return cube( }';
    
    expect(() => evaluateJSCAD(invalidCode)).toThrow();
  });
  
  test('provides proper context functions', () => {
    const code = `
      function main() {
        return union(
          cube({ size: 5 }),
          translate([10, 0, 0], sphere({ radius: 3 }))
        );
      }
    `;
    
    const result = evaluateJSCAD(code);
    expect(result).toBeDefined();
  });
});
```

---

## Performance Best Practices

### React Performance

**Memoization Strategies:**
```javascript
// Expensive calculations
const ExpensiveModelProcessor = ({ models, filters }) => {
  const processedModels = useMemo(() => {
    return models
      .filter(model => applyFilters(model, filters))
      .map(model => processModelData(model))
      .sort(compareModels);
  }, [models, filters]);
  
  return <ModelList models={processedModels} />;
};

// Stable references
const ModelEditor = ({ model, onUpdate }) => {
  // Memoize callbacks to prevent unnecessary re-renders
  const handleNameChange = useCallback((newName) => {
    onUpdate({ ...model, name: newName });
  }, [model, onUpdate]);
  
  const handleGeometryChange = useCallback((newGeometry) => {
    onUpdate({ ...model, geometry: newGeometry });
  }, [model, onUpdate]);
  
  return (
    <div>
      <NameEditor value={model.name} onChange={handleNameChange} />
      <GeometryEditor geometry={model.geometry} onChange={handleGeometryChange} />
    </div>
  );
};
```

**Code Splitting:**
```javascript
// Dynamic imports for heavy components
const HeavyCADComponent = lazy(() => 
  import('../components/HeavyCADComponent')
);

const ModelViewer = () => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  return (
    <div>
      <BasicViewer />
      
      {showAdvanced && (
        <Suspense fallback={<LoadingSpinner />}>
          <HeavyCADComponent />
        </Suspense>
      )}
    </div>
  );
};
```

### 3D Performance

**Geometry Optimization:**
```javascript
const optimizeGeometry = (geometry) => {
  // Simplify complex geometries
  if (geometry.vertices.length > MAX_VERTICES) {
    return simplifyGeometry(geometry, SIMPLIFICATION_RATIO);
  }
  
  // Merge similar vertices
  const mergedGeometry = mergeVertices(geometry, VERTEX_PRECISION);
  
  // Calculate normals if missing
  if (!mergedGeometry.normals) {
    mergedGeometry.normals = calculateNormals(mergedGeometry);
  }
  
  return mergedGeometry;
};

// Level of detail system
const LODManager = {
  createLODs(geometry, distances = [10, 50, 100]) {
    return distances.map(distance => ({
      distance,
      geometry: simplifyGeometry(geometry, distance / 100)
    }));
  },
  
  selectLOD(lods, cameraDistance) {
    return lods.find(lod => cameraDistance <= lod.distance) || lods[lods.length - 1];
  }
};
```

**Rendering Optimization:**
```javascript
// Frustum culling
const useFrustumCulling = (objects, camera) => {
  const frustum = useMemo(() => new THREE.Frustum(), []);
  
  const visibleObjects = useMemo(() => {
    const matrix = new THREE.Matrix4()
      .multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(matrix);
    
    return objects.filter(obj => frustum.intersectsObject(obj));
  }, [objects, camera.position, camera.rotation]);
  
  return visibleObjects;
};

// Batch rendering
const BatchRenderer = {
  batches: new Map(),
  
  addToBatch(geometry, material, transform) {
    const key = `${geometry.uuid}_${material.uuid}`;
    
    if (!this.batches.has(key)) {
      this.batches.set(key, {
        geometry,
        material,
        instances: []
      });
    }
    
    this.batches.get(key).instances.push(transform);
  },
  
  render(scene, camera, renderer) {
    this.batches.forEach(batch => {
      const instancedMesh = new THREE.InstancedMesh(
        batch.geometry,
        batch.material,
        batch.instances.length
      );
      
      batch.instances.forEach((transform, index) => {
        instancedMesh.setMatrixAt(index, transform);
      });
      
      scene.add(instancedMesh);
    });
  }
};
```

### Memory Management

**Resource Disposal:**
```javascript
const useThreeResourceManager = () => {
  const resources = useRef(new Set());
  
  const addResource = useCallback((resource) => {
    resources.current.add(resource);
  }, []);
  
  const removeResource = useCallback((resource) => {
    if (resource.dispose) {
      resource.dispose();
    }
    resources.current.delete(resource);
  }, []);
  
  const cleanup = useCallback(() => {
    resources.current.forEach(resource => {
      if (resource.dispose) {
        resource.dispose();
      }
    });
    resources.current.clear();
  }, []);
  
  useEffect(() => {
    return cleanup;
  }, [cleanup]);
  
  return { addResource, removeResource, cleanup };
};
```

**Memory Leak Prevention:**
```javascript
// Proper event listener cleanup
const useCADEvents = () => {
  useEffect(() => {
    const handleModelChange = (event) => {
      // Handle model changes
    };
    
    const handleSelectionChange = (event) => {
      // Handle selection changes
    };
    
    // Add listeners
    eventBus.on('model:changed', handleModelChange);
    eventBus.on('selection:changed', handleSelectionChange);
    
    return () => {
      // Cleanup listeners
      eventBus.off('model:changed', handleModelChange);
      eventBus.off('selection:changed', handleSelectionChange);
    };
  }, []);
};

// WeakMap for object associations
const objectMetadata = new WeakMap();

const setObjectMetadata = (object, metadata) => {
  objectMetadata.set(object, metadata);
};

const getObjectMetadata = (object) => {
  return objectMetadata.get(object);
};
```

---

## Debugging & Troubleshooting

### Development Tools

**Browser DevTools Setup:**
```javascript
// Add development utilities to window object
if (process.env.NODE_ENV === 'development') {
  window.CADDebug = {
    modelStore,
    sketchManager,
    getScene: () => sceneRef.current,
    getCamera: () => cameraRef.current,
    
    // Performance monitoring
    performanceMonitor: {
      startTimer: (name) => console.time(name),
      endTimer: (name) => console.timeEnd(name),
      logMemory: () => console.log(performance.memory)
    }
  };
}
```

**Three.js Debugging:**
```javascript
// Scene inspector
const SceneDebugger = () => {
  const [showHelper, setShowHelper] = useState(false);
  
  useEffect(() => {
    if (showHelper && scene) {
      // Add axis helper
      const axesHelper = new THREE.AxesHelper(100);
      scene.add(axesHelper);
      
      // Add grid helper
      const gridHelper = new THREE.GridHelper(200, 20);
      scene.add(gridHelper);
      
      // Add camera helper
      const cameraHelper = new THREE.CameraHelper(camera);
      scene.add(cameraHelper);
      
      return () => {
        scene.remove(axesHelper);
        scene.remove(gridHelper);
        scene.remove(cameraHelper);
      };
    }
  }, [showHelper, scene, camera]);
  
  return (
    <button onClick={() => setShowHelper(!showHelper)}>
      Toggle Debug Helpers
    </button>
  );
};
```

### Common Issues & Solutions

**JSCAD Evaluation Issues:**
```javascript
// Enhanced error reporting
const debugJSCADEvaluation = (code) => {
  console.group('JSCAD Evaluation Debug');
  console.log('Code:', code);
  
  try {
    const result = evaluateJSCAD(code);
    console.log('Success:', result);
    console.log('Polygons:', result.polygons?.length);
    console.log('Vertices:', result.vertices?.length);
    return result;
  } catch (error) {
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    
    // Check for common issues
    if (error.message.includes('main')) {
      console.warn('Hint: Make sure your code has a main() function');
    }
    
    throw error;
  } finally {
    console.groupEnd();
  }
};
```

**Performance Debugging:**
```javascript
// Performance monitor component
const PerformanceMonitor = () => {
  const [stats, setStats] = useState({});
  
  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (entry.name.startsWith('cad-operation')) {
          setStats(prev => ({
            ...prev,
            [entry.name]: entry.duration
          }));
        }
      });
    });
    
    observer.observe({ entryTypes: ['measure'] });
    
    return () => observer.disconnect();
  }, []);
  
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  return (
    <div className="performance-monitor">
      <h3>Performance Stats</h3>
      {Object.entries(stats).map(([operation, duration]) => (
        <div key={operation}>
          {operation}: {duration.toFixed(2)}ms
        </div>
      ))}
    </div>
  );
};

// Usage in CAD operations
const performCADOperation = (operation, ...args) => {
  const operationName = `cad-operation-${operation}`;
  
  performance.mark(`${operationName}-start`);
  
  try {
    const result = cadOperations[operation](...args);
    
    performance.mark(`${operationName}-end`);
    performance.measure(operationName, 
      `${operationName}-start`, 
      `${operationName}-end`
    );
    
    return result;
  } catch (error) {
    performance.mark(`${operationName}-error`);
    throw error;
  }
};
```

### Error Tracking

**Production Error Handling:**
```javascript
// Error boundary with reporting
class ProductionErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  componentDidCatch(error, errorInfo) {
    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      reportError(error, {
        ...errorInfo,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback onReset={() => this.setState({ hasError: false })} />;
    }
    
    return this.props.children;
  }
}
```

---

## Contribution Guidelines

### Before Contributing

1. **Check existing issues** on GitHub
2. **Discuss new features** in discussions/issues first
3. **Read the codebase** to understand patterns
4. **Set up development environment** properly

### Pull Request Process

1. **Fork the repository** and create a feature branch
2. **Make changes** following coding standards
3. **Add tests** for new functionality
4. **Update documentation** if needed
5. **Submit pull request** with clear description

### Code Review Guidelines

**For Authors:**
- Keep PRs focused and small
- Write clear commit messages
- Include tests and documentation
- Respond to feedback promptly

**For Reviewers:**
- Be constructive and helpful
- Focus on code quality and maintainability
- Check for performance implications
- Verify tests are comprehensive

### Documentation Standards

**Code Comments:**
```javascript
/**
 * Converts JSCAD geometry to Three.js BufferGeometry
 * 
 * @param {Object} jscadGeometry - JSCAD geometry object
 * @param {Object} options - Conversion options
 * @param {boolean} options.mergeVertices - Whether to merge duplicate vertices
 * @param {number} options.precision - Vertex precision for merging
 * @returns {THREE.BufferGeometry} Three.js compatible geometry
 * 
 * @example
 * const cube = jscad.primitives.cube({ size: 10 });
 * const threeGeometry = convertGeometry(cube, { mergeVertices: true });
 */
const convertGeometry = (jscadGeometry, options = {}) => {
  // Implementation
};
```

**README Updates:**
- Keep installation instructions current
- Document new features and APIs
- Include examples for complex features
- Update troubleshooting section

This development guide provides the foundation for maintaining high code quality and efficient development workflows in the OpenShape project. Following these guidelines ensures consistency, reliability, and ease of contribution for all developers.