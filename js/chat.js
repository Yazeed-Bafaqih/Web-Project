let socket;
let currentTeamId;
let currentUser;

document.addEventListener('DOMContentLoaded', async () => {
    currentUser = JSON.parse(localStorage.getItem('techpath_user'));
    if (!currentUser) {
        window.location.href = '/html/teams.html';
        return;
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    currentTeamId = urlParams.get('id');
    
    if (!currentTeamId) {
        window.location.href = '/html/teams.html';
        return;
    }

    await loadTeamDetails();
    initChat();
});

async function loadTeamDetails() {
    try {
        const res = await fetch(`/api/teams/${currentTeamId}`);
        const data = await res.json();
        
        if (data.success) {
            const team = data.team;
            document.getElementById('team-name').textContent = team.name;
            document.getElementById('team-members-count').textContent = team.members.length;
            document.getElementById('team-streak').textContent = team.streak;
            
            // Populate members and calculate overall progress
            let totalProgress = 0;
            const membersList = document.getElementById('members-list');
            membersList.innerHTML = team.members.map(m => {
                const memberProgress = m.progress || Math.floor(Math.random() * 60) + 40;
                totalProgress += memberProgress;
                return `
                <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 12px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--gradient-primary); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
                            ${m.username.charAt(0).toUpperCase()}
                        </div>
                        <div style="flex-grow: 1; display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-weight: 500;">${m.username} ${m.userEmail === currentUser.userEmail ? '<span style="color: var(--dark-muted); font-size: 0.8rem;">(You)</span>' : ''} ${m.role === 'admin' ? '<span class="badge badge-primary" style="font-size: 0.6rem; padding: 2px 6px;">Admin</span>' : ''}</span>
                            <span style="font-size: 0.8rem; font-weight: bold; color: var(--primary);">${memberProgress}%</span>
                        </div>
                    </div>
                    <div class="team-progress-bg" style="height: 10px; margin-top: 4px;">
                        <div class="team-progress-fill" style="width: ${memberProgress}%; border-radius: var(--radius-full);"></div>
                    </div>
                </div>
            `}).join('');
            
            // Set Overall Progress
            const overallProgress = team.members.length > 0 ? Math.floor(totalProgress / team.members.length) : 0;
            document.getElementById('overall-progress-text').textContent = overallProgress + '%';
            document.getElementById('overall-progress-fill').style.width = overallProgress + '%';
            
            // Random Motivational Quote
            const quotes = [
                '"Alone we can do so little; together we can do so much." - Helen Keller',
                '"Success is the sum of small efforts, repeated day in and day out."',
                '"Teamwork makes the dream work!"',
                '"Coming together is a beginning, staying together is progress, and working together is success." - Henry Ford',
                '"Individually, we are one drop. Together, we are an ocean." - Ryunosuke Satoro'
            ];
            document.getElementById('motivational-quote').textContent = quotes[Math.floor(Math.random() * quotes.length)];
            
        } else {
            alert('Team not found');
            window.location.href = '/html/teams.html';
        }
    } catch (error) {
        console.error(error);
    }
}

function initChat() {
    // Make sure we have socket.io loaded via script tag in HTML
    if (typeof io === 'undefined') {
        console.error('Socket.io client library not loaded');
        return;
    }
    
    socket = io();
    
    // Join room
    socket.emit('join_team', currentTeamId, currentUser);
    
    // Load history
    fetch(`/api/chat/${currentTeamId}?limit=50`)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                const chatBox = document.getElementById('chat-messages');
                chatBox.innerHTML = ''; // clear loading state
                data.messages.forEach(msg => appendMessage(msg, false));
                scrollToBottom();
            }
        });
        
    // Listen for incoming messages
    socket.on('receive_message', (msg) => {
        appendMessage(msg, true);
        scrollToBottom();
    });
    
    // Setup input and send button
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    
    const sendMessage = () => {
        const text = messageInput.value.trim();
        if (!text) return;
        
        const msgData = {
            teamId: currentTeamId,
            senderEmail: currentUser.userEmail,
            senderName: currentUser.username,
            content: text
        };
        
        socket.emit('send_message', msgData);
        messageInput.value = '';
    };
    
    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
}

function appendMessage(msg, isNew = false) {
    const chatBox = document.getElementById('chat-messages');
    const isMe = msg.senderEmail === currentUser.userEmail;
    
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${isNew ? 'message-new' : ''}`;
    
    if (msg.type === 'system') {
        msgDiv.innerHTML = `
            <div style="text-align: center; color: var(--dark-muted); font-size: 0.8rem; margin: 8px 0;">
                <em>${msg.content}</em>
            </div>
        `;
    } else {
        msgDiv.style.display = 'flex';
        msgDiv.style.flexDirection = 'column';
        msgDiv.style.alignItems = isMe ? 'flex-end' : 'flex-start';
        msgDiv.style.marginBottom = '12px';
        
        msgDiv.innerHTML = `
            <span style="font-size: 0.75rem; color: var(--dark-muted); margin-bottom: 2px; margin-left: 4px; margin-right: 4px;">
                ${isMe ? 'You' : msg.senderName} • ${new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </span>
            <div style="
                background: ${isMe ? 'var(--gradient-primary)' : 'rgba(30, 41, 59, 0.8)'};
                color: ${isMe ? 'white' : 'var(--dark-text)'};
                padding: 10px 14px;
                border-radius: ${isMe ? '16px 16px 0 16px' : '16px 16px 16px 0'};
                max-width: 80%;
                word-wrap: break-word;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                border: 1px solid ${isMe ? 'transparent' : 'rgba(255,255,255,0.05)'};
            ">
                ${msg.content}
            </div>
        `;
    }
    
    chatBox.appendChild(msgDiv);
}

function scrollToBottom() {
    const chatBox = document.getElementById('chat-messages');
    chatBox.scrollTop = chatBox.scrollHeight;
}
