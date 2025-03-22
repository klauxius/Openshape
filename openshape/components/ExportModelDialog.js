import React, { useState } from 'react';
import { exportToSTL, exportToOBJ, exportToJSON } from '../utils/exportUtils';
import { useUnits } from '../contexts/UnitContext';

/**
 * A dialog for exporting 3D models in different formats
 * @param {Object} props - Component props
 * @param {Object} props.geometry - The JSCAD geometry to export
 * @param {boolean} props.isOpen - Whether the dialog is open
 * @param {Function} props.onClose - Function to call when the dialog is closed
 */
const ExportModelDialog = ({ geometry, isOpen, onClose }) => {
  const [filename, setFilename] = useState('model');
  const [format, setFormat] = useState('stl');
  const [binary, setBinary] = useState(true);
  const [includeUnitInfo, setIncludeUnitInfo] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState(null);
  
  // Get unit system information from context
  const { unitSystem } = useUnits();

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);
    
    try {
      if (!geometry) {
        throw new Error('No model to export');
      }
      
      // If including unit information, add unit metadata
      let geometryToExport = geometry;
      if (includeUnitInfo) {
        // For JSON exports, we can directly add metadata
        if (format === 'json') {
          geometryToExport = {
            ...geometry,
            metadata: {
              ...geometry.metadata,
              units: unitSystem.id,
              unitsName: unitSystem.name,
              unitsAbbreviation: unitSystem.abbreviation
            }
          };
        }
        // For other formats, the unit info will be added in the file header where supported
      }
      
      switch (format) {
        case 'stl':
          exportToSTL(geometryToExport, filename, binary, unitSystem);
          break;
        case 'obj':
          exportToOBJ(geometryToExport, filename, unitSystem);
          break;
        case 'json':
          exportToJSON(geometryToExport, filename);
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }
      
      // Close dialog after successful export
      onClose();
    } catch (err) {
      console.error('Export error:', err);
      setError(err.message || 'Failed to export model');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Export Model</h2>
        
        <div className="space-y-4">
          {/* Filename input */}
          <div>
            <label htmlFor="filename" className="block text-sm font-medium text-gray-700">
              Filename
            </label>
            <input
              type="text"
              id="filename"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-800"
              placeholder="model"
            />
          </div>
          
          {/* Format selection */}
          <div>
            <label htmlFor="format" className="block text-sm font-medium text-gray-700">
              Format
            </label>
            <select
              id="format"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-800"
            >
              <option value="stl">STL</option>
              <option value="obj">OBJ</option>
              <option value="json">JSON</option>
            </select>
          </div>
          
          {/* Binary option (for STL only) */}
          {format === 'stl' && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="binary"
                checked={binary}
                onChange={(e) => setBinary(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="binary" className="ml-2 block text-sm text-gray-700">
                Binary format (smaller file size)
              </label>
            </div>
          )}
          
          {/* Include unit information option */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="includeUnitInfo"
              checked={includeUnitInfo}
              onChange={(e) => setIncludeUnitInfo(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="includeUnitInfo" className="ml-2 block text-sm text-gray-700">
              Include unit system information ({unitSystem.name})
            </label>
          </div>
          
          {/* Unit information note */}
          <div className="text-xs text-gray-500 italic">
            Models will be exported using {unitSystem.name} ({unitSystem.abbreviation}) as the unit system.
            {format === 'json' ? ' Unit information will be stored as metadata.' : ''}
          </div>
          
          {/* Error message */}
          {error && (
            <div className="text-red-500 text-sm mt-2">
              {error}
            </div>
          )}
        </div>
        
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || !filename.trim()}
            className={`px-4 py-2 rounded-md text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              isExporting || !filename.trim()
                ? 'bg-blue-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModelDialog; 