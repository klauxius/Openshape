import React from 'react';

/**
 * Sidebar component for the OpenShape CAD application
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the sidebar is open
 * @param {Function} props.onClose - Function to call when the sidebar is closed
 */
const Sidebar = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out">
      <div className="flex flex-col h-full p-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-blue-600">OpenShape</h2>
          <button 
            className="text-gray-500 hover:text-gray-800"
            onClick={onClose}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 space-y-4">
          <div>
            <h3 className="font-medium text-gray-500 uppercase tracking-wider text-xs mb-2">Project</h3>
            <ul className="space-y-1">
              <li>
                <button className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-blue-700 hover:bg-blue-50">
                  <svg className="mr-3 h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  New Model
                </button>
              </li>
              <li>
                <button className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-blue-700 hover:bg-blue-50">
                  <svg className="mr-3 h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Open Project
                </button>
              </li>
              <li>
                <button className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-blue-700 hover:bg-blue-50">
                  <svg className="mr-3 h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Save Project
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium text-gray-500 uppercase tracking-wider text-xs mb-2">Tools</h3>
            <ul className="space-y-1">
              <li>
                <button className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-blue-700 hover:bg-blue-50">
                  <svg className="mr-3 h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Sketch Tool
                </button>
              </li>
              <li>
                <button className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-blue-700 hover:bg-blue-50">
                  <svg className="mr-3 h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Extrusion
                </button>
              </li>
              <li>
                <button className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-blue-700 hover:bg-blue-50">
                  <svg className="mr-3 h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Boolean Operations
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium text-gray-500 uppercase tracking-wider text-xs mb-2">Settings</h3>
            <ul className="space-y-1">
              <li>
                <button className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-blue-700 hover:bg-blue-50">
                  <svg className="mr-3 h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Preferences
                </button>
              </li>
              <li>
                <button className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-blue-700 hover:bg-blue-50">
                  <svg className="mr-3 h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Help
                </button>
              </li>
            </ul>
          </div>
        </nav>

        <div className="mt-auto pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">OpenShape v0.1.0</p>
          <p className="text-xs text-gray-500 mt-1">Free and Open Source CAD</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 