import React from 'react';
import { useUnits } from '../contexts/UnitContext';

/**
 * A component that provides a user guide for OpenShape CAD functionality
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the guide is open
 * @param {Function} props.onClose - Function to call when the guide is closed
 */
const UserGuide = ({ isOpen, onClose }) => {
  const { unitSystems } = useUnits();

  // Convert unit systems object to an array for rendering
  const unitOptions = Object.values(unitSystems || {});

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">OpenShape CAD User Guide</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6 text-gray-800">
            <section>
              <h3 className="text-xl font-semibold mb-2">Navigation Controls</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Left/Middle Mouse Button:</strong> Rotate the model</li>
                <li><strong>Right Mouse Button:</strong> Pan the view</li>
                <li><strong>Mouse Wheel:</strong> Zoom in/out</li>
                <li><strong>View Buttons:</strong> Quickly switch between Front, Top, Right, and Isometric views</li>
                <li><strong>ViewCube:</strong> Click on a face, edge, or corner to orient the view</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-2">Unit System</h3>
              <p className="mb-2">
                OpenShape supports multiple unit systems that you can select from the dropdown menu in the interface:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                {unitOptions.map(unit => (
                  <li key={unit.id}>
                    <strong>{unit.name} ({unit.abbreviation}):</strong> Precise to {unit.precision} decimal places
                  </li>
                ))}
              </ul>
              <p className="mt-2 bg-blue-50 p-2 rounded text-sm">
                <strong>Note:</strong> When you change the unit system, all measurements in the interface will update 
                accordingly. Your unit preference is saved between sessions.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-2">Import/Export Functionality</h3>
              
              <h4 className="text-lg font-medium mt-3 mb-1">Exporting Models</h4>
              <p className="mb-2">
                To export your current model, click the "Export" button in the top toolbar.
                You can export in the following formats:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>STL:</strong> Standard format for 3D printing and manufacturing</li>
                <li><strong>OBJ:</strong> Common format for 3D models with texture information</li>
                <li><strong>JSON:</strong> OpenShape's native format for preserving full model information</li>
              </ul>
              
              <h4 className="text-lg font-medium mt-3 mb-1">Importing Models</h4>
              <p className="mb-2">
                To import models, click the "Import" button in the top toolbar.
                You can import the following formats:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>STL:</strong> Import existing 3D models</li>
                <li><strong>JSON:</strong> Import previously saved OpenShape models</li>
              </ul>
              <p className="mt-2 bg-blue-50 p-2 rounded text-sm">
                <strong>Note:</strong> Full STL import functionality is currently in development.
                For best results, use the JSON format for preserving all model data.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-2">Model Creation</h3>
              <p>
                Currently, you can select from predefined model types in the dropdown menu.
                Future versions will support full parametric modeling with a code editor and
                direct manipulation tools.
              </p>
            </section>

            <section className="bg-gray-50 p-3 rounded">
              <h3 className="text-xl font-semibold mb-2">Tips and Tricks</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Use the ViewCube for quick orientation changes</li>
                <li>For precise control, use the view buttons rather than manual rotation</li>
                <li>Export as JSON to save your model with all parameters for later editing</li>
                <li>When importing complex models, be patient as rendering may take a moment</li>
                <li>For architectural design, consider using inches or feet as your unit system</li>
                <li>For mechanical parts, millimeters often provide the best precision</li>
              </ul>
            </section>
          </div>
        </div>
        
        <div className="bg-gray-50 px-6 py-3 flex justify-end rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserGuide; 