// Model Context Protocol (MCP) Client Implementation
// This module provides utilities for interacting with the MCP server and Claude

/**
 * Represents a client for the Model Context Protocol
 */
class MCPClient {
  constructor() {
    this.tools = [];
    this.conversationId = null;
    this.apiEndpoint = process.env.NEXT_PUBLIC_CLAUDE_API_ENDPOINT || 'https://api.anthropic.com/v1/messages';
    this.apiKey = process.env.NEXT_PUBLIC_CLAUDE_API_KEY;
    this.modelName = process.env.NEXT_PUBLIC_CLAUDE_MODEL || 'claude-3-opus-20240229';
  }

  /**
   * Registers a tool that can be used by the AI assistant
   * @param {Object} tool - The tool definition
   * @param {string} tool.name - Name of the tool
   * @param {string} tool.description - Description of what the tool does
   * @param {Object} tool.parameters - Parameters the tool accepts (JSON Schema format)
   * @param {Function} tool.execute - Function to execute when tool is called
   */
  registerTool(tool) {
    // Validate tool structure
    if (!tool.name || !tool.description || !tool.parameters || !tool.execute) {
      throw new Error('Tool must have name, description, parameters, and execute function');
    }
    
    this.tools.push(tool);
    console.log(`Registered tool: ${tool.name}`);
  }

  /**
   * Returns all registered tools in the format expected by Claude
   */
  getToolDefinitions() {
    return this.tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }));
  }

  /**
   * Sends a message to Claude and handles tool calling
   * @param {string} message - The user's message
   * @param {Array} conversation - The conversation history
   * @returns {Promise<Object>} - Claude's response
   */
  async sendMessage(message, conversation = []) {
    if (!this.apiKey) {
      console.error('Claude API key not set');
      return {
        role: 'assistant',
        content: 'Sorry, I cannot process your request because the API key is not configured.',
        id: Date.now().toString()
      };
    }

    try {
      // For now, just return a simulated response
      // In the actual implementation, this would call Claude's API
      
      const simulatedResponse = {
        role: 'assistant',
        content: `I understand you want to "${message}". I'm a simulated response for now, but in the full implementation, I would be able to help you create and modify 3D models.`,
        id: Date.now().toString(),
        toolCalls: []
      };
      
      // Simulate tool calling behavior if keywords are detected
      if (message.toLowerCase().includes('create') || message.toLowerCase().includes('make')) {
        if (message.toLowerCase().includes('cube') || message.toLowerCase().includes('box')) {
          simulatedResponse.toolCalls.push({
            name: 'create_cube',
            parameters: {
              width: 10,
              height: 10,
              depth: 10,
              position: [0, 0, 0]
            }
          });
          simulatedResponse.content = "I'll create a cube for you. The default size is 10x10x10 units.";
        } else if (message.toLowerCase().includes('cylinder')) {
          simulatedResponse.toolCalls.push({
            name: 'create_cylinder',
            parameters: {
              radius: 5,
              height: 10,
              position: [0, 0, 0]
            }
          });
          simulatedResponse.content = "I'll create a cylinder for you. The default size is radius 5 and height 10 units.";
        }
      }
      
      return simulatedResponse;
    } catch (error) {
      console.error('Error calling Claude API:', error);
      return {
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request.',
        id: Date.now().toString()
      };
    }
  }

  /**
   * Executes a tool call from Claude
   * @param {Object} toolCall - The tool call information
   * @returns {Promise<Object>} - Result of the tool execution
   */
  async executeToolCall(toolCall) {
    const { name, parameters } = toolCall;
    const tool = this.tools.find(t => t.name === name);
    
    if (!tool) {
      console.error(`Tool not found: ${name}`);
      return {
        error: `Tool not found: ${name}`
      };
    }
    
    try {
      const result = await tool.execute(parameters);
      return {
        result
      };
    } catch (error) {
      console.error(`Error executing tool ${name}:`, error);
      return {
        error: error.message
      };
    }
  }
}

// Create a singleton instance
const mcpClient = new MCPClient();

// Export the singleton instance
export default mcpClient; 