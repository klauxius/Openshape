import React from 'react';
import { Pencil } from 'lucide-react';

/**
 * Button component for creating a new sketch
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onClick - Handler for when the button is clicked
 * @param {string} props.className - Additional CSS classes
 */
const SketchButton = ({ onClick, className = '' }) => {
  return (
    <button
      className={`flex items-center justify-center p-2 bg-white border border-gray-300 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      onClick={onClick}
      title="Create new sketch"
    >
      <Pencil size={20} className="text-blue-600" />
      <span className="ml-2">New Sketch</span>
    </button>
  );
};

export default SketchButton; 