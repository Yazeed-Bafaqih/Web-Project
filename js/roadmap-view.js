const API_BASE_URL = 'http://localhost:3000/api';
document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const roadmapId = urlParams.get('id');
  if (!roadmapId) {
    if (window.navigateTo) {
      window.navigateTo('roadmap-generator.html');
    } else {
      window.location.href = 'roadmap-generator.html';
    }
    return;
  }
  document.getElementById('loading-overlay').style.display = 'flex';
  await loadRoadmap(roadmapId);
  setupEventListeners();
});
async function loadRoadmap(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/roadmap/${id}`);
    const result = await response.json();
    if (!result.success) {
      throw new Error('Failed to load roadmap');
    }
    const roadmap = result.roadmap;
    renderRoadmap(roadmap);
    document.getElementById('loading-overlay').style.display = 'none';
    document.getElementById('roadmap-content').style.display = 'block';
    updateProgressUI(roadmap.progress || 0);
  } catch (error) {
    console.error('Error:', error);
    showError('Failed to load roadmap');
    document.getElementById('loading-overlay').innerHTML = `<p style="color:var(--clr-danger)">Failed to load roadmap. <a href="roadmap-generator.html">Go back</a></p>`;
  }
}
function renderRoadmap(roadmap) {
  const data = roadmap.roadmapData;
  document.getElementById('roadmap-topic').textContent = data.topic;
  document.getElementById('total-duration').textContent = `${data.total_duration_weeks || '-'} weeks`;
  document.getElementById('difficulty-level').textContent = `Difficulty: ${data.difficulty_rating || '-'}/10`;
  document.getElementById('total-phases').textContent = data.phases ? data.phases.length : 0;
  document.getElementById('total-hours').textContent = calculateTotalHours(data);
  document.getElementById('weekly-hours').textContent = `${roadmap.hoursPerWeek} hrs/week`;
  const phasesContainer = document.getElementById('phases-container');
  phasesContainer.innerHTML = '';
  if (data.phases && data.phases.length > 0) {
    data.phases.forEach((phase, index) => {
      const phaseCard = createPhaseCard(phase, index);
      phasesContainer.appendChild(phaseCard);
    });
  } else {
    phasesContainer.innerHTML = '<p>No phases found in this roadmap.</p>';
  }
  if(data.weekly_schedule) renderWeeklySchedule(data.weekly_schedule);
  if(data.prerequisites) renderPrerequisites(data.prerequisites);
  if(data.next_steps) renderNextSteps(data.next_steps);
}
function createPhaseCard(phase, index) {
  const card = document.createElement('div');
  card.className = 'phase-card';
  card.innerHTML = `
    <div class="phase-header" onclick="togglePhase(${index})">
      <div class="phase-number">Phase ${phase.phase_number || index + 1}</div>
      <div class="phase-title-group">
        <h3 class="phase-name">${phase.phase_name || 'Phase ' + (index+1)}</h3>
        <div class="phase-duration">${phase.duration_weeks || '-'} weeks</div>
      </div>
      <button class="toggle-btn" aria-label="Toggle Phase">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
      </button>
    </div>
    <div class="phase-content collapsed" id="phase-${index}">
      <p class="phase-description">${phase.description || ''}</p>
      ${phase.topics && phase.topics.length > 0 ? `
      <div class="phase-section">
        <h4>Key Topics</h4>
        <div class="topics-tags">
          ${phase.topics.map(topic => `<span class="topic-tag">${topic}</span>`).join('')}
        </div>
      </div>` : ''}
      ${phase.resources && phase.resources.length > 0 ? `
      <div class="phase-section">
        <h4>Resources</h4>
        <ul class="resources-list">
          ${phase.resources.map(resource => `
            <li class="resource-item">
              <span class="resource-type type-${resource.type ? resource.type.toLowerCase() : 'other'}">${resource.type || 'Link'}</span>
              <a href="${resource.url || '#'}" target="_blank" rel="noopener noreferrer">${resource.title || 'Resource'}</a>
            </li>
          `).join('')}
        </ul>
      </div>` : ''}
      ${phase.milestones && phase.milestones.length > 0 ? `
      <div class="phase-section">
        <h4>Milestones</h4>
        <ul class="milestones-list">
          ${phase.milestones.map((milestone, i) => `
            <li class="milestone-item">
              <label class="custom-checkbox">
                <input type="checkbox" id="milestone-${index}-${i}" onchange="handleMilestoneChange()" />
                <span class="checkmark"></span>
                <span class="milestone-text">${milestone}</span>
              </label>
            </li>
          `).join('')}
        </ul>
      </div>` : ''}
      ${phase.exercises && phase.exercises.length > 0 ? `
      <div class="phase-section">
        <h4>Exercises & Practice</h4>
        <ul class="exercises-list">
          ${phase.exercises.map(exercise => `<li><span class="exercise-icon">💪</span> ${exercise}</li>`).join('')}
        </ul>
      </div>` : ''}
      <div class="phase-footer">
        <span class="estimated-hours">⏱️ ${phase.estimated_hours || '-'} hours estimated</span>
      </div>
    </div>
  `;
  return card;
}
window.togglePhase = function(index) {
  const content = document.getElementById(`phase-${index}`);
  const btn = content.previousElementSibling.querySelector('.toggle-btn');
  if (content.classList.contains('collapsed')) {
    content.classList.remove('collapsed');
    btn.style.transform = 'rotate(180deg)';
  } else {
    content.classList.add('collapsed');
    btn.style.transform = 'rotate(0deg)';
  }
}
function renderWeeklySchedule(schedule) {
  const container = document.getElementById('weekly-schedule');
  container.innerHTML = `
    <h3>Weekly Schedule</h3>
    <div class="schedule-grid">
      <div class="schedule-stat">
        <span class="schedule-value">${schedule.study_hours || 0}</span>
        <span class="schedule-label">Study Hrs</span>
      </div>
      <div class="schedule-stat">
        <span class="schedule-value">${schedule.practice_hours || 0}</span>
        <span class="schedule-label">Practice Hrs</span>
      </div>
    </div>
    ${schedule.suggested_days ? `
    <div class="schedule-days-section">
      <span class="schedule-label">Suggested Days:</span>
      <div class="days-tags">
        ${schedule.suggested_days.map(day => `<span class="day-tag">${day}</span>`).join('')}
      </div>
    </div>` : ''}
  `;
}
function renderPrerequisites(prereqs) {
  const container = document.getElementById('prerequisites');
  if (prereqs && prereqs.length > 0) {
    container.innerHTML = `
      <h3>Prerequisites</h3>
      <ul class="sidebar-list check-list">
        ${prereqs.map(prereq => `<li>${prereq}</li>`).join('')}
      </ul>
    `;
  } else {
    container.style.display = 'none';
  }
}
function renderNextSteps(steps) {
  const container = document.getElementById('next-steps');
  if (steps && steps.length > 0) {
    container.innerHTML = `
      <h3>Next Steps</h3>
      <ul class="sidebar-list arrow-list">
        ${steps.map(step => `<li>${step}</li>`).join('')}
      </ul>
    `;
  } else {
    container.style.display = 'none';
  }
}
function calculateTotalHours(data) {
  if (!data.phases) return 0;
  return data.phases.reduce((total, phase) => total + (phase.estimated_hours || 0), 0);
}
function setupEventListeners() {
  document.getElementById('save-btn').addEventListener('click', saveRoadmapLocally);
  document.getElementById('share-btn').addEventListener('click', shareRoadmap);
  document.getElementById('print-btn').addEventListener('click', () => window.print());
}
window.handleMilestoneChange = async function() {
  const checkboxes = document.querySelectorAll('.milestone-item input[type="checkbox"]');
  if(checkboxes.length === 0) return;
  const totalMilestones = checkboxes.length;
  const completedMilestones = document.querySelectorAll('.milestone-item input[type="checkbox"]:checked').length;
  const progress = Math.round((completedMilestones / totalMilestones) * 100);
  updateProgressUI(progress);
  const roadmapId = new URLSearchParams(window.location.search).get('id');
  if (roadmapId) {
    try {
      await fetch(`${API_BASE_URL}/roadmap/${roadmapId}/progress`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress })
      });
    } catch (e) {
      console.error('Failed to save progress', e);
    }
  }
}
function updateProgressUI(progress) {
  const bar = document.getElementById('progress-bar');
  const text = document.getElementById('progress-text');
  if(bar && text) {
    bar.style.width = `${progress}%`;
    text.textContent = `${progress}% Complete`;
    if(progress === 100) {
      bar.style.backgroundColor = 'var(--clr-success)';
    } else {
      bar.style.backgroundColor = 'var(--clr-accent)';
    }
  }
}
function saveRoadmapLocally() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
  let saved = JSON.parse(localStorage.getItem('savedRoadmaps') || '[]');
  if(!saved.includes(id)) {
    saved.push(id);
    localStorage.setItem('savedRoadmaps', JSON.stringify(saved));
  }
  alert('Roadmap saved locally! You can access it from the My Roadmaps page.');
}
async function shareRoadmap() {
  const shareUrl = window.location.href;
  try {
    await navigator.clipboard.writeText(shareUrl);
    alert('Link copied to clipboard!');
  } catch (err) {
    prompt('Copy this link:', shareUrl);
  }
}
function showError(message) {
  let errorDiv = document.querySelector('.error-notification');
  if (!errorDiv) {
    errorDiv = document.createElement('div');
    errorDiv.className = 'error-notification';
    document.body.appendChild(errorDiv);
  }
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
  setTimeout(() => {
    errorDiv.style.opacity = '0';
    setTimeout(() => errorDiv.remove(), 300);
  }, 5000);
}