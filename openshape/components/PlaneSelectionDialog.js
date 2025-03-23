import React, { useState } from 'react';

/**
 * Dialog for selecting a plane on which to create a sketch
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the dialog is open
 * @param {Function} props.onClose - Function to call when dialog is closed without selection
 * @param {Function} props.onPlaneSelected - Function to call with the selected plane information
 */
const PlaneSelectionDialog = ({ isOpen, onClose, onPlaneSelected }) => {
  const [selectedPlane, setSelectedPlane] = useState('xy');
  const [customOffset, setCustomOffset] = useState(0);
  const [isCustomPlane, setIsCustomPlane] = useState(false);

  if (!isOpen) return null;

  const handlePlaneSelect = (plane) => {
    setSelectedPlane(plane);
    setIsCustomPlane(plane === 'custom');
  };

  const handleConfirm = () => {
    onPlaneSelected({
      plane: selectedPlane,
      offset: isCustomPlane ? customOffset : 0
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Select Sketch Plane</h2>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              className={`p-3 border rounded-md flex flex-col items-center ${selectedPlane === 'xy' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
              onClick={() => handlePlaneSelect('xy')}
            >
              <div className="w-16 h-16 bg-gray-100 border flex items-center justify-center mb-2">
                <span className="text-blue-600 font-bold">XY</span>
              </div>
              <span>Front Plane</span>
            </button>
            
            <button
              className={`p-3 border rounded-md flex flex-col items-center ${selectedPlane === 'yz' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
              onClick={() => handlePlaneSelect('yz')}
            >
              <div className="w-16 h-16 bg-gray-100 border flex items-center justify-center mb-2">
                <span className="text-green-600 font-bold">YZ</span>
              </div>
              <span>Right Plane</span>
            </button>
            
            <button
              className={`p-3 border rounded-md flex flex-col items-center ${selectedPlane === 'xz' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
              onClick={() => handlePlaneSelect('xz')}
            >
              <div className="w-16 h-16 bg-gray-100 border flex items-center justify-center mb-2">
                <span className="text-red-600 font-bold">XZ</span>
              </div>
              <span>Top Plane</span>
            </button>
            
            <button
              className={`p-3 border rounded-md flex flex-col items-center ${selectedPlane === 'custom' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
              onClick={() => handlePlaneSelect('custom')}
            >
              <div className="w-16 h-16 bg-gray-100 border flex items-center justify-center mb-2">
                <span className="text-purple-600 font-bold">+</span>
              </div>
              <span>Custom Plane</span>
            </button>
          </div>
          
          {isCustomPlane && (
            <div className="mt-4 p-3 border rounded-md">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Offset from origin
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  value={customOffset}
                  onChange={(e) => setCustomOffset(parseFloat(e.target.value) || 0)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <span className="ml-2">mm</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-6 flex justify-end space-x-3">
          <button
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={handleConfirm}
          >
            Create Sketch
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlaneSelectionDialog; 