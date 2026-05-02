const API_BASE_URL = 'http://localhost:3000/api'; // Change to absolute or relative if deployed

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('roadmap-form');
  
  if(form) {
    // Check if there's a stored email to pre-fill
    const storedEmail = localStorage.getItem('userEmail');
    if (storedEmail) {
      const emailInput = document.getElementById('userEmail');
      if (emailInput) emailInput.value = storedEmail;
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Get form values
      const formData = {
        topic: document.getElementById('topic').value.trim(),
        level: document.getElementById('level').value,
        hours: parseInt(document.getElementById('hours').value),
        goal: document.getElementById('goal').value.trim(),
        userEmail: document.getElementById('userEmail').value.trim()
      };
      
      // Validate
      if (!validateForm(formData)) return;

      // Save email if provided
      if (formData.userEmail) {
        localStorage.setItem('userEmail', formData.userEmail);
      }
      
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
  if (data.hours < 1 || data.hours > 20) {
    showError('Hours per week must be between 1 and 20');
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
  submitBtn.innerHTML = 'Generate Roadmap';
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
