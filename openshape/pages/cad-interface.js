"use client"

import { useState, useEffect, useRef } from "react"
import Head from "next/head"
import dynamic from "next/dynamic"
import {
  ChevronDown,
  ChevronRight,
  Link,
  Search,
  Settings,
  Share,
  Info,
  Square,
  Circle,
  Hexagon,
  Box,
  Layers,
  Pen,
  Maximize,
  Grid,
  Eye,
  EyeOff,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Move,
  PanelLeft,
  Edit3,
  Menu,
  X,
  Ruler,
  Bot,
  Terminal as TerminalIcon,
  MessageSquare,
} from "lucide-react"
import { useUnits } from '../contexts/UnitContext'
import initializeTools from '../lib/mcpTools';
import partsLibrary from '../lib/partsLibrary';
import UserGuide from '../components/UserGuide'
import ImportModelDialog from '../components/ImportModelDialog'
import ExportModelDialog from '../components/ExportModelDialog'
import SketchButton from '../components/SketchButton'
import PlaneSelectionDialog from '../components/PlaneSelectionDialog'
import sketchManager from '../lib/sketchManager'
import { toggleTerminal } from '../components/CodeTerminal';
import SidebarFixed from '../components/SidebarFixed'

// Placeholder component for JscadThreeViewer
const PlaceholderViewer = () => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100">
      <div className="p-6 bg-white rounded-lg shadow-md text-center">
        <div className="w-16 h-16 mx-auto mb-4 text-blue-600">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">3D Viewer Placeholder</h3>
        <p className="text-sm text-gray-600 mb-4">The actual 3D viewer component will be rendered here.</p>
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  )
}

// Import the Three.js viewer component with SSR disabled
const JscadThreeViewer = dynamic(() => import('../components/JscadThreeViewer'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full">Loading 3D viewer...</div>,
})

// Import the AI Assistant component
const AICadAssistant = dynamic(() => import('../components/AICadAssistant'), {
  ssr: false,
})

// Import the Sketch Toolbar component
const SketchToolbar = dynamic(() => import('../components/SketchToolbar'), {
  ssr: false,
})

// Import the Code Terminal component
const CodeTerminal = dynamic(() => import('../components/CodeTerminal'), {
  ssr: false,
})

export default function CadInterface() {
  const [mounted, setMounted] = useState(false)
  const [expandedFeatures, setExpandedFeatures] = useState(true)
  const [expandedParts, setExpandedParts] = useState(true)
  const [expandedDefaultGeometry, setExpandedDefaultGeometry] = useState(true)
  const [activeTab, setActiveTab] = useState("sketch")
  const [viewMode, setViewMode] = useState("shaded")
  const [showGuide, setShowGuide] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [activeModel, setActiveModel] = useState(null)
  const [projectName, setProjectName] = useState("New Project")
  const [isEditingName, setIsEditingName] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(true)
  const projectNameInputRef = useRef(null)
  const { unitSystem, format } = useUnits()
  const [showPlaneSelectionDialog, setShowPlaneSelectionDialog] = useState(false)
  const [isInSketchMode, setIsInSketchMode] = useState(false)
  const [showPartDialog, setShowPartDialog] = useState(false);
  const [selectedPartType, setSelectedPartType] = useState(null);
  const [partParameters, setPartParameters] = useState({});
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const viewerRef = useRef(null);

  // Fake data for the UI mockup
  const featureItems = [
    { id: 1, name: "Sketch 1", type: "sketch", active: true },
    { id: 2, name: "Extrude 1", type: "extrude", active: true },
    { id: 3, name: "Sketch 2", type: "sketch", active: true },
    { id: 4, name: "Extrude 2", type: "extrude", active: true },
  ]

  const defaultGeometryItems = [
    { id: "origin", name: "Origin", type: "origin", active: true },
    { id: "top", name: "Top", type: "plane", active: true },
    { id: "front", name: "Front", type: "plane", active: true },
    { id: "right", name: "Right", type: "plane", active: true },
  ]

  const toolbarTabs = [
    { id: "sketch", label: "Sketch" },
    { id: "model", label: "Model" },
    { id: "assembly", label: "Assembly" },
    { id: "drawing", label: "Drawing" },
    { id: "sheetmetal", label: "Sheet Metal" },
  ]

  const sketchTools = [
    { id: "line", icon: <div className="w-4 h-0.5 bg-current" />, tooltip: "Line" },
    { id: "rectangle", icon: <Square size={16} />, tooltip: "Rectangle" },
    { id: "circle", icon: <Circle size={16} />, tooltip: "Circle" },
    { id: "polygon", icon: <Hexagon size={16} />, tooltip: "Polygon" },
    { id: "arc", icon: <div className="w-4 h-4 border-t-2 border-r-2 rounded-tr-full" />, tooltip: "Arc" },
    {
      id: "spline",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 17c0 0 3.75-5 9-5s9 5 9 5" />
        </svg>
      ),
      tooltip: "Spline",
    },
  ]

  const modelTools = [
    { id: "extrude", icon: <Box size={16} />, tooltip: "Extrude" },
    { id: "revolve", icon: <RotateCw size={16} />, tooltip: "Revolve" },
    {
      id: "sweep",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 12h18M3 6h18M3 18h18" />
        </svg>
      ),
      tooltip: "Sweep",
    },
    { id: "loft", icon: <Layers size={16} />, tooltip: "Loft" },
    { id: "hole", icon: <Circle size={16} className="border-2" />, tooltip: "Hole" },
    {
      id: "fillet",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 3H3v18h18V3z" />
          <path d="M16 16H8V8" />
        </svg>
      ),
      tooltip: "Fillet",
    },
  ]

  const viewTools = [
    {
      id: "front",
      label: "Front",
      icon: <div className="flex items-center justify-center w-5 h-5 border border-gray-400 rounded">F</div>,
    },
    {
      id: "top",
      label: "Top",
      icon: <div className="flex items-center justify-center w-5 h-5 border border-gray-400 rounded">T</div>,
    },
    {
      id: "right",
      label: "Right",
      icon: <div className="flex items-center justify-center w-5 h-5 border border-gray-400 rounded">R</div>,
    },
    {
      id: "iso",
      label: "Iso",
      icon: <div className="flex items-center justify-center w-5 h-5 border border-gray-400 rounded">I</div>,
    },
  ]

  const toggleUserGuide = () => {
    setShowGuide(!showGuide)
  }

  const handleImportClick = () => {
    setShowImportDialog(true)
  }

  const handleExportClick = () => {
    setShowExportDialog(true)
  }

  const handleModelImported = (model) => {
    console.log('Model imported:', model)
    setActiveModel(model)
  }

  const handleProjectNameClick = () => {
    setIsEditingName(true)
    setTimeout(() => {
      if (projectNameInputRef.current) {
        projectNameInputRef.current.focus()
        projectNameInputRef.current.select()
      }
    }, 0)
  }

  const handleProjectNameChange = (e) => {
    setProjectName(e.target.value)
  }

  const handleProjectNameBlur = () => {
    setIsEditingName(false)
  }

  const handleProjectNameKeyDown = (e) => {
    if (e.key === 'Enter') {
      setIsEditingName(false)
    }
  }

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const toggleFeatures = () => {
    setExpandedFeatures(!expandedFeatures)
  }

  const toggleParts = () => {
    setExpandedParts(!expandedParts)
  }

  const toggleAIAssistant = () => {
    setIsAIAssistantOpen(!isAIAssistantOpen)
  }

  const handleCreateSketch = () => {
    setShowPlaneSelectionDialog(true)
  }

  const handlePlaneSelected = (planeInfo) => {
    setShowPlaneSelectionDialog(false)
    
    try {
      // Create a new sketch on the selected plane
      const sketch = sketchManager.createSketch(planeInfo)
      console.log('Sketch created:', sketch)
      
      // Update UI to reflect sketch mode
      setIsInSketchMode(true)
      
      // Snap camera view to be normal to the selected plane
      const viewer = document.getElementById('jscad-three-viewer');
      if (viewer) {
        // Access the viewer's scene and camera
        const scene = viewer.scene;
        const camera = viewer.camera;
        const controls = viewer.controls;
        
        if (camera && controls) {
          // Set camera position based on plane
          switch(planeInfo.plane) {
            case 'xy':
              // Front view is normal to XY plane (looking from Z axis)
              camera.position.set(0, 0, 15);
              camera.lookAt(0, 0, 0);
              break;
            case 'yz':
              // Right view is normal to YZ plane (looking from X axis)
              camera.position.set(15, 0, 0);
              camera.lookAt(0, 0, 0);
              break;
            case 'xz':
              // Top view is normal to XZ plane (looking from Y axis)
              camera.position.set(0, 15, 0);
              camera.lookAt(0, 0, 0);
              break;
            default:
              // For custom planes, we'd need more complex camera positioning
              camera.position.set(0, 0, 15);
              camera.lookAt(0, 0, 0);
          }
          
          if (controls.update) {
            controls.update();
          }
        }
      }
    } catch (error) {
      console.error('Failed to create sketch:', error)
      alert(`Failed to create sketch: ${error.message}`)
    }
  }

  const handleExitSketchMode = () => {
    setIsInSketchMode(false)
  }

  const handleSketchExtrude = (modelId) => {
    console.log('Sketch extruded, model created:', modelId)
    setIsInSketchMode(false)
  }

  const handlePartClick = (partType) => {
    setSelectedPartType(partType);
    
    // Set default parameters based on part type
    let defaultParams = {};
    switch(partType) {
      case 'cube':
        defaultParams = { width: 10, height: 10, depth: 10 };
        break;
      case 'sphere':
        defaultParams = { radius: 5 };
        break;
      case 'cylinder':
        defaultParams = { radius: 5, height: 10 };
        break;
      case 'torus':
        defaultParams = { innerRadius: 2, outerRadius: 5 };
        break;
      default:
        defaultParams = {};
    }
    
    setPartParameters(defaultParams);
    setShowPartDialog(true);
  };

  const handleInsertPart = () => {
    if (!selectedPartType) return;
    
    // Insert the part using the parts library
    const result = partsLibrary.insertStandardPart(selectedPartType, partParameters);
    
    if (result.success) {
      console.log('Part inserted successfully:', result.message);
      // Optionally set the newly created part as active
      setActiveModel(result.model);
    } else {
      console.error('Failed to insert part:', result.error);
      alert(`Failed to insert part: ${result.error}`);
    }
    
    // Close the dialog
    setShowPartDialog(false);
  };

  const handlePartParameterChange = (param, value) => {
    setPartParameters(prev => ({
      ...prev,
      [param]: parseFloat(value) || 0
    }));
  };

  useEffect(() => {
    setMounted(true)
    
    // Initialize MCP tools when the component mounts
    initializeTools();

    // Add effect to listen for sketch mode changes
    const handleSketchModeChanged = (event) => {
      const { active } = event.detail
      setIsInSketchMode(active)
    }
    
    window.addEventListener('openshape:sketchModeChanged', handleSketchModeChanged)
    
    return () => {
      window.removeEventListener('openshape:sketchModeChanged', handleSketchModeChanged)
    }
  }, [])

  if (!mounted) {
    return <div className="flex items-center justify-center h-screen">Loading interface...</div>
  }

  return (
    <>
      <Head>
        <title>OpenShape CAD Interface</title>
        <meta name="description" content="OpenShape - Free and Open Source 3D CAD in the browser" />
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

      <div className="flex flex-col w-full h-screen overflow-hidden bg-white">
        {/* Header with project name and controls */}
        <header className="flex items-center h-12 px-3 border-b border-gray-200 bg-white">
          <div className="flex items-center mr-4">
            <div className="flex items-center justify-center w-8 h-8 mr-2 bg-blue-600 text-white rounded">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="font-medium text-gray-700">OpenShape CAD</span>
          </div>

          <div className="flex items-center space-x-1 px-2 border-l border-r border-gray-200">
            {isEditingName ? (
              <input
                ref={projectNameInputRef}
                type="text"
                className="font-medium text-gray-800 bg-gray-100 px-1 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={projectName}
                onChange={handleProjectNameChange}
                onKeyDown={handleProjectNameKeyDown}
                onBlur={handleProjectNameBlur}
              />
            ) : (
              <span 
                className="font-medium text-gray-800 px-1 py-0.5 hover:bg-gray-100 rounded cursor-pointer" 
                onDoubleClick={handleProjectNameClick}
                title="Double-click to edit"
              >
                {projectName}
              </span>
            )}
            <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">Main</span>
            <button className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded">
              <Link size={14} />
            </button>
          </div>

          {/* Core toolbar with drawing tools */}
          <div className="flex-1 flex items-center">
            {/* View tools */}
            <div className="flex items-center pr-3 mr-3 border-r border-gray-200">
              {viewTools.map((tool) => (
                <button
                  key={tool.id}
                  className="flex items-center px-2 py-1 mx-0.5 text-xs text-gray-700 hover:bg-gray-100 rounded"
                  title={tool.label}
                >
                  {tool.icon}
                  <span className="ml-1">{tool.label}</span>
                </button>
              ))}
            </div>

            {/* Create Sketch Button - only show when Sketch tab is active */}
            {(activeTab === "sketch" && !isInSketchMode) && (
              <div className="flex items-center pr-3 mr-3 border-r border-gray-200">
                <SketchButton onClick={handleCreateSketch} className="mx-1" />
              </div>
            )}

            {/* Active tab tools */}
            <div className="flex items-center pr-3 mr-3 border-r border-gray-200">
              {activeTab === "sketch" ? (
                <>
                  {sketchTools.map((tool) => (
                    <button
                      key={tool.id}
                      className="flex items-center justify-center w-8 h-8 mx-0.5 text-gray-700 hover:bg-gray-100 rounded"
                      title={tool.tooltip}
                    >
                      {tool.icon}
                    </button>
                  ))}
                </>
              ) : (
                <>
                  {modelTools.map((tool) => (
                    <button
                      key={tool.id}
                      className="flex items-center justify-center w-8 h-8 mx-0.5 text-gray-700 hover:bg-gray-100 rounded"
                      title={tool.tooltip}
                    >
                      {tool.icon}
                    </button>
                  ))}
                </>
              )}
            </div>

            {/* View mode tools */}
            <div className="flex items-center pr-3 mr-3 border-r border-gray-200">
              <button
                className={`flex items-center justify-center w-8 h-8 mx-0.5 rounded ${viewMode === "wireframe" ? "bg-blue-100 text-blue-600" : "text-gray-700 hover:bg-gray-100"}`}
                title="Wireframe"
                onClick={() => setViewMode("wireframe")}
              >
                <Grid size={16} />
              </button>
              <button
                className={`flex items-center justify-center w-8 h-8 mx-0.5 rounded ${viewMode === "shaded" ? "bg-blue-100 text-blue-600" : "text-gray-700 hover:bg-gray-100"}`}
                title="Shaded"
                onClick={() => setViewMode("shaded")}
              >
                <Box size={16} />
              </button>
              <button
                className={`flex items-center justify-center w-8 h-8 mx-0.5 rounded ${viewMode === "rendered" ? "bg-blue-100 text-blue-600" : "text-gray-700 hover:bg-gray-100"}`}
                title="Rendered"
                onClick={() => setViewMode("rendered")}
              >
                <Maximize size={16} />
              </button>
            </div>

            {/* Navigation tools */}
            <div className="flex items-center">
              <button
                className="flex items-center justify-center w-8 h-8 mx-0.5 text-gray-700 hover:bg-gray-100 rounded"
                title="Pan"
              >
                <Move size={16} />
              </button>
              <button
                className="flex items-center justify-center w-8 h-8 mx-0.5 text-gray-700 hover:bg-gray-100 rounded"
                title="Rotate"
              >
                <RotateCcw size={16} />
              </button>
              <button
                className="flex items-center justify-center w-8 h-8 mx-0.5 text-gray-700 hover:bg-gray-100 rounded"
                title="Zoom In"
              >
                <ZoomIn size={16} />
              </button>
              <button
                className="flex items-center justify-center w-8 h-8 mx-0.5 text-gray-700 hover:bg-gray-100 rounded"
                title="Zoom Out"
              >
                <ZoomOut size={16} />
              </button>
            </div>

            {/* Search box */}
            <div className="flex items-center ml-auto">
              <div className="flex items-center px-2 py-1 border border-gray-300 rounded">
                <input type="text" placeholder="Search tools..." className="w-40 text-sm border-none outline-none" />
                <Search size={14} className="text-gray-500" />
              </div>
            </div>

            {/* Right side controls */}
            <div className="flex items-center ml-auto">
              {/* Add Terminal button */}
              <button 
                className={`flex items-center justify-center w-8 h-8 mx-0.5 rounded ${
                  isTerminalOpen ? 'bg-blue-100 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
                }`}
                title="JSCAD Terminal (Ctrl + `)"
                onClick={toggleTerminal}
              >
                <TerminalIcon size={16} />
              </button>
              
              {/* AI Assistant button (already existing) */}
              <button 
                className={`flex items-center justify-center w-8 h-8 mx-0.5 rounded ${
                  isAIAssistantOpen ? 'bg-blue-100 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
                }`}
                title="AI CAD Assistant"
                onClick={toggleAIAssistant}
              >
                <MessageSquare size={16} />
              </button>
              
              {/* ... any other existing buttons ... */}
            </div>
          </div>
        </header>

        {/* Main toolbar */}
        <div className="flex flex-col border-b border-gray-200">
          {/* Tab navigation */}
          <div className="flex items-center h-10 px-2 bg-gray-100">
            {toolbarTabs.map((tab) => (
              <button
                key={tab.id}
                className={`px-3 py-1.5 text-sm font-medium rounded-t ${
                  activeTab === tab.id
                    ? "bg-white text-blue-600 border-t-2 border-blue-600"
                    : "text-gray-600 hover:bg-gray-200"
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tool buttons */}
          <div className="flex items-center h-10 px-2 bg-white overflow-x-auto">
            {/* View tools */}
            <div className="flex items-center pr-3 mr-3 border-r border-gray-200">
              {viewTools.map((tool) => (
                <button
                  key={tool.id}
                  className="flex items-center px-2 py-1 mx-0.5 text-xs text-gray-700 hover:bg-gray-100 rounded"
                  title={tool.label}
                >
                  {tool.icon}
                  <span className="ml-1">{tool.label}</span>
                </button>
              ))}
            </div>

            {/* Create Sketch Button - only show when Sketch tab is active */}
            {(activeTab === "sketch" && !isInSketchMode) && (
              <div className="flex items-center pr-3 mr-3 border-r border-gray-200">
                <SketchButton onClick={handleCreateSketch} className="mx-1" />
              </div>
            )}

            {/* Active tab tools */}
            <div className="flex items-center pr-3 mr-3 border-r border-gray-200">
              {activeTab === "sketch" ? (
                <>
                  {sketchTools.map((tool) => (
                    <button
                      key={tool.id}
                      className="flex items-center justify-center w-8 h-8 mx-0.5 text-gray-700 hover:bg-gray-100 rounded"
                      title={tool.tooltip}
                    >
                      {tool.icon}
                    </button>
                  ))}
                </>
              ) : (
                <>
                  {modelTools.map((tool) => (
                    <button
                      key={tool.id}
                      className="flex items-center justify-center w-8 h-8 mx-0.5 text-gray-700 hover:bg-gray-100 rounded"
                      title={tool.tooltip}
                    >
                      {tool.icon}
                    </button>
                  ))}
                </>
              )}
            </div>

            {/* View mode tools */}
            <div className="flex items-center pr-3 mr-3 border-r border-gray-200">
              <button
                className={`flex items-center justify-center w-8 h-8 mx-0.5 rounded ${viewMode === "wireframe" ? "bg-blue-100 text-blue-600" : "text-gray-700 hover:bg-gray-100"}`}
                title="Wireframe"
                onClick={() => setViewMode("wireframe")}
              >
                <Grid size={16} />
              </button>
              <button
                className={`flex items-center justify-center w-8 h-8 mx-0.5 rounded ${viewMode === "shaded" ? "bg-blue-100 text-blue-600" : "text-gray-700 hover:bg-gray-100"}`}
                title="Shaded"
                onClick={() => setViewMode("shaded")}
              >
                <Box size={16} />
              </button>
              <button
                className={`flex items-center justify-center w-8 h-8 mx-0.5 rounded ${viewMode === "rendered" ? "bg-blue-100 text-blue-600" : "text-gray-700 hover:bg-gray-100"}`}
                title="Rendered"
                onClick={() => setViewMode("rendered")}
              >
                <Maximize size={16} />
              </button>
            </div>

            {/* Navigation tools */}
            <div className="flex items-center">
              <button
                className="flex items-center justify-center w-8 h-8 mx-0.5 text-gray-700 hover:bg-gray-100 rounded"
                title="Pan"
              >
                <Move size={16} />
              </button>
              <button
                className="flex items-center justify-center w-8 h-8 mx-0.5 text-gray-700 hover:bg-gray-100 rounded"
                title="Rotate"
              >
                <RotateCcw size={16} />
              </button>
              <button
                className="flex items-center justify-center w-8 h-8 mx-0.5 text-gray-700 hover:bg-gray-100 rounded"
                title="Zoom In"
              >
                <ZoomIn size={16} />
              </button>
              <button
                className="flex items-center justify-center w-8 h-8 mx-0.5 text-gray-700 hover:bg-gray-100 rounded"
                title="Zoom Out"
              >
                <ZoomOut size={16} />
              </button>
            </div>

            {/* Search box */}
            <div className="flex items-center ml-auto">
              <div className="flex items-center px-2 py-1 border border-gray-300 rounded">
                <input type="text" placeholder="Search tools..." className="w-40 text-sm border-none outline-none" />
                <Search size={14} className="text-gray-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Use our Sidebar component instead of hardcoded feature tree */}
          {isSidebarOpen && (
            <SidebarFixed isOpen={true} onClose={toggleSidebar} />
          )}

          {/* 3D Viewer */}
          <div className="relative flex-1 bg-gray-100">
            <JscadThreeViewer 
              id="jscad-three-viewer"
              onModelChange={setActiveModel}
            />

            {/* Sketch Toolbar - only shown in sketch mode */}
            {isInSketchMode && (
              <SketchToolbar 
                onExit={handleExitSketchMode}
                onExtrude={handleSketchExtrude}
              />
            )}

            {/* AI Assistant */}
            {isAIAssistantOpen && (
              <AICadAssistant 
                isOpen={isAIAssistantOpen}
                onToggle={toggleAIAssistant}
              />
            )}

            {/* Coordinate system indicator */}
            <div className="absolute right-4 bottom-4 w-20 h-20 flex items-center justify-center bg-white bg-opacity-80 rounded-full shadow-md">
              <div className="absolute w-5 h-5 flex items-center justify-center font-bold text-red-600 transform translate-x-7">
                X
              </div>
              <div className="absolute w-5 h-5 flex items-center justify-center font-bold text-green-600 transform -translate-y-7">
                Y
              </div>
              <div className="absolute w-5 h-5 flex items-center justify-center font-bold text-blue-600 transform translate-x-3.5 translate-y-3.5">
                Z
              </div>
              <svg width="40" height="40" viewBox="0 0 100 100" className="absolute">
                <line x1="50" y1="50" x2="85" y2="50" stroke="red" strokeWidth="2" />
                <line x1="50" y1="50" x2="50" y2="15" stroke="green" strokeWidth="2" />
                <line x1="50" y1="50" x2="70" y2="70" stroke="blue" strokeWidth="2" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Modals and dialogs */}
      {showGuide && (
        <UserGuide isOpen={showGuide} onClose={toggleUserGuide} />
      )}
      
      <ImportModelDialog 
        isOpen={showImportDialog} 
        onClose={() => setShowImportDialog(false)}
        onModelImported={handleModelImported}
      />
      
      <ExportModelDialog 
        isOpen={showExportDialog} 
        onClose={() => setShowExportDialog(false)} 
        geometry={activeModel ? activeModel.geometry : null}
      />
      
      {/* Plane Selection Dialog */}
      <PlaneSelectionDialog
        isOpen={showPlaneSelectionDialog}
        onClose={() => setShowPlaneSelectionDialog(false)}
        onPlaneSelected={handlePlaneSelected}
      />

      {/* Part Parameters Dialog */}
      {showPartDialog && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Insert {selectedPartType && selectedPartType.charAt(0).toUpperCase() + selectedPartType.slice(1)}
            </h2>
            
            <div className="space-y-4">
              {selectedPartType === 'cube' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Width</label>
                      <input
                        type="number"
                        value={partParameters.width || ''}
                        onChange={(e) => handlePartParameterChange('width', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
                      <input
                        type="number"
                        value={partParameters.height || ''}
                        onChange={(e) => handlePartParameterChange('height', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Depth</label>
                    <input
                      type="number"
                      value={partParameters.depth || ''}
                      onChange={(e) => handlePartParameterChange('depth', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </>
              )}
              
              {selectedPartType === 'sphere' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Radius</label>
                  <input
                    type="number"
                    value={partParameters.radius || ''}
                    onChange={(e) => handlePartParameterChange('radius', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              )}
              
              {selectedPartType === 'cylinder' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Radius</label>
                    <input
                      type="number"
                      value={partParameters.radius || ''}
                      onChange={(e) => handlePartParameterChange('radius', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
                    <input
                      type="number"
                      value={partParameters.height || ''}
                      onChange={(e) => handlePartParameterChange('height', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </>
              )}
              
              {selectedPartType === 'torus' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Inner Radius</label>
                    <input
                      type="number"
                      value={partParameters.innerRadius || ''}
                      onChange={(e) => handlePartParameterChange('innerRadius', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Outer Radius</label>
                    <input
                      type="number"
                      value={partParameters.outerRadius || ''}
                      onChange={(e) => handlePartParameterChange('outerRadius', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </>
              )}
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                onClick={() => setShowPartDialog(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                onClick={handleInsertPart}
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Code Terminal */}
      <CodeTerminal 
        onVisibilityChange={setIsTerminalOpen} 
      />
    </>
  )
}

