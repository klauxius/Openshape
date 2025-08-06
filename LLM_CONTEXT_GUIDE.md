# LLM Context Guide for OpenShape CAD Application

## 🎯 Purpose of This Document

This guide is specifically designed to help Large Language Models (LLMs) understand the OpenShape codebase and provide effective assistance. It serves as a navigation map to all documentation and explains the context needed for coding additional features.

## 📚 Documentation Hierarchy

### **Tier 1: Essential Overview Documents** (Start Here)
1. **[README_COMPREHENSIVE.md](./README_COMPREHENSIVE.md)** - Main project overview
2. **[COMPREHENSIVE_PROJECT_DOCUMENTATION.md](./COMPREHENSIVE_PROJECT_DOCUMENTATION.md)** - Complete architecture overview
3. **This Document** - Navigation guide for LLMs

### **Tier 2: Deep Technical References**
1. **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Complete API reference
2. **[COMPONENT_ARCHITECTURE.md](./COMPONENT_ARCHITECTURE.md)** - React component structure
3. **[DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)** - Development practices

### **Tier 3: Specialized Context**
1. **[CORE_CONCEPTS_REFERENCE.md](./CORE_CONCEPTS_REFERENCE.md)** - Key concepts and patterns
2. **[CODE_EXAMPLES_CATALOG.md](./CODE_EXAMPLES_CATALOG.md)** - Working code examples
3. **[FEATURE_DEVELOPMENT_PATTERNS.md](./FEATURE_DEVELOPMENT_PATTERNS.md)** - Common development patterns

## 🧠 How to Use This Guide as an LLM

### When User Asks for New Features
1. **Read** `COMPREHENSIVE_PROJECT_DOCUMENTATION.md` sections 4-8 for component understanding
2. **Reference** `API_DOCUMENTATION.md` for exact function signatures
3. **Check** `FEATURE_DEVELOPMENT_PATTERNS.md` for established patterns
4. **Use** `CODE_EXAMPLES_CATALOG.md` for implementation templates

### When User Asks About Architecture
1. **Start** with `README_COMPREHENSIVE.md` section "Architecture Overview"
2. **Deep dive** using `COMPONENT_ARCHITECTURE.md`
3. **Understand data flow** via `COMPREHENSIVE_PROJECT_DOCUMENTATION.md` section 6

### When User Asks About CAD Operations
1. **Reference** `CORE_CONCEPTS_REFERENCE.md` for CAD fundamentals
2. **Check** `API_DOCUMENTATION.md` sections 4-5 for Parts Library and CAD Operations
3. **Review** existing implementations in `/lib/cadOperations.js`

### When User Needs to Debug Issues
1. **Consult** `DEVELOPMENT_GUIDE.md` section 7 "Debugging & Troubleshooting"
2. **Check** `COMPREHENSIVE_PROJECT_DOCUMENTATION.md` section 14 for common issues
3. **Understand** performance implications in section 13

## 🗺️ Codebase Mental Map

### **Core Engine** (`/lib/`)
- `mcpTools.js` (3061 lines) - Model Management Protocol, central state management
- `cadOperations.js` (880 lines) - Boolean operations, transformations
- `sketchManager.js` (931 lines) - 2D sketching with constraints
- `jscadProcessor.js` (86 lines) - JavaScript CAD code evaluation

### **Main UI Components** (`/components/`)
- `JscadThreeViewer.js` (1635 lines) - Core 3D visualization engine
- `SidebarFixed.js` (773 lines) - Main sidebar with feature tree
- `AICadAssistant.js` (467 lines) - AI integration component

### **Application Entry** (`/pages/`)
- `cad-interface.js` (886 lines) - Main CAD application interface
- `index.js` - Simple interface variant

### **Utilities** (`/utils/`)
- `exportUtils.js` - Model export functionality
- `importUtils.js` - Model import functionality
- `measurementUtils.js` - Measurement calculations
- `unitUtils.js` - Unit conversion system

## 🏗️ Key Architectural Patterns

### **State Management Pattern**
```javascript
// Central model store in mcpTools.js
export const modelStore = {
  models: new Map(),
  activeModelId: null,
  // Operations trigger notifications
  addModel(geometry, name) { /* ... */ }
};

// Components subscribe to changes
import { modelStore, notifyModelChanged } from '../lib/mcpTools';
```

### **Component Communication Pattern**
```javascript
// Parent-child prop passing
<JscadThreeViewer 
  selectedTool={selectedTool}
  onModelSelect={handleModelSelect}
/>

// Event-driven updates
notifyModelChanged(modelData);
```

### **3D Rendering Pattern**
```javascript
// JSCAD → Three.js pipeline
JSCAD Code → evaluateJSCAD() → Three.js Geometry → WebGL Rendering
```

## 📋 Common Development Tasks

### **Adding a New CAD Primitive**
1. Add function to `/lib/partsLibrary.js`
2. Register with model store in function
3. Add UI control to appropriate toolbar
4. Update parts library UI

### **Adding a New CAD Operation**
1. Implement operation in `/lib/cadOperations.js`
2. Add to CAD operations toolbar
3. Handle multi-model selection
4. Update operation history

### **Adding a New UI Component**
1. Create component in `/components/`
2. Follow existing patterns from similar components
3. Integrate with state management
4. Add to appropriate parent component

### **Adding a New File Format**
1. Extend `/utils/exportUtils.js` or `/utils/importUtils.js`
2. Add serialization/deserialization logic
3. Update UI dialogs to include new format
4. Test with various model types

## 🔍 Code Analysis Helpers

### **Finding Related Code**
- **Search for patterns**: `grep -r "functionName" openshape/`
- **Component usage**: Look for import statements
- **State updates**: Search for `modelStore` references
- **Event handlers**: Look for `notify*` function calls

### **Understanding Data Flow**
1. **User Action** → Event Handler (in page/component)
2. **Event Handler** → API Call (in /lib/)
3. **API Call** → State Update (modelStore)
4. **State Update** → UI Re-render (React components)

### **Performance Considerations**
- Large files: `mcpTools.js`, `JscadThreeViewer.js`, `SidebarFixed.js`
- Performance configs: `PERFORMANCE_CONFIG` in JscadThreeViewer
- 3D optimization: Geometry simplification, frustum culling

## 🚀 Quick Start for LLM Assistance

### **Before Writing Code**
1. Understand the user's request context
2. Identify which components/files are involved
3. Check existing patterns in the codebase
4. Reference API documentation for exact signatures

### **When Writing New Features**
1. Follow established patterns
2. Use existing utility functions
3. Maintain consistent error handling
4. Add appropriate state management
5. Consider 3D rendering performance

### **After Writing Code**
1. Ensure proper cleanup (Three.js resources)
2. Add error boundaries where needed
3. Consider responsive design
4. Think about accessibility

## 🔧 Technical Context for LLMs

### **JavaScript CAD (JSCAD) Context**
OpenShape uses JSCAD for parametric modeling:
- Code is evaluated in sandboxed environment
- Geometry is functional and immutable
- Boolean operations combine objects
- Transformations move/rotate/scale objects

### **Three.js Integration Context**
3D visualization uses Three.js:
- JSCAD geometry converted to BufferGeometry
- Materials applied for visualization
- Camera controls for navigation
- Raycasting for object selection

### **React Patterns Context**
Modern React patterns used throughout:
- Functional components with hooks
- Context for global state (units, themes)
- Dynamic imports for code splitting
- Refs for Three.js integration

### **Next.js Context**
Built on Next.js framework:
- Pages in `/pages/` directory
- API routes in `/pages/api/`
- Static assets in `/public/`
- SSR disabled for 3D components

## ⚠️ Important Gotchas for LLMs

### **Performance Sensitive Areas**
- 3D rendering in `JscadThreeViewer.js`
- Large model operations in `mcpTools.js`
- Real-time sketching in `sketchManager.js`

### **Browser Compatibility**
- WebGL required for 3D rendering
- Modern JavaScript features used
- Memory management important for 3D scenes

### **State Management Complexity**
- Multiple state layers (React, modelStore, Three.js)
- Event-driven updates between components
- Careful cleanup required for 3D resources

### **CAD-Specific Constraints**
- Geometry must be valid JSCAD objects
- Coordinate system consistency important
- Unit conversions handled throughout
- Precision matters for CAD operations

## 📖 Example Usage Scenarios

### **Scenario 1: User wants to add a torus primitive**
1. Check existing primitives in `partsLibrary.js`
2. Follow the pattern of existing functions like `createCube`
3. Add torus creation using JSCAD modeling primitives
4. Register with model store
5. Add UI control to appropriate toolbar

### **Scenario 2: User wants to improve performance**
1. Check `PERFORMANCE_CONFIG` in `JscadThreeViewer.js`
2. Review geometry optimization techniques
3. Consider level-of-detail (LOD) systems
4. Monitor memory usage patterns

### **Scenario 3: User wants to add measurement features**
1. Examine existing measurement tools in `/components/measurements/`
2. Check measurement utilities in `/utils/measurementUtils.js`
3. Follow patterns for tool integration
4. Consider coordinate system transformations

---

**For LLMs: This guide provides the context and navigation needed to effectively assist with OpenShape development. Always reference the appropriate detailed documentation before making code changes, and follow established patterns in the codebase.**