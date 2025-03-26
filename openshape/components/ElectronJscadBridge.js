/**
 * ElectronJscadBridge.js
 * 
 * This component provides a bridge between the JSCAD components and Electron's IPC
 * for file operations. It handles saving and loading models through Electron's native
 * file dialogs while maintaining compatibility with web environments.
 */

import { useState, useEffect, useCallback } from 'react';

// Ensure compatibility with both web and Electron environments
const isElectron = () => {
  return typeof window !== 'undefined' && typeof window.electron !== 'undefined';
};

const ElectronJscadBridge = ({ onFileLoaded, onFileSaved, onError }) => {
  const [isListening, setIsListening] = useState(false);

  // Set up listener for file system events from Electron
  useEffect(() => {
    if (isElectron() && !isListening) {
      // Listen for responses from main process
      window.electron.receive('fromMain', (response) => {
        try {
          console.log('Received response from main process:', response);
          
          if (response.type === 'error') {
            console.error('Error from main process:', response.error);
            if (onError) onError(response.error);
          } 
          else if (response.type === 'save-path') {
            if (onFileSaved) onFileSaved(response.path);
          } 
          else if (response.type === 'load-file') {
            if (onFileLoaded) onFileLoaded(response.path);
          }
        } catch (err) {
          console.error('Error handling main process response:', err);
          if (onError) onError(err.message);
        }
      });
      
      setIsListening(true);
      
      // Clean up listener when component unmounts
      return () => {
        if (isElectron()) {
          window.electron.removeAllListeners('fromMain');
        }
      };
    }
  }, [onFileLoaded, onFileSaved, onError, isListening]);

  // Methods to interact with Electron's file system
  const saveModelToFile = useCallback((modelData) => {
    if (isElectron()) {
      window.electron.saveFile(modelData);
    } else {
      console.warn('Save file operation only works in Electron environment');
      // Fallback for web - could implement browser download here
      if (onError) onError('Save file operation only works in Electron environment');
    }
  }, [onError]);

  const openModelFromFile = useCallback(() => {
    if (isElectron()) {
      window.electron.openFile();
    } else {
      console.warn('Open file operation only works in Electron environment');
      // Fallback for web - could implement file input here
      if (onError) onError('Open file operation only works in Electron environment');
    }
  }, [onError]);

  // Return methods that can be used by parent components
  return {
    saveModelToFile,
    openModelFromFile,
    isElectron: isElectron()
  };
};

export default ElectronJscadBridge; 