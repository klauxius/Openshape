import { createContext, useState, useContext, useEffect } from 'react';
import { 
  UnitSystems, 
  DEFAULT_UNIT_SYSTEM, 
  loadUnitSystemPreference, 
  saveUnitSystemPreference,
  convertUnits,
  formatValueWithUnit
} from '../utils/unitUtils';

// Create the context
const UnitContext = createContext({
  unitSystem: DEFAULT_UNIT_SYSTEM,
  setUnitSystem: () => {},
  convert: () => {},
  format: () => {}
});

/**
 * Provider component for unit system management
 */
export const UnitProvider = ({ children }) => {
  // Initialize with the saved preference or default
  const [unitSystem, setUnitSystemState] = useState(DEFAULT_UNIT_SYSTEM);
  
  // Load the saved unit preference on initial render
  useEffect(() => {
    const savedUnitSystem = loadUnitSystemPreference();
    setUnitSystemState(savedUnitSystem);
  }, []);
  
  // Handle unit system changes
  const setUnitSystem = (newUnitSystem) => {
    setUnitSystemState(newUnitSystem);
    saveUnitSystemPreference(newUnitSystem.id);
  };
  
  // Conversion helper that uses the current unit system
  const convert = (value, fromUnit, toUnit = unitSystem) => {
    return convertUnits(value, fromUnit, toUnit);
  };
  
  // Formatting helper that uses the current unit system
  const format = (value, unit = unitSystem) => {
    return formatValueWithUnit(value, unit);
  };
  
  // Provide the context value to children
  const contextValue = {
    unitSystem,
    setUnitSystem,
    convert,
    format,
    unitSystems: UnitSystems
  };
  
  return (
    <UnitContext.Provider value={contextValue}>
      {children}
    </UnitContext.Provider>
  );
};

/**
 * Custom hook for accessing the unit context
 */
export const useUnits = () => {
  const context = useContext(UnitContext);
  if (!context) {
    throw new Error('useUnits must be used within a UnitProvider');
  }
  return context;
};

export default UnitContext; 