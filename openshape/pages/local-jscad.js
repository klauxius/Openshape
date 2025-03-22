import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

// Import components from the local jscad-fiber library
const JscadView = dynamic(() => 
  import('@jscad-fiber/components/jscad-view').then(mod => mod.JsCadView), 
  { ssr: false }
);

const Cube = dynamic(() => 
  import('@jscad-fiber').then(mod => {
    console.log('Available exports from @jscad-fiber:', Object.keys(mod));
    return mod.Cube;
  }), 
  { ssr: false }
);

// This component ensures the 3D rendering only happens on the client
function ClientOnlyJscad() {
  const [isMounted, setIsMounted] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    setIsMounted(true);
    console.log('Component mounted, container:', containerRef.current);
  }, []);

  if (!isMounted) {
    return <div>Loading JSCAD components...</div>;
  }

  return (
    <div 
      ref={containerRef}
      style={{ 
        width: '100%', 
        height: '400px', 
        border: '1px solid #ccc' 
      }}
    >
      <JscadView>
        <Cube size={10} color="orange" center={[0, 0, 10]} />
      </JscadView>
    </div>
  );
}

// Error boundary component to catch rendering errors
function ErrorBoundary({ children }) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const errorHandler = (error) => {
      console.error('Error caught by boundary:', error);
      setError(error.message || 'Unknown error');
      setHasError(true);
    };

    window.addEventListener('error', errorHandler);
    return () => window.removeEventListener('error', errorHandler);
  }, []);

  if (hasError) {
    return (
      <div style={{
        padding: '15px',
        border: '1px solid #f00',
        backgroundColor: '#fff0f0',
        color: '#800',
        borderRadius: '4px',
        margin: '10px 0'
      }}>
        <h3>Error Rendering 3D View</h3>
        <p>{error}</p>
      </div>
    );
  }

  return children;
}

export default function LocalJscadPage() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Local JSCAD Fiber Test</h1>
      <p>Using the local jscad-fiber library via @jscad-fiber alias</p>
      
      <ErrorBoundary>
        <ClientOnlyJscad />
      </ErrorBoundary>
      
      <div style={{ marginTop: '20px' }}>
        <h3>Implementation Notes:</h3>
        <ul>
          <li>Imported <code>JsCadView</code> from <code>@jscad-fiber/components/jscad-view</code></li>
          <li>Imported <code>Cube</code> from <code>@jscad-fiber</code> root exports</li>
          <li>Using dynamic imports to ensure all components load client-side only</li>
          <li>Added error boundary to gracefully handle rendering issues</li>
        </ul>
      </div>
    </div>
  );
} 