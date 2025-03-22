import React, { useState, useRef } from 'react';
import { importFile } from '../utils/importUtils';
import { useUnits } from '../contexts/UnitContext';
import { UnitSystems } from '../utils/unitUtils';

/**
 * Dialog component for importing 3D models with unit system detection
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the dialog is open
 * @param {Function} props.onClose - Function to call when dialog is closed
 * @param {Function} props.onModelImported - Function to call with imported model data
 */
const ImportModelDialog = ({ isOpen, onClose, onModelImported }) => {
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [detectedUnitSystem, setDetectedUnitSystem] = useState(null);
  const [useDetectedUnits, setUseDetectedUnits] = useState(true);
  
  const fileInputRef = useRef(null);
  const { unitSystem, setUnitSystem } = useUnits();

  if (!isOpen) return null;

  const handleFileSelect = (event) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleDrag = (event) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (event.type === 'dragenter' || event.type === 'dragover') {
      setDragActive(true);
    } else if (event.type === 'dragleave' || event.type === 'drop') {
      setDragActive(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = (file) => {
    setSelectedFile(file);
    setError(null);
    setDetectedUnitSystem(null);
    
    // Check file type
    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (!['stl', 'obj', 'json'].includes(fileExtension)) {
      setError(`Unsupported file type: .${fileExtension}`);
      return;
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    
    setIsImporting(true);
    setError(null);
    
    try {
      await importFile(
        selectedFile,
        (unitSystem) => {
          setDetectedUnitSystem(unitSystem);
          if (useDetectedUnits) {
            setUnitSystem(unitSystem);
          }
        },
        (importedGeometry) => {
          if (onModelImported) {
            onModelImported(importedGeometry);
          }
          onClose();
        },
        (errorMessage) => {
          setError(errorMessage);
          setIsImporting(false);
        }
      );
    } catch (err) {
      setError(err.message || 'Failed to import file');
      setIsImporting(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Import Model</h2>
        
        <div 
          className={`border-2 border-dashed rounded-lg p-6 mb-4 text-center ${
            dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          }`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".stl,.obj,.json"
            onChange={handleFileSelect}
          />
          
          {selectedFile ? (
            <div className="text-gray-800">
              <div className="flex items-center justify-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium">File selected</span>
              </div>
              <p className="text-sm mb-1">Name: {selectedFile.name}</p>
              <p className="text-sm mb-1">Size: {(selectedFile.size / 1024).toFixed(2)} KB</p>
              <p className="text-sm">Type: {selectedFile.type || selectedFile.name.split('.').pop().toUpperCase()}</p>
              
              <button
                onClick={triggerFileInput}
                className="mt-3 text-sm text-blue-600 hover:text-blue-800"
              >
                Change file
              </button>
            </div>
          ) : (
            <div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="mt-2 text-gray-600">
                Drag and drop your file here, or
              </p>
              <button
                onClick={triggerFileInput}
                className="mt-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Browse files
              </button>
              <p className="mt-2 text-xs text-gray-500">
                Supported formats: STL, OBJ, JSON
              </p>
            </div>
          )}
        </div>
        
        {detectedUnitSystem && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-gray-800">
              <span className="font-medium">Unit system detected: </span>
              {detectedUnitSystem.name} ({detectedUnitSystem.abbreviation})
            </p>
            <div className="mt-2 flex items-center">
              <input
                type="checkbox"
                id="useDetectedUnits"
                checked={useDetectedUnits}
                onChange={(e) => setUseDetectedUnits(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="useDetectedUnits" className="ml-2 block text-sm text-gray-700">
                Use this unit system for the application
              </label>
            </div>
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={isImporting || !selectedFile}
            className={`px-4 py-2 rounded-md text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              isImporting || !selectedFile
                ? 'bg-blue-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isImporting ? 'Importing...' : 'Import'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportModelDialog; 