import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import styles from '../styles/CadInterface.module.css';

// Import the Three.js viewer component with SSR disabled
const JscadThreeViewer = dynamic(
  () => import('../components/JscadThreeViewer'),
  { ssr: false, loading: () => <div>Loading 3D viewer...</div> }
);

export default function CadInterface() {
  const [mounted, setMounted] = useState(false);
  const [expandedFeatures, setExpandedFeatures] = useState(true);
  const [expandedParts, setExpandedParts] = useState(false);
  const [expandedDefaultGeometry, setExpandedDefaultGeometry] = useState(true);
  
  // Fake data for the UI mockup
  const featureItems = [
    { id: 1, name: 'Sketch 1', type: 'sketch' },
    { id: 2, name: 'Extrude 1', type: 'extrude' },
    { id: 3, name: 'Sketch 2', type: 'sketch' },
    { id: 4, name: 'Extrude 2', type: 'extrude' },
  ];
  
  const defaultGeometryItems = [
    { id: 'origin', name: 'Origin', type: 'origin' },
    { id: 'top', name: 'Top', type: 'plane' },
    { id: 'front', name: 'Front', type: 'plane' },
    { id: 'right', name: 'Right', type: 'plane' },
  ];
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return <div>Loading interface...</div>;
  }
  
  return (
    <>
      <Head>
        <title>Openshape CAD</title>
        <meta name="description" content="OpenSource browser-based CAD software" />
        <style jsx global>{`
          html, body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            width: 100%;
            height: 100%;
            font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
          }
          #__next {
            width: 100%;
            height: 100%;
          }
        `}</style>
      </Head>
      
      <div className={styles.cadContainer}>
        {/* Header with project name and controls */}
        <header className={styles.header}>
          <div className={styles.logoSection}>
            <img src="/logo.svg" alt="Openshape" className={styles.logo} />
            <span>Openshape</span>
          </div>
          
          <div className={styles.documentTitle}>
            <span>Lacing Table</span>
            <span className={styles.documentType}>Main</span>
          </div>
          
          <div className={styles.headerControls}>
            <button className={styles.headerButton}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button className={styles.headerButton}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            </button>
            <button className={styles.headerButton}>0</button>
            <button className={styles.headerButton}>0</button>
            <button className={styles.shareButton}>Share</button>
          </div>
        </header>
        
        {/* Main toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.toolGroup}>
            <button className={styles.toolButton}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <button className={styles.toolButton}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <button className={styles.toolButton}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
          
          <div className={styles.toolGroup}>
            <button className={styles.toolButton}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
                <path d="M2 2l7.586 7.586"></path>
                <circle cx="11" cy="11" r="2"></circle>
              </svg>
              <span>Sketch</span>
            </button>
          </div>
          
          <div className={styles.toolGroup}>
            <button className={styles.toolButton}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              </svg>
            </button>
            <button className={styles.toolButton}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
              </svg>
            </button>
            <button className={styles.toolButton}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                <line x1="8" y1="2" x2="8" y2="18"></line>
                <line x1="16" y1="6" x2="16" y2="22"></line>
              </svg>
            </button>
            <button className={styles.toolButton}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              </svg>
            </button>
          </div>
          
          {/* Continue with more tool groups and buttons */}
          <div className={styles.toolGroup}>
            <button className={styles.toolButton}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
            </button>
            <button className={styles.toolButton}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
              </svg>
            </button>
          </div>
          
          <div className={styles.searchBox}>
            <input type="text" placeholder="Search tools..." />
            <button>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
          </div>
        </div>
        
        {/* Main content area */}
        <div className={styles.mainContent}>
          {/* Feature tree sidebar */}
          <div className={styles.sidebar}>
            <div className={styles.sidebarFilter}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
              </svg>
              <input type="text" placeholder="Filter by name or type" />
            </div>
            
            {/* Features Tree */}
            <div className={styles.treeSection}>
              <div 
                className={styles.treeSectionHeader}
                onClick={() => setExpandedFeatures(!expandedFeatures)}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  style={{ transform: expandedFeatures ? 'rotate(90deg)' : 'rotate(0)' }}
                >
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
                <span>Features (8)</span>
              </div>
              
              {expandedFeatures && (
                <div className={styles.treeContent}>
                  {/* Default Geometry Section */}
                  <div className={styles.treeSubSection}>
                    <div 
                      className={styles.treeSubSectionHeader}
                      onClick={() => setExpandedDefaultGeometry(!expandedDefaultGeometry)}
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="12" 
                        height="12" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        style={{ transform: expandedDefaultGeometry ? 'rotate(90deg)' : 'rotate(0)' }}
                      >
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                      <span>Default geometry</span>
                    </div>
                    
                    {expandedDefaultGeometry && (
                      <div className={styles.treeItems}>
                        {defaultGeometryItems.map(item => (
                          <div key={item.id} className={styles.treeItem}>
                            <span className={`${styles.itemIcon} ${styles[item.type]}`}>
                              {item.type === 'origin' && 
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="10"></circle>
                                  <line x1="2" y1="12" x2="22" y2="12"></line>
                                  <line x1="12" y1="2" x2="12" y2="22"></line>
                                </svg>
                              }
                              {item.type === 'plane' && 
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                </svg>
                              }
                            </span>
                            <span>{item.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Feature Items */}
                  {featureItems.map(item => (
                    <div key={item.id} className={styles.treeItem}>
                      <span className={`${styles.itemIcon} ${styles[item.type]}`}>
                        {item.type === 'sketch' && 
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
                            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
                          </svg>
                        }
                        {item.type === 'extrude' && 
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="8 6 21 6 21 18 8 18"></polyline>
                            <path d="M3 6h5v12H3z"></path>
                          </svg>
                        }
                      </span>
                      <span>{item.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Parts Tree */}
            <div className={styles.treeSection}>
              <div 
                className={styles.treeSectionHeader}
                onClick={() => setExpandedParts(!expandedParts)}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  style={{ transform: expandedParts ? 'rotate(90deg)' : 'rotate(0)' }}
                >
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
                <span>Parts (0)</span>
              </div>
              
              {expandedParts && (
                <div className={styles.treeContent}>
                  <div className={styles.emptyState}>No parts defined</div>
                </div>
              )}
            </div>
          </div>
          
          {/* 3D Viewer */}
          <div className={styles.viewerContainer}>
            <JscadThreeViewer />
            
            {/* Coordinate system indicator */}
            <div className={styles.coordinateSystem}>
              <div className={`${styles.axis} ${styles.x}`}>X</div>
              <div className={`${styles.axis} ${styles.y}`}>Y</div>
              <div className={`${styles.axis} ${styles.z}`}>Z</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 