// Check for basic user session
const checkAuth = () => {
    let userDetails = JSON.parse(localStorage.getItem('techpath_user'));
    if (!userDetails) {
        const username = prompt("Welcome to Teams! What is your name?");
        if (!username) {
            window.location.href = '/'; // Redirect if cancelled
            return null;
        }
        userDetails = {
            username: username,
            userEmail: `${username.toLowerCase().replace(/\s+/g, '')}@example.com`
        };
        localStorage.setItem('techpath_user', JSON.stringify(userDetails));
    }
    return userDetails;
};

// Modal and UI Utils
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function filterPublicTeams() {
    const query = document.getElementById('searchPublicTeams').value.toLowerCase();
    const cards = document.querySelectorAll('#public-teams-container .team-card');
    let visibleCount = 0;
    cards.forEach(card => {
        const title = card.querySelector('.team-card-title').textContent.toLowerCase();
        const desc = card.querySelector('.team-roadmap-name').textContent.toLowerCase();
        if (title.includes(query) || desc.includes(query)) {
            card.style.display = 'flex';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });
    
    const emptyState = document.getElementById('empty-public-teams');
    if (visibleCount === 0 && cards.length > 0) {
        emptyState.classList.remove('hidden');
    } else if (cards.length > 0) {
        emptyState.classList.add('hidden');
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const user = checkAuth();
    if (!user) return;
    
    document.getElementById('user-welcome-name').textContent = user.username;
    
    // Load Teams
    await loadMyTeams(user.userEmail);
    await loadPublicTeams();
    
    // Setup Create Team Form
    document.getElementById('createTeamForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btn = e.target.querySelector('button[type="submit"]');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="loader-primary" style="width: 20px; height: 20px; border-width: 2px;"></span> Creating...';
        btn.disabled = true;
        
        const name = document.getElementById('teamName').value;
        const privacy = document.getElementById('teamPrivacy').value;
        const description = document.getElementById('teamDesc').value;
        
        try {
            const res = await fetch('/api/teams', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, privacy, description, userEmail: user.userEmail, username: user.username })
            });
            const data = await res.json();
            if (data.success) {
                alert('Team Created Successfully!');
                window.location.href = `/html/team.html?id=${data.team._id}`;
            } else {
                alert('Error creating team: ' + JSON.stringify(data.errors || data.error));
            }
        } catch (error) {
            console.error(error);
            alert('Failed to connect to server');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });
});

async function loadMyTeams(email) {
    const container = document.getElementById('my-teams-container');
    const loadingState = document.getElementById('loading-my-teams');
    const emptyState = document.getElementById('empty-my-teams');
    
    loadingState.classList.remove('hidden');
    container.innerHTML = '';
    emptyState.classList.add('hidden');
    
    try {
        const res = await fetch(`/api/teams/my-teams?email=${encodeURIComponent(email)}`);
        const data = await res.json();
        
        loadingState.classList.add('hidden');
        
        if (data.success && data.teams.length > 0) {
            // Update Stats
            document.getElementById('stat-teams-joined').textContent = data.teams.length;
            const highestStreak = Math.max(...data.teams.map(t => t.streak || 0), 0);
            document.getElementById('stat-streak').textContent = `${highestStreak} 🔥`;
            document.getElementById('stat-roadmaps').textContent = `${data.teams.length} 🗺️`;

            container.innerHTML = data.teams.map((team, index) => {
                const progress = team.progress || Math.floor(Math.random() * 100); // Mock progress if not available
                return `
                <div class="card-glass team-card stagger-item visible" style="--i: ${index};">
                    <div>
                        <div class="team-card-header">
                            <div>
                                <h3 class="team-card-title">${team.name}</h3>
                                <div class="team-roadmap-name">${team.description || 'General Learning'}</div>
                            </div>
                            <span class="badge badge-primary">${team.privacy}</span>
                        </div>
                        
                        <div class="team-stats">
                            <div class="team-stat-item">👥 ${team.members.length} members</div>
                            <div class="team-stat-item">🔥 <span style="color: var(--warning);">${team.streak || 0}d streak</span></div>
                        </div>
                        
                        <div class="team-progress-container">
                            <div class="team-progress-header">
                                <span>Team Progress</span>
                                <span style="color: var(--primary); font-weight: 600;">${progress}%</span>
                            </div>
                            <div class="team-progress-bg">
                                <div class="team-progress-fill" style="width: ${progress}%;"></div>
                            </div>
                        </div>
                    </div>
                    
                    <a href="/html/team.html?id=${team._id}" class="btn-primary" style="margin-top: 1.5rem; text-align: center;">View Team &rarr;</a>
                </div>
            `}).join('');
        } else {
            emptyState.classList.remove('hidden');
        }
    } catch (error) {
        loadingState.classList.add('hidden');
        container.innerHTML = '<p class="text-error" style="color: var(--error);">Failed to load teams.</p>';
    }
}

async function loadPublicTeams() {
    const container = document.getElementById('public-teams-container');
    const loadingState = document.getElementById('loading-public-teams');
    const emptyState = document.getElementById('empty-public-teams');
    
    loadingState.classList.remove('hidden');
    container.innerHTML = '';
    emptyState.classList.add('hidden');
    
    try {
        const res = await fetch(`/api/teams`);
        const data = await res.json();
        
        loadingState.classList.add('hidden');
        
        if (data.success && data.teams.length > 0) {
            container.innerHTML = data.teams.map((team, index) => {
                const progress = team.progress || Math.floor(Math.random() * 100);
                return `
                <div class="card-glass team-card stagger-item visible" style="--i: ${index};">
                    <div>
                        <div class="team-card-header">
                            <div>
                                <h3 class="team-card-title">${team.name}</h3>
                                <div class="team-roadmap-name">${team.description || 'General Learning'}</div>
                            </div>
                            <span class="badge badge-primary">${team.privacy}</span>
                        </div>
                        
                        <div class="team-stats">
                            <div class="team-stat-item">👥 ${team.memberCount || 1} members</div>
                            <div class="team-stat-item">🔥 <span style="color: var(--warning);">${team.streak || 0}d streak</span></div>
                        </div>
                        
                        <div class="team-progress-container">
                            <div class="team-progress-header">
                                <span>Team Progress</span>
                                <span style="color: var(--primary); font-weight: 600;">${progress}%</span>
                            </div>
                            <div class="team-progress-bg">
                                <div class="team-progress-fill" style="width: ${progress}%;"></div>
                            </div>
                        </div>
                    </div>
                    
                    <button class="btn-secondary" style="margin-top: 1.5rem; width: 100%; border-color: var(--primary); color: var(--primary);" onclick="joinTeam('${team._id}', '${team.privacy}')">Join Team &rarr;</button>
                </div>
            `}).join('');
        } else {
            emptyState.classList.remove('hidden');
        }
    } catch (error) {
        loadingState.classList.add('hidden');
        container.innerHTML = '<p class="text-error" style="color: var(--error);">Failed to load teams.</p>';
    }
}

async function joinTeam(teamId, privacy) {
    const user = JSON.parse(localStorage.getItem('techpath_user'));
    if (!user) return;
    
    let inviteCode = '';
    if (privacy === 'private') {
        inviteCode = prompt('Enter the invite code:');
        if (!inviteCode) return;
    }
    
    try {
        const res = await fetch(`/api/teams/${teamId}/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                userEmail: user.userEmail, 
                username: user.username,
                inviteCode
            })
        });
        const data = await res.json();
        
        if (data.success) {
            window.location.href = `/html/team.html?id=${teamId}`;
        } else {
            alert(data.error || 'Failed to join team');
        }
    } catch (error) {
        alert('Server connection error');
    }
}
