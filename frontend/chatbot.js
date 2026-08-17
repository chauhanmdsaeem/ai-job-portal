// Chatbot logic for Fieldnote Careers
document.addEventListener('DOMContentLoaded', () => {
    // Inject Chatbot UI
    const chatbotHTML = `
        <div id="chatbot-widget" class="chatbot-widget">
            <div id="chatbot-window" class="chatbot-window" style="display: none;">
                <div class="chatbot-header">
                    <span>Fieldnote AI</span>
                    <button id="chatbot-close">&times;</button>
                </div>
                <div id="chatbot-messages" class="chatbot-messages">
                    <div class="chat-message ai">Hi! I'm Fieldnote AI. How can I help you navigate the platform today?</div>
                </div>
                <div id="chatbot-chips" class="chatbot-chips"></div>
                <div class="chatbot-input-area">
                    <input type="text" id="chatbot-input" placeholder="Ask me anything..." />
                    <button id="chatbot-send">➤</button>
                </div>
            </div>
            <button id="chatbot-toggle" class="chatbot-toggle">✨ AI</button>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', chatbotHTML);
    
    const widget = document.getElementById('chatbot-widget');
    const chatWindow = document.getElementById('chatbot-window');
    const toggleBtn = document.getElementById('chatbot-toggle');
    const closeBtn = document.getElementById('chatbot-close');
    const sendBtn = document.getElementById('chatbot-send');
    const inputEl = document.getElementById('chatbot-input');
    const messagesEl = document.getElementById('chatbot-messages');
    const chipsContainer = document.getElementById('chatbot-chips');
    
    let chatHistory = [];
    let userRole = 'guest';

    // Fetch user role dynamically
    fetch('/api/me').then(r => r.json()).then(data => {
        if (data.user && data.user.role) {
            userRole = data.user.role;
        }
        
        if (userRole === 'candidate') {
            inputEl.placeholder = "Ask about jobs, salaries, or resume tips...";
            chipsContainer.innerHTML = `
                <button class="chat-chip">Find remote React jobs</button>
                <button class="chat-chip">Review my resume</button>
                <button class="chat-chip">Interview tips</button>
            `;
        } else if (userRole === 'recruiter') {
            inputEl.placeholder = "Ask about pipelines, sourcing, or job drafts...";
            chipsContainer.innerHTML = `
                <button class="chat-chip">Draft a Job Description</button>
                <button class="chat-chip">Screen recent applicants</button>
                <button class="chat-chip">Summarize top candidates</button>
            `;
        } else {
            inputEl.placeholder = "Ask me anything...";
            chipsContainer.innerHTML = `
                <button class="chat-chip">What is Fieldnote Careers?</button>
                <button class="chat-chip">How do I create an account?</button>
            `;
        }
        
        document.querySelectorAll('.chat-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                inputEl.value = chip.textContent;
                sendMessage();
            });
        });
    }).catch(err => console.error(err));
    
    // Toggle window
    toggleBtn.addEventListener('click', () => {
        chatWindow.style.display = chatWindow.style.display === 'none' ? 'flex' : 'none';
        if (chatWindow.style.display === 'flex') {
            inputEl.focus();
        }
    });
    
    closeBtn.addEventListener('click', () => {
        chatWindow.style.display = 'none';
    });
    
    function appendMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-message ${sender}`;
        msgDiv.textContent = text;
        messagesEl.appendChild(msgDiv);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }
    
    async function sendMessage() {
        const text = inputEl.value.trim();
        if (!text) return;
        
        appendMessage(text, 'user');
        inputEl.value = '';
        inputEl.disabled = true;
        sendBtn.disabled = true;
        
        // Form history string
        const historyText = chatHistory.map(m => `${m.role}: ${m.text}`).join('\n');
        
        // Add to history
        chatHistory.push({ role: 'user', text });
        
        // Typing indicator
        const typingDiv = document.createElement('div');
        typingDiv.className = 'chat-message ai typing';
        typingDiv.textContent = '...';
        messagesEl.appendChild(typingDiv);
        messagesEl.scrollTop = messagesEl.scrollHeight;
        
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, history: historyText })
            });
            
            messagesEl.removeChild(typingDiv);
            
            if (res.ok) {
                const data = await res.json();
                appendMessage(data.reply, 'ai');
                chatHistory.push({ role: 'ai', text: data.reply });
            } else {
                appendMessage("Sorry, I encountered an error.", 'ai');
            }
        } catch (err) {
            messagesEl.removeChild(typingDiv);
            appendMessage("Network error. Please try again.", 'ai');
        }
        
        inputEl.disabled = false;
        sendBtn.disabled = false;
        inputEl.focus();
    }
    
    sendBtn.addEventListener('click', sendMessage);
    inputEl.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
});
