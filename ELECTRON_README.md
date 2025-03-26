# OpenShape Electron App

This guide explains how to run, build, and develop the OpenShape CAD application as a desktop app using Electron.

## Overview

OpenShape is a powerful AI-enhanced browser-based CAD platform that combines the accessibility of web technologies with the power of programmatic CAD operations. This Electron wrapper allows the application to run as a native desktop application with additional capabilities like file system access.

## Development Setup

### Prerequisites

- Node.js (v16+ recommended)
- npm or yarn

### Installation

1. Install dependencies:

```bash
npm install
```

### Running in Development Mode

To run the application in development mode:

```bash
npm run electron-dev
```

This will start both the Next.js development server and the Electron application.

### Building for Production

To build the application for production:

```bash
npm run electron-pack
```

This will:
1. Build the Next.js application
2. Export it as static files
3. Package it with Electron for your platform

The packaged application will be available in the `dist` directory.

## Key Files

- `electron/main.js` - The main process file for Electron
- `electron/preload.js` - The preload script that securely bridges Electron and the renderer
- `package.json` - Contains scripts and dependencies for both Next.js and Electron
- `next.config.js` - Configuration for Next.js to work with Electron

## Features

- **Integrated JSCAD** - Provides 3D CAD functionality through JSCAD
- **Native File Dialogs** - Open and save models using native OS dialogs
- **Cross-Platform** - Runs on Windows, macOS, and Linux
- **Security** - Uses Electron's security features like context isolation
- **Error Handling** - Robust error handling to prevent crashes

## Components for Electron Integration

- `ElectronJscadBridge.js` - Bridges JSCAD components with Electron's IPC
- Enhanced `JSCADViewer.js` - Provides file handling through Electron

## Troubleshooting

### Common Issues

- **White Screen**: Make sure your build path is correct and the output directory is set to 'out'
- **Module Not Found**: Check that all dependencies are installed properly
- **File Access Issues**: Ensure proper IPC communication setup for file operations

### Debug Mode

To run with DevTools open, the application automatically opens DevTools in development mode.

## Upgrading

When upgrading dependencies, ensure compatibility:
- Test Electron with updated Next.js versions
- Check JSCAD compatibility with Three.js updates

## Security Notes

This application follows Electron's security best practices:
- Context isolation enabled
- Node integration disabled
- Sandbox mode enabled
- Restricted IPC communication

## License

[Your license information] 