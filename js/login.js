document.addEventListener('DOMContentLoaded', () => {
    const authForm = document.getElementById('auth-form');
    const toggleAuth = document.getElementById('toggle-auth');
    const authTitle = document.getElementById('auth-title');
    const authSubtitle = document.getElementById('auth-subtitle');
    const submitBtn = document.getElementById('submit-btn');
    const toggleText = document.getElementById('toggle-text');
    const nameGroup = document.getElementById('name-group');
    const errorBox = document.getElementById('error-box');
    let isLogin = true;
    toggleAuth.addEventListener('click', (e) => {
        e.preventDefault();
        isLogin = !isLogin;
        if (isLogin) {
            authTitle.textContent = 'Welcome Back';
            authSubtitle.textContent = 'Log in to track your progress';
            submitBtn.textContent = 'Login';
            toggleText.textContent = "Don't have an account?";
            toggleAuth.textContent = 'Sign Up';
            nameGroup.style.display = 'none';
            document.getElementById('name').required = false;
        } else {
            authTitle.textContent = 'Create Account';
            authSubtitle.textContent = 'Join TechPath to master new skills';
            submitBtn.textContent = 'Sign Up';
            toggleText.textContent = 'Already have an account?';
            toggleAuth.textContent = 'Login';
            nameGroup.style.display = 'flex';
            document.getElementById('name').required = true;
        }
        errorBox.style.display = 'none';
    });
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const name = document.getElementById('name').value;
        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
        const payload = isLogin ? { email, password } : { email, password, name };
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (data.success) {
                localStorage.setItem('techpath_user', JSON.stringify(data.user));
                if (window.navigateTo) {
                    window.navigateTo('index.html');
                } else {
                    window.location.href = 'index.html';
                }
            } else {
                errorBox.textContent = data.error || 'Authentication failed';
                errorBox.style.display = 'block';
            }
        } catch (err) {
            console.error('Auth error:', err);
            errorBox.textContent = 'A server error occurred. Please try again.';
            errorBox.style.display = 'block';
        }
    });
});