import React, { useState, useEffect } from 'react';
import { 
  History, 
  RotateCcw, 
  RotateCw, 
  Play, 
  Pause, 
  Settings, 
  ChevronDown, 
  ChevronRight,
  Clock,
  Target,
  Layers
} from 'lucide-react';
import designHistory from '../lib/designHistory';

const DesignHistoryPanel = ({ isOpen, onToggle }) => {
  const [history, setHistory] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [expandedOperations, setExpandedOperations] = useState(new Set());
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1000); // ms between operations

  useEffect(() => {
    // Load initial history
    const initialHistory = designHistory.getHistory();
    setHistory(initialHistory);
    setCurrentIndex(designHistory.currentIndex);

    // Listen for design history changes
    const handleHistoryChange = (event) => {
      const { event: historyEvent, data } = event.detail;
      
      if (historyEvent === 'operation_recorded') {
        setHistory(designHistory.getHistory());
        setCurrentIndex(designHistory.currentIndex);
      } else if (historyEvent === 'parameters_updated') {
        setHistory([...designHistory.getHistory()]); // Force re-render
      } else if (historyEvent === 'undo' || historyEvent === 'redo') {
        setCurrentIndex(designHistory.currentIndex);
      } else if (historyEvent === 'cleared') {
        setHistory([]);
        setCurrentIndex(-1);
      }
    };

    window.addEventListener('openshape:designHistoryChanged', handleHistoryChange);
    
    return () => {
      window.removeEventListener('openshape:designHistoryChanged', handleHistoryChange);
    };
  }, []);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatParameters = (parameters) => {
    return Object.entries(parameters)
      .filter(([key, value]) => value !== undefined && value !== null)
      .map(([key, value]) => {
        if (typeof value === 'number') {
          return `${key}: ${value.toFixed(2)}`;
        }
        if (Array.isArray(value)) {
          return `${key}: [${value.map(v => typeof v === 'number' ? v.toFixed(1) : v).join(', ')}]`;
        }
        return `${key}: ${value}`;
      });
  };

  const toggleOperationExpanded = (operationId) => {
    const newExpanded = new Set(expandedOperations);
    if (newExpanded.has(operationId)) {
      newExpanded.delete(operationId);
    } else {
      newExpanded.add(operationId);
    }
    setExpandedOperations(newExpanded);
  };

  const handleUndo = () => {
    const undoResult = designHistory.undo();
    if (undoResult) {
      setCurrentIndex(designHistory.currentIndex);
    }
  };

  const handleRedo = () => {
    const redoResult = designHistory.redo();
    if (redoResult) {
      setCurrentIndex(designHistory.currentIndex);
    }
  };

  const handlePlayback = () => {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    
    const playNextOperation = (index) => {
      if (index >= history.length || !isPlaying) {
        setIsPlaying(false);
        return;
      }

      // Here you would trigger the operation replay
      // For now, we just advance the current index
      setCurrentIndex(index);
      
      setTimeout(() => {
        playNextOperation(index + 1);
      }, playbackSpeed);
    };

    playNextOperation(0);
  };

  const getOperationIcon = (type) => {
    switch (type) {
      case 'primitive_creation':
        return <Layers size={16} className="text-blue-500" />;
      case 'boolean_operation':
        return <Target size={16} className="text-green-500" />;
      case 'transformation':
        return <RotateCw size={16} className="text-orange-500" />;
      default:
        return <Settings size={16} className="text-gray-500" />;
    }
  };

  const getOperationTypeColor = (type) => {
    switch (type) {
      case 'primitive_creation':
        return 'bg-blue-100 text-blue-800';
      case 'boolean_operation':
        return 'bg-green-100 text-green-800';
      case 'transformation':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-80 h-full bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <History size={20} className="text-gray-600" />
          <h3 className="font-semibold text-gray-900">Design History</h3>
        </div>
        <button
          onClick={onToggle}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <ChevronRight size={16} className="text-gray-500" />
        </button>
      </div>

      {/* Controls */}
      <div className="p-4 border-b border-gray-200 space-y-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleUndo}
            disabled={currentIndex <= 0}
            className="flex items-center space-x-1 px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded"
          >
            <RotateCcw size={14} />
            <span>Undo</span>
          </button>
          <button
            onClick={handleRedo}
            disabled={currentIndex >= history.length - 1}
            className="flex items-center space-x-1 px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded"
          >
            <RotateCw size={14} />
            <span>Redo</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handlePlayback}
            className="flex items-center space-x-1 px-2 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-800 rounded"
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            <span>{isPlaying ? 'Pause' : 'Replay'}</span>
          </button>
          <select
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value={500}>2x Speed</option>
            <option value={1000}>Normal</option>
            <option value={2000}>0.5x Speed</option>
          </select>
        </div>
      </div>

      {/* Operation List */}
      <div className="flex-1 overflow-y-auto">
        {history.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <History size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No operations yet</p>
            <p className="text-xs mt-1">Start creating shapes to see your design history</p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {history.map((operation, index) => (
              <div
                key={operation.id}
                className={`border rounded-lg transition-all ${
                  index === currentIndex
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${operation.needsRegeneration ? 'border-l-4 border-l-orange-400' : ''}`}
              >
                <div
                  className="p-3 cursor-pointer"
                  onClick={() => toggleOperationExpanded(operation.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-2 flex-1">
                      {getOperationIcon(operation.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm text-gray-900 truncate">
                            {operation.toolName || 'Unknown Operation'}
                          </span>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${getOperationTypeColor(operation.type)}`}>
                            {operation.type}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {operation.intent}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Clock size={12} className="text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {formatTimestamp(operation.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      {operation.needsRegeneration && (
                        <div className="w-2 h-2 bg-orange-400 rounded-full" title="Needs regeneration" />
                      )}
                      {expandedOperations.has(operation.id) ? (
                        <ChevronDown size={16} className="text-gray-400" />
                      ) : (
                        <ChevronRight size={16} className="text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedOperations.has(operation.id) && (
                  <div className="px-3 pb-3 border-t border-gray-100 bg-gray-50">
                    <div className="space-y-2 mt-2">
                      <div>
                        <h4 className="text-xs font-medium text-gray-700 mb-1">Parameters:</h4>
                        <div className="space-y-1">
                          {formatParameters(operation.parameters).map((param, idx) => (
                            <div key={idx} className="text-xs text-gray-600 font-mono bg-white px-2 py-1 rounded">
                              {param}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {operation.result && (
                        <div>
                          <h4 className="text-xs font-medium text-gray-700 mb-1">Result:</h4>
                          <div className="text-xs text-gray-600 bg-white px-2 py-1 rounded">
                            {operation.result.success ? '✓ Success' : '✗ Error'}
                            {operation.result.message && `: ${operation.result.message}`}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer with summary */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-600 space-y-1">
          <div>Total Operations: {history.length}</div>
          <div>Current Step: {currentIndex + 1} of {history.length}</div>
          {history.filter(op => op.needsRegeneration).length > 0 && (
            <div className="text-orange-600">
              {history.filter(op => op.needsRegeneration).length} operations need regeneration
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DesignHistoryPanel;