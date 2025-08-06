# Core Concepts Reference for OpenShape

## 🎯 Purpose

This document explains the fundamental concepts, patterns, and mental models used throughout the OpenShape CAD application. It's designed to give LLMs the essential context needed to understand and work with the codebase effectively.

## 🏗️ Architecture Concepts

### Model Management Protocol (MCP)

**Concept**: Centralized system for managing 3D models and their lifecycle.

**Key Components**:
- **Model Store**: Central repository (`modelStore` in `mcpTools.js`)
- **Event Notifications**: Change propagation system
- **State Synchronization**: Keeping UI in sync with model changes

**Mental Model**:
```
User Action → Model Store Update → Event Notification → UI Re-render
```

**Example**:
```javascript
// Adding a model triggers notifications
const modelId = modelStore.addModel(geometry, "My Shape");
notifyModelChanged({ id: modelId, action: 'add' });
// All subscribed components automatically update
```

### JSCAD Integration Pattern

**Concept**: JavaScript-based CAD using functional programming principles.

**Key Principles**:
- **Immutable Geometry**: Operations create new objects, don't modify existing ones
- **Functional Composition**: Complex shapes built by combining simple operations
- **Code as Model**: 3D models defined as executable JavaScript code

**Mental Model**:
```
JavaScript Code → JSCAD Evaluation → 3D Geometry → Three.js Rendering
```

**Example**:
```javascript
// Functional composition in JSCAD
const shape = union(
  cube({ size: 10 }),
  translate([5, 0, 0], sphere({ radius: 5 }))
);
```

### Three.js Rendering Pipeline

**Concept**: WebGL-based 3D rendering using Three.js library.

**Key Components**:
- **Scene**: Container for all 3D objects
- **Camera**: Viewpoint and projection
- **Renderer**: WebGL interface
- **Geometry**: 3D shape data
- **Material**: Surface appearance

**Mental Model**:
```
JSCAD Geometry → Buffer Geometry → Three.js Mesh → WebGL Rendering
```

## 🎨 UI Architecture Patterns

### Component Hierarchy Pattern

**Concept**: React components organized in a tree structure with clear responsibilities.

**Key Patterns**:
- **Container Components**: Manage state and logic (`cad-interface.js`)
- **Presentation Components**: Display UI elements (`ViewCube.tsx`)
- **Integration Components**: Bridge different systems (`JscadThreeViewer.js`)

**Mental Model**:
```
Application Shell → Layout Components → Feature Components → UI Elements
```

### State Management Pattern

**Concept**: Multiple state layers working together.

**State Layers**:
1. **React Component State**: Local UI state (`useState`, `useReducer`)
2. **React Context**: Global application state (`UnitContext`)
3. **Model Store**: CAD model data and operations
4. **Three.js State**: 3D scene state and rendering

**Mental Model**:
```
UI State ←→ React Context ←→ Model Store ←→ Three.js Scene
```

### Event-Driven Communication

**Concept**: Components communicate through events rather than direct coupling.

**Key Patterns**:
- **Notification System**: `notify*` functions in `mcpTools.js`
- **Event Handlers**: Component callback props
- **Context Updates**: Global state changes

**Example**:
```javascript
// Component triggers model change
const handleAddCube = () => {
  const result = createCube({ size: 10 });
  notifyModelChanged(result); // All listeners update
};
```

## 🔧 CAD-Specific Concepts

### Parametric Modeling

**Concept**: Models defined by parameters that can be changed to update the geometry.

**Key Elements**:
- **Parameters**: Numerical inputs (width, height, radius)
- **Constraints**: Relationships between elements
- **Regeneration**: Updating models when parameters change

**Mental Model**:
```
Parameters → JSCAD Code → Geometry → Visual Update
```

### Boolean Operations

**Concept**: Combining 3D objects using set operations.

**Operations**:
- **Union**: Combine objects (A + B)
- **Subtraction**: Remove one from another (A - B)
- **Intersection**: Keep only overlapping parts (A ∩ B)

**Mental Model**:
```
Object A + Object B → Boolean Operation → New Combined Object
```

### Sketch-Based Modeling

**Concept**: Creating 3D models by drawing 2D sketches and extruding them.

**Workflow**:
1. **Sketch Plane**: 2D drawing surface
2. **2D Geometry**: Lines, arcs, circles
3. **Constraints**: Dimensional and geometric relationships
4. **Extrusion**: Converting 2D to 3D

**Mental Model**:
```
2D Sketch → Apply Constraints → Extrude → 3D Solid
```

### Coordinate Systems

**Concept**: 3D space organization and transformations.

**Key Systems**:
- **World Coordinates**: Global 3D space
- **Local Coordinates**: Object-relative space
- **Screen Coordinates**: 2D display projection

**Transformations**:
- **Translation**: Moving objects
- **Rotation**: Rotating objects
- **Scaling**: Resizing objects

## 🎮 Interaction Patterns

### Tool-Based Interface

**Concept**: CAD interface organized around tools that modify behavior.

**Tool Categories**:
- **Sketch Tools**: 2D drawing operations
- **Feature Tools**: 3D modeling operations
- **Measurement Tools**: Analysis and dimensioning
- **View Tools**: Camera and display controls

**State Management**:
```javascript
const [selectedTool, setSelectedTool] = useState(null);
const [toolMode, setToolMode] = useState('select');
```

### Selection and Highlighting

**Concept**: Interactive object selection with visual feedback.

**Key Elements**:
- **Raycasting**: Mouse-to-3D-object mapping
- **Selection State**: Tracking selected objects
- **Visual Feedback**: Highlighting selected objects

**Implementation Pattern**:
```javascript
// Raycasting for selection
const intersects = raycaster.intersectObjects(scene.children);
if (intersects.length > 0) {
  selectObject(intersects[0].object);
}
```

### Camera Control Pattern

**Concept**: Intuitive 3D navigation using orbit controls.

**Controls**:
- **Orbit**: Rotate around target point
- **Pan**: Move viewpoint parallel to screen
- **Zoom**: Move closer/farther from target

**Integration**:
```javascript
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Smooth motion
```

## 🔄 Data Flow Patterns

### Model Lifecycle

**Concept**: How 3D models are created, modified, and destroyed.

**Lifecycle Stages**:
1. **Creation**: User action creates new model
2. **Registration**: Model added to store
3. **Rendering**: Model displayed in 3D view
4. **Modification**: Model parameters or operations changed
5. **Update**: Visual representation updated
6. **Deletion**: Model removed from store and display

### Change Propagation

**Concept**: How changes flow through the system.

**Flow Pattern**:
```
User Input → Event Handler → Model Update → Notification → UI Update
```

**Example**:
```javascript
// Change propagation example
const updateModelParameter = (modelId, parameter, value) => {
  // 1. Update model
  const model = modelStore.getModel(modelId);
  model.parameters[parameter] = value;
  
  // 2. Regenerate geometry
  const newGeometry = regenerateModel(model);
  
  // 3. Notify changes
  notifyModelChanged({ id: modelId, action: 'update' });
};
```

## 🎯 Performance Concepts

### 3D Rendering Optimization

**Concept**: Maintaining smooth 3D performance with complex models.

**Key Strategies**:
- **Level of Detail (LOD)**: Simpler models at distance
- **Frustum Culling**: Don't render off-screen objects
- **Geometry Instancing**: Reuse geometry for repeated objects
- **Buffer Geometry**: Efficient geometry representation

### Memory Management

**Concept**: Proper cleanup of 3D resources to prevent memory leaks.

**Critical Areas**:
- **Geometry Disposal**: `geometry.dispose()`
- **Material Disposal**: `material.dispose()`
- **Texture Disposal**: `texture.dispose()`
- **Event Listener Cleanup**: Remove listeners on unmount

**Pattern**:
```javascript
useEffect(() => {
  return () => {
    // Cleanup on component unmount
    geometry.dispose();
    material.dispose();
  };
}, []);
```

### React Performance

**Concept**: Optimizing React rendering for smooth UI updates.

**Key Techniques**:
- **React.memo**: Prevent unnecessary re-renders
- **useMemo**: Cache expensive calculations
- **useCallback**: Stable function references
- **Code Splitting**: Dynamic imports for large components

## 🔧 Development Patterns

### Component Composition

**Concept**: Building complex UIs from simple, reusable components.

**Pattern**:
```javascript
// Composition over inheritance
const CADInterface = () => (
  <Layout>
    <Toolbar />
    <MainView>
      <ThreeViewer />
      <PropertyPanel />
    </MainView>
  </Layout>
);
```

### Hook Patterns

**Concept**: Custom hooks for reusable logic.

**Examples**:
- `useUnits()`: Unit system management
- `useThreeScene()`: Three.js scene setup
- `useModelStore()`: Model store integration

### Error Boundaries

**Concept**: Graceful error handling in React components.

**Pattern**:
```javascript
const ErrorBoundary = ({ children }) => {
  // Catch and handle component errors
  return <ErrorDisplay /> || children;
};
```

## 🎓 Mental Models for LLMs

### When Adding New Features

**Think**: What existing patterns can I follow?
1. Find similar existing feature
2. Identify the pattern used
3. Adapt pattern to new requirement
4. Maintain consistency with existing code

### When Debugging Issues

**Think**: What layer is the problem in?
1. **UI Layer**: React component issues
2. **Logic Layer**: Business logic in `/lib/`
3. **Rendering Layer**: Three.js/WebGL issues
4. **Data Layer**: Model store or state issues

### When Optimizing Performance

**Think**: Where are the bottlenecks?
1. **Rendering**: Too many/complex 3D objects
2. **Computation**: Heavy JSCAD operations
3. **Memory**: Resource leaks or excessive usage
4. **React**: Unnecessary re-renders

---

**For LLMs**: These concepts provide the mental framework needed to understand OpenShape's architecture and make informed decisions when implementing new features or fixing issues. Always consider how new code fits into these established patterns.