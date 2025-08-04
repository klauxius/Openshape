# OpenShape API Documentation

## Table of Contents

1. [Model Store API](#model-store-api)
2. [JSCAD Processor API](#jscad-processor-api)
3. [Sketch Manager API](#sketch-manager-api)
4. [Parts Library API](#parts-library-api)
5. [CAD Operations API](#cad-operations-api)
6. [Import/Export API](#importexport-api)
7. [Measurement API](#measurement-api)
8. [Unit System API](#unit-system-api)
9. [Event System](#event-system)
10. [Error Handling](#error-handling)

---

## Model Store API

The Model Store (`lib/mcpTools.js`) provides centralized model management functionality.

### Core Methods

#### `addModel(geometry, name, metadata = {})`
Adds a new model to the store.

**Parameters:**
- `geometry` (Object): JSCAD geometry object
- `name` (String): Display name for the model
- `metadata` (Object): Optional metadata (material, color, etc.)

**Returns:** String - Unique model ID

**Example:**
```javascript
import { modelStore } from '../lib/mcpTools';

const cube = jscad.primitives.cube({ size: 10 });
const modelId = modelStore.addModel(cube, 'My Cube', {
  color: [1, 0, 0],
  material: 'metal'
});
```

#### `getModel(id)`
Retrieves a model by ID.

**Parameters:**
- `id` (String): Model ID

**Returns:** Object | null - Model data or null if not found

**Example:**
```javascript
const model = modelStore.getModel(modelId);
if (model) {
  console.log(model.name, model.geometry);
}
```

#### `getAllModels()`
Returns all models in the store.

**Returns:** Array - Array of model objects

#### `deleteModel(id)`
Removes a model from the store.

**Parameters:**
- `id` (String): Model ID

**Returns:** Boolean - Success status

#### `setActiveModel(id)`
Sets the active model for operations.

**Parameters:**
- `id` (String): Model ID

#### `getActiveModel()`
Gets the currently active model.

**Returns:** Object | null - Active model or null

### Model Object Structure

```javascript
{
  id: "unique-id",
  name: "Model Name",
  geometry: JSCADGeometry,
  visible: true,
  created: 1234567890,
  modified: 1234567891,
  metadata: {
    color: [1, 0, 0],
    material: "metal",
    // custom properties
  }
}
```

### Events

The model store emits events that components can listen to:

- `model-added`: When a new model is added
- `model-deleted`: When a model is removed
- `model-changed`: When a model is modified
- `active-model-changed`: When the active model changes

**Example:**
```javascript
import { notifyModelChanged } from '../lib/mcpTools';

// Listen for model changes
const handleModelChange = (modelData) => {
  console.log('Model changed:', modelData);
};

// This is typically handled internally, but you can trigger notifications
notifyModelChanged(modelData);
```

---

## JSCAD Processor API

The JSCAD Processor (`lib/jscadProcessor.js`) handles JavaScript code evaluation and geometry generation.

### Core Functions

#### `evaluateJSCAD(code)`
Evaluates JSCAD JavaScript code in a sandboxed environment.

**Parameters:**
- `code` (String): JavaScript code containing JSCAD operations

**Returns:** Object - JSCAD geometry object

**Available Context Functions:**
```javascript
// Primitives
cube, cuboid, sphere, cylinder, cone

// Boolean operations
union, subtract, difference, intersect

// Transformations
translate, rotate, scale

// Extrusions
extrudeLinear, extrudeRotate

// 2D primitives
circle, square, rectangle

// Utilities
vec2, vec3
```

**Example:**
```javascript
import { evaluateJSCAD } from '../lib/jscadProcessor';

const code = `
function main() {
  return union(
    cube({ size: 10 }),
    translate([5, 5, 5], sphere({ radius: 5 }))
  );
}
`;

try {
  const geometry = evaluateJSCAD(code);
  const modelId = modelStore.addModel(geometry, 'Complex Shape');
} catch (error) {
  console.error('JSCAD evaluation failed:', error);
}
```

#### `generatePrimitiveCode(type, params = {})`
Generates JSCAD code for standard primitives.

**Parameters:**
- `type` (String): Primitive type ('cube', 'sphere', 'cylinder', etc.)
- `params` (Object): Parameters for the primitive

**Returns:** String - Generated JSCAD code

**Example:**
```javascript
import { generatePrimitiveCode } from '../lib/jscadProcessor';

const cubeCode = generatePrimitiveCode('cube', { size: 15 });
const sphereCode = generatePrimitiveCode('sphere', { radius: 8 });
const cylinderCode = generatePrimitiveCode('cylinder', { 
  height: 20, 
  radius: 6 
});
```

### Error Handling

JSCAD evaluation can fail for various reasons. Always wrap in try-catch:

```javascript
try {
  const geometry = evaluateJSCAD(userCode);
  // Handle successful evaluation
} catch (error) {
  if (error.name === 'SyntaxError') {
    console.error('JavaScript syntax error in user code');
  } else if (error.message.includes('JSCAD')) {
    console.error('JSCAD-specific error');
  } else {
    console.error('General evaluation error:', error);
  }
}
```

---

## Sketch Manager API

The Sketch Manager (`lib/sketchManager.js`) provides 2D sketching capabilities.

### Core Methods

#### `createSketch(planeInfo, layer = 'default')`
Creates a new sketch on the specified plane.

**Parameters:**
- `planeInfo` (Object): Plane definition
- `layer` (String): Layer name (optional)

**Plane Info Structure:**
```javascript
{
  plane: 'xy' | 'yz' | 'xz' | 'custom',
  offset: 0,  // Offset distance for custom planes
  normal: [0, 0, 1],  // Normal vector for custom planes
  origin: [0, 0, 0]   // Origin point for custom planes
}
```

**Returns:** String - Sketch ID

**Example:**
```javascript
import sketchManager from '../lib/sketchManager';

// Create sketch on XY plane
const sketchId = sketchManager.createSketch({ plane: 'xy' });

// Create offset sketch
const offsetSketchId = sketchManager.createSketch({
  plane: 'xy',
  offset: 10
});
```

#### `addLine(sketchId, startPoint, endPoint)`
Adds a line to the sketch.

**Parameters:**
- `sketchId` (String): Sketch ID
- `startPoint` (Array): [x, y] coordinates
- `endPoint` (Array): [x, y] coordinates

**Returns:** String - Entity ID

#### `addCircle(sketchId, center, radius)`
Adds a circle to the sketch.

**Parameters:**
- `sketchId` (String): Sketch ID
- `center` (Array): [x, y] coordinates
- `radius` (Number): Circle radius

**Returns:** String - Entity ID

#### `addRectangle(sketchId, corner1, corner2)`
Adds a rectangle to the sketch.

**Parameters:**
- `sketchId` (String): Sketch ID
- `corner1` (Array): [x, y] coordinates of first corner
- `corner2` (Array): [x, y] coordinates of opposite corner

**Returns:** String - Entity ID

#### `addConstraint(sketchId, constraintType, entities, value)`
Adds a constraint to sketch entities.

**Parameters:**
- `sketchId` (String): Sketch ID
- `constraintType` (String): Type of constraint
- `entities` (Array): Array of entity IDs
- `value` (Number): Constraint value (for dimensional constraints)

**Constraint Types:**
- `'distance'`: Distance between two points
- `'parallel'`: Two lines are parallel
- `'perpendicular'`: Two lines are perpendicular
- `'horizontal'`: Line is horizontal
- `'vertical'`: Line is vertical
- `'tangent'`: Line is tangent to circle

**Example:**
```javascript
const line1 = sketchManager.addLine(sketchId, [0, 0], [10, 0]);
const line2 = sketchManager.addLine(sketchId, [10, 0], [10, 10]);

// Make lines perpendicular
sketchManager.addConstraint(sketchId, 'perpendicular', [line1, line2]);

// Set specific length
sketchManager.addConstraint(sketchId, 'distance', [line1], 15);
```

#### `extrudeSketch(sketchId, distance, direction = [0, 0, 1])`
Extrudes a sketch into 3D geometry.

**Parameters:**
- `sketchId` (String): Sketch ID
- `distance` (Number): Extrusion distance
- `direction` (Array): Extrusion direction vector

**Returns:** Object - JSCAD 3D geometry

#### `getSketch(sketchId)`
Retrieves sketch data.

**Returns:** Object - Sketch data including entities and constraints

#### `deleteSketch(sketchId)`
Deletes a sketch.

**Returns:** Boolean - Success status

### Sketch Object Structure

```javascript
{
  id: "sketch-id",
  name: "Sketch Name",
  plane: "xy",
  entities: [
    {
      id: "entity-id",
      type: "line",
      startPoint: [0, 0],
      endPoint: [10, 0]
    }
  ],
  constraints: [
    {
      id: "constraint-id",
      type: "distance",
      entities: ["entity-id"],
      value: 10
    }
  ]
}
```

---

## Parts Library API

The Parts Library (`lib/partsLibrary.js`) provides standard CAD parts.

### Standard Parts

#### `createCube(params = {})`
Creates a cube/cuboid.

**Parameters:**
```javascript
{
  width: 10,           // Width (X dimension)
  height: 10,          // Height (Y dimension)  
  depth: 10,           // Depth (Z dimension)
  position: [0, 0, 0], // Center position
  name: 'Cube'         // Part name
}
```

#### `createSphere(params = {})`
Creates a sphere.

**Parameters:**
```javascript
{
  radius: 5,           // Sphere radius
  position: [0, 0, 0], // Center position
  segments: 32,        // Resolution (optional)
  name: 'Sphere'       // Part name
}
```

#### `createCylinder(params = {})`
Creates a cylinder.

**Parameters:**
```javascript
{
  height: 10,          // Cylinder height
  radius: 5,           // Cylinder radius
  position: [0, 0, 0], // Center position
  segments: 32,        // Resolution (optional)
  name: 'Cylinder'     // Part name
}
```

#### `createTorus(params = {})`
Creates a torus.

**Parameters:**
```javascript
{
  majorRadius: 10,     // Major radius
  minorRadius: 2,      // Minor radius
  position: [0, 0, 0], // Center position
  segments: 32,        // Resolution (optional)
  name: 'Torus'        // Part name
}
```

### Return Format

All part creation functions return:

```javascript
{
  success: true,
  modelId: "generated-id",
  model: {
    id: "generated-id",
    name: "Part Name",
    geometry: JSCADGeometry
  },
  message: "Created successfully"
}
```

Or on error:
```javascript
{
  success: false,
  error: "Error message"
}
```

### Usage Example

```javascript
import { createCube, createSphere } from '../lib/partsLibrary';

// Create a cube
const cubeResult = createCube({
  width: 20,
  height: 10,
  depth: 15,
  position: [0, 0, 0],
  name: 'Base Block'
});

if (cubeResult.success) {
  console.log('Created cube with ID:', cubeResult.modelId);
}

// Create a sphere
const sphereResult = createSphere({
  radius: 8,
  position: [10, 10, 5],
  name: 'Ball'
});
```

---

## CAD Operations API

The CAD Operations module (`lib/cadOperations.js`) provides boolean and transformation operations.

### Boolean Operations

#### `union(models)`
Combines multiple models into one.

**Parameters:**
- `models` (Array): Array of model IDs or geometry objects

**Returns:** Object - Result geometry

#### `subtract(baseModel, subtractModels)`
Subtracts models from a base model.

**Parameters:**
- `baseModel` (String|Object): Base model ID or geometry
- `subtractModels` (Array): Models to subtract

#### `intersect(models)`
Creates intersection of multiple models.

**Parameters:**
- `models` (Array): Array of model IDs or geometry objects

### Transformation Operations

#### `translate(model, vector)`
Translates a model.

**Parameters:**
- `model` (String|Object): Model ID or geometry
- `vector` (Array): Translation vector [x, y, z]

#### `rotate(model, angles)`
Rotates a model.

**Parameters:**
- `model` (String|Object): Model ID or geometry
- `angles` (Array): Rotation angles [x, y, z] in radians

#### `scale(model, factors)`
Scales a model.

**Parameters:**
- `model` (String|Object): Model ID or geometry
- `factors` (Array): Scale factors [x, y, z]

### Usage Example

```javascript
import { CADOperations } from '../lib/cadOperations';

// Create two cubes
const cube1Id = modelStore.addModel(
  jscad.primitives.cube({ size: 10 }), 
  'Cube 1'
);

const cube2Id = modelStore.addModel(
  jscad.primitives.cube({ size: 8 }), 
  'Cube 2'
);

// Union operation
const unionResult = CADOperations.union([cube1Id, cube2Id]);

// Translate the result
const translatedResult = CADOperations.translate(unionResult, [10, 0, 0]);

// Add result to model store
const finalModelId = modelStore.addModel(translatedResult, 'Union Result');
```

---

## Import/Export API

### Export Functions (`utils/exportUtils.js`)

#### `exportModel(modelId, format, options = {})`
Exports a model to the specified format.

**Parameters:**
- `modelId` (String): Model to export
- `format` (String): File format ('stl', 'obj', 'ply')
- `options` (Object): Format-specific options

**Returns:** Promise - Resolves to file data

**STL Options:**
```javascript
{
  binary: true,        // Binary or ASCII format
  precision: 6         // Decimal precision for ASCII
}
```

**OBJ Options:**
```javascript
{
  includeNormals: true,  // Include vertex normals
  includeTextures: false // Include texture coordinates
}
```

#### `exportMultipleModels(modelIds, format, options = {})`
Exports multiple models as a single file.

#### `downloadFile(data, filename)`
Triggers browser download of file data.

### Import Functions (`utils/importUtils.js`)

#### `importModel(fileData, format, options = {})`
Imports a model from file data.

**Parameters:**
- `fileData` (ArrayBuffer|String): File content
- `format` (String): File format
- `options` (Object): Import options

**Returns:** Promise - Resolves to geometry object

#### `importFromUrl(url, format)`
Imports a model from a URL.

### Usage Example

```javascript
import { exportModel, importModel } from '../utils/exportUtils';
import { importModel } from '../utils/importUtils';

// Export model
exportModel(modelId, 'stl', { binary: true })
  .then(data => {
    downloadFile(data, 'model.stl');
  });

// Import model
const fileInput = document.getElementById('file-input');
const file = fileInput.files[0];

file.arrayBuffer().then(data => {
  return importModel(data, 'stl');
}).then(geometry => {
  const importedModelId = modelStore.addModel(geometry, 'Imported Model');
});
```

---

## Measurement API

### Measurement Functions (`utils/measurementUtils.js`)

#### `measureDistance(point1, point2)`
Measures distance between two points.

**Parameters:**
- `point1` (Array): [x, y, z] coordinates
- `point2` (Array): [x, y, z] coordinates

**Returns:** Number - Distance value

#### `measureAngle(point1, vertex, point2)`
Measures angle between three points.

**Parameters:**
- `point1` (Array): First point
- `vertex` (Array): Vertex point
- `point2` (Array): Second point

**Returns:** Number - Angle in radians

#### `measureVolume(geometry)`
Calculates volume of 3D geometry.

**Parameters:**
- `geometry` (Object): JSCAD geometry

**Returns:** Number - Volume value

#### `measureSurfaceArea(geometry)`
Calculates surface area of 3D geometry.

### Usage Example

```javascript
import { measureDistance, measureVolume } from '../utils/measurementUtils';

// Measure distance
const distance = measureDistance([0, 0, 0], [10, 10, 10]);
console.log('Distance:', distance);

// Measure volume
const model = modelStore.getModel(modelId);
const volume = measureVolume(model.geometry);
console.log('Volume:', volume);
```

---

## Unit System API

### Unit Conversion (`utils/unitUtils.js`)

#### `convertUnits(value, fromUnit, toUnit)`
Converts between different units.

**Parameters:**
- `value` (Number): Value to convert
- `fromUnit` (String): Source unit
- `toUnit` (String): Target unit

**Supported Units:**
- Length: 'mm', 'cm', 'm', 'in', 'ft'
- Angle: 'rad', 'deg'
- Volume: 'mm³', 'cm³', 'm³', 'in³', 'ft³'

#### `formatValue(value, unit, precision = 2)`
Formats a value for display with proper units.

**Parameters:**
- `value` (Number): Numeric value
- `unit` (String): Unit string
- `precision` (Number): Decimal places

**Returns:** String - Formatted string

### Unit Context

The unit context provides application-wide unit management:

```javascript
import { useUnits } from '../contexts/UnitContext';

function MyComponent() {
  const { 
    units,           // Current unit system
    setUnits,        // Change unit system
    convertValue,    // Convert with current units
    formatValue      // Format with current units
  } = useUnits();

  return (
    <div>
      <p>Current units: {units.length}</p>
      <p>Converted value: {convertValue(100, 'mm')}</p>
    </div>
  );
}
```

---

## Event System

The application uses a custom event system for component communication.

### Event Types

- `model-added`: New model added to store
- `model-deleted`: Model removed from store
- `model-changed`: Model geometry or properties changed
- `active-model-changed`: Active model selection changed
- `sketch-created`: New sketch created
- `sketch-modified`: Sketch geometry changed
- `measurement-added`: New measurement created

### Subscribing to Events

```javascript
import { eventEmitter } from '../lib/mcpTools';

// Subscribe to model changes
eventEmitter.on('model-changed', (modelData) => {
  console.log('Model updated:', modelData);
});

// Unsubscribe
const unsubscribe = eventEmitter.on('model-added', handler);
unsubscribe(); // Call to remove listener
```

### Emitting Events

```javascript
import { eventEmitter } from '../lib/mcpTools';

// Emit custom event
eventEmitter.emit('custom-event', eventData);
```

---

## Error Handling

### Error Types

The application defines several error types for better error handling:

```javascript
class JSCADError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'JSCADError';
    this.code = code;
  }
}

class GeometryError extends Error {
  constructor(message, geometry) {
    super(message);
    this.name = 'GeometryError';
    this.geometry = geometry;
  }
}
```

### Error Handling Patterns

#### JSCAD Operations
```javascript
try {
  const geometry = evaluateJSCAD(code);
  const modelId = modelStore.addModel(geometry, name);
} catch (error) {
  if (error instanceof JSCADError) {
    // Handle JSCAD-specific errors
    console.error('JSCAD Error:', error.message, error.code);
  } else {
    // Handle general errors
    console.error('Unexpected error:', error);
  }
}
```

#### Model Operations
```javascript
try {
  const result = CADOperations.union([model1Id, model2Id]);
} catch (error) {
  if (error instanceof GeometryError) {
    console.error('Geometry operation failed:', error.message);
  }
}
```

#### Import/Export Operations
```javascript
try {
  const geometry = await importModel(fileData, format);
} catch (error) {
  if (error.message.includes('format')) {
    console.error('Unsupported file format');
  } else if (error.message.includes('parse')) {
    console.error('File parsing failed');
  } else {
    console.error('Import failed:', error);
  }
}
```

### Best Practices

1. **Always wrap API calls in try-catch blocks**
2. **Provide meaningful error messages to users**
3. **Log detailed errors for debugging**
4. **Handle partial failures gracefully**
5. **Implement retry logic for network operations**

This API documentation provides the essential interfaces for extending and integrating with the OpenShape CAD application. Each API is designed to be intuitive while providing the flexibility needed for advanced CAD operations.