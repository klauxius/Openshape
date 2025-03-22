import React, { useState, useEffect } from 'react';
import { 
  UnitSystems, 
  loadUnitSystemPreference, 
  saveUnitSystemPreference 
} from '../utils/unitUtils';

/**
 * A component for selecting the application's unit system
 * @param {Object} props - Component props
 * @param {Object} props.currentUnit - The currently selected unit system
 * @param {Function} props.onUnitChange - Callback when unit system changes
 * @param {string} props.className - Additional CSS class names
 */
const UnitSelector = ({ currentUnit, onUnitChange, className = '' }) => {
  // Initialize with the current unit from props, or load from localStorage
  const [unitSystem, setUnitSystem] = useState(() => {
    return currentUnit || loadUnitSystemPreference();
  });
  
  // Update the unit system when changed externally
  useEffect(() => {
    if (currentUnit && currentUnit.id !== unitSystem.id) {
      setUnitSystem(currentUnit);
    }
  }, [currentUnit]);
  
  // Convert unit systems object to an array for rendering
  const unitOptions = Object.values(UnitSystems);
  
  const handleUnitChange = (e) => {
    const selectedUnitId = e.target.value;
    const selectedUnit = unitOptions.find(unit => unit.id === selectedUnitId);
    
    if (selectedUnit) {
      setUnitSystem(selectedUnit);
      saveUnitSystemPreference(selectedUnit.id);
      
      if (onUnitChange) {
        onUnitChange(selectedUnit);
      }
    }
  };
  
  return (
    <div className={`flex items-center ${className}`}>
      <label htmlFor="unit-selector" className="text-sm mr-2 text-gray-600">
        Units:
      </label>
      <select
        id="unit-selector"
        value={unitSystem.id}
        onChange={handleUnitChange}
        className="text-sm border border-gray-300 rounded px-2 py-1 bg-white hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {unitOptions.map(unit => (
          <option key={unit.id} value={unit.id}>
            {unit.abbreviation} ({unit.name})
          </option>
        ))}
      </select>
    </div>
  );
};

export default UnitSelector; 