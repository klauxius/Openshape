// Model Context Protocol (MCP) Client Implementation
// This module provides utilities for interacting with the MCP server and Claude

/**
 * Represents a client for the Model Context Protocol
 */
class MCPClient {
  constructor() {
    this.tools = [];
    this.conversationId = null;
    this.apiEndpoint = '/api/claude';
    this.modelName = process.env.NEXT_PUBLIC_CLAUDE_MODEL || 'claude-sonnet-5';
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
    
    // Check for duplicate tool names
    const existingTool = this.tools.find(t => t.name === tool.name);
    if (existingTool) {
      console.warn(`Tool with name '${tool.name}' is already registered. Replacing...`);
      this.tools = this.tools.filter(t => t.name !== tool.name);
    }
    
    this.tools.push(tool);
    console.log(`Registered tool: ${tool.name}`);
  }

  /**
   * Returns all registered tools in the format expected by Claude.
   * Anthropic's tool schema requires the JSON schema under `input_schema`
   * (not `parameters`) - the wire format differs from our internal
   * registry field name.
   */
  getToolDefinitions() {
    return this.tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.parameters
    }));
  }

  /**
   * Sends a message to Claude, running tools and feeding their results back
   * until Claude stops requesting them (or a safety cap is hit). This lets
   * Claude chain multiple tool calls in sequence, each informed by the
   * previous one's result, rather than only ever executing the tool(s)
   * from a single response.
   * @param {string} message - The user's message
   * @param {Array} conversation - The conversation history
   * @returns {Promise<Object>} - Final assistant response plus every tool call made along the way
   */
  async sendMessage(message, conversation = []) {
    // Explicit dev opt-in: skip the real API entirely and use the local pattern matcher.
    // Whether a Claude API key is configured is a server-side concern (see pages/api/claude.js);
    // the client must not gate on it directly, since only NEXT_PUBLIC_-prefixed vars are visible
    // here and the real key should never be exposed to the browser via that prefix.
    if (process.env.NEXT_PUBLIC_USE_SIMULATED_RESPONSES === 'true') {
      console.log('Using simulated responses for development');
      return this.generateSimulatedResponse(message);
    }

    // Anthropic message history: the running list of turns, including raw
    // tool_use/tool_result content blocks (not the flattened {role, content}
    // string shape the chat UI stores its own history in). The UI also keeps
    // 'system' role entries for tool-call/result bubbles - Claude's API only
    // accepts user/assistant roles in `messages`, so those must be dropped.
    const messages = conversation
      .filter(msg => msg.role === 'user' || msg.role === 'assistant')
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));
    messages.push({ role: 'user', content: message });

    const allToolCalls = [];
    const MAX_TOOL_ITERATIONS = 8;

    try {
      for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
        const claudeRequest = {
          model: this.modelName,
          messages,
          system: "You are Clapeyron, an advanced AI CAD assistant for OpenShape, a browser-based CAD platform. You help users design 3D models through natural language commands. Focus on understanding design intent, generating precise 3D geometry, and explaining CAD concepts clearly. Always use the tools available to you to accomplish the user's goals. When a task needs multiple steps (e.g. creating a sketch, then drawing geometry in it, then extruding), call the tools one at a time and use each result to decide the next step.",
          max_tokens: 4000,
          tools: this.getToolDefinitions()
        };

        console.log('Sending request via proxy API route:', this.apiEndpoint);

        const response = await fetch(this.apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(claudeRequest)
        });

        // Handle API errors
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Claude API error:', errorText);

          // Server has no API key configured - fall back to the local pattern matcher
          // instead of surfacing a hard error to the user.
          if (response.status === 500 && errorText.includes('API key not configured')) {
            console.warn('Claude API key not configured on server; using simulated responses');
            return this.generateSimulatedResponse(message);
          }

          throw new Error(`API error: ${response.status} - ${errorText}`);
        }

        const claudeResponse = await response.json();
        console.log('Claude API response:', claudeResponse);

        const responseContent = claudeResponse.content || [];
        const toolUseBlocks = responseContent.filter(block => block.type === 'tool_use');
        const textContent = responseContent
          .filter(block => block.type === 'text')
          .map(block => block.text)
          .join('');

        // Keep the assistant's raw content (including tool_use blocks) in the
        // running history so Claude sees its own prior tool calls next round.
        messages.push({ role: 'assistant', content: responseContent });

        if (toolUseBlocks.length === 0 || claudeResponse.stop_reason !== 'tool_use') {
          // Claude is done - no more tools requested.
          return {
            role: 'assistant',
            content: textContent,
            toolCalls: allToolCalls,
            id: claudeResponse.id
          };
        }

        // Execute every requested tool and report each result back to Claude.
        const toolResultBlocks = [];
        for (const block of toolUseBlocks) {
          const toolCall = { name: block.name, parameters: block.input, id: block.id };
          const execution = await this.executeToolCall(toolCall);

          allToolCalls.push({ ...toolCall, ...execution });

          toolResultBlocks.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: JSON.stringify(execution.error ? { error: execution.error } : execution.result),
            is_error: Boolean(execution.error)
          });
        }

        messages.push({ role: 'user', content: toolResultBlocks });
      }

      // Hit the iteration cap - return whatever progress was made.
      return {
        role: 'assistant',
        content: 'I made several tool calls but stopped after reaching the maximum chain length. Let me know if you want me to continue.',
        toolCalls: allToolCalls,
        id: Date.now().toString()
      };
    } catch (error) {
      console.error('Error processing message:', error);
      return {
        role: 'assistant',
        content: `Sorry, I encountered an error while processing your request: ${error.message}`,
        toolCalls: allToolCalls,
        id: Date.now().toString()
      };
    }
  }

  /**
   * Generates a simulated response for development purposes
   * @param {string} message - The user's message
   * @returns {Object} - Simulated response
   */
  generateSimulatedResponse(message) {
    // Convert to lowercase for easier pattern matching
    const lowerMessage = message.toLowerCase();
    
    // Look for shape creation patterns
    if (this.matchesPattern(lowerMessage, ['create', 'make', 'add'], ['cube', 'box'])) {
      // Extract dimensions from the message if present
      const widthMatch = lowerMessage.match(/width\s+(\d+)/i) || lowerMessage.match(/(\d+)\s*x/i);
      const heightMatch = lowerMessage.match(/height\s+(\d+)/i) || lowerMessage.match(/x\s*(\d+)\s*x/i);
      const depthMatch = lowerMessage.match(/depth\s+(\d+)/i) || lowerMessage.match(/x\s*(\d+)(?:\s|$)/i);
      
      const width = widthMatch ? Number(widthMatch[1]) : 10;
      const height = heightMatch ? Number(heightMatch[1]) : 10;
      const depth = depthMatch ? Number(depthMatch[1]) : 10;
      
      return {
        content: `I'll create a cube with dimensions ${width}×${height}×${depth}.`,
        toolCalls: [
          {
            name: 'create_cube',
            parameters: {
              width,
              height,
              depth
            }
          }
        ]
      };
    } 
    else if (this.matchesPattern(lowerMessage, ['create', 'make', 'add'], ['cylinder', 'tube'])) {
      let radius = 5, height = 10;
      
      // Try to extract radius
      const radiusMatch = message.match(/radius\s*[=:]\s*(\d+)/i) || message.match(/radius\s+of\s+(\d+)/i);
      if (radiusMatch) {
        radius = parseFloat(radiusMatch[1]);
      }
      
      // Try to extract height
      const heightMatch = message.match(/height\s*[=:]\s*(\d+)/i) || message.match(/height\s+of\s+(\d+)/i);
      if (heightMatch) {
        height = parseFloat(heightMatch[1]);
      }
      
      return {
        content: `I'll create a cylinder with radius ${radius} and height ${height}.`,
        toolCalls: [
          {
            name: 'create_cylinder',
            parameters: {
              radius,
              height
            }
          }
        ]
      };
    }
    else if (this.matchesPattern(lowerMessage, ['create', 'make', 'add'], ['sphere', 'ball'])) {
      let radius = 5;
      
      // Try to extract radius
      const radiusMatch = message.match(/radius\s*[=:]\s*(\d+)/i) || message.match(/radius\s+of\s+(\d+)/i);
      if (radiusMatch) {
        radius = parseFloat(radiusMatch[1]);
      }
      
      return {
        content: `I'll create a sphere with radius ${radius}.`,
        toolCalls: [
          {
            name: 'create_sphere',
            parameters: {
              radius
            }
          }
        ]
      };
    }
    else if (this.matchesPattern(lowerMessage, ['create', 'make', 'add'], ['torus', 'donut'])) {
      let innerRadius = 2, outerRadius = 5;
      
      // Try to extract inner radius
      const innerRadiusMatch = message.match(/inner\s*radius\s*[=:]\s*(\d+)/i);
      if (innerRadiusMatch) {
        innerRadius = parseFloat(innerRadiusMatch[1]);
      }
      
      // Try to extract outer radius
      const outerRadiusMatch = message.match(/outer\s*radius\s*[=:]\s*(\d+)/i);
      if (outerRadiusMatch) {
        outerRadius = parseFloat(outerRadiusMatch[1]);
      }
      
      return {
        content: `I'll create a torus with inner radius ${innerRadius} and outer radius ${outerRadius}.`,
        toolCalls: [
          {
            name: 'create_torus',
            parameters: {
              innerRadius,
              outerRadius
            }
          }
        ]
      };
    }
    // Handle 2D sketching tools
    else if (this.matchesPattern(lowerMessage, ['create', 'make', 'draw'], ['line', 'segment'])) {
      // Default parameters
      let startPoint = [0, 0];
      let endPoint = [10, 0];
      let thickness = 0.5;
      let height = 1;
      
      // Extract points if provided
      const pointsMatch = message.match(/from\s*\[?\s*(-?\d+)\s*,\s*(-?\d+)\s*\]?\s*to\s*\[?\s*(-?\d+)\s*,\s*(-?\d+)\s*\]?/i);
      if (pointsMatch) {
        startPoint = [parseFloat(pointsMatch[1]), parseFloat(pointsMatch[2])];
        endPoint = [parseFloat(pointsMatch[3]), parseFloat(pointsMatch[4])];
      }
      
      // Try to extract thickness
      const thicknessMatch = message.match(/thickness\s*[=:]\s*(\d+(\.\d+)?)/i);
      if (thicknessMatch) {
        thickness = parseFloat(thicknessMatch[1]);
      }
      
      // Try to extract height for extrusion
      const heightMatch = message.match(/height\s*[=:]\s*(\d+(\.\d+)?)/i);
      if (heightMatch) {
        height = parseFloat(heightMatch[1]);
      }
      
      return {
        content: `I'll create a line from [${startPoint}] to [${endPoint}] with thickness ${thickness} and height ${height}.`,
        toolCalls: [
          {
            name: 'create_line',
            parameters: {
              startPoint,
              endPoint,
              thickness,
              height
            }
          }
        ]
      };
    }
    else if (this.matchesPattern(lowerMessage, ['create', 'make', 'draw'], ['rectangle', 'rect'])) {
      // Default parameters
      let width = 10;
      let height = 5;
      let center = [0, 0];
      let extrudeHeight = 0;
      
      // Extract dimensions if provided
      const dimensionMatch = message.match(/(\d+(\.\d+)?)\s*x\s*(\d+(\.\d+)?)/i);
      if (dimensionMatch) {
        width = parseFloat(dimensionMatch[1]);
        height = parseFloat(dimensionMatch[3]);
      }
      
      // Extract center if provided
      const centerMatch = message.match(/at\s*\[?\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*\]?/i);
      if (centerMatch) {
        center = [parseFloat(centerMatch[1]), parseFloat(centerMatch[3])];
      }
      
      // Extract extrude height if provided
      const extrudeMatch = message.match(/extrude\s*(to|by|with)?\s*(\d+(\.\d+)?)/i);
      if (extrudeMatch) {
        extrudeHeight = parseFloat(extrudeMatch[2]);
      }
      
      return {
        content: `I'll create a rectangle with dimensions ${width}×${height} at [${center}].`,
        toolCalls: [
          {
            name: 'create_rectangle',
            parameters: {
              width,
              height,
              center,
              extrudeHeight
            }
          }
        ]
      };
    }
    else if (this.matchesPattern(lowerMessage, ['create', 'make', 'draw'], ['circle', 'round'])) {
      // Default parameters
      let radius = 5;
      let center = [0, 0];
      let extrudeHeight = 0;
      
      // Extract radius if provided
      const radiusMatch = message.match(/radius\s*[=:]\s*(\d+(\.\d+)?)/i) || message.match(/radius\s+of\s+(\d+(\.\d+)?)/i);
      if (radiusMatch) {
        radius = parseFloat(radiusMatch[1]);
      }
      
      // Extract center if provided
      const centerMatch = message.match(/at\s*\[?\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*\]?/i);
      if (centerMatch) {
        center = [parseFloat(centerMatch[1]), parseFloat(centerMatch[3])];
      }
      
      // Extract extrude height if provided
      const extrudeMatch = message.match(/extrude\s*(to|by|with)?\s*(\d+(\.\d+)?)/i);
      if (extrudeMatch) {
        extrudeHeight = parseFloat(extrudeMatch[2]);
      }
      
      return {
        content: `I'll create a circle with radius ${radius} at [${center}].`,
        toolCalls: [
          {
            name: 'create_circle',
            parameters: {
              radius,
              center,
              extrudeHeight
            }
          }
        ]
      };
    }
    else if (this.matchesPattern(lowerMessage, ['create', 'make', 'draw'], ['polygon'])) {
      // Default parameters - a triangle
      let points = [[0, 0], [10, 0], [5, 10]];
      let extrudeHeight = 0;
      
      // Extract points if provided in a format like [[0,0], [10,0], [5,10]]
      const pointsPattern = /\[\s*\[\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*\](?:\s*,\s*\[\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*\])+\s*\]/i;
      const pointsMatch = message.match(pointsPattern);
      
      if (pointsMatch) {
        // This is a simplistic parser - in a real implementation, you'd need a more robust parser
        const pointsText = pointsMatch[0];
        const coordsMatches = pointsText.match(/\[\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*\]/g);
        
        if (coordsMatches && coordsMatches.length >= 3) {
          points = coordsMatches.map(coord => {
            const nums = coord.match(/(-?\d+(\.\d+)?)/g);
            return [parseFloat(nums[0]), parseFloat(nums[1])];
          });
        }
      }
      
      // Extract extrude height if provided
      const extrudeMatch = message.match(/extrude\s*(to|by|with)?\s*(\d+(\.\d+)?)/i);
      if (extrudeMatch) {
        extrudeHeight = parseFloat(extrudeMatch[2]);
      }
      
      return {
        content: `I'll create a polygon with ${points.length} points.`,
        toolCalls: [
          {
            name: 'create_polygon',
            parameters: {
              points,
              extrudeHeight
            }
          }
        ]
      };
    }
    else if (this.matchesPattern(lowerMessage, ['extrude'], ['shape', 'model', 'object'])) {
      // Default parameters
      let modelId = 'model_1';
      let height = 5;
      
      // Extract model ID if provided
      const modelIdMatch = message.match(/model_\d+/i);
      if (modelIdMatch) {
        modelId = modelIdMatch[0];
      }
      
      // Extract height if provided
      const heightMatch = message.match(/height\s*[=:]\s*(\d+(\.\d+)?)/i) || message.match(/(to|by|with)\s*(\d+(\.\d+)?)/i);
      if (heightMatch) {
        height = parseFloat(heightMatch[heightMatch.length - 2]);
      }
      
      return {
        content: `I'll extrude the shape ${modelId} to a height of ${height}.`,
        toolCalls: [
          {
            name: 'extrude_shape',
            parameters: {
              modelId,
              height
            }
          }
        ]
      };
    }
    else if (this.matchesPattern(lowerMessage, ['list', 'show'], ['models', 'shapes', 'objects'])) {
      return {
        content: `I'll list all the models in the scene for you.`,
        toolCalls: [
          {
            name: 'list_models',
            parameters: {}
          }
        ]
      };
    }
    else if (this.matchesPattern(lowerMessage, ['delete', 'remove'], ['model', 'shape', 'object'])) {
      // Extract model ID if provided
      const modelIdMatch = message.match(/model_\d+/i);
      let modelId = modelIdMatch ? modelIdMatch[0] : 'model_1'; // Default to model_1 if not found
      
      return {
        content: `I'll delete the model with ID ${modelId} from the scene.`,
        toolCalls: [
          {
            name: 'delete_model',
            parameters: {
              modelId
            }
          }
        ]
      };
    }
    else if (this.matchesPattern(lowerMessage, ['combine', 'union'], ['models', 'shapes', 'objects'])) {
      return {
        content: `I'll combine the specified models using a boolean union.`,
        toolCalls: [
          {
            name: 'union_shapes',
            parameters: {
              modelIds: ['model_1', 'model_2']
            }
          }
        ]
      };
    }
    else if (this.matchesPattern(lowerMessage, ['subtract', 'cut', 'difference'], ['from'])) {
      return {
        content: `I'll subtract the specified models from the base model using a boolean difference.`,
        toolCalls: [
          {
            name: 'subtract_shapes',
            parameters: {
              baseModelId: 'model_1',
              subtractModelIds: ['model_2']
            }
          }
        ]
      };
    }
    else if (this.matchesPattern(lowerMessage, ['intersect', 'intersection'], ['models', 'shapes', 'objects'])) {
      return {
        content: `I'll create the intersection of the specified models using a boolean intersection.`,
        toolCalls: [
          {
            name: 'intersect_shapes',
            parameters: {
              modelIds: ['model_1', 'model_2']
            }
          }
        ]
      };
    }
    else if (this.matchesPattern(lowerMessage, ['move', 'translate'], ['model', 'shape', 'object'])) {
      return {
        content: `I'll move the model to the specified position.`,
        toolCalls: [
          {
            name: 'translate_shape',
            parameters: {
              modelId: 'model_1',
              translation: [10, 0, 0]
            }
          }
        ]
      };
    }
    else if (this.matchesPattern(lowerMessage, ['rotate', 'turn'], ['model', 'shape', 'object'])) {
      return {
        content: `I'll rotate the model around the specified axis.`,
        toolCalls: [
          {
            name: 'rotate_shape',
            parameters: {
              modelId: 'model_1',
              axis: [0, 0, 1],
              angle: 45
            }
          }
        ]
      };
    }
    else if (this.matchesPattern(lowerMessage, ['scale', 'resize'], ['model', 'shape', 'object'])) {
      return {
        content: `I'll scale the model by the specified factor.`,
        toolCalls: [
          {
            name: 'scale_shape',
            parameters: {
              modelId: 'model_1',
              scale: 2
            }
          }
        ]
      };
    }
    // Add sketch creation patterns
    else if (this.matchesPattern(lowerMessage, ['create', 'make', 'new', 'start'], ['sketch'])) {
      // Extract plane information if present
      let plane = 'xy';
      let offset = 0;
      
      if (lowerMessage.includes('front') || lowerMessage.includes('xy')) {
        plane = 'xy';
      } else if (lowerMessage.includes('right') || lowerMessage.includes('yz')) {
        plane = 'yz';
      } else if (lowerMessage.includes('top') || lowerMessage.includes('xz')) {
        plane = 'xz';
      }
      
      const offsetMatch = lowerMessage.match(/offset\s+(\d+)/i);
      if (offsetMatch) {
        offset = Number(offsetMatch[1]);
      }
      
      const planeNames = {
        'xy': 'front (XY)',
        'yz': 'right (YZ)',
        'xz': 'top (XZ)'
      };
      
      return {
        content: `I'll create a new sketch on the ${planeNames[plane]} plane${offset > 0 ? ` with offset ${offset}` : ''}.`,
        toolCalls: [
          {
            name: 'cadCreateSketch',
            parameters: {
              plane,
              offset
            }
          }
        ]
      };
    }
    // Drawing in sketch patterns
    else if (this.matchesPattern(lowerMessage, ['draw', 'create', 'add'], ['line']) && 
            this.matchesPattern(lowerMessage, ['in', 'to', 'on'], ['sketch'])) {
      // Parse "from [x, y] to [x, y]" if provided, otherwise use a default segment.
      let startPoint = [0, 0];
      let endPoint = [10, 0];
      const pointMatches = [...message.matchAll(/\[?\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\]?/g)];
      if (pointMatches.length >= 2) {
        startPoint = [parseFloat(pointMatches[0][1]), parseFloat(pointMatches[0][2])];
        endPoint = [parseFloat(pointMatches[1][1]), parseFloat(pointMatches[1][2])];
      }

      return {
        content: `I'll add a line from [${startPoint}] to [${endPoint}] in the sketch.`,
        toolCalls: [
          {
            name: 'cadAddLineToSketch',
            parameters: { startPoint, endPoint }
          }
        ]
      };
    }
    else if (this.matchesPattern(lowerMessage, ['draw', 'create', 'add'], ['circle']) && 
            this.matchesPattern(lowerMessage, ['in', 'to', 'on'], ['sketch'])) {
      // Default parameters for circle
      let radius = 5;
      let center = [0, 0];
      
      // Extract radius if provided
      const radiusMatch = message.match(/radius\s*[=:]\s*(\d+(\.\d+)?)/i) || message.match(/radius\s+of\s+(\d+(\.\d+)?)/i);
      if (radiusMatch) {
        radius = parseFloat(radiusMatch[1]);
      }
      
      // Extract center if provided
      const centerMatch = message.match(/at\s*\[?\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*\]?/i);
      if (centerMatch) {
        center = [parseFloat(centerMatch[1]), parseFloat(centerMatch[3])];
      }
      
      return {
        content: `I'll create a circle with radius ${radius} at position [${center}] in the sketch.`,
        toolCalls: [
          {
            name: 'cadAddCircleToSketch',
            parameters: {
              center,
              radius
            }
          }
        ]
      };
    }
    else if (this.matchesPattern(lowerMessage, ['draw', 'create', 'add'], ['rectangle']) && 
            this.matchesPattern(lowerMessage, ['in', 'to', 'on'], ['sketch'])) {
      // Parse dimensions like "10 by 6", "10x6", or "width 10 height 6".
      let width = 10;
      let height = 10;
      let center = [0, 0];

      const byMatch = message.match(/(\d+(?:\.\d+)?)\s*(?:by|x|×|\*)\s*(\d+(?:\.\d+)?)/i);
      if (byMatch) {
        width = parseFloat(byMatch[1]);
        height = parseFloat(byMatch[2]);
      } else {
        const widthMatch = message.match(/width\s*[=:]?\s*(\d+(?:\.\d+)?)/i);
        const heightMatch = message.match(/height\s*[=:]?\s*(\d+(?:\.\d+)?)/i);
        if (widthMatch) width = parseFloat(widthMatch[1]);
        if (heightMatch) height = parseFloat(heightMatch[1]);
      }

      const centerMatch = message.match(/at\s*\[?\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\]?/i);
      if (centerMatch) {
        center = [parseFloat(centerMatch[1]), parseFloat(centerMatch[2])];
      }

      return {
        content: `I'll add a ${width}×${height} rectangle at [${center}] to the sketch.`,
        toolCalls: [
          {
            name: 'cadAddRectangleToSketch',
            parameters: { center, width, height }
          }
        ]
      };
    }
    else if (this.matchesPattern(lowerMessage, ['exit', 'finish', 'end', 'close'], ['sketch'])) {
      return {
        content: `I'll exit sketch mode. Any geometry you've created will remain in the sketch.`,
        systemMessage: "The system will now exit sketch mode."
      };
    }
    else if (this.matchesPattern(lowerMessage, ['extrude'], ['sketch'])) {
      // Extract height if present
      const heightMatch = lowerMessage.match(/height\s+(\d+(?:\.\d+)?)/i) || lowerMessage.match(/(\d+(?:\.\d+)?)\s*mm/i);
      const height = heightMatch ? Number(heightMatch[1]) : 10;
      
      return {
        content: `I'll extrude the sketch to a height of ${height}mm.`,
        toolCalls: [
          {
            name: 'cadExtrudeSketch',
            parameters: { height }
          }
        ]
      };
    }
    // Default response if no pattern matches
    else {
      return {
        content: "I can help you with CAD operations like creating shapes, transforming them, and performing boolean operations. Try saying something like 'Create a cube with dimensions 10x20x5' or 'Create a new sketch on the front plane'.",
        toolCalls: []
      };
    }
  }
  
  /**
   * Helper method to check if a message matches any of the action words and object words
   * @param {string} message - The message to check
   * @param {Array<string>} actionWords - List of action words to match
   * @param {Array<string>} objectWords - List of object words to match
   * @returns {boolean} - True if the message matches
   */
  matchesPattern(message, actionWords, objectWords) {
    const hasAction = actionWords.some(action => message.includes(action));
    const hasObject = objectWords.some(object => message.includes(object));
    return hasAction && hasObject;
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
        error: `Tool '${name}' not found. Available tools: ${this.tools.map(t => t.name).join(', ')}`
      };
    }
    
    try {
      console.log(`Executing tool ${name} with parameters:`, parameters);
      const result = await tool.execute(parameters);
      console.log(`Tool ${name} execution result:`, result);
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