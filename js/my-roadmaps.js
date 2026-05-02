const API_BASE_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
  const emailInput = document.getElementById('filterEmail');
  const storedEmail = localStorage.getItem('userEmail');
  
  if(emailInput && storedEmail) {
    emailInput.value = storedEmail;
  }

  loadUserRoadmaps(storedEmail);

  document.getElementById('loadRoadmapsBtn')?.addEventListener('click', () => {
    const email = document.getElementById('filterEmail').value.trim();
    if(email) {
      localStorage.setItem('userEmail', email);
    }
    loadUserRoadmaps(email);
  });
});

async function loadUserRoadmaps(email) {
  const loading = document.getElementById('loading-roadmaps');
  const grid = document.getElementById('roadmaps-grid');
  const emptyState = document.getElementById('empty-state');
  
  loading.style.display = 'block';
  grid.style.display = 'none';
  emptyState.style.display = 'none';
  grid.innerHTML = '';

  try {
    let url = `${API_BASE_URL}/roadmap/my-roadmaps`;
    if(email) {
      url += `?email=${encodeURIComponent(email)}`;
    }
    
    const response = await fetch(url);
    const result = await response.json();
    
    if (!result.success) throw new Error('Failed to fetch roadmaps');

    const roadmaps = result.roadmaps;

    if (roadmaps.length === 0) {
      emptyState.style.display = 'block';
    } else {
      grid.style.display = 'grid';
      roadmaps.forEach(roadmap => {
        grid.appendChild(createRoadmapCard(roadmap));
      });
    }

  } catch (error) {
    console.error('Error fetching roadmaps:', error);
    emptyState.style.display = 'block';
    emptyState.innerHTML = `<p style="color:var(--clr-danger)">Error loading roadmaps. Is the backend running?</p>`;
  } finally {
    loading.style.display = 'none';
  }
}

function createRoadmapCard(roadmap) {
  const card = document.createElement('div');
  card.className = 'dashboard-card card-glass stagger-item';
  card.style.setProperty('--i', Math.random());
  
  const dateStr = new Date(roadmap.createdAt).toLocaleDateString();
  const progress = roadmap.progress || 0;
  
  card.innerHTML = `
    <div class="card-header" style="display: flex; justify-content: space-between; margin-bottom: 12px;">
      <span class="badge badge-primary">${roadmap.level}</span>
      <span class="date" style="color: var(--dark-muted); font-size: 0.85rem;">${dateStr}</span>
    </div>
    <h3 class="card-topic" style="margin-bottom: 8px;">${roadmap.topic}</h3>
    <div class="card-meta" style="display: flex; gap: 10px; color: var(--dark-muted); font-size: 0.9rem; margin-bottom: 16px;">
      <span>⏱️ ${roadmap.hoursPerWeek} hrs/week</span>
      <span>📅 ${roadmap.roadmapData?.total_duration_weeks || '-'} weeks</span>
    </div>
    <div class="card-progress" style="margin-bottom: 16px;">
      <div class="progress-bar-bg" style="background: rgba(255,255,255,0.1); height: 8px; border-radius: 4px; overflow: hidden; margin-bottom: 6px;">
        <div class="progress-bar-fill" style="background: var(--primary); height: 100%; width: ${progress}%; transition: width 0.5s ease;"></div>
      </div>
      <span class="progress-text" style="font-size: 0.85rem; color: var(--primary-soft);">${progress}% Complete</span>
    </div>
    <div class="card-actions" style="display: flex; gap: 10px;">
      <a href="roadmap-view.html?id=${roadmap._id}" class="btn-primary" style="flex: 1; padding: 8px 16px;">Continue</a>
      <button class="btn-secondary delete-btn" onclick="deleteRoadmap('${roadmap._id}')" style="padding: 8px 16px; border-color: var(--error); color: var(--error);">Delete</button>
    </div>
  `;
  return card;
}

window.deleteRoadmap = async function(id) {
  if(!confirm('Are you sure you want to delete this roadmap?')) return;
  
  try {
    const response = await fetch(`${API_BASE_URL}/roadmap/${id}`, {
      method: 'DELETE'
    });
    const result = await response.json();
    
    if(result.success) {
      // Reload
      const email = document.getElementById('filterEmail').value.trim();
      loadUserRoadmaps(email);
    } else {
      alert('Failed to delete');
    }
  } catch (err) {
    console.error(err);
    alert('Failed to delete roadmap');
  }
}
