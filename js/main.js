"use strict";
(function initNav() {
    const toggle = document.querySelector(".nav-toggle");
    const nav    = document.querySelector(".main-nav");
    if (!toggle || !nav) return;
    toggle.addEventListener("click", function () {
        const isOpen = nav.classList.toggle("open");
        toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
    nav.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", function () {
            nav.classList.remove("open");
            toggle.setAttribute("aria-expanded", "false");
        });
    });
    document.addEventListener("click", function (e) {
        if (!toggle.contains(e.target) && !nav.contains(e.target)) {
            nav.classList.remove("open");
            toggle.setAttribute("aria-expanded", "false");
        }
    });
}());
(function initCharCounters() {
    document.querySelectorAll("textarea[maxlength]").forEach(function (textarea) {
        const counterId = textarea.getAttribute("aria-describedby")
            ? textarea.getAttribute("aria-describedby").split(" ").find(function (id) {
                return id.includes("count");
              })
            : null;
        if (!counterId) return;
        const counter = document.getElementById(counterId);
        if (!counter) return;
        const max = parseInt(textarea.getAttribute("maxlength"), 10);
        textarea.addEventListener("input", function () {
            const len = textarea.value.length;
            counter.textContent = len + " / " + max;
            counter.style.color = len > max * 0.9
                ? "var(--clr-danger)"
                : "var(--clr-muted)";
        });
    });
}());
document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('page-load');
    const authNavItem = document.getElementById('auth-nav-item');
    const user = JSON.parse(localStorage.getItem('techpath_user') || 'null');
    if (user && authNavItem) {
        authNavItem.innerHTML = `
            <div class="user-menu" style="display: flex; align-items: center; gap: 0.5rem; margin-left: 1rem;">
                <span style="color: var(--text-muted); font-size: 0.85rem; font-weight: 500;">Hi, ${user.name || user.email.split('@')[0]}</span>
                <a href="#" id="logout-btn" class="nav-link" style="padding: 0.4rem 0.8rem; background: rgba(239, 68, 68, 0.1); color: #ef4444 !important;">Logout</a>
            </div>
        `;
        document.getElementById('logout-btn').addEventListener('click', () => {
            localStorage.removeItem('techpath_user');
            window.location.reload();
        });
    }
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            } else {
                entry.target.classList.remove('visible');
            }
        });
    }, observerOptions);
    const staggerItems = document.querySelectorAll('.stagger-item');
    staggerItems.forEach(item => {
        observer.observe(item);
    });
});