"use client"

import { useState, useEffect } from "react"
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
} from "lucide-react"

// Import the Three.js viewer component with SSR disabled
const JscadThreeViewer = dynamic(() => import("../components/JscadThreeViewer"), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full">Loading 3D viewer...</div>,
})

export default function CadInterface() {
  const [mounted, setMounted] = useState(false)
  const [expandedFeatures, setExpandedFeatures] = useState(true)
  const [expandedParts, setExpandedParts] = useState(false)
  const [expandedDefaultGeometry, setExpandedDefaultGeometry] = useState(true)
  const [activeTab, setActiveTab] = useState("sketch")
  const [viewMode, setViewMode] = useState("shaded")

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

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="flex items-center justify-center h-screen">Loading interface...</div>
  }

  return (
    <>
      <Head>
        <title>Browser CAD</title>
        <meta name="description" content="Professional browser-based CAD software" />
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
            <span className="font-medium text-gray-700">Browser CAD</span>
          </div>

          <div className="flex items-center space-x-1 px-2 border-l border-r border-gray-200">
            <span className="font-medium text-gray-800">Lacing Table</span>
            <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">Main</span>
            <button className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded">
              <Link size={14} />
            </button>
          </div>

          <div className="flex items-center ml-auto space-x-1">
            <button className="flex items-center justify-center w-8 h-8 text-gray-600 hover:bg-gray-100 rounded">
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
          <div className="flex flex-col w-64 border-r border-gray-200 bg-gray-50 overflow-y-auto">
            <div className="flex items-center p-2 border-b border-gray-200">
              <Search size={14} className="mr-2 text-gray-500" />
              <input
                type="text"
                placeholder="Filter by name or type"
                className="w-full text-sm bg-transparent border-none outline-none"
              />
            </div>

            {/* Features Tree */}
            <div className="border-b border-gray-200">
              <div
                className="flex items-center p-2 hover:bg-gray-200 cursor-pointer"
                onClick={() => setExpandedFeatures(!expandedFeatures)}
              >
                {expandedFeatures ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <span className="ml-1 text-sm font-medium">Features (8)</span>
              </div>

              {expandedFeatures && (
                <div className="pl-2">
                  {/* Default Geometry Section */}
                  <div>
                    <div
                      className="flex items-center p-1.5 hover:bg-gray-200 cursor-pointer"
                      onClick={() => setExpandedDefaultGeometry(!expandedDefaultGeometry)}
                    >
                      {expandedDefaultGeometry ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      <span className="ml-1 text-sm">Default geometry</span>
                    </div>

                    {expandedDefaultGeometry && (
                      <div className="pl-4">
                        {defaultGeometryItems.map((item) => (
                          <div key={item.id} className="flex items-center p-1.5 hover:bg-gray-200 cursor-pointer">
                            {item.type === "origin" && (
                              <div className="flex items-center justify-center w-4 h-4 mr-2 text-gray-600">
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <circle cx="12" cy="12" r="10" />
                                  <line x1="2" y1="12" x2="22" y2="12" />
                                  <line x1="12" y1="2" x2="12" y2="22" />
                                </svg>
                              </div>
                            )}
                            {item.type === "plane" && (
                              <div className="flex items-center justify-center w-4 h-4 mr-2 text-blue-600">
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <rect x="3" y="3" width="18" height="18" rx="2" />
                                </svg>
                              </div>
                            )}
                            <span className="text-sm">{item.name}</span>
                            <button className="ml-auto p-1 text-gray-400 hover:text-gray-600">
                              {item.active ? <Eye size={14} /> : <EyeOff size={14} />}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Feature Items */}
                  {featureItems.map((item) => (
                    <div key={item.id} className="flex items-center p-1.5 pl-2 hover:bg-gray-200 cursor-pointer">
                      {item.type === "sketch" && (
                        <div className="flex items-center justify-center w-4 h-4 mr-2 text-green-600">
                          <Pen size={14} />
                        </div>
                      )}
                      {item.type === "extrude" && (
                        <div className="flex items-center justify-center w-4 h-4 mr-2 text-orange-600">
                          <Box size={14} />
                        </div>
                      )}
                      <span className="text-sm">{item.name}</span>
                      <button className="ml-auto p-1 text-gray-400 hover:text-gray-600">
                        {item.active ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Parts Tree */}
            <div>
              <div
                className="flex items-center p-2 hover:bg-gray-200 cursor-pointer"
                onClick={() => setExpandedParts(!expandedParts)}
              >
                {expandedParts ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <span className="ml-1 text-sm font-medium">Parts (0)</span>
              </div>

              {expandedParts && <div className="p-3 text-sm text-gray-500 italic">No parts defined</div>}
            </div>
          </div>

          {/* 3D Viewer */}
          <div className="relative flex-1 bg-gray-100">
            <JscadThreeViewer />

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

            {/* Status bar */}
            <div className="absolute left-0 right-0 bottom-0 flex items-center justify-between px-3 py-1 bg-gray-800 bg-opacity-80 text-white text-xs">
              <div className="flex items-center space-x-4">
                <span>X: 0.00</span>
                <span>Y: 0.00</span>
                <span>Z: 0.00</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>{viewMode.charAt(0).toUpperCase() + viewMode.slice(1)}</span>
                <span>|</span>
                <span>Units: mm</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

