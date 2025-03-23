// CodeTerminal.js - Terminal-like interface for executing JSCAD commands
import React, { useState, useEffect, useRef } from 'react';
import * as jscad from '@jscad/modeling';
import CADOperations from '../lib/cadOperations';
import { modelStore, notifyModelChanged } from '../lib/mcpTools';
import { Terminal, Code, Copy, CheckCircle, X, Play, Minimize, Maximize } from 'lucide-react';

const CodeTerminal = ({ onVisibilityChange }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [commandHistory, setCommandHistory] = useState([]);
  const [operations, setOperations] = useState([]);
  const [activeTab, setActiveTab] = useState('command'); // 'command' or 'history'
  const [isExpanded, setIsExpanded] = useState(false);
  const terminalRef = useRef(null);
  const inputRef = useRef(null);
  const contentRef = useRef(null);

  // Update visibility state when changed externally
  const toggleVisibility = (visible) => {
    const newVisibility = visible === undefined ? !isVisible : visible;
    setIsVisible(newVisibility);
    
    // Notify parent component about visibility change if callback exists
    if (onVisibilityChange) {
      onVisibilityChange(newVisibility);
    }
    
    // Focus the input when visible
    if (newVisibility) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 0);
    }
  };

  // Load operation history
  useEffect(() => {
    // Update operations list from CADOperations history
    const updateOperations = () => {
      const ops = CADOperations.getHistory();
      setOperations(ops);
    };

    // Create custom event for operation history changes
    const handleOperationHistoryChanged = () => {
      updateOperations();
    };

    window.addEventListener('openshape:operationHistoryChanged', handleOperationHistoryChanged);
    updateOperations();

    return () => {
      window.removeEventListener('openshape:operationHistoryChanged', handleOperationHistoryChanged);
    };
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Toggle terminal with Ctrl + ` (backtick)
      if (e.ctrlKey && e.key === '`') {
        e.preventDefault();
        toggleVisibility();
      }

      // Handle keyboard navigation in the terminal
      if (isVisible && activeTab === 'command') {
        // Handle up arrow for command history
        if (e.key === 'ArrowUp' && document.activeElement === inputRef.current) {
          e.preventDefault();
          if (commandHistory.length > 0 && historyIndex < commandHistory.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            setCommand(commandHistory[commandHistory.length - 1 - newIndex]);
          }
        }
        
        // Handle down arrow for command history
        if (e.key === 'ArrowDown' && document.activeElement === inputRef.current) {
          e.preventDefault();
          if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setCommand(commandHistory[commandHistory.length - 1 - newIndex]);
          } else if (historyIndex === 0) {
            setHistoryIndex(-1);
            setCommand('');
          }
        }
      }
    };

    // Listen for toggle events
    const handleToggleEvent = () => {
      toggleVisibility();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('openshape:toggleTerminal', handleToggleEvent);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('openshape:toggleTerminal', handleToggleEvent);
    };
  }, [isVisible, activeTab, commandHistory, historyIndex]);

  // Function to execute JSCAD command
  const executeCommand = async () => {
    if (!command.trim()) return;

    // Add command to history
    setHistory(prev => [...prev, { type: 'input', content: command }]);
    
    // Add to command history for up/down arrow navigation
    setCommandHistory(prev => [...prev, command]);
    setHistoryIndex(-1);

    try {
      // Create a safe evaluation context with JSCAD and CADOperations available
      const models = modelStore.getAllModels().reduce((acc, model) => {
        acc[`model_${model.id}`] = model.geometry;
        return acc;
      }, {});

      // Simple execution context
      const context = {
        jscad,
        ...models,
        CADOperations,
        modelStore,
        result: null
      };

      // Create a function that will be executed with the above context
      const executeFn = new Function(
        ...Object.keys(context),
        `try {
          ${command};
          return { success: true, result: typeof result !== 'undefined' ? result : null };
        } catch (error) {
          return { success: false, error: error.message };
        }`
      );

      // Execute the command with the context
      const response = executeFn(...Object.values(context));

      if (response.success) {
        // Add result to history
        setHistory(prev => [...prev, { 
          type: 'output', 
          content: response.result ? JSON.stringify(response.result, null, 2) : 'Command executed successfully.'
        }]);

        // If the result is a valid JSCAD geometry, add it to the model store
        if (response.result && typeof response.result === 'object' && response.result.polygons) {
          const modelId = modelStore.addModel(response.result, 'Script Result');
          notifyModelChanged({ id: modelId, geometry: response.result, isVisible: true });
          setHistory(prev => [...prev, { 
            type: 'output', 
            content: `Created model with ID: ${modelId}`
          }]);
        }
      } else {
        // Add error to history
        setHistory(prev => [...prev, { 
          type: 'error', 
          content: `Error: ${response.error}`
        }]);
      }
    } catch (error) {
      // Add error to history
      setHistory(prev => [...prev, { 
        type: 'error', 
        content: `Error: ${error.message}`
      }]);
    }

    // Clear command
    setCommand('');
    
    // Scroll to bottom
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  };

  const handleCommandChange = (e) => {
    setCommand(e.target.value);
    setCursorPosition(e.target.selectionStart);
  };

  const handleCommandKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      executeCommand();
    }
  };

  const toggleExpanded = () => {
    setIsExpanded(prev => !prev);
  };

  const clearHistory = () => {
    setHistory([]);
  };

  if (!isVisible) return null;

  return (
    <div 
      ref={terminalRef}
      className={`fixed bottom-0 right-0 bg-gray-900 text-white z-50 border-t border-l border-gray-700 rounded-tl-lg shadow-lg ${
        isExpanded ? 'w-2/3 h-2/3' : 'w-1/2 h-64'
      }`}
      style={{ 
        maxHeight: isExpanded ? 'calc(100vh - 100px)' : '400px',
        display: isVisible ? 'block' : 'none'
      }}
    >
      {/* Terminal header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-gray-700 rounded-tl-lg">
        <div className="flex items-center">
          <Terminal size={16} className="mr-2" />
          <span className="font-medium">JSCAD Terminal</span>
        </div>

        <div className="flex items-center space-x-2">
          <button 
            className={`px-2 py-1 rounded text-xs ${activeTab === 'command' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
            onClick={() => setActiveTab('command')}
          >
            <Code size={14} className="mr-1 inline" />
            Command
          </button>
          <button 
            className={`px-2 py-1 rounded text-xs ${activeTab === 'history' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
            onClick={() => setActiveTab('history')}
          >
            <Code size={14} className="mr-1 inline" />
            History
          </button>
          <button 
            className="p-1 hover:bg-gray-700 rounded"
            onClick={toggleExpanded}
            title={isExpanded ? "Minimize" : "Maximize"}
          >
            {isExpanded ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
          <button 
            className="p-1 hover:bg-gray-700 rounded"
            onClick={() => toggleVisibility(false)}
            title="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Terminal content */}
      {activeTab === 'command' && (
        <div className="flex flex-col h-full">
          <div 
            ref={contentRef}
            className="flex-1 p-3 overflow-y-auto font-mono text-sm"
            style={{ maxHeight: 'calc(100% - 80px)' }}
          >
            {/* Welcome message */}
            {history.length === 0 && (
              <div className="text-green-400 mb-4">
                <p>Welcome to the JSCAD Terminal</p>
                <p className="text-gray-400 text-xs mt-1">
                  Execute JSCAD commands to create and manipulate 3D models. 
                  You have access to the entire JSCAD API and CADOperations.
                </p>
                <p className="text-gray-400 text-xs mt-2">
                  Examples:
                </p>
                <p className="text-blue-400 text-xs">
                  const cube = jscad.primitives.cuboid(&#123; size: [10, 10, 10] &#125;);
                  <br />
                  result = cube; // Assign to result to visualize
                  <br /><br />
                  // Use CADOperations for higher-level functions
                  <br />
                  CADOperations.createCube(&#123; width: 20, height: 15, depth: 10 &#125;);
                </p>
              </div>
            )}

            {/* Command history */}
            {history.map((item, index) => (
              <div key={index} className="mb-2">
                {item.type === 'input' && (
                  <div>
                    <span className="text-green-500">{'>'}</span>
                    <span className="text-green-300 ml-2">{item.content}</span>
                  </div>
                )}
                {item.type === 'output' && (
                  <div className="text-gray-300 ml-4 whitespace-pre-wrap">{item.content}</div>
                )}
                {item.type === 'error' && (
                  <div className="text-red-400 ml-4">{item.content}</div>
                )}
              </div>
            ))}
          </div>

          {/* Input area */}
          <div className="p-3 border-t border-gray-700 bg-gray-800">
            <div className="flex items-center">
              <span className="text-green-500 mr-2">{'>'}</span>
              <input
                ref={inputRef}
                type="text"
                value={command}
                onChange={handleCommandChange}
                onKeyDown={handleCommandKeyDown}
                className="flex-1 bg-transparent border-none outline-none text-green-300 font-mono"
                placeholder="Enter JSCAD command..."
                autoFocus
              />
              <button 
                className="ml-2 p-1 bg-green-700 hover:bg-green-600 rounded"
                onClick={executeCommand}
                title="Execute"
              >
                <Play size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History tab */}
      {activeTab === 'history' && (
        <div className="flex flex-col h-full">
          <div className="flex-1 p-3 overflow-y-auto">
            <h3 className="font-medium mb-2">Operation History</h3>
            {operations.length === 0 ? (
              <p className="text-gray-400 text-sm">No operations performed yet.</p>
            ) : (
              <div className="space-y-2">
                {operations.map((op, index) => (
                  <div 
                    key={index} 
                    className={`p-2 border border-gray-700 rounded ${
                      index === CADOperations.getHistoryIndex() ? 'bg-blue-900 border-blue-600' : 'bg-gray-800'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="font-medium">{op.type}</div>
                      <div className="text-xs text-gray-400">
                        {new Date(op.timestamp || Date.now()).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="text-sm text-gray-300 mt-1">
                      Parameters: {JSON.stringify(op.params)}
                    </div>
                    {op.modelId && (
                      <div className="text-xs text-blue-400 mt-1">
                        Model ID: {op.modelId}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-3 border-t border-gray-700 bg-gray-800">
            <div className="flex justify-between">
              <button 
                className="px-3 py-1 bg-blue-700 hover:bg-blue-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => CADOperations.undo()}
                disabled={CADOperations.getHistoryIndex() < 0}
              >
                Undo
              </button>
              <button 
                className="px-3 py-1 bg-blue-700 hover:bg-blue-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => CADOperations.redo()}
                disabled={CADOperations.getHistoryIndex() >= operations.length - 1}
              >
                Redo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Export toggleTerminal method along with the component
export const toggleTerminal = () => {
  const event = new CustomEvent('openshape:toggleTerminal');
  window.dispatchEvent(event);
};

export default CodeTerminal; 