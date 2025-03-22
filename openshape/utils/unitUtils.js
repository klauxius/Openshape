/**
 * Unit conversion utilities for OpenShape CAD
 * Handles conversion between different unit systems and maintains application-wide unit settings
 */

/**
 * Unit system definitions for the OpenShape application
 * Each unit system includes:
 * - id: Unique identifier
 * - name: Display name
 * - abbreviation: Short form
 * - conversionFactor: Multiplier to convert from mm (internal units)
 * - precision: Default number of decimal places to display
 * - description: Brief explanation
 */
export const UnitSystems = {
  mm: {
    id: 'mm',
    name: 'Millimeters',
    abbreviation: 'mm',
    conversionFactor: 1,
    precision: 2,
    description: 'Metric system base unit (internal system)',
  },
  cm: {
    id: 'cm',
    name: 'Centimeters',
    abbreviation: 'cm',
    conversionFactor: 0.1,
    precision: 2,
    description: '1/100 of a meter',
  },
  m: {
    id: 'm',
    name: 'Meters',
    abbreviation: 'm',
    conversionFactor: 0.001,
    precision: 3,
    description: 'Standard metric unit',
  },
  inch: {
    id: 'inch',
    name: 'Inches',
    abbreviation: 'in',
    conversionFactor: 0.0393701,
    precision: 3,
    description: 'Imperial/US customary unit',
  },
  ft: {
    id: 'ft',
    name: 'Feet',
    abbreviation: 'ft',
    conversionFactor: 0.00328084,
    precision: 3,
    description: 'Imperial/US customary unit (12 inches)',
  }
};

// Default unit system if none is saved in user preferences
export const DEFAULT_UNIT_SYSTEM = UnitSystems.mm;

/**
 * Local storage key for saving unit system preference
 */
const UNIT_SYSTEM_STORAGE_KEY = 'openshape_unit_system';

/**
 * Load the user's preferred unit system from local storage
 * @returns {Object} The unit system object or the default if none is saved
 */
export const loadUnitSystemPreference = () => {
  try {
    if (typeof window === 'undefined') return DEFAULT_UNIT_SYSTEM;
    
    const savedUnitSystemId = localStorage.getItem(UNIT_SYSTEM_STORAGE_KEY);
    if (!savedUnitSystemId) return DEFAULT_UNIT_SYSTEM;
    
    // Return the saved unit system or default if not found
    return UnitSystems[savedUnitSystemId] || DEFAULT_UNIT_SYSTEM;
  } catch (error) {
    console.warn('Error loading unit system preference:', error);
    return DEFAULT_UNIT_SYSTEM;
  }
};

/**
 * Save the user's preferred unit system to local storage
 * @param {string} unitSystemId - The ID of the unit system to save
 * @returns {boolean} True if saved successfully, false otherwise
 */
export const saveUnitSystemPreference = (unitSystemId) => {
  try {
    if (typeof window === 'undefined') return false;
    
    // Verify the unit system ID is valid
    if (!UnitSystems[unitSystemId]) {
      console.warn(`Invalid unit system ID: ${unitSystemId}`);
      return false;
    }
    
    localStorage.setItem(UNIT_SYSTEM_STORAGE_KEY, unitSystemId);
    return true;
  } catch (error) {
    console.warn('Error saving unit system preference:', error);
    return false;
  }
};

/**
 * Convert a value from millimeters (internal units) to the specified unit system
 * @param {number} valueInMm - The value in millimeters to convert
 * @param {Object|string} targetUnit - The target unit system or its ID
 * @returns {number} The converted value
 */
export const convertFromMm = (valueInMm, targetUnit) => {
  if (valueInMm === null || valueInMm === undefined) return null;
  
  // Get the unit system object if an ID was provided
  let unitSystem = targetUnit;
  if (typeof targetUnit === 'string') {
    unitSystem = UnitSystems[targetUnit];
    if (!unitSystem) {
      console.warn(`Unknown unit system: ${targetUnit}, using default`);
      unitSystem = DEFAULT_UNIT_SYSTEM;
    }
  }
  
  return valueInMm * unitSystem.conversionFactor;
};

/**
 * Convert a value from the specified unit system to millimeters (internal units)
 * @param {number} value - The value to convert
 * @param {Object|string} sourceUnit - The source unit system or its ID
 * @returns {number} The value in millimeters
 */
export const convertToMm = (value, sourceUnit) => {
  if (value === null || value === undefined) return null;
  
  // Get the unit system object if an ID was provided
  let unitSystem = sourceUnit;
  if (typeof sourceUnit === 'string') {
    unitSystem = UnitSystems[sourceUnit];
    if (!unitSystem) {
      console.warn(`Unknown unit system: ${sourceUnit}, using default`);
      unitSystem = DEFAULT_UNIT_SYSTEM;
    }
  }
  
  return value / unitSystem.conversionFactor;
};

/**
 * Format a value with its unit abbreviation
 * @param {number} value - The value to format
 * @param {Object} unitSystem - The unit system to use for formatting
 * @param {number} [precision] - Optional precision override (decimal places)
 * @returns {string} The formatted value with unit abbreviation
 */
export const formatValueWithUnit = (value, unitSystem, precision) => {
  if (value === null || value === undefined) return 'N/A';
  
  const decimalPlaces = precision !== undefined ? precision : unitSystem.precision;
  return `${value.toFixed(decimalPlaces)} ${unitSystem.abbreviation}`;
};

/**
 * Get the appropriate step size for an input in the given unit system
 * @param {Object} unitSystem - The unit system
 * @returns {number} - The step size for inputs
 */
export const getStepSize = (unitSystem) => {
  return unitSystem.stepSize || 0.1;
};

/**
 * Convert model dimensions when switching unit systems
 * @param {Object} dimensions - Model dimensions in the old unit system
 * @param {Object} fromUnit - The source unit system
 * @param {Object} toUnit - The target unit system
 * @returns {Object} - Converted dimensions
 */
export const convertModelDimensions = (dimensions, fromUnit, toUnit) => {
  const result = {};
  
  for (const [key, value] of Object.entries(dimensions)) {
    if (typeof value === 'number') {
      result[key] = convertUnits(value, fromUnit, toUnit);
    } else {
      result[key] = value; // Non-numeric values remain unchanged
    }
  }
  
  return result;
};

/**
 * Convert a value from one unit system to another
 * @param {number} value - The value to convert
 * @param {Object} fromUnit - The source unit system (from UnitSystems)
 * @param {Object} toUnit - The target unit system (from UnitSystems)
 * @returns {number} - The converted value
 */
export const convertUnits = (value, fromUnit, toUnit) => {
  // Convert to mm first (our base unit), then to the target unit
  const valueInMM = value * fromUnit.conversionFactor;
  return valueInMM * toUnit.conversionFactor;
}; 