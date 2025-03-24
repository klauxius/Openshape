import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Maximize2, Minimize2, Clipboard, Check, Code } from 'lucide-react';
import styles from '../styles/AICadAssistant.module.css';
import mcpClient from '../lib/mcpClient';

// Generate a unique ID for messages
const generateUniqueId = () => {
  return `msg_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
};

const AICadAssistant = ({ isOpen, onToggle }) => {
  // Add console log to verify component is rendering
  console.log('AICadAssistant rendering, isOpen:', isOpen);
  
  const [messages, setMessages] = useState([
    { 
      id: generateUniqueId(), 
      role: 'assistant', 
      content: 'Hello! I\'m Clapeyron, your CAD assistant. How can I help you with your 3D modeling today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input when chat is opened
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  // Reset copied status after 2 seconds
  useEffect(() => {
    if (copiedId) {
      const timer = setTimeout(() => setCopiedId(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedId]);

  // Handle executing tool calls
  const handleToolCalls = async (toolCalls) => {
    if (!toolCalls || !toolCalls.length) return;
    
    for (const toolCall of toolCalls) {
      try {
        // Format parameters to be more readable
        const formattedParams = JSON.stringify(toolCall.parameters, null, 2);
        
        // Add a system message showing the tool call
        setMessages(prev => [
          ...prev, 
          { 
            id: generateUniqueId(), 
            role: 'system', 
            type: 'tool_call',
            content: `Executing tool: ${toolCall.name}`,
            toolName: toolCall.name,
            parameters: formattedParams
          }
        ]);
        
        // Execute the tool call
        const result = await mcpClient.executeToolCall(toolCall);
        
        // Add the result as a system message
        if (result.error) {
          setMessages(prev => [
            ...prev, 
            { 
              id: generateUniqueId(), 
              role: 'system', 
              type: 'error',
              content: `Error: ${result.error}`
            }
          ]);
        } else {
          const successMessage = result.result?.message || 'Tool executed successfully';
          setMessages(prev => [
            ...prev, 
            { 
              id: generateUniqueId(), 
              role: 'system', 
              type: 'success',
              content: successMessage
            }
          ]);
        }
      } catch (error) {
        console.error('Error executing tool call:', error);
        setMessages(prev => [
          ...prev, 
          { 
            id: generateUniqueId(), 
            role: 'system', 
            type: 'error',
            content: `Error executing tool: ${error.message}`
          }
        ]);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    // Add user message to chat
    const userMessage = { 
      id: generateUniqueId(), 
      role: 'user', 
      content: input.trim() 
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    
    try {
      // Send message to MCP client and get response
      const response = await mcpClient.sendMessage(userMessage.content, messages);
      
      // Add assistant's response to chat
      setMessages(prev => [...prev, { 
        id: generateUniqueId(), 
        role: 'assistant', 
        content: response.content || 'I processed your request.'
      }]);
      
      // Execute any tool calls
      if (response.toolCalls && response.toolCalls.length > 0) {
        await handleToolCalls(response.toolCalls);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      setMessages(prev => [...prev, { 
        id: generateUniqueId(), 
        role: 'system', 
        type: 'error',
        content: `Error processing your request: ${error.message}`
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(prev => !prev);
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
  };

  const renderMessage = (message) => {
    // Determine the message class based on role and type
    let messageClass = styles.systemMessage;
    if (message.role === 'user') {
      messageClass = styles.userMessage;
    } else if (message.role === 'assistant') {
      messageClass = styles.assistantMessage;
    } else if (message.type === 'tool_call') {
      messageClass = `${styles.systemMessage} ${styles.toolCall}`;
    } else if (message.type === 'success') {
      messageClass = `${styles.systemMessage} ${styles.success}`;
    } else if (message.type === 'error') {
      messageClass = `${styles.systemMessage} ${styles.error}`;
    }

    return (
      <div key={message.id} className={messageClass}>
        {/* Tool call message with parameters */}
        {message.type === 'tool_call' && (
          <>
            <div className={styles.toolHeader}>
              <Code size={16} className={styles.toolIcon} />
              <span>{message.content}</span>
            </div>
            <div className={styles.codeBlock}>
              <pre>{message.parameters}</pre>
              <button 
                className={styles.copyButton}
                onClick={() => copyToClipboard(message.parameters, message.id)}
                title="Copy parameters"
              >
                {copiedId === message.id ? <Check size={14} /> : <Clipboard size={14} />}
              </button>
            </div>
          </>
        )}
        
        {/* Regular messages */}
        {!message.type && message.content}
        
        {/* Success or error messages */}
        {(message.type === 'success' || message.type === 'error') && message.content}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`${styles.assistantContainer} ${isMinimized ? styles.minimized : ''}`}
    >
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.title}>Clapeyron CAD Assistant</div>
        <div className={styles.controls}>
          <button className={styles.controlButton} onClick={toggleMinimize}>
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
          <button className={styles.controlButton} onClick={onToggle}>
            <X size={16} />
          </button>
        </div>
      </div>
      
      {/* Message area */}
      {!isMinimized && (
        <div className={styles.messagesContainer}>
          {messages.map(message => renderMessage(message))}
          {isTyping && (
            <div className={styles.assistantMessage}>
              <div className={styles.typingIndicator}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}
      
      {/* Input area */}
      {!isMinimized && (
        <div className={styles.inputContainer}>
          <textarea 
            ref={inputRef}
            className={styles.input}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me to create or modify 3D models..."
            rows={1}
          />
          <button 
            className={styles.sendButton} 
            onClick={handleSendMessage}
            disabled={!input.trim() || isTyping}
          >
            <Send size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

export default AICadAssistant; 