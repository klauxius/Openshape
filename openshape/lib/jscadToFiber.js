import React from 'react'
import * as JscadFiber from 'jscad-fiber'

// This is a simplified approach - a complete implementation 
// would need a more sophisticated parser
export function convertJSCADtoComponents(code) {
  try {
    // Extract the main function
    const mainFnMatch = code.match(/function\s+main\s*\(\s*\)\s*{([\s\S]*?return\s+([\s\S]*?);[\s\S]*?)}/m)
    
    if (!mainFnMatch || !mainFnMatch[2]) {
      throw new Error('Could not find main function with return statement')
    }
    
    const returnExpr = mainFnMatch[2].trim()
    
    // Now parse the return expression to create components
    if (returnExpr.startsWith('cube(')) {
      const params = extractParams(returnExpr, 'cube')
      return <JscadFiber.Cube size={params.size || 10} color="steelblue" />
    }
    
    if (returnExpr.startsWith('sphere(')) {
      const params = extractParams(returnExpr, 'sphere')
      return <JscadFiber.Sphere radius={params.radius || 10} color="coral" />
    }
    
    if (returnExpr.startsWith('cylinder(')) {
      const params = extractParams(returnExpr, 'cylinder')
      return <JscadFiber.Cylinder 
        radius={params.radius || 5} 
        height={params.height || 10}
        color="seagreen" 
      />
    }
    
    if (returnExpr.startsWith('difference(') || returnExpr.startsWith('subtract(')) {
      // This is simplified - a real implementation would need recursive parsing
      return (
        <JscadFiber.Subtract>
          <JscadFiber.Cube size={10} color="steelblue" />
          <JscadFiber.Sphere radius={6} color="red" />
        </JscadFiber.Subtract>
      )
    }
    
    throw new Error('Unsupported geometry type')
  } catch (error) {
    console.error('Error converting JSCAD to components:', error)
    throw error
  }
}

// Helper to extract parameters from function calls
function extractParams(expr, funcName) {
  const paramsMatch = expr.match(new RegExp(`${funcName}\\(\\s*{([^}]*)}\\s*\\)`))
  if (!paramsMatch) return {}
  
  const paramsStr = paramsMatch[1]
  const params = {}
  
  // Extract key-value pairs
  const keyValueRegex = /(\w+)\s*:\s*([^,}]+)/g
  let match
  while ((match = keyValueRegex.exec(paramsStr)) !== null) {
    const key = match[1].trim()
    let value = match[2].trim()
    
    // Try to convert to number if possible
    if (!isNaN(value)) {
      params[key] = parseFloat(value)
    } else {
      params[key] = value
    }
  }
  
  return params
} 