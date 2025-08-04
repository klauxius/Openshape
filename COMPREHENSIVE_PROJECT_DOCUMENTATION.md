# OpenShape - Comprehensive Project Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Technology Stack](#architecture--technology-stack)
3. [Directory Structure](#directory-structure)
4. [Core Components](#core-components)
5. [Key Libraries & Dependencies](#key-libraries--dependencies)
6. [Data Flow & State Management](#data-flow--state-management)
7. [3D Rendering & Visualization](#3d-rendering--visualization)
8. [CAD Operations & Features](#cad-operations--features)
9. [User Interface Structure](#user-interface-structure)
10. [API Reference](#api-reference)
11. [Development Workflow](#development-workflow)
12. [Extension Points](#extension-points)
13. [Performance Considerations](#performance-considerations)
14. [Troubleshooting & Common Issues](#troubleshooting--common-issues)

---

## Project Overview

**OpenShape** is a browser-based Computer-Aided Design (CAD) application built with Next.js and React. It provides a comprehensive 3D modeling environment that combines:

- **Parametric 3D modeling** using JSCAD (JavaScript CAD) as the underlying geometry engine
- **Real-time 3D visualization** powered by Three.js and React Three Fiber
- **2D sketching capabilities** with constraint-based geometry creation
- **Advanced CAD features** including boolean operations, extrusions, and measurements
- **Model Management Protocol (MCP)** integration for AI-assisted design
- **Import/Export functionality** supporting multiple file formats (STL, OBJ, etc.)

### Key Differentiators

1. **Browser-Native**: No desktop installation required
2. **Code-First CAD**: Uses JavaScript for parametric modeling (JSCAD)
3. **AI Integration**: Built-in AI assistant for design guidance
4. **Modern UI**: Clean, responsive interface with professional CAD workflows
5. **Extensible Architecture**: Plugin-friendly design for custom tools

---

## Architecture & Technology Stack

### Frontend Framework
- **Next.js 15.2.3** - React framework with SSR/SSG capabilities
- **React 18.2.0** - Component-based UI library
- **TypeScript 5** - Type safety and enhanced development experience

### 3D Graphics & CAD Engine
- **@jscad/modeling 2.12.5** - Core CAD geometry engine
- **Three.js 0.174.0** - 3D graphics library
- **@react-three/fiber 9.1.0** - React renderer for Three.js
- **jscad-fiber 0.0.77** - JSCAD integration with React Three Fiber

### UI & Styling
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **Lucide React 0.356.0** - Modern icon library
- **PostCSS 8.5.3** - CSS processing

### Additional Libraries
- **regl 2.1.1** - WebGL abstraction library
- **uuid 11.1.0** - Unique identifier generation

### Development Tools
- **ESLint** - Code linting
- **TypeScript compiler** - Type checking
- **Autoprefixer** - CSS vendor prefixing

---

## Directory Structure

```
openshape/
├── components/           # React UI components
│   ├── measurements/     # Measurement tools and controls
│   ├── AICadAssistant.js # AI integration component
│   ├── JscadThreeViewer.js # Main 3D viewer (1536 lines)
│   ├── Sidebar.js        # Feature tree and model browser
│   ├── SidebarFixed.js   # Fixed sidebar variant
│   ├── ViewCube.tsx      # 3D navigation cube
│   └── [other components]
├── contexts/             # React Context providers
│   └── UnitContext.js    # Unit system management
├── lib/                  # Core business logic
│   ├── cadOperations.js  # CAD operations (880 lines)
│   ├── jscadProcessor.js # JSCAD code evaluation
│   ├── mcpTools.js       # Model Management Protocol (1797 lines)
│   ├── partsLibrary.js   # Standard parts library
│   └── sketchManager.js  # 2D sketching engine (931 lines)
├── pages/                # Next.js pages
│   ├── api/              # API routes
│   ├── cad-interface.js  # Main CAD application (837 lines)
│   └── [test pages]
├── public/               # Static assets
├── src/app/              # App router directory
├── styles/               # CSS styles
├── types/                # TypeScript type definitions
└── utils/                # Utility functions
    ├── exportUtils.js    # Model export functionality
    ├── importUtils.js    # Model import functionality
    ├── measurementUtils.js # Measurement calculations
    └── unitUtils.js      # Unit conversion utilities
```

---

## Core Components

### 1. Main Application Entry Points

#### `pages/cad-interface.js` (Primary CAD Interface)
The main CAD application interface containing:
- **Toolbar System**: Tabbed interface with sketch, modeling, and measurement tools
- **3D Viewer**: Integrated JSCAD Three.js viewer
- **Sidebar Management**: Feature tree, model browser, parts library
- **Modal Systems**: Import/export dialogs, plane selection
- **State Management**: Active tools, selected objects, UI state

**Key Features:**
- Responsive layout with collapsible panels
- Tool context switching (sketch mode, modeling mode)
- Real-time model updates
- User guide integration

#### `pages/index.js` (Simple Interface)
Basic CAD interface for quick prototyping:
- Simplified toolbar
- Parameter controls
- Basic JSCAD code generation

### 2. 3D Visualization System

#### `components/JscadThreeViewer.js` (Main 3D Engine - 1536 lines)
The core 3D visualization component that handles:

**Rendering Pipeline:**
```javascript
// Performance configuration
const PERFORMANCE_CONFIG = {
  antialias: true,
  pixelRatio: 1.5,
  shadowMapEnabled: false,
  raycasterThrottleMs: 50,
  precision: 0.1,
  simplifyGeometry: true,
  frustumCulling: true
};
```

**Key Capabilities:**
- JSCAD geometry to Three.js mesh conversion
- Real-time model updates
- Interactive camera controls (OrbitControls)
- Selection and highlighting
- Grid and axis display
- Performance optimization for complex models

**Integration Points:**
- Connects to `modelStore` for model data
- Integrates with measurement tools
- Supports reference planes
- Handles export/import operations

#### `components/ViewCube.tsx` & `components/DomViewCube.tsx`
3D navigation controls that provide:
- Standard orthographic views (front, back, left, right, top, bottom)
- Isometric views
- Smooth camera transitions
- Interactive cube face selection

### 3. CAD Engine Integration

#### `lib/jscadProcessor.js` (JSCAD Evaluation Engine)
Handles the conversion from JavaScript code to 3D geometry:

```javascript
export const evaluateJSCAD = (code) => {
  const context = {
    // Primitives
    cube: modeling.primitives.cube,
    sphere: modeling.primitives.sphere,
    cylinder: modeling.primitives.cylinder,
    
    // Boolean operations
    union: modeling.booleans.union,
    subtract: modeling.booleans.subtract,
    intersect: modeling.booleans.intersect,
    
    // Transformations
    translate: modeling.transforms.translate,
    rotate: modeling.transforms.rotate,
    scale: modeling.transforms.scale
  };
  
  // Execute user code in sandboxed environment
  const evalFunction = new Function(
    ...Object.keys(context),
    `${code}; return typeof main === 'function' ? main() : null;`
  );
  
  return evalFunction(...Object.values(context));
};
```

**Security Features:**
- Sandboxed execution environment
- Limited function access
- Error handling and recovery

---

## Key Libraries & Dependencies

### JSCAD Ecosystem
- **@jscad/modeling**: Core geometry operations
- **@jscad/obj-serializer**: OBJ file format support
- **@jscad/stl-serializer**: STL file format support
- **@jscad/regl-renderer**: Alternative renderer option

### Three.js Integration
- **three**: Core 3D graphics library
- **OrbitControls**: Camera control system
- **Raycaster**: Object selection and interaction
- **Geometry utilities**: BufferGeometry, Material systems

### React Integration
- **@react-three/fiber**: React renderer for Three.js
- **jscad-fiber**: Custom JSCAD-React integration layer

---

## Data Flow & State Management

### Model Management System (`lib/mcpTools.js`)

The Model Management Protocol provides centralized state management:

```javascript
export const modelStore = {
  models: new Map(),
  activeModelId: null,
  
  addModel(geometry, name) {
    const id = generateId();
    this.models.set(id, {
      id,
      name,
      geometry,
      visible: true,
      created: Date.now()
    });
    return id;
  },
  
  getModel(id) { /* ... */ },
  getAllModels() { /* ... */ },
  setActiveModel(id) { /* ... */ }
};
```

**Features:**
- Centralized model storage
- Change notification system
- Model metadata management
- Undo/redo capability foundation

### Context Providers

#### `contexts/UnitContext.js`
Manages unit system across the application:
- Metric/Imperial conversion
- Display formatting
- Precision settings
- Real-time unit conversion

### State Synchronization
- Models are stored in `modelStore`
- UI components subscribe to changes via notifications
- 3D viewer automatically updates when models change
- Sidebar reflects current model tree state

---

## 3D Rendering & Visualization

### Geometry Pipeline

1. **JSCAD Code** → JavaScript function execution
2. **JSCAD Geometry** → Three.js BufferGeometry conversion
3. **Three.js Mesh** → WebGL rendering
4. **Display** → Canvas output

### Rendering Features

#### Material System
- Default gray material for models
- Wireframe mode toggle
- Transparency support
- Color coding for different object types

#### Lighting Setup
- Ambient lighting for overall illumination
- Directional lights for depth perception
- Shadow mapping (configurable)

#### Camera System
- Perspective camera with adjustable FOV
- OrbitControls for intuitive navigation
- Preset view positions via ViewCube
- Zoom-to-fit functionality

#### Performance Optimizations
- Geometry simplification for complex models
- Frustum culling
- Level-of-detail (LOD) systems
- Throttled raycasting for selection

---

## CAD Operations & Features

### Primitive Creation (`lib/partsLibrary.js`)

Standard CAD primitives with parameterization:

```javascript
export const createCube = (params = {}) => {
  const width = params.width || 10;
  const height = params.height || 10;
  const depth = params.depth || 10;
  const position = params.position || [0, 0, 0];
  
  const cube = jscad.primitives.cuboid({
    size: [width, height, depth],
    center: position
  });
  
  const modelId = modelStore.addModel(cube, 'Cube');
  return { success: true, modelId, model: cube };
};
```

**Available Primitives:**
- Cube/Cuboid with dimensions
- Sphere with radius
- Cylinder with height and radius
- Torus with major/minor radius

### Boolean Operations (`lib/cadOperations.js`)

Advanced CAD operations for model combination:
- **Union**: Combine multiple objects
- **Subtraction**: Remove one object from another
- **Intersection**: Keep only overlapping regions
- **Shell**: Create hollow objects

### 2D Sketching System (`lib/sketchManager.js`)

Comprehensive 2D sketching with:

**Sketch Planes:**
- XY, YZ, XZ orthographic planes
- Custom plane definition
- Offset plane creation

**Geometric Entities:**
- Lines, arcs, circles
- Rectangles, polygons
- Splines and curves

**Constraints:**
- Dimensional constraints
- Geometric constraints (parallel, perpendicular, tangent)
- Automatic constraint inference

**Workflow:**
1. Select sketch plane
2. Enter sketch mode
3. Draw 2D geometry
4. Apply constraints
5. Extrude to 3D

### Measurement Tools

**Types of Measurements:**
- Distance between points/edges/faces
- Angle measurements
- Area calculations
- Volume calculations

**Features:**
- Real-time measurement display
- Persistent measurement annotations
- Export measurement data
- Precision control

---

## User Interface Structure

### Layout System

The application uses a flexible layout with:
- **Header**: Main navigation and tool access
- **Toolbar**: Context-sensitive tool palettes
- **Left Sidebar**: Feature tree and model browser
- **Main Canvas**: 3D viewport
- **Right Panels**: Properties and parameters
- **Bottom Panel**: Code terminal and console

### Responsive Design

**Breakpoints:**
- Mobile: Collapsed sidebars, simplified tools
- Tablet: Reduced panel sizes, touch-friendly controls
- Desktop: Full feature set, multiple panels

### Component Architecture

**Atomic Design Principles:**
- **Atoms**: Buttons, inputs, icons
- **Molecules**: Tool groups, parameter sets
- **Organisms**: Sidebar, toolbar, viewer
- **Templates**: Page layouts
- **Pages**: Complete applications

### State Management Pattern

Components follow a unidirectional data flow:
1. User interaction triggers action
2. Action updates model store
3. Store notifies subscribed components
4. Components re-render with new state

---

## API Reference

### Core APIs

#### Model Store API
```javascript
// Add a new model
const modelId = modelStore.addModel(geometry, name);

// Get model by ID
const model = modelStore.getModel(modelId);

// Get all models
const models = modelStore.getAllModels();

// Set active model
modelStore.setActiveModel(modelId);

// Delete model
modelStore.deleteModel(modelId);
```

#### JSCAD Processor API
```javascript
// Evaluate JSCAD code
const geometry = evaluateJSCAD(codeString);

// Generate primitive code
const code = generatePrimitiveCode('cube', { size: 10 });
```

#### Sketch Manager API
```javascript
// Create new sketch
const sketchId = sketchManager.createSketch(planeInfo);

// Add geometric entity
sketchManager.addLine(sketchId, startPoint, endPoint);

// Apply constraint
sketchManager.addConstraint(sketchId, constraintType, entities);

// Extrude sketch
const solid = sketchManager.extrudeSketch(sketchId, distance);
```

#### Parts Library API
```javascript
// Create standard parts
const result = createCube({ width: 10, height: 5, depth: 8 });
const result = createSphere({ radius: 5 });
const result = createCylinder({ height: 10, radius: 3 });
```

### Utility APIs

#### Unit Conversion
```javascript
// Convert between units
const meters = convertUnits(10, 'mm', 'm');

// Format for display
const formatted = formatValue(123.456, 'mm', 2);
```

#### Export/Import
```javascript
// Export model
exportModel(modelId, 'stl');
exportModel(modelId, 'obj');

// Import model
importModel(fileData, 'stl').then(model => {
  // Handle imported model
});
```

---

## Development Workflow

### Getting Started

1. **Environment Setup:**
```bash
cd openshape
npm install
npm run dev
```

2. **Development Server:**
   - Runs on `http://localhost:3000`
   - Hot reloading enabled
   - TypeScript compilation in watch mode

### Code Organization

**File Naming Conventions:**
- Components: PascalCase (e.g., `JscadThreeViewer.js`)
- Utilities: camelCase (e.g., `exportUtils.js`)
- Pages: kebab-case (e.g., `cad-interface.js`)

**Import Patterns:**
```javascript
// External libraries
import React from 'react';
import * as THREE from 'three';

// Internal components
import Sidebar from '../components/Sidebar';
import { modelStore } from '../lib/mcpTools';

// Utilities
import { formatValue } from '../utils/unitUtils';
```

### Testing Strategy

**Component Testing:**
- Unit tests for utility functions
- Integration tests for component interactions
- Visual regression tests for UI components

**CAD Engine Testing:**
- Geometry validation tests
- Boolean operation accuracy tests
- Performance benchmarks

### Build Process

**Development Build:**
```bash
npm run dev          # Development with hot reload
npm run dev:turbo    # Development with Turbopack
```

**Production Build:**
```bash
npm run build        # Production optimization
npm run start        # Serve production build
```

**Linting:**
```bash
npm run lint         # ESLint code quality checks
```

---

## Extension Points

### Adding New CAD Features

1. **New Primitive Types:**
   - Add to `lib/partsLibrary.js`
   - Implement JSCAD geometry generation
   - Add UI controls in appropriate components

2. **Custom Operations:**
   - Extend `lib/cadOperations.js`
   - Implement operation logic
   - Add to operation toolbar

3. **New File Formats:**
   - Extend `utils/exportUtils.js` and `utils/importUtils.js`
   - Add format-specific serialization
   - Update UI to include new format options

### UI Customization

**Theming:**
- Modify Tailwind configuration
- Add custom CSS variables
- Update component styles

**Layout Modifications:**
- Adjust grid systems in main layouts
- Modify responsive breakpoints
- Add new panel types

### Plugin Architecture

The application is designed to support plugins through:
- Dynamic component loading
- Tool registration system
- Event hook system
- Configuration injection

**Example Plugin Structure:**
```javascript
export const MyPlugin = {
  name: 'my-plugin',
  tools: [
    {
      id: 'my-tool',
      label: 'My Tool',
      icon: MyIcon,
      action: () => { /* tool logic */ }
    }
  ],
  components: {
    'my-panel': MyPanelComponent
  }
};
```

---

## Performance Considerations

### 3D Rendering Optimization

**Geometry Management:**
- Use BufferGeometry for efficient memory usage
- Implement geometry instancing for repeated objects
- Apply level-of-detail (LOD) systems for complex scenes

**Rendering Pipeline:**
- Frustum culling for off-screen objects
- Occlusion culling for hidden objects
- Batch rendering for similar objects

**Memory Management:**
- Dispose of unused geometries and materials
- Use object pooling for temporary objects
- Monitor memory usage in development tools

### Code Execution Performance

**JSCAD Evaluation:**
- Cache compiled functions when possible
- Limit execution time for complex operations
- Use web workers for heavy computations

**UI Responsiveness:**
- Debounce rapid user inputs
- Use React.memo for expensive components
- Implement virtual scrolling for large lists

### Network Optimization

**Asset Loading:**
- Lazy load non-critical components
- Use dynamic imports for large libraries
- Implement progressive loading for models

**Data Transfer:**
- Compress model data for transmission
- Use binary formats when possible
- Implement differential updates

---

## Troubleshooting & Common Issues

### Performance Issues

**Slow 3D Rendering:**
1. Check `PERFORMANCE_CONFIG` settings
2. Reduce model complexity
3. Disable shadows and antialiasing
4. Lower pixel ratio for high-DPI displays

**Memory Leaks:**
1. Ensure proper geometry disposal
2. Check for uncleaned event listeners
3. Monitor component unmounting
4. Use Chrome DevTools memory profiler

### JSCAD Issues

**Code Evaluation Errors:**
1. Check syntax in user code
2. Verify function availability in context
3. Handle edge cases in geometry creation
4. Add error boundaries for robustness

**Geometry Display Problems:**
1. Validate JSCAD geometry before conversion
2. Check Three.js geometry creation
3. Verify material application
4. Debug coordinate system issues

### Import/Export Issues

**File Format Problems:**
1. Verify file format compatibility
2. Check serializer library versions
3. Handle encoding issues
4. Validate geometry before export

**Large File Handling:**
1. Implement streaming for large files
2. Add progress indicators
3. Use web workers for processing
4. Handle memory constraints

### Browser Compatibility

**WebGL Support:**
1. Check WebGL availability
2. Provide fallback for unsupported browsers
3. Handle context loss scenarios
4. Optimize for mobile GPUs

**JavaScript Features:**
1. Ensure modern JavaScript feature support
2. Add polyfills where necessary
3. Test across different browsers
4. Handle varying performance characteristics

---

## Additional Resources

### Documentation References
- [JSCAD Documentation](https://openjscad.org/)
- [Three.js Documentation](https://threejs.org/docs/)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/getting-started/introduction)
- [Next.js Documentation](https://nextjs.org/docs)

### Code Examples
- See `/pages/` directory for usage examples
- Check component implementations for patterns
- Review utility functions for common operations

### Contributing Guidelines
- Follow existing code style
- Add tests for new features
- Update documentation
- Ensure cross-browser compatibility

This documentation provides a comprehensive foundation for understanding and extending the OpenShape CAD application. The modular architecture and clear separation of concerns make it easy to add new features and customize existing functionality.