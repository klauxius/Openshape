import * as modeling from '@jscad/modeling'

// Create a sandbox environment for evaluating JSCAD code
export const evaluateJSCAD = (code) => {
  try {
    // Build a context with all the JSCAD modeling functions
    const context = {
      // Primitives
      cube: modeling.primitives.cube,
      cuboid: modeling.primitives.cuboid,
      sphere: modeling.primitives.sphere,
      cylinder: modeling.primitives.cylinder,
      cone: modeling.primitives.cone,
      
      // Boolean operations
      union: modeling.booleans.union,
      subtract: modeling.booleans.subtract, 
      difference: modeling.booleans.subtract, // alias for subtract
      intersect: modeling.booleans.intersect,
      
      // Transformations
      translate: modeling.transforms.translate,
      rotate: modeling.transforms.rotate,
      scale: modeling.transforms.scale,
      
      // Extrusions
      extrudeLinear: modeling.extrusions.extrudeLinear,
      extrudeRotate: modeling.extrusions.extrudeRotate,
      
      // 2D primitives
      circle: modeling.primitives.circle,
      square: modeling.primitives.square,
      rectangle: modeling.primitives.rectangle,
      
      // Utilities
      vec2: modeling.maths.vec2,
      vec3: modeling.maths.vec3
    }
    
    // Create a function from the code that uses our context
    const evalFunction = new Function(
      ...Object.keys(context),
      `${code}; return typeof main === 'function' ? main() : null;`
    )
    
    // Execute the function with all the modeling functions as arguments
    const result = evalFunction(...Object.values(context))
    
    // Log more debugging info to help diagnose issues
    console.log('JSCAD evaluation result:', result)
    return result
  } catch (error) {
    console.error('Error evaluating JSCAD code:', error)
    throw error
  }
}

// This function would be used to generate specific primitive code
export const generatePrimitiveCode = (type, params = {}) => {
  switch (type) {
    case 'cube':
      const size = params.size || 10
      return `function main() {\n  return cube({size: ${size}});\n}`
    
    case 'sphere':
      const radius = params.radius || 10
      return `function main() {\n  return sphere({radius: ${radius}});\n}`
    
    case 'cylinder':
      const height = params.height || 10
      const radius1 = params.radius || 5
      return `function main() {\n  return cylinder({height: ${height}, radius: ${radius1}});\n}`
    
    case 'union':
      return `function main() {\n  return union(\n    cube({size: 10}),\n    translate([5, 5, 5], sphere({radius: 5}))\n  );\n}`
    
    case 'difference':
      return `function main() {\n  return difference(\n    cube({size: 10}),\n    translate([5, 5, 5], sphere({radius: 6}))\n  );\n}`
    
    case 'intersection':
      return `function main() {\n  return intersect(\n    cube({size: 10}),\n    translate([5, 5, 5], sphere({radius: 8}))\n  );\n}`
      
    default:
      return `function main() {\n  return cube({size: 10});\n}`
  }
} 