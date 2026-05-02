/* ============================================================
   TechPath — main.js (Shared JavaScript)
   CCSW321 Web Development — University of Jeddah 2025-2026
   ============================================================ */

"use strict";

/* ── Mobile Navigation Toggle ──────────────────────────────── */
(function initNav() {
    const toggle = document.querySelector(".nav-toggle");
    const nav    = document.querySelector(".main-nav");

    if (!toggle || !nav) return;

    toggle.addEventListener("click", function () {
        const isOpen = nav.classList.toggle("open");
        toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    /* Close nav when a link is clicked (mobile) */
    nav.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", function () {
            nav.classList.remove("open");
            toggle.setAttribute("aria-expanded", "false");
        });
    });

    /* Close nav on outside click */
    document.addEventListener("click", function (e) {
        if (!toggle.contains(e.target) && !nav.contains(e.target)) {
            nav.classList.remove("open");
            toggle.setAttribute("aria-expanded", "false");
        }
    });
}());

/* ── Char Counter for Textareas ────────────────────────────── */
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

/* ── Animations & Init ────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    // Page load animation class
    document.body.classList.add('page-load');

    // Mock Auth Check
    const storedEmail = localStorage.getItem('userEmail');
    if (!storedEmail) {
        console.log('No user email found. Using guest mode.');
    } else {
        console.log('Logged in as:', storedEmail);
    }

    // Intersection Observer for scroll animations
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

    // Select all elements to be animated on scroll
    const staggerItems = document.querySelectorAll('.stagger-item');
    staggerItems.forEach(item => {
        observer.observe(item);
    });
});