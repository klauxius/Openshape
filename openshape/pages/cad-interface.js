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
} from "lucide-react"
import { useUnits } from '../contexts/UnitContext'

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
  const projectNameInputRef = useRef(null)
  const { unitSystem, format } = useUnits()

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

  useEffect(() => {
    setMounted(true)
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

          <div className="flex items-center ml-auto space-x-1">
            <button 
              className="flex items-center justify-center w-8 h-8 text-gray-600 hover:bg-gray-100 rounded"
              onClick={toggleUserGuide}
            >
              <Info size={16} />
            </button>
            <div className="flex items-center border border-gray-300 rounded overflow-hidden">
              <button className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100">0</button>
              <div className="h-4 border-r border-gray-300"></div>
              <button className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100">0</button>
            </div>
            <button className="flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded">
              <Share size={14} className="mr-1.5" />
              Share
            </button>
            <button className="flex items-center justify-center w-8 h-8 text-gray-600 hover:bg-gray-100 rounded">
              <Settings size={16} />
            </button>
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
          {/* Feature tree sidebar */}
          {isSidebarOpen && (
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
              {/* Sidebar Header */}
              <div className="p-3 border-b border-gray-200 font-medium text-gray-700">
                Model Browser
              </div>
              
              {/* Feature Tree */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-2">
                  <div className="mb-2">
                    <div 
                      className="flex items-center p-1 hover:bg-gray-100 rounded cursor-pointer"
                      onClick={toggleFeatures}
                    >
                      {expandedFeatures ? (
                        <ChevronDown size={16} className="text-gray-500 mr-1" />
                      ) : (
                        <ChevronRight size={16} className="text-gray-500 mr-1" />
                      )}
                      <span className="font-medium text-sm">Features</span>
                    </div>
                    
                    {expandedFeatures && (
                      <div className="ml-5 mt-1 space-y-1">
                        <div className="flex items-center p-1 text-sm text-gray-700 hover:bg-gray-100 rounded">
                          <span>Base Feature</span>
                        </div>
                        <div className="flex items-center p-1 text-sm text-gray-700 hover:bg-gray-100 rounded">
                          <span>Extrusion 1</span>
                        </div>
                        <div className="flex items-center p-1 text-sm text-gray-700 hover:bg-gray-100 rounded">
                          <span>Fillet 1</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <div 
                      className="flex items-center p-1 hover:bg-gray-100 rounded cursor-pointer"
                      onClick={toggleParts}
                    >
                      {expandedParts ? (
                        <ChevronDown size={16} className="text-gray-500 mr-1" />
                      ) : (
                        <ChevronRight size={16} className="text-gray-500 mr-1" />
                      )}
                      <span className="font-medium text-sm">Parts</span>
                    </div>
                    
                    {expandedParts && (
                      <div className="ml-5 mt-1 space-y-1">
                        <div className="flex items-center p-1 text-sm text-gray-700 hover:bg-gray-100 rounded">
                          <span>Default</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </aside>
          )}

          {/* 3D Viewer */}
          <div className="relative flex-1 bg-gray-100">
            <JscadThreeViewer 
              onModelChange={setActiveModel}
            />

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
        <div className="fixed inset-0" onClick={toggleUserGuide}>
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl">
              <h2 className="text-xl font-bold mb-4">OpenShape CAD User Guide</h2>
              <p className="mb-2">
                Use this interface to create and edit 3D models for your CAD projects.
              </p>
              <button
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none"
                onClick={toggleUserGuide}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Import/Export Dialogs */}
      <div id="modal-container"></div>
    </>
  )
}

