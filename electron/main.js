// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const serve = require('electron-serve')
const isDev = require('electron-is-dev')

// Load the Next.js app in production, or connect to dev server
const loadURL = serve({ directory: 'out' })

let mainWindow = null

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // Load the app
  if (isDev) {
    // In development, connect to the Next.js dev server
    mainWindow.loadURL('http://localhost:3000/cad-interface')
    // Open DevTools automatically
    mainWindow.webContents.openDevTools()
  } else {
    // In production, serve the built Next.js app
    loadURL(mainWindow)
    mainWindow.loadURL('app://-/cad-interface')
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