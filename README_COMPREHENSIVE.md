# OpenShape - Browser-Based CAD Application

## Overview

**OpenShape** is a comprehensive browser-based Computer-Aided Design (CAD) application built with modern web technologies. It combines the power of parametric 3D modeling using JSCAD (JavaScript CAD) with an intuitive user interface, providing a full-featured CAD environment that runs entirely in the browser.

## 🎯 Key Features

- **Parametric 3D Modeling**: JavaScript-based CAD using JSCAD engine
- **Real-time 3D Visualization**: Powered by Three.js and React Three Fiber
- **2D Sketching**: Constraint-based geometry creation with extrusion capabilities
- **Boolean Operations**: Union, subtraction, intersection, and advanced CAD operations
- **Import/Export**: Support for STL, OBJ, and other 3D file formats
- **Measurement Tools**: Distance, angle, area, and volume calculations
- **AI Integration**: Built-in AI assistant for design guidance via MCP
- **Professional UI**: Modern, responsive interface with professional CAD workflows
- **Unit System**: Comprehensive metric/imperial unit management
- **Performance Optimized**: Advanced 3D rendering optimizations

## 📁 Documentation Structure

This project includes comprehensive documentation designed to provide complete context for development and extension:

### Core Documentation Files

1. **[COMPREHENSIVE_PROJECT_DOCUMENTATION.md](./COMPREHENSIVE_PROJECT_DOCUMENTATION.md)**
   - Complete project overview and architecture
   - Technology stack and dependencies
   - Component structure and data flow
   - Performance considerations and troubleshooting

2. **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)**
   - Detailed API reference for all core modules
   - Model Store, JSCAD Processor, Sketch Manager APIs
   - Import/Export, Measurement, and Unit System APIs
   - Error handling patterns and best practices

3. **[COMPONENT_ARCHITECTURE.md](./COMPONENT_ARCHITECTURE.md)**
   - React component hierarchy and relationships
   - Component communication patterns
   - Performance optimization strategies
   - Testing methodologies

4. **[DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)**
   - Development environment setup
   - Coding standards and conventions
   - Testing guidelines and workflows
   - Contribution guidelines

## 🏗️ Architecture Overview

```
OpenShape CAD Application
├── Frontend Framework: Next.js 15.2.3 + React 18.2.0
├── 3D Engine: Three.js 0.174.0 + React Three Fiber
├── CAD Engine: JSCAD 2.12.5 (JavaScript CAD)
├── UI Framework: Tailwind CSS + Lucide Icons
├── State Management: React Context + Custom Event System
└── File I/O: Multiple format support (STL, OBJ, PLY)
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Modern browser with WebGL support
- Git

### Installation
```bash
# Clone repository
git clone <repository-url>
cd openshape

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

### Verification
1. Open the CAD interface at http://localhost:3000/cad-interface
2. Add a primitive (cube, sphere, cylinder)
3. Verify 3D rendering works
4. Test basic CAD operations

## 📂 Project Structure

```
openshape/
├── components/              # React UI components
│   ├── JscadThreeViewer.js # Main 3D visualization (1536 lines)
│   ├── Sidebar.js          # Feature tree and model browser
│   ├── ViewCube.tsx        # 3D navigation controls
│   ├── measurements/       # Measurement tools
│   └── [other components]
├── contexts/               # React Context providers
│   └── UnitContext.js     # Global unit management
├── lib/                    # Core business logic
│   ├── mcpTools.js        # Model Management Protocol (1797 lines)
│   ├── jscadProcessor.js  # JSCAD code evaluation
│   ├── cadOperations.js   # CAD operations (880 lines)
│   ├── sketchManager.js   # 2D sketching engine (931 lines)
│   └── partsLibrary.js    # Standard parts library
├── pages/                  # Next.js pages
│   ├── cad-interface.js   # Main CAD application (837 lines)
│   ├── index.js           # Simple interface
│   └── api/               # API routes
├── utils/                  # Utility functions
│   ├── exportUtils.js     # Model export functionality
│   ├── importUtils.js     # Model import functionality
│   ├── measurementUtils.js # Measurement calculations
│   └── unitUtils.js       # Unit conversion
└── styles/                 # CSS and styling
```

## 🔧 Core Components

### 1. 3D Visualization Engine
- **JscadThreeViewer.js**: Main 3D rendering component (1536 lines)
- Real-time JSCAD geometry to Three.js conversion
- Performance-optimized rendering pipeline
- Interactive camera controls and object selection

### 2. CAD Engine Integration
- **JSCAD Processor**: Sandboxed JavaScript evaluation for 3D modeling
- **Parts Library**: Standard primitives and complex parts
- **Boolean Operations**: Advanced CAD operations (union, subtract, intersect)
- **Sketch Manager**: 2D constraint-based drawing with 3D extrusion

### 3. Model Management
- **Model Store**: Centralized state management for 3D models
- **Event System**: Component communication and updates
- **Import/Export**: Multi-format file support
- **Measurement Tools**: Comprehensive measurement capabilities

### 4. User Interface
- **Professional Layout**: CAD-style interface with toolbars and panels
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Accessibility**: WCAG compliant with keyboard navigation
- **Dark/Light Themes**: User preference support

## 🎨 Key Technologies

### Frontend Stack
- **Next.js 15.2.3**: React framework with SSR capabilities
- **React 18.2.0**: Modern React with hooks and concurrent features
- **TypeScript 5**: Type safety and enhanced development experience
- **Tailwind CSS 3.4.17**: Utility-first CSS framework

### 3D Graphics & CAD
- **Three.js 0.174.0**: WebGL-based 3D graphics library
- **@react-three/fiber 9.1.0**: React renderer for Three.js
- **@jscad/modeling 2.12.5**: JavaScript CAD geometry engine
- **jscad-fiber 0.0.77**: Custom JSCAD-React integration

### Development Tools
- **ESLint**: Code linting and quality assurance
- **Prettier**: Code formatting
- **Jest**: Unit testing framework
- **Playwright**: End-to-end testing

## 🎯 Usage Examples

### Basic CAD Operations
```javascript
// Create a cube
const cubeResult = createCube({
  width: 20,
  height: 10,
  depth: 15,
  position: [0, 0, 0],
  name: 'Base Block'
});

// Perform boolean operation
const unionResult = CADOperations.union([model1Id, model2Id]);

// Add measurement
const distance = measureDistance([0, 0, 0], [10, 10, 10]);
```

### JSCAD Code Evaluation
```javascript
const jscadCode = `
function main() {
  return union(
    cube({ size: 10 }),
    translate([5, 5, 5], sphere({ radius: 5 }))
  );
}
`;

const geometry = evaluateJSCAD(jscadCode);
const modelId = modelStore.addModel(geometry, 'Complex Shape');
```

### Sketch-to-3D Workflow
```javascript
// Create 2D sketch
const sketchId = sketchManager.createSketch({ plane: 'xy' });

// Add geometric entities
const line1 = sketchManager.addLine(sketchId, [0, 0], [10, 0]);
const line2 = sketchManager.addLine(sketchId, [10, 0], [10, 10]);

// Add constraints
sketchManager.addConstraint(sketchId, 'perpendicular', [line1, line2]);

// Extrude to 3D
const solid = sketchManager.extrudeSketch(sketchId, 5);
```

## 🔧 Development Workflow

### Adding New Features
1. **Read Documentation**: Understand the architecture and patterns
2. **Create Feature Branch**: `git checkout -b feature/new-feature`
3. **Follow Conventions**: Use established coding standards
4. **Add Tests**: Comprehensive unit and integration tests
5. **Update Documentation**: Keep documentation current

### Code Quality
- ESLint configuration for consistent code style
- Prettier for automatic formatting
- TypeScript for type safety
- Comprehensive testing suite
- Performance monitoring and optimization

### Testing Strategy
- **Unit Tests (70%)**: Individual functions and components
- **Integration Tests (20%)**: Component interactions
- **E2E Tests (10%)**: Complete user workflows

## 🚀 Performance Optimizations

### 3D Rendering
- Geometry simplification for complex models
- Level-of-detail (LOD) systems
- Frustum culling for off-screen objects
- Instanced rendering for repeated objects

### React Performance
- Component memoization with React.memo
- useMemo and useCallback for expensive operations
- Code splitting for large components
- Virtual scrolling for large lists

### Memory Management
- Proper Three.js resource disposal
- WeakMap usage for object associations
- Event listener cleanup
- Garbage collection optimization

## 🎓 Learning Resources

### Understanding the Codebase
1. Start with **COMPREHENSIVE_PROJECT_DOCUMENTATION.md** for high-level overview
2. Review **COMPONENT_ARCHITECTURE.md** for React patterns
3. Use **API_DOCUMENTATION.md** for specific implementation details
4. Follow **DEVELOPMENT_GUIDE.md** for contributing

### Key Concepts
- **JSCAD**: JavaScript-based CAD modeling
- **Three.js**: WebGL 3D graphics programming
- **React Three Fiber**: Declarative 3D with React
- **CAD Workflows**: Sketch-based modeling, boolean operations
- **Performance**: 3D optimization techniques

## 🐛 Troubleshooting

### Common Issues
1. **WebGL not supported**: Check browser compatibility
2. **JSCAD evaluation errors**: Verify code syntax and available functions
3. **Performance issues**: Monitor geometry complexity and rendering load
4. **Memory leaks**: Check Three.js resource cleanup

### Debug Tools
```javascript
// Access debugging utilities in browser console
window.CADDebug.modelStore      // Inspect model data
window.CADDebug.getScene()      // Access Three.js scene
window.CADDebug.performanceMonitor // Monitor performance
```

## 🤝 Contributing

### Getting Started
1. Fork the repository
2. Set up development environment
3. Read the development guide
4. Create a feature branch
5. Submit a pull request

### Code Standards
- Follow established patterns in the codebase
- Write comprehensive tests
- Update documentation
- Use meaningful commit messages
- Follow the git workflow described in DEVELOPMENT_GUIDE.md

## 📋 API Reference Quick Links

### Core APIs
- **Model Store**: Centralized model management
- **JSCAD Processor**: Code evaluation and geometry generation
- **Sketch Manager**: 2D drawing and constraints
- **Parts Library**: Standard CAD components
- **CAD Operations**: Boolean and transformation operations

### Utility APIs
- **Export/Import**: File format conversion
- **Measurements**: Distance, angle, volume calculations
- **Units**: Metric/Imperial conversion system
- **Events**: Component communication system

## 🏆 Project Goals

OpenShape aims to provide:
1. **Professional CAD capability** in the browser
2. **Educational platform** for learning 3D modeling
3. **Extensible architecture** for custom CAD tools
4. **Performance equivalent** to desktop CAD applications
5. **Modern development practices** and code quality

## 📞 Support & Community

- **Issues**: Report bugs and request features on GitHub
- **Discussions**: Community discussions and questions
- **Documentation**: Comprehensive guides and API references
- **Examples**: Working code samples and tutorials

## 🔮 Future Roadmap

- **Advanced Constraints**: More sophisticated constraint solving
- **Assembly Modeling**: Multi-part assemblies and relationships
- **Simulation Integration**: FEA and motion simulation
- **Cloud Collaboration**: Real-time collaborative editing
- **Plugin System**: Third-party extensions and tools
- **Mobile Optimization**: Touch-based CAD interactions

---

**Note for LLM Context**: This project represents a comprehensive browser-based CAD application with professional-grade capabilities. The extensive documentation provides complete context for understanding the architecture, APIs, components, and development patterns. Use the linked documentation files for detailed information about specific aspects of the system.

The codebase follows modern React patterns, emphasizes performance optimization for 3D graphics, and maintains high code quality standards. The modular architecture makes it easy to extend and customize for specific CAD applications or integrate new features.

For development questions, refer to the specific documentation sections that cover the relevant topic in detail. The API documentation provides exact function signatures and usage examples, while the component architecture guide explains the React patterns and component relationships.