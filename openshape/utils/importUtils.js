/**
 * Utility functions for importing 3D models into the application
 */

import { UnitSystems, DEFAULT_UNIT_SYSTEM } from './unitUtils';

// For STL imports, we need to parse the file and convert it to JSCAD geometry
// This is currently a placeholder as full STL import requires more complex parsing
export const importSTL = async (file) => {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const contents = event.target.result;
          
          // Placeholder: In a full implementation, this would use a proper STL parser
          // and convert to JSCAD geometry. For now, we'll log this as a limitation.
          console.log('STL import is currently limited. Full parsing would be implemented here.');
          
          // Return a placeholder result - in a real implementation this would be converted geometry
          // In the future, this could integrate with libraries like @jscad/stl-deserializer
          resolve({
            type: 'stl',
            name: file.name,
            size: file.size,
            // Normally this would contain the actual geometry data
            geometry: null,
            rawData: contents
          });
        } catch (error) {
          reject(new Error(`Failed to parse STL file: ${error.message}`));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read STL file'));
      };
      
      // Read the file as text or arraybuffer based on whether it's binary
      // For proper implementation, binary detection would be needed
      reader.readAsText(file);
    } catch (error) {
      reject(error);
    }
  });
};

// JSON import is simpler as we can directly parse the JSON structure
export const importJSON = async (file) => {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const contents = event.target.result;
          const jsonData = JSON.parse(contents);
          
          // Here we would validate that the JSON structure matches our expected format
          // For now, we'll just return the parsed data
          resolve({
            type: 'json',
            name: file.name,
            size: file.size,
            geometry: jsonData,
            rawData: contents
          });
        } catch (error) {
          reject(new Error(`Failed to parse JSON file: ${error.message}`));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read JSON file'));
      };
      
      reader.readAsText(file);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Detects the file type based on extension and imports the file accordingly
 * @param {File} file - The file to import
 * @returns {Promise<Object>} - A promise that resolves to the imported data
 */
export const importModel = async (file) => {
  const fileName = file.name.toLowerCase();
  
  if (fileName.endsWith('.stl')) {
    return importSTL(file);
  } else if (fileName.endsWith('.json')) {
    return importJSON(file);
  } else {
    throw new Error(`Unsupported file format: ${file.name}`);
  }
};

/**
 * Detects the unit system from imported file content
 * @param {string} fileContent - The content of the imported file
 * @param {string} fileType - The type of file ('stl', 'obj', 'json', etc.)
 * @returns {Object} The detected unit system or DEFAULT_UNIT_SYSTEM if not found
 */
export const detectUnitSystem = (fileContent, fileType) => {
  if (!fileContent) return DEFAULT_UNIT_SYSTEM;
  
  try {
    switch (fileType.toLowerCase()) {
      case 'stl':
        // Try to find unit information in ASCII STL header
        if (fileContent.startsWith('solid') && !fileContent.startsWith('solid ÿÿÿÿ')) {
          // This is an ASCII STL file
          const headerMatch = fileContent.match(/Unit system: ([^(]+) \(([^)]+)\)/i);
          if (headerMatch) {
            const unitName = headerMatch[1].trim();
            const unitAbbr = headerMatch[2].trim();
            // Find the matching unit system
            const unitSystem = Object.values(UnitSystems).find(
              u => u.name.toLowerCase() === unitName.toLowerCase() || 
                   u.abbreviation.toLowerCase() === unitAbbr.toLowerCase()
            );
            if (unitSystem) return unitSystem;
          }
        }
        break;
        
      case 'obj':
        // OBJ files may have unit information in comments
        const objHeaderMatch = fileContent.match(/^# .*Unit system: ([^(]+) \(([^)]+)\)/i);
        if (objHeaderMatch) {
          const unitName = objHeaderMatch[1].trim();
          const unitAbbr = objHeaderMatch[2].trim();
          // Find the matching unit system
          const unitSystem = Object.values(UnitSystems).find(
            u => u.name.toLowerCase() === unitName.toLowerCase() || 
                 u.abbreviation.toLowerCase() === unitAbbr.toLowerCase()
          );
          if (unitSystem) return unitSystem;
        }
        break;
        
      case 'json':
        // For JSON files, parse and look for metadata
        try {
          const jsonData = JSON.parse(fileContent);
          if (jsonData.metadata && jsonData.metadata.units) {
            const unitId = jsonData.metadata.units;
            if (UnitSystems[unitId]) {
              return UnitSystems[unitId];
            }
          }
        } catch (jsonError) {
          console.warn('Failed to parse JSON file for unit detection:', jsonError);
        }
        break;
    }
  } catch (error) {
    console.warn('Error detecting unit system from imported file:', error);
  }
  
  return DEFAULT_UNIT_SYSTEM;
};

/**
 * Read a file and return its contents as text
 * @param {File} file - The file object to read
 * @returns {Promise<string>} A promise that resolves to the file contents
 */
export const readFileAsText = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
};

/**
 * Read a file and return its contents as an ArrayBuffer
 * @param {File} file - The file object to read
 * @returns {Promise<ArrayBuffer>} A promise that resolves to the file contents
 */
export const readFileAsArrayBuffer = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Import a file and process it based on its type
 * @param {File} file - The file to import
 * @param {Function} onUnitSystemDetected - Callback to handle detected unit system
 * @param {Function} onGeometryLoaded - Callback to handle the loaded geometry
 * @param {Function} onError - Callback to handle errors
 */
export const importFile = async (file, onUnitSystemDetected, onGeometryLoaded, onError) => {
  try {
    // Get file extension
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    // Read file content for unit detection
    const fileContent = await readFileAsText(file);
    const detectedUnitSystem = detectUnitSystem(fileContent, fileExtension);
    
    // Notify about detected unit system
    if (onUnitSystemDetected) {
      onUnitSystemDetected(detectedUnitSystem);
    }
    
    // Process different file types
    switch (fileExtension) {
      case 'stl':
      case 'obj':
      case 'json':
        // Here we would call the relevant JSCAD deserializer
        // Example (pseudo-code):
        // const geometry = await deserializeFile(file, fileExtension);
        // onGeometryLoaded(geometry);
        
        // This is a placeholder until the actual JSCAD import functionality is implemented
        if (onGeometryLoaded) {
          onGeometryLoaded({
            type: 'placeholder',
            message: `File ${file.name} would be imported with ${detectedUnitSystem.name} units`,
            // In a real implementation, this would be the actual geometry
          });
        }
        break;
        
      default:
        throw new Error(`Unsupported file type: .${fileExtension}`);
    }
  } catch (error) {
    console.error('Import error:', error);
    if (onError) {
      onError(error.message || 'Failed to import file');
    }
  }
}; 