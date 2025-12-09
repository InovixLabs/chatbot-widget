/**
 * Embeddable Chatbot Widget
 * Can be injected into any website with simple script tag
 */

(function() {
    'use strict';
    
    // Prevent multiple widget instances
    if (window.ChatbotWidget) {
        console.warn('ChatbotWidget already exists');
        return;
    }
    
    // Add error handling to prevent page refreshes
    window.addEventListener('error', function(event) {
        if (event.filename && event.filename.includes('chatbot-widget.js')) {
            console.error('Chatbot widget error:', event.error);
            event.preventDefault();
        }
    });
    
    class ChatbotWidget {
        constructor() {
            this.config = null;
            this.isOpen = false;
            this.sessionId = null;
            this.messages = [];
            this.isTyping = false;
            this.widget = null;
        }
        
        init(config) {
            // Prevent multiple initialization
            if (this.widget) {
                console.warn('ChatbotWidget already initialized');
                return;
            }
            
            this.config = {
                apiKey: '',
                apiUrl: 'http://localhost:8001/api',
                widgetId: 'chatbot-widget',
                position: 'bottom-right',
                primaryColor: '#2563eb',
                textColor: '#ffffff',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                title: 'Assistant',
                subtitle: 'How can I help you?',
                welcomeMessage: 'Hello! How can I assist you today?',
                ...config
            };
            
            this.createSession();
            this.createWidget();
            this.addStyles();
        }
        
        async createSession() {
            try {
                const origin = window.location.origin || 'null';
                console.log('Creating session with origin:', origin);
                
                const response = await fetch(`${this.config.apiUrl}/widget/session`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': this.config.apiKey,
                        'Origin': origin
                    },
                    body: JSON.stringify({
                        origin: origin
                    })
                });
                
                console.log('Session response status:', response.status);
                
                if (response.ok) {
                    const data = await response.json();
                    this.sessionId = data.session_id;
                    console.log('Session created successfully:', this.sessionId);
                } else {
                    const errorData = await response.text();
                    console.error('Failed to create chatbot session:', response.status, errorData);
                }
            } catch (error) {
                console.error('Error creating chatbot session:', error);
            }
        }
        
        createWidget() {
            try {
                // Prevent duplicate widget creation
                if (document.getElementById(this.config.widgetId)) {
                    console.warn('Widget already exists');
                    return;
                }
                
                // Create widget container
                this.widget = document.createElement('div');
                this.widget.id = this.config.widgetId;
                this.widget.className = 'chatbot-widget';
                
                // Set position
                const positionClass = this.config.position === 'bottom-left' ? 'bottom-left' : 'bottom-right';
                this.widget.classList.add(positionClass);
                
                // Debug: Log the applied classes
                console.log('Widget position config:', this.config.position);
                console.log('Applied position class:', positionClass);
                console.log('Widget classes:', this.widget.className);
                
                this.widget.innerHTML = `
                    <div class="chatbot-toggle" onclick="window.ChatbotWidget.toggle()">
                        <svg class="chatbot-icon" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                        </svg>
                        <svg class="chatbot-close" viewBox="0 0 24 24" fill="currentColor" style="display: none;">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </div>
                    
                    <div class="chatbot-window" style="display: none;">
                        <div class="chatbot-header">
                            <div class="chatbot-header-content">
                                <h3>${this.config.title}</h3>
                                <p>${this.config.subtitle}</p>
                            </div>
                            <button class="chatbot-minimize" onclick="window.ChatbotWidget.toggle()">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                                </svg>
                            </button>
                        </div>
                        
                        <div class="chatbot-messages" id="chatbot-messages">
                            <div class="chatbot-message bot-message">
                                <div class="message-content">${this.config.welcomeMessage}</div>
                            </div>
                        </div>
                        
                        <div class="chatbot-typing" id="chatbot-typing" style="display: none;">
                            <div class="typing-indicator">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                            <span class="typing-text">Assistant is typing...</span>
                        </div>
                        
                        <div class="chatbot-input">
                            <input type="text" id="chatbot-input-field" placeholder="Type your message..." onkeypress="window.ChatbotWidget.handleKeyPress(event)">
                            <button onclick="window.ChatbotWidget.sendMessage()">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                `;
                
                document.body.appendChild(this.widget);
            } catch (error) {
                console.error('Error creating widget:', error);
            }
        }
        
        addStyles() {
            const styles = `
                .chatbot-widget {
                    position: fixed;
                    z-index: 9999;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                }
                
                .chatbot-widget.bottom-right {
                    bottom: 20px !important;
                    right: 20px !important;
                    left: auto !important;
                }
                
                .chatbot-widget.bottom-left {
                    bottom: 20px !important;
                    left: 20px !important;
                    right: auto !important;
                }
                
                .chatbot-toggle {
                    width: 60px;
                    height: 60px;
                    background: ${this.config.primaryColor};
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                }
                
                .chatbot-toggle:hover {
                    transform: scale(1.05);
                    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
                }
                
                .chatbot-toggle svg {
                    width: 24px;
                    height: 24px;
                    color: ${this.config.textColor};
                }
                
                .chatbot-window {
                    position: absolute;
                    bottom: 80px;
                    width: 350px;
                    height: 500px;
                    background: ${this.config.backgroundColor};
                    border-radius: ${this.config.borderRadius};
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    animation: slideUp 0.3s ease-out;
                }
                
                .chatbot-widget.bottom-right .chatbot-window {
                    right: 0 !important;
                    left: auto !important;
                }
                
                .chatbot-widget.bottom-left .chatbot-window {
                    left: 0 !important;
                    right: auto !important;
                }
                
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .chatbot-header {
                    background: ${this.config.primaryColor};
                    color: ${this.config.textColor};
                    padding: 16px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .chatbot-header h3 {
                    margin: 0;
                    font-size: 16px;
                    font-weight: 600;
                }
                
                .chatbot-header p {
                    margin: 4px 0 0 0;
                    font-size: 12px;
                    opacity: 0.9;
                }
                
                .chatbot-minimize {
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 4px;
                    transition: background 0.2s ease;
                }
                
                .chatbot-minimize:hover {
                    background: rgba(255, 255, 255, 0.1);
                }
                
                .chatbot-minimize svg {
                    width: 16px;
                    height: 16px;
                    color: ${this.config.textColor};
                }
                
                .chatbot-messages {
                    flex: 1;
                    overflow-y: auto;
                    padding: 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                
                .chatbot-message {
                    display: flex;
                    margin-bottom: 8px;
                }
                
                .bot-message {
                    justify-content: flex-start;
                }
                
                .user-message {
                    justify-content: flex-end;
                }
                
                .message-content {
                    max-width: 80%;
                    padding: 12px 16px;
                    border-radius: 18px;
                    font-size: 14px;
                    line-height: 1.4;
                }
                
                .bot-message .message-content {
                    background: #f1f5f9;
                    color: #334155;
                }
                
                .user-message .message-content {
                    background: ${this.config.primaryColor};
                    color: ${this.config.textColor};
                }
                
                .chatbot-typing {
                    padding: 0 16px 16px 16px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .typing-indicator {
                    display: flex;
                    gap: 4px;
                }
                
                .typing-indicator span {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: #94a3b8;
                    animation: typing 1.4s ease-in-out infinite;
                }
                
                .typing-indicator span:nth-child(2) {
                    animation-delay: 0.2s;
                }
                
                .typing-indicator span:nth-child(3) {
                    animation-delay: 0.4s;
                }
                
                @keyframes typing {
                    0%, 60%, 100% {
                        transform: translateY(0);
                    }
                    30% {
                        transform: translateY(-10px);
                    }
                }
                
                .typing-text {
                    font-size: 12px;
                    color: #64748b;
                }
                
                .chatbot-input {
                    padding: 16px;
                    border-top: 1px solid #e2e8f0;
                    display: flex;
                    gap: 12px;
                }
                
                .chatbot-input input {
                    flex: 1;
                    padding: 12px 16px;
                    border: 1px solid #e2e8f0;
                    border-radius: 24px;
                    outline: none;
                    font-size: 14px;
                    transition: border-color 0.2s ease;
                }
                
                .chatbot-input input:focus {
                    border-color: ${this.config.primaryColor};
                }
                
                .chatbot-input button {
                    width: 44px;
                    height: 44px;
                    background: ${this.config.primaryColor};
                    border: none;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: background 0.2s ease;
                }
                
                .chatbot-input button:hover {
                    opacity: 0.9;
                }
                
                .chatbot-input button svg {
                    width: 18px;
                    height: 18px;
                    color: ${this.config.textColor};
                }
                
                @media (max-width: 480px) {
                    .chatbot-window {
                        width: calc(100vw - 40px);
                        height: calc(100vh - 140px);
                    }
                    
                    .chatbot-widget.bottom-right {
                        right: 20px;
                    }
                    
                    .chatbot-widget.bottom-left {
                        left: 20px;
                    }
                }
            `;
            
            const styleSheet = document.createElement('style');
            styleSheet.textContent = styles;
            document.head.appendChild(styleSheet);
        }
        
        toggle() {
            const window = this.widget.querySelector('.chatbot-window');
            const icon = this.widget.querySelector('.chatbot-icon');
            const closeIcon = this.widget.querySelector('.chatbot-close');
            
            if (this.isOpen) {
                window.style.display = 'none';
                icon.style.display = 'block';
                closeIcon.style.display = 'none';
                this.isOpen = false;
            } else {
                window.style.display = 'flex';
                icon.style.display = 'none';
                closeIcon.style.display = 'block';
                this.isOpen = true;
                
                // Focus input
                setTimeout(() => {
                    const input = document.getElementById('chatbot-input-field');
                    if (input) input.focus();
                }, 100);
            }
        }
        
        handleKeyPress(event) {
            if (event.key === 'Enter') {
                this.sendMessage();
            }
        }
        
        async sendMessage() {
            const input = document.getElementById('chatbot-input-field');
            const message = input.value.trim();
            
            if (!message) return;
            
            if (!this.sessionId) {
                console.error('No valid session. Attempting to create session...');
                await this.createSession();
                if (!this.sessionId) {
                    this.addMessage('Sorry, I cannot connect to the chat service right now. Please try again.', 'bot');
                    return;
                }
            }
            
            // Add user message
            this.addMessage(message, 'user');
            input.value = '';
            
            // Show typing indicator
            this.showTyping();
            
            console.log('Sending message:', message);
            console.log('Using session ID:', this.sessionId);
            
            try {
                const response = await fetch(`${this.config.apiUrl}/chat`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': this.config.apiKey,
                        'X-Session-ID': this.sessionId
                    },
                    body: JSON.stringify({
                        message: message,
                        session_id: this.sessionId
                    })
                });
                
                console.log('Chat response status:', response.status);
                
                if (response.ok) {
                    const data = await response.json();
                    this.hideTyping();
                    this.addMessage(data.response, 'bot');
                    console.log('Received response:', data.response);
                } else {
                    const errorData = await response.text();
                    console.error('Chat API error:', response.status, errorData);
                    this.hideTyping();
                    this.addMessage('Sorry, I encountered an error. Please try again.', 'bot');
                }
            } catch (error) {
                console.error('Error sending message:', error);
                this.hideTyping();
                this.addMessage('Sorry, I\'m having trouble connecting. Please try again.', 'bot');
            }
        }
        
        addMessage(content, sender) {
            const messagesContainer = document.getElementById('chatbot-messages');
            const messageDiv = document.createElement('div');
            messageDiv.className = `chatbot-message ${sender}-message`;
            messageDiv.innerHTML = `<div class="message-content">${content}</div>`;
            
            messagesContainer.appendChild(messageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
        
        showTyping() {
            const typingIndicator = document.getElementById('chatbot-typing');
            typingIndicator.style.display = 'flex';
            
            const messagesContainer = document.getElementById('chatbot-messages');
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
        
        hideTyping() {
            const typingIndicator = document.getElementById('chatbot-typing');
            typingIndicator.style.display = 'none';
        }
    }
    
    // Make widget globally available
    window.ChatbotWidget = new ChatbotWidget();
    
})();