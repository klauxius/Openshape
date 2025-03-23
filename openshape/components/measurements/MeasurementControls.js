import React from 'react';
import { Ruler, Move, X, RotateCcw, RefreshCcw, Trash } from 'lucide-react';

/**
 * MeasurementControls component provides a UI for measurement tools
 * 
 * @param {object} props - Component props
 * @param {boolean} props.isActive - Whether measurement mode is active
 * @param {string} props.measurementType - Current measurement type ('distance' or 'angle')
 * @param {function} props.onActivate - Function to activate measurement mode
 * @param {function} props.onDeactivate - Function to deactivate measurement mode
 * @param {function} props.onSetDistanceMeasurement - Function to set distance measurement mode
 * @param {function} props.onSetAngleMeasurement - Function to set angle measurement mode
 * @param {function} props.onClearMeasurements - Function to clear all measurements
 * @param {array} props.measurements - Array of saved measurement objects
 */
const MeasurementControls = ({
  isActive = false,
  measurementType = 'distance',
  onActivate,
  onDeactivate,
  onSetDistanceMeasurement,
  onSetAngleMeasurement,
  onClearMeasurements,
  measurements = []
}) => {
  return (
    <div className="bg-white rounded shadow p-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-sm">Measurement Tools</h3>
        <button
          onClick={onDeactivate}
          className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-100"
          title="Exit measurement mode"
        >
          <X size={16} />
        </button>
      </div>
      
      <div className="flex space-x-2 mb-4">
        <button
          onClick={onSetDistanceMeasurement}
          className={`flex items-center px-3 py-1.5 text-sm rounded ${
            measurementType === 'distance'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
          }`}
          title="Measure distance between two points"
        >
          <Ruler size={14} className="mr-1.5" />
          Distance
        </button>
        
        <button
          onClick={onSetAngleMeasurement}
          className={`flex items-center px-3 py-1.5 text-sm rounded ${
            measurementType === 'angle'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
          }`}
          title="Measure angle between three points"
        >
          <RotateCcw size={14} className="mr-1.5" />
          Angle
        </button>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="text-xs text-gray-500 mb-2">
          {measurementType === 'distance' ? (
            <p>Click to place points. Two points needed for distance measurement.</p>
          ) : (
            <p>Click to place points. Three points needed for angle measurement.</p>
          )}
        </div>
        
        <button
          onClick={onDeactivate}
          className="text-xs flex items-center bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded"
          title="Exit measurement mode"
        >
          Exit
        </button>
      </div>
      
      {measurements.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-xs text-gray-600">Saved Measurements</h4>
            <button
              onClick={onClearMeasurements}
              className="text-xs flex items-center text-red-600 hover:text-red-700 p-1"
              title="Clear all measurements"
            >
              <Trash size={12} className="mr-1" />
              Clear All
            </button>
          </div>
          
          <div className="max-h-40 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-1 px-2 text-left">Type</th>
                  <th className="py-1 px-2 text-right">Value</th>
                </tr>
              </thead>
              <tbody>
                {measurements.map((measurement) => (
                  <tr key={measurement.id} className="border-b border-gray-100">
                    <td className="py-1.5 px-2">
                      {measurement.type === 'distance' ? 'Distance' : 'Angle'}
                    </td>
                    <td className="py-1.5 px-2 text-right font-medium">
                      {measurement.formattedValue}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
        <p>
          <strong>Tip:</strong> Press Esc to cancel the current measurement.
        </p>
      </div>
    </div>
  );
};

export default MeasurementControls; 