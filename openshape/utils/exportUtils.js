import { stlSerializer } from '@jscad/stl-serializer';
import { objSerializer } from '@jscad/obj-serializer';

/**
 * Exports a JSCAD geometry to STL format
 * @param {Object} geometry - The JSCAD geometry to export
 * @param {string} filename - The name of the file to download (without extension)
 * @param {boolean} binary - Whether to export as binary STL (true) or ASCII STL (false)
 * @param {Object} unitSystem - The current unit system information
 */
export const exportToSTL = (geometry, filename = 'model', binary = true, unitSystem) => {
  try {
    // Configure serializer options
    const options = {
      binary,
      statusCallback: (status) => console.log('STL export status:', status)
    };
    
    // Add unit information to STL header if available and not binary
    if (unitSystem && !binary) {
      options.description = `OpenShape model - Unit system: ${unitSystem.name} (${unitSystem.abbreviation})`;
    }
    
    // Serialize the geometry to STL format
    const rawData = stlSerializer.serialize(geometry, options);
    
    // Create blob and download
    const blob = binary 
      ? new Blob([rawData.buffer], { type: 'application/octet-stream' })
      : new Blob([rawData], { type: 'application/octet-stream' });
    
    downloadBlob(blob, `${filename}.stl`);
    
    return true;
  } catch (error) {
    console.error('STL export error:', error);
    throw new Error(`Failed to export STL: ${error.message}`);
  }
};

/**
 * Exports a JSCAD geometry to OBJ format
 * @param {Object} geometry - The JSCAD geometry to export
 * @param {string} filename - The name of the file to download (without extension)
 * @param {Object} unitSystem - The current unit system information
 */
export const exportToOBJ = (geometry, filename = 'model', unitSystem) => {
  try {
    // Configure serializer options
    const options = {
      statusCallback: (status) => console.log('OBJ export status:', status)
    };
    
    // Serialize the geometry to OBJ format
    let rawData = objSerializer.serialize(geometry, options);
    
    // Add unit information as a comment at the beginning of the OBJ file if available
    if (unitSystem) {
      const unitComment = `# OpenShape model - Unit system: ${unitSystem.name} (${unitSystem.abbreviation})\n`;
      rawData = unitComment + rawData;
    }
    
    // Create blob and download
    const blob = new Blob([rawData], { type: 'application/octet-stream' });
    downloadBlob(blob, `${filename}.obj`);
    
    return true;
  } catch (error) {
    console.error('OBJ export error:', error);
    throw new Error(`Failed to export OBJ: ${error.message}`);
  }
};

/**
 * Exports a JSCAD geometry to JSON format
 * @param {Object} geometry - The JSCAD geometry to export (with optional metadata)
 * @param {string} filename - The name of the file to download (without extension)
 */
export const exportToJSON = (geometry, filename = 'model') => {
  try {
    // Convert geometry to JSON string with pretty formatting
    const jsonData = JSON.stringify(geometry, null, 2);
    
    // Create blob and download
    const blob = new Blob([jsonData], { type: 'application/json' });
    downloadBlob(blob, `${filename}.json`);
    
    return true;
  } catch (error) {
    console.error('JSON export error:', error);
    throw new Error(`Failed to export JSON: ${error.message}`);
  }
};

/**
 * Helper function to download a blob as a file
 * @param {Blob} blob - The blob to download
 * @param {string} filename - The name of the file to download
 */
const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}; 