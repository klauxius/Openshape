// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const serve = require('electron-serve')
const isDev = require('electron-is-dev')
const http = require('http')

// Load the Next.js app in production, or connect to dev server
const loadURL = serve({ directory: 'openshape/out' })

let mainWindow = null

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
  
  if (mainWindow) {
    dialog.showErrorBox(
      'An error occurred',
      `Error: ${error.message}\n\nThe application will attempt to continue running.`
    )
  }
})

// Find an available Next.js development server port
function findAvailablePort(startPort, callback) {
  const ports = [startPort, 3001, 3002, 3003, 3004, 3005];
  
  function checkPort(index) {
    if (index >= ports.length) {
      console.error('Could not find an available port for Next.js');
      callback(null);
      return;
    }
    
    const port = ports[index];
    const options = {
      hostname: 'localhost',
      port: port,
      path: '/',
      method: 'HEAD',
      timeout: 1000
    };
    
    const req = http.request(options, (res) => {
      if (res.statusCode === 200) {
        console.log(`Next.js is running on port ${port}`);
        callback(port);
      } else {
        checkPort(index + 1);
      }
    });
    
    req.on('error', () => {
      checkPort(index + 1);
    });
    
    req.on('timeout', () => {
      req.destroy();
      checkPort(index + 1);
    });
    
    req.end();
  }
  
  checkPort(0);
}

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      sandbox: true, // Enable sandbox for additional security
      webSecurity: true,
      allowRunningInsecureContent: false,
      enableBlinkFeatures: '', // Disable all experimental features
    },
    // Better performance and appearance
    show: false, // Wait until ready to show
    backgroundColor: '#ffffff', // Prevent white flash
  })

  // Prevent window from being garbage collected
  mainWindow.setTitle('OpenShape CAD')

  // Only show window when it's ready to prevent white flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  // Load the app
  if (isDev) {
    // In development, connect to the Next.js dev server
    const startURL = process.env.ELECTRON_START_URL || 'http://localhost:3003/cad-interface';
    console.log('Loading from development server:', startURL);
    mainWindow.loadURL(startURL);
    
    // Open DevTools automatically
    mainWindow.webContents.openDevTools()
  } else {
    // In production, serve the built Next.js app
    loadURL(mainWindow)
    mainWindow.loadURL('app://-/')
  }

  // Handle window being closed
  mainWindow.on('closed', function () {
    mainWindow = null
  })
}

// Create window when Electron is ready
app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// Listen for IPC messages from the renderer
ipcMain.on('toMain', (event, message) => {
  try {
    console.log('Received message from renderer:', message)
    // Handle different message types
    if (message.type === 'save-file' && message.data) {
      handleSaveFile(message.data)
    } else if (message.type === 'load-file') {
      handleLoadFile()
    }
  } catch (error) {
    console.error('Error handling IPC message:', error)
    // Send error back to renderer
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('fromMain', { 
        type: 'error', 
        error: error.message 
      })
    }
  }
})

// Handle file saving
function handleSaveFile(data) {
  dialog.showSaveDialog(mainWindow, {
    title: 'Save CAD Model',
    defaultPath: 'model.stl',
    filters: [
      { name: 'STL Files', extensions: ['stl'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  }).then(result => {
    if (!result.canceled && result.filePath) {
      // Send the path back to renderer to complete the save operation
      mainWindow.webContents.send('fromMain', { 
        type: 'save-path', 
        path: result.filePath 
      })
    }
  }).catch(err => {
    console.error('Error showing save dialog:', err)
  })
}

// Handle file loading
function handleLoadFile() {
  dialog.showOpenDialog(mainWindow, {
    title: 'Open CAD Model',
    properties: ['openFile'],
    filters: [
      { name: 'CAD Models', extensions: ['stl', 'obj', 'step', 'stp'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  }).then(result => {
    if (!result.canceled && result.filePaths.length > 0) {
      mainWindow.webContents.send('fromMain', { 
        type: 'load-file', 
        path: result.filePaths[0] 
      })
    }
  }).catch(err => {
    console.error('Error showing open dialog:', err)
  })
} 