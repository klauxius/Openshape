// Preload script that will be executed in the renderer process
const { contextBridge, ipcRenderer } = require('electron')

// Expose protected methods that allow the renderer process to use IPC
contextBridge.exposeInMainWorld('electron', {
  // API methods can be added here to safely communicate with the main process
  sendMessage: (channel, data) => {
    // Whitelist channels
    let validChannels = ['toMain'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  receive: (channel, func) => {
    let validChannels = ['fromMain'];
    if (validChannels.includes(channel)) {
      // Remove the event to avoid memory leaks
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  }
}) 