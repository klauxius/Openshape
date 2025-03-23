import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Maximize2, Minimize2 } from 'lucide-react';
import styles from '../styles/AICadAssistant.module.css';
import mcpClient from '../lib/mcpClient';

const AICadAssistant = ({ isOpen, onToggle }) => {
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
            content: `Executing tool: ${toolCall.name}...`
          }
        ]);
        
        // Execute the tool call
        const result = await mcpClient.executeToolCall(toolCall);
        
        // Add the result as a system message
        setMessages(prev => [
          ...prev, 
          { 
            id: Date.now() + 1, 
            role: 'system', 
            content: result.error 
              ? `Error: ${result.error}` 
              : `Tool executed successfully: ${JSON.stringify(result.result)}`
          }
        ]);
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
    
    // Add user message
    const userMessage = { id: Date.now(), role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    
    try {
      // Get all previous messages for context (excluding system messages)
      const conversationHistory = messages
        .filter(msg => msg.role !== 'system')
        .map(msg => ({ role: msg.role, content: msg.content }));
      
      // Send the message to the MCP client
      const response = await mcpClient.sendMessage(input, conversationHistory);
      
      // Add the assistant's response
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        role: 'assistant', 
        content: response.content
      }]);
      
      // Process any tool calls
      if (response.toolCalls && response.toolCalls.length > 0) {
        await handleToolCalls(response.toolCalls);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        role: 'assistant', 
        content: 'Sorry, I encountered an error while processing your request.'
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
    setIsMinimized(!isMinimized);
  };

  if (!isOpen) return null;

  return (
    <div className={`${styles.assistantContainer} ${isMinimized ? styles.minimized : ''}`}>
      <div className={styles.header}>
        <div className={styles.title}>CAD Assistant</div>
        <div className={styles.controls}>
          {isMinimized ? (
            <button onClick={toggleMinimize} className={styles.controlButton}>
              <Maximize2 size={16} />
            </button>
          ) : (
            <button onClick={toggleMinimize} className={styles.controlButton}>
              <Minimize2 size={16} />
            </button>
          )}
          <button onClick={onToggle} className={styles.controlButton}>
            <X size={16} />
          </button>
        </div>
      </div>
      
      {!isMinimized && (
        <>
          <div className={styles.messagesContainer}>
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`${styles.message} ${
                  message.role === 'user' 
                    ? styles.userMessage 
                    : message.role === 'system' 
                      ? styles.systemMessage 
                      : styles.assistantMessage
                }`}
              >
                <div className={styles.messageContent}>
                  {message.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className={`${styles.message} ${styles.assistantMessage}`}>
                <div className={styles.typingIndicator}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className={styles.inputContainer}>
            <textarea
              ref={inputRef}
              className={styles.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me about modeling or tasks..."
              rows={1}
            />
            <button 
              onClick={handleSendMessage} 
              className={styles.sendButton}
              disabled={!input.trim()}
            >
              <Send size={18} />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AICadAssistant; 