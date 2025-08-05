// Design History Manager for OpenShape
// Tracks parametric design operations and their intent for AI-driven iteration

class DesignHistoryManager {
  constructor() {
    this.history = [];
    this.currentIndex = -1;
    this.designIntent = {}; // Stores the reasoning behind operations
    this.parameters = {}; // Stores current parameter values
    this.listeners = new Set();
  }

  /**
   * Records a design operation with its intent and parameters
   * @param {Object} operation - The CAD operation
   * @param {string} intent - Human-readable description of design intent
   * @param {Object} parameters - Current parameter values
   * @param {Object} result - Result of the operation
   */
  recordOperation(operation, intent, parameters = {}, result = null) {
    const historyEntry = {
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      operation,
      intent,
      parameters: { ...this.parameters, ...parameters },
      result,
      type: operation.type || 'unknown',
      toolName: operation.toolName || operation.name
    };

    // Clear any future history if we're not at the end
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    this.history.push(historyEntry);
    this.currentIndex = this.history.length - 1;
    this.parameters = historyEntry.parameters;

    // Store design intent for AI reference
    this.designIntent[historyEntry.id] = {
      intent,
      operation: operation.toolName || operation.name,
      parameters: historyEntry.parameters,
      dependencies: this.findDependencies(operation)
    };

    this.notifyListeners('operation_recorded', historyEntry);
    console.log('Design operation recorded:', historyEntry);
    
    return historyEntry.id;
  }

  /**
   * Finds dependencies between operations
   */
  findDependencies(operation) {
    const dependencies = [];
    
    // If operation references existing models/shapes
    if (operation.targetId || operation.shapeId) {
      const targetId = operation.targetId || operation.shapeId;
      // Find the operation that created this target
      const creatingOp = this.history.find(h => 
        h.result && h.result.modelId === targetId
      );
      if (creatingOp) {
        dependencies.push(creatingOp.id);
      }
    }

    return dependencies;
  }

  /**
   * Updates parameters for a specific operation and regenerates dependent operations
   * @param {string} operationId - ID of the operation to update
   * @param {Object} newParameters - New parameter values
   */
  updateOperationParameters(operationId, newParameters) {
    const opIndex = this.history.findIndex(h => h.id === operationId);
    if (opIndex === -1) {
      throw new Error(`Operation ${operationId} not found in history`);
    }

    const operation = this.history[opIndex];
    const oldParameters = operation.parameters;
    
    // Update parameters
    operation.parameters = { ...operation.parameters, ...newParameters };
    if (this.designIntent[operationId]) {
      this.designIntent[operationId].parameters = operation.parameters;
    }

    console.log(`Updating operation ${operationId} parameters:`, {
      old: oldParameters,
      new: operation.parameters
    });

    // Mark operations that need regeneration
    this.markForRegeneration(opIndex);
    
    this.notifyListeners('parameters_updated', {
      operationId,
      oldParameters,
      newParameters: operation.parameters
    });

    return operation;
  }

  /**
   * Marks operations for regeneration from a given index onwards
   */
  markForRegeneration(fromIndex) {
    for (let i = fromIndex; i < this.history.length; i++) {
      this.history[i].needsRegeneration = true;
    }
  }

  /**
   * Gets all operations that need regeneration
   */
  getOperationsNeedingRegeneration() {
    return this.history.filter(op => op.needsRegeneration);
  }

  /**
   * Marks an operation as regenerated
   */
  markAsRegenerated(operationId, newResult) {
    const operation = this.history.find(h => h.id === operationId);
    if (operation) {
      operation.needsRegeneration = false;
      operation.result = newResult;
      operation.lastRegenerated = new Date();
      
      this.notifyListeners('operation_regenerated', operation);
    }
  }

  /**
   * Gets the design intent for AI context
   */
  getDesignContext() {
    const recentOperations = this.history.slice(-10); // Last 10 operations
    const intents = recentOperations.map(op => ({
      operation: op.toolName,
      intent: this.designIntent[op.id]?.intent || 'No intent recorded',
      parameters: op.parameters,
      timestamp: op.timestamp
    }));

    return {
      currentParameters: this.parameters,
      recentIntents: intents,
      totalOperations: this.history.length,
      designGoals: this.extractDesignGoals()
    };
  }

  /**
   * Extracts high-level design goals from operation intents
   */
  extractDesignGoals() {
    const goals = new Set();
    
    Object.values(this.designIntent).forEach(intent => {
      // Extract keywords that suggest design goals
      const goalKeywords = [
        'stronger', 'lighter', 'larger', 'smaller', 'hollow', 'solid',
        'aesthetic', 'functional', 'streamlined', 'robust', 'precise'
      ];
      
      goalKeywords.forEach(keyword => {
        if (intent.intent.toLowerCase().includes(keyword)) {
          goals.add(keyword);
        }
      });
    });

    return Array.from(goals);
  }

  /**
   * Gets operations by type for analysis
   */
  getOperationsByType(type) {
    return this.history.filter(op => op.type === type);
  }

  /**
   * Gets parameter evolution over time
   */
  getParameterEvolution(parameterName) {
    return this.history
      .filter(op => op.parameters[parameterName] !== undefined)
      .map(op => ({
        value: op.parameters[parameterName],
        timestamp: op.timestamp,
        intent: this.designIntent[op.id]?.intent
      }));
  }

  /**
   * Undoes the last operation
   */
  undo() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      const currentOp = this.history[this.currentIndex];
      this.parameters = currentOp.parameters;
      
      this.notifyListeners('undo', currentOp);
      return currentOp;
    }
    return null;
  }

  /**
   * Redoes the next operation
   */
  redo() {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++;
      const currentOp = this.history[this.currentIndex];
      this.parameters = currentOp.parameters;
      
      this.notifyListeners('redo', currentOp);
      return currentOp;
    }
    return null;
  }

  /**
   * Gets the current operation
   */
  getCurrentOperation() {
    return this.currentIndex >= 0 ? this.history[this.currentIndex] : null;
  }

  /**
   * Gets all history entries
   */
  getHistory() {
    return [...this.history];
  }

  /**
   * Clears all history
   */
  clear() {
    this.history = [];
    this.currentIndex = -1;
    this.designIntent = {};
    this.parameters = {};
    this.notifyListeners('cleared');
  }

  /**
   * Adds a listener for history events
   */
  addListener(listener) {
    this.listeners.add(listener);
  }

  /**
   * Removes a listener
   */
  removeListener(listener) {
    this.listeners.delete(listener);
  }

  /**
   * Notifies all listeners of an event
   */
  notifyListeners(event, data) {
    this.listeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.error('Error in design history listener:', error);
      }
    });

    // Also dispatch global events for other components
    if (typeof window !== 'undefined') {
      const customEvent = new CustomEvent('openshape:designHistoryChanged', {
        detail: { event, data, history: this.getHistory() }
      });
      window.dispatchEvent(customEvent);
    }
  }

  /**
   * Exports history for serialization
   */
  export() {
    return {
      history: this.history,
      designIntent: this.designIntent,
      parameters: this.parameters,
      currentIndex: this.currentIndex,
      exportedAt: new Date()
    };
  }

  /**
   * Imports history from serialized data
   */
  import(data) {
    this.history = data.history || [];
    this.designIntent = data.designIntent || {};
    this.parameters = data.parameters || {};
    this.currentIndex = data.currentIndex || -1;
    
    this.notifyListeners('imported', data);
  }
}

// Create and export a singleton instance
const designHistory = new DesignHistoryManager();

export default designHistory;