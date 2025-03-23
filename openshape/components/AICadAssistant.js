import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Maximize2, Minimize2 } from 'lucide-react';
import styles from '../styles/AICadAssistant.module.css';
import mcpClient from '../lib/mcpClient';

const AICadAssistant = ({ isOpen, onToggle }) => {
  // Add console log to verify component is rendering
  console.log('AICadAssistant rendering, isOpen:', isOpen);
  
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      role: 'assistant', 
      content: 'Hello! I\'m your CAD assistant. How can I help you with your 3D modeling today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
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

  // Handle executing tool calls
  const handleToolCalls = async (toolCalls) => {
    if (!toolCalls || !toolCalls.length) return;
    
    for (const toolCall of toolCalls) {
      try {
        // Add a system message showing the tool call
        setMessages(prev => [
          ...prev, 
          { 
            id: Date.now(), 
            role: 'system', 
            content: `Executing tool: ${toolCall.name} with parameters: ${JSON.stringify(toolCall.parameters)}`
          }
        ]);
        
        // Execute the tool call
        const result = await mcpClient.executeToolCall(toolCall);
        
        // Add the result as a system message
        if (result.error) {
          setMessages(prev => [
            ...prev, 
            { 
              id: Date.now() + 1, 
              role: 'system', 
              content: `Error: ${result.error}`
            }
          ]);
        } else {
          const successMessage = result.result?.message || 'Tool executed successfully';
          setMessages(prev => [
            ...prev, 
            { 
              id: Date.now() + 1, 
              role: 'system', 
              content: successMessage
            }
          ]);
        }
      } catch (error) {
        console.error('Error executing tool call:', error);
        setMessages(prev => [
          ...prev, 
          { 
            id: Date.now() + 2, 
            role: 'system', 
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
      id: Date.now(), 
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
        id: Date.now(), 
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
        id: Date.now(), 
        role: 'system', 
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

  if (!isOpen) return null;

  return (
    <div 
      className={`${styles.assistantContainer} ${isMinimized ? styles.minimized : ''}`}
    >
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.title}>AI CAD Assistant</div>
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
          {messages.map(message => (
            <div 
              key={message.id} 
              className={`${
                message.role === 'user' 
                  ? styles.userMessage 
                  : message.role === 'assistant' 
                    ? styles.assistantMessage 
                    : styles.systemMessage
              }`}
            >
              {message.content}
            </div>
          ))}
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