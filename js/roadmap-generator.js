const API_BASE_URL = 'http://localhost:3000/api'; // Change to absolute or relative if deployed

function ensureRoadmapSessionId() {
  const key = 'techpath_roadmap_session';
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

document.addEventListener('DOMContentLoaded', () => {
  ensureRoadmapSessionId();
  const form = document.getElementById('roadmap-form');
  
  if(form) {
    const hoursSlider = document.getElementById('hours');
    const hoursValueEl = document.getElementById('hours-value');

    function syncHoursLabel() {
      if (!hoursSlider || !hoursValueEl) return;
      const v = hoursSlider.value;
      hoursValueEl.textContent = v + '\u00a0hrs/wk';
      hoursSlider.setAttribute('aria-valuenow', v);
    }

    hoursSlider?.addEventListener('input', syncHoursLabel);
    syncHoursLabel();

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const durationWeeks = parseInt(document.getElementById('durationWeeks').value, 10);

      const formData = {
        topic: document.getElementById('topic').value.trim(),
        level: document.getElementById('level').value,
        hours: parseInt(hoursSlider.value, 10),
        durationWeeks,
        sessionId: ensureRoadmapSessionId(),
      };
      
      if (!validateForm(formData)) return;
      
      // Show loading state
      showLoadingState();
      
      try {
        const response = await fetch(`${API_BASE_URL}/roadmap/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to generate roadmap');
        }
        
        // Store roadmap ID and redirect to view
        window.location.href = `roadmap-view.html?id=${result.roadmapId}`;
        
      } catch (error) {
        console.error('Error:', error);
        showError(error.message);
      } finally {
        hideLoadingState();
      }
    });
  }
});

function validateForm(data) {
  if (!data.topic || data.topic.length < 3) {
    showError('Please enter a valid topic (at least 3 characters)');
    return false;
  }
  if (!data.level) {
    showError('Please select your current skill level');
    return false;
  }
  if (Number.isNaN(data.hours) || data.hours < 1 || data.hours > 15) {
    showError('Hours per week must be between 1 and 15');
    return false;
  }
  if (Number.isNaN(data.durationWeeks) || data.durationWeeks < 3 || data.durationWeeks > 52) {
    showError('Duration must be between 3 and 52 weeks');
    return false;
  }
  return true;
}

function showLoadingState() {
  const submitBtn = document.querySelector('.submit-btn');
  if(!submitBtn) return;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spinner" style="display:inline-block; margin-right:8px; width:16px; height:16px; border-width:2px;"></span> Generating Roadmap...';
}

function hideLoadingState() {
  const submitBtn = document.querySelector('.submit-btn');
  if(!submitBtn) return;
  submitBtn.disabled = false;
  submitBtn.innerHTML = '<span class="btn-text">Generate Roadmap &rarr;</span>';
}

function showError(message) {
  // Check if there's already an error notification to prevent spam
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
    setTimeout(() => {
      errorDiv.remove();
    }, 300); // Wait for transition
  }, 5000);
}
