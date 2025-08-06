# Color Management System

OpenShape includes a comprehensive color management system that allows users to set default colors for all models and customize individual model colors.

## Default Color

All models in OpenShape use a consistent default color of `#94a6b5` (a neutral gray-blue). This ensures visual coherence across all models in the scene.

## MCP Tools for Color Management

### Set Default Model Color
```javascript
// Set the default color for all new models
set_default_model_color({
  color: "#94a6b5"  // Hex color or CSS color name
})
```

### Get Default Model Color
```javascript
// Get the current default color
get_default_model_color()
```

### Set Individual Model Color
```javascript
// Set color for a specific model
set_model_color({
  modelId: "model_1234567890",
  color: "#ff6b6b"  // Hex color or CSS color name
})
```

## Shape Creation with Colors

When creating shapes, you can specify a custom color:

### Create Cube with Custom Color
```javascript
create_cube({
  width: 10,
  height: 10,
  depth: 10,
  color: "#ff6b6b"  // Optional: custom color
})
```

### Create Sphere with Custom Color
```javascript
create_sphere({
  radius: 5,
  color: "#4ecdc4"  // Optional: custom color
})
```

### Create Cylinder with Custom Color
```javascript
create_cylinder({
  radius: 5,
  height: 10,
  color: "#45b7d1"  // Optional: custom color
})
```

### Create Torus with Custom Color
```javascript
create_torus({
  innerRadius: 2,
  outerRadius: 5,
  color: "#96ceb4"  // Optional: custom color
})
```

## Color Format Support

The color management system supports:
- **Hex colors**: `#94a6b5`, `#ff6b6b`, `#4ecdc4`
- **CSS color names**: `red`, `blue`, `green`, `cyan`, `magenta`, etc.

## Implementation Details

### Model Store Integration
The `modelStore` in `lib/mcpTools.js` includes:
- `defaultColor` property set to `#94a6b5`
- `setDefaultColor(color)` method to change the default
- `getDefaultColor()` method to retrieve the current default
- `setModelColor(modelId, color)` method for individual models

### Viewer Integration
The `JscadThreeViewer` component automatically uses the model's color from the store when creating Three.js materials. If no color is specified, it falls back to the default color.

### Parts Library Integration
All shape creation functions in `lib/partsLibrary.js` automatically apply the default color to new models unless a custom color is specified.

## Testing

Use the `/color-test` page to:
- Change the default color and see it applied to new models
- Create test models with different colors
- View all models and their current colors
- Test the color management system interactively

## Example Usage

1. **Set a new default color**:
   ```
   "Set the default color to red"
   ```

2. **Create a blue cube**:
   ```
   "Create a blue cube with dimensions 10x10x10"
   ```

3. **Change an existing model's color**:
   ```
   "Change the color of model_1234567890 to green"
   ```

The AI assistant will automatically use the appropriate MCP tools to manage colors based on your requests. 