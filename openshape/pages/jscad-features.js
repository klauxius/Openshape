import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Import the JSCAD-Three.js component with SSR disabled
const JscadThreeViewer = dynamic(
  () => import('../components/JscadThreeViewer'),
  { ssr: false, loading: () => <div>Loading JSCAD viewer...</div> }
);

export default function JscadFeaturesPage() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return <div style={{ padding: '20px' }}>Loading page...</div>;
  }
  
  return (
    <div style={{ padding: '20px' }}>
      <h1>JSCAD Modeling Features</h1>
      <p>Demonstrating programmatic CAD capabilities using @jscad/modeling with Three.js</p>
      
      <div style={{ 
        width: '700px', 
        height: '500px', 
        border: '1px solid #ccc',
        marginBottom: '20px'
      }}>
        <JscadThreeViewer />
      </div>
      
      <div>
        <h3>JSCAD Modeling Features:</h3>
        <ul>
          <li><strong>Primitive Shapes:</strong> Create basic shapes like cubes, spheres, and cylinders programmatically</li>
          <li><strong>Boolean Operations:</strong> 
            <ul>
              <li><strong>Subtract:</strong> Remove material (e.g., creating holes)</li>
              <li><strong>Union:</strong> Combine shapes together</li>
              <li><strong>Intersect:</strong> Keep only overlapping portions</li>
            </ul>
          </li>
          <li><strong>Transformations:</strong> 
            <ul>
              <li><strong>Translate:</strong> Move objects in 3D space</li>
              <li><strong>Rotate:</strong> Rotate objects around different axes</li>
              <li><strong>Scale:</strong> Change object dimensions</li>
            </ul>
          </li>
          <li><strong>Extrusions:</strong> Create 3D objects from 2D profiles</li>
          <li><strong>Parametric Design:</strong> Modify shapes by changing their parameters</li>
          <li><strong>CSG (Constructive Solid Geometry):</strong> Build complex models from simple components</li>
        </ul>
        
        <h3>Available Examples:</h3>
        <p>Use the dropdown menu in the top-left corner of the viewer to explore different JSCAD features:</p>
        <ul>
          <li><strong>Cube, Sphere, Cylinder:</strong> Basic primitive shapes</li>
          <li><strong>Complex (Subtract):</strong> A cylinder with a cube-shaped hole using boolean subtraction</li>
          <li><strong>Better Complex (Subtract):</strong> An improved implementation of boolean subtraction using scale and translate operations for more reliable results</li>
          <li><strong>Union:</strong> A cube with a sphere on top combined using boolean union</li>
          <li><strong>Extrusion:</strong> A 2D rectangle extruded into a 3D shape</li>
          <li><strong>Rotated:</strong> A cube rotated in 3D space</li>
          <li><strong>Advanced CSG:</strong> A complex model combining multiple boolean operations (holes, cutouts, and additions)</li>
        </ul>
        
        <h3>Implementation Notes:</h3>
        <ul>
          <li>Using @jscad/modeling for creating 3D geometries programmatically</li>
          <li>Custom converter from JSCAD geometry to Three.js BufferGeometry</li>
          <li>Pure client-side rendering with dynamic imports</li>
          <li>Interactive model selection to demonstrate different JSCAD features</li>
          <li>Proper error handling and resource management</li>
        </ul>
        
        <h3>Common Issues and Solutions:</h3>
        <ul>
          <li><strong>"Size must be positive" Error:</strong> When creating primitives, always ensure size values are positive. The "Better Complex" example demonstrates a more robust approach using unit primitives with scaling.</li>
          <li><strong>Boolean Operation Failures:</strong> Boolean operations can sometimes fail with complex shapes. Try using simpler shapes or adjusting the positioning for more reliable results.</li>
          <li><strong>Rendering Performance:</strong> Complex models with many polygons can affect performance. Use appropriate level of detail for your application needs.</li>
          <li><strong>Transform Order:</strong> The order of transformations matters. Try to apply translations after other transformations for more predictable results.</li>
        </ul>
      </div>
    </div>
  );
}