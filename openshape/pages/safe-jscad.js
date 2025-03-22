import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Create a client-only component that wraps JsCadView
const SafeJsCadView = dynamic(() => {
  return import('../components/SafeJsCadView');
}, {
  ssr: false, // Make sure it only loads on the client
  loading: () => <div>Loading 3D Viewer...</div>
});

export default function SafeJscadPage() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return <div style={{ padding: '20px' }}>Loading page...</div>;
  }
  
  return (
    <div style={{ padding: '20px' }}>
      <h1>Safe JSCAD View</h1>
      <p>Using a custom wrapper to safely load the components</p>
      
      <div style={{ 
        width: '600px', 
        height: '400px', 
        border: '1px solid #ccc',
        marginBottom: '20px'
      }}>
        <SafeJsCadView />
      </div>
      
      <div>
        <h3>Implementation Notes:</h3>
        <ul>
          <li>Using a custom SafeJsCadView component that ensures React is properly loaded</li>
          <li>Dynamic imports with ssr: false to prevent server-side rendering issues</li>
          <li>Proper error handling to prevent crashes</li>
        </ul>
      </div>
    </div>
  );
} 