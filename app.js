class Chat {
    constructor() {
      this.messages = [];
      this.currentChatId = Date.now();
      this.chatHistory = [];
      this.debounceTimeout = null; // Untuk debouncing
      this.init();
    }
  
    init() {
      this.messageForm = document.getElementById('messageForm');
      this.userInput = document.getElementById('userInput');
      this.chatMessages = document.getElementById('chatMessages');
      this.chatHistoryContainer = document.getElementById('chatHistory');
      this.newChatBtn = document.getElementById('newChatBtn');
  
      this.messageForm.addEventListener('submit', (e) => this.handleSubmit(e));
      this.newChatBtn.addEventListener('click', () => this.startNewChat());
      this.userInput.addEventListener('input', () => {
        clearTimeout(this.debounceTimeout); // Debouncing
        this.debounceTimeout = setTimeout(() => this.adjustTextareaHeight(), 100);
      });
  
      // Load chat history from localStorage
      this.loadChatHistory();
      this.renderChatHistory();
    }
  
    adjustTextareaHeight() {
      const textarea = this.userInput;
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  
    startNewChat() {
      this.currentChatId = Date.now();
      this.messages = [];
      this.chatMessages.innerHTML = '';
      this.saveChatToHistory();
      this.renderChatHistory();
      this.userInput.focus(); // Auto-focus ke input
    }
  
    async handleSubmit(e) {
      e.preventDefault();
      const message = this.userInput.value.trim();
      if (!message) return;
  
      // Add user message
      this.addMessage('user', message);
      this.userInput.value = '';
      this.userInput.style.height = 'auto';
      this.userInput.focus(); // Auto-focus setelah mengirim pesan
  
      // Simulate AI response
      await this.getAIResponse(message);
  
      // Save chat to history
      this.saveChatToHistory();
      this.renderChatHistory();
    }
  
    addMessage(role, content) {
      const message = { role, content, timestamp: Date.now() };
      this.messages.push(message);
      this.renderMessage(message);
      this.scrollToBottom(); // Scroll halus ke bawah
    }
  
    async getAIResponse(userMessage) {
        // Show typing indicator
        const typingMessage = { role: 'ai', content: 'Typing...', isTyping: true };
        this.renderMessage(typingMessage);
      
        try {
          const response = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer sk-079cabacd5d84d5d80fdc1f919fd2661`, // Ganti dengan API key DeepSeek Anda
            },
            body: JSON.stringify({
              model: 'deepseek-chat', // Model yang digunakan
              messages: [
                { role: 'system', content: 'You are a helpful assistant.' }, // Pesan sistem
                { role: 'user', content: userMessage }, // Pesan dari pengguna
              ],
              stream: false, // Non-streaming response
            }),
          });
      
          if (!response.ok) {
            const errorData = await response.json(); // Ambil detail error dari respons
            console.error('Error Details:', errorData);
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
      
          const data = await response.json();
          console.log('API Response:', data); // Log respons dari API
      
          // Remove typing indicator and add actual response
          this.chatMessages.lastElementChild.remove();
          this.addMessage('ai', data.choices[0].message.content); // Ambil konten respons dari API
        } catch (error) {
          console.error('Error:', error);
          // Remove typing indicator and add error message
          this.chatMessages.lastElementChild.remove();
          this.addMessage('ai', `Sorry, I encountered an error: ${error.message}. Please try again.`);
        }
      }
  
    renderMessage(message) {
      const messageDiv = document.createElement('div');
      messageDiv.className = `message ${message.role}`;
  
      const avatar = document.createElement('div');
      avatar.className = 'avatar';
      avatar.innerHTML = message.role === 'user' ? this.getUserAvatar() : this.getAIAvatar();
  
      const content = document.createElement('div');
      content.className = 'message-content';
  
      if (message.isTyping) {
        content.innerHTML = this.getTypingIndicator();
      } else {
        content.innerHTML = DOMPurify.sanitize(marked.parse(message.content)); // Sanitasi input
      }
  
      messageDiv.appendChild(avatar);
      messageDiv.appendChild(content);
      this.chatMessages.appendChild(messageDiv);
      this.scrollToBottom(); // Scroll halus ke bawah
    }
  
    scrollToBottom() {
      this.chatMessages.scrollTo({
        top: this.chatMessages.scrollHeight,
        behavior: 'smooth',
      });
    }
  
    getUserAvatar() {
      return `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="12" fill="#555"/>
          <path d="M12 11C13.6569 11 15 9.65685 15 8C15 6.34315 13.6569 5 12 5C10.3431 5 9 6.34315 9 8C9 9.65685 10.3431 11 12 11Z" fill="white"/>
          <path d="M18 18C18 14.6863 15.3137 12 12 12C8.68629 12 6 14.6863 6 18" stroke="white" stroke-width="2"/>
        </svg>
      `;
    }
  
    getAIAvatar() {
      return `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" rx="4" fill="#10A37F"/>
          <path d="M15 17H9C6.79086 17 5 15.2091 5 13V11C5 8.79086 6.79086 7 9 7H15C17.2091 7 19 8.79086 19 11V13C19 15.2091 17.2091 17 15 17Z" stroke="white" stroke-width="2"/>
          <circle cx="12" cy="12" r="2" fill="white"/>
        </svg>
      `;
    }
  
    getTypingIndicator() {
      return `
        <div class="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      `;
    }
  
    saveChatToHistory() {
      if (this.messages.length === 0) return;
  
      const existingChatIndex = this.chatHistory.findIndex((chat) => chat.id === this.currentChatId);
      const chatTitle = this.messages[0].content.slice(0, 30) + '...';
  
      const chatData = {
        id: this.currentChatId,
        title: chatTitle,
        messages: this.messages,
        timestamp: Date.now(),
      };
  
      if (existingChatIndex !== -1) {
        this.chatHistory[existingChatIndex] = chatData;
      } else {
        this.chatHistory.unshift(chatData);
      }
  
      localStorage.setItem('chatHistory', JSON.stringify(this.chatHistory));
    }
  
    loadChatHistory() {
      const savedHistory = localStorage.getItem('chatHistory');
      this.chatHistory = savedHistory ? JSON.parse(savedHistory) : [];
    }
  
    renderChatHistory() {
      this.chatHistoryContainer.innerHTML = '';
  
      this.chatHistory.forEach((chat) => {
        const chatItem = document.createElement('div');
        chatItem.className = 'chat-history-item';
        chatItem.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 2H2V14H14V2Z" stroke="currentColor" stroke-width="2"/>
            <path d="M4 4H12M4 8H12M4 12H8" stroke="currentColor" stroke-width="2"/>
          </svg>
          ${chat.title}
        `;
  
        chatItem.addEventListener('click', () => this.loadChat(chat));
        this.chatHistoryContainer.appendChild(chatItem);
      });
    }
  
    loadChat(chat) {
      this.currentChatId = chat.id;
      this.messages = chat.messages;
      this.chatMessages.innerHTML = '';
      this.messages.forEach((message) => this.renderMessage(message));
      this.scrollToBottom(); // Scroll halus ke bawah
    }
  }
  
  // Initialize the chat application
  new Chat();