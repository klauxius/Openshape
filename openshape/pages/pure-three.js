import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Import the standalone Three.js component with SSR disabled
const PureThreeViewer = dynamic(
  () => import('../components/PureThreeViewer'),
  { ssr: false, loading: () => <div>Loading 3D viewer...</div> }
);

export default function PureThreePage() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return <div style={{ padding: '20px' }}>Loading page...</div>;
  }
  
  return (
    <div style={{ padding: '20px' }}>
      <h1>Pure Three.js Implementation</h1>
      <p>Using direct Three.js without jscad-fiber components</p>
      
      <div style={{ 
        width: '600px', 
        height: '400px', 
        border: '1px solid #ccc',
        marginBottom: '20px'
      }}>
        <PureThreeViewer />
      </div>
      
      <div>
        <h3>Implementation Notes:</h3>
        <ul>
          <li>Using pure Three.js without any jscad-fiber components</li>
          <li>Dynamic import with ssr: false to prevent server-side rendering</li>
          <li>Independent implementation to avoid React import issues</li>
          <li>Simple blue cube as placeholder for more complex geometries</li>
        </ul>
      </div>
    </div>
  );
} 