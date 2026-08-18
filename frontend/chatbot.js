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
            <button class="back-to-top-button" id="back-to-top-btn" style="display: none; margin-bottom: 16px;">
              <svg class="svgIcon" viewBox="0 0 384 512">
                <path d="M214.6 41.4c-12.5-12.5-32.8-12.5-45.3 0l-160 160c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 141.2V448c0 17.7 14.3 32 32 32s32-14.3 32-32V141.2L329.4 246.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-160-160z"></path>
              </svg>
            </button>
            <button id="chatbot-toggle" class="btn-magic-ai chatbot-toggle-magic">
                <div class="dots_border"></div>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="sparkle">
                    <path class="path" stroke-linejoin="round" stroke-linecap="round" stroke="black" fill="black" d="M14.187 8.096L15 5.25L15.813 8.096C16.0231 8.83114 16.4171 9.50062 16.9577 10.0413C17.4984 10.5819 18.1679 10.9759 18.903 11.186L21.75 12L18.904 12.813C18.1689 13.0231 17.4994 13.4171 16.9587 13.9577C16.4181 14.4984 16.0241 15.1679 15.814 15.903L15 18.75L14.187 15.904C13.9769 15.1689 13.5829 14.4994 13.0423 13.9587C12.5016 13.4181 11.8321 13.0241 11.097 12.814L8.25 12L11.096 11.187C11.8311 10.9769 12.5006 10.5829 13.0413 10.0423C13.5819 9.50162 13.9759 8.83214 14.186 8.097L14.187 8.096Z"></path>
                    <path class="path" stroke-linejoin="round" stroke-linecap="round" stroke="black" fill="black" d="M6 14.25L5.741 15.285C5.59267 15.8785 5.28579 16.4206 4.85319 16.8532C4.42059 17.2858 3.87853 17.5927 3.285 17.741L2.25 18L3.285 18.259C3.87853 18.4073 4.42059 18.7142 4.85319 19.1468C5.28579 19.5794 5.59267 20.1215 5.741 20.715L6 21.75L6.259 20.715C6.40725 20.1216 6.71398 19.5796 7.14639 19.147C7.5788 18.7144 8.12065 18.4075 8.714 18.259L9.75 18L8.714 17.741C8.12065 17.5925 7.5788 17.2856 7.14639 16.853C6.71398 16.4204 6.40725 15.8784 6.259 15.285L6 14.25Z"></path>
                    <path class="path" stroke-linejoin="round" stroke-linecap="round" stroke="black" fill="black" d="M6.5 4L6.303 4.5915C6.24777 4.75718 6.15472 4.90774 6.03123 5.03123C5.90774 5.15472 5.75718 5.24777 5.5915 5.303L5 5.5L5.5915 5.697C5.75718 5.75223 5.90774 5.84528 6.03123 5.96877C6.15472 6.09226 6.24777 6.24282 6.303 6.4085L6.5 7L6.697 6.4085C6.75223 6.24282 6.84528 6.09226 6.96877 5.96877C7.09226 5.84528 7.24282 5.75223 7.4085 5.697L8 5.5L7.4085 5.303C7.24282 5.24777 7.09226 5.15472 6.96877 5.03123C6.84528 4.90774 6.75223 4.75718 6.697 4.5915L6.5 4Z"></path>
                </svg>
                <span class="text_button" style="padding-bottom: 2px;">AI</span>
            </button>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', chatbotHTML);
    
    // Back to top logic
    const backToTopBtn = document.getElementById("back-to-top-btn");
    if (backToTopBtn) {
        window.addEventListener("scroll", () => {
            if (window.scrollY > 300) {
                backToTopBtn.style.display = "flex";
            } else {
                backToTopBtn.style.display = "none";
            }
        });
        backToTopBtn.addEventListener("click", () => {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

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
