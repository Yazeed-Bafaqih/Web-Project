/* ============================================================
   TechPath — assessment.js (Level Assessment Logic)
   CCSW321 Web Development — University of Jeddah 2025-2026
   ============================================================ */

"use strict";

/* ── Resources Database ────────────────────────────────────── */
var RESOURCES = {
    webdev: {
        beginner: {
            label: "Beginner",
            desc: "Great starting point! We've selected the most beginner-friendly resources to help you build solid foundations in Web Development.",
            resources: [
                { type: "Video",   title: "HTML & CSS Full Course",         desc: "freeCodeCamp — 11 hrs, project-based" },
                { type: "Article", title: "MDN Web Docs: HTML Basics",       desc: "The official reference, simplified" },
                { type: "Project", title: "Build a Personal Portfolio Page",  desc: "Apply your HTML & CSS from day one" }
            ]
        },
        intermediate: {
            label: "Intermediate",
            desc: "Solid foundation! You're ready to dive into JavaScript and more advanced CSS techniques.",
            resources: [
                { type: "Video",   title: "JavaScript 30 by Wes Bos",          desc: "30 mini JS projects in 30 days — free" },
                { type: "Article", title: "CSS Flexbox & Grid Guide (CSS-Tricks)", desc: "Master modern layout techniques" },
                { type: "Project", title: "Build a To-Do App with Local Storage",  desc: "DOM manipulation + JS data persistence" }
            ]
        },
        advanced: {
            label: "Advanced",
            desc: "Impressive level! Time to master frameworks, testing, and production-grade architecture.",
            resources: [
                { type: "Video",   title: "React + Node.js Full Stack Course",  desc: "Traversy Media — build a real app end-to-end" },
                { type: "Article", title: "You Don't Know JS (book series)",     desc: "Deep dive into JavaScript internals" },
                { type: "Project", title: "Build a REST API with Auth & MySQL",  desc: "Node.js, Express, JWT, MySQL" }
            ]
        }
    },
    ai: {
        beginner: {
            label: "Beginner",
            desc: "Welcome to AI! We'll start with Python fundamentals and the key concepts behind machine learning.",
            resources: [
                { type: "Video",   title: "Python for Everybody (Coursera)",        desc: "No experience needed — Dr. Chuck" },
                { type: "Article", title: "Google Machine Learning Crash Course",    desc: "Visual intro to ML concepts" },
                { type: "Project", title: "Predict House Prices with Linear Regression", desc: "Your first scikit-learn model" }
            ]
        },
        intermediate: {
            label: "Intermediate",
            desc: "Good progress! You're ready to build real models and understand core ML algorithms.",
            resources: [
                { type: "Video",   title: "Deep Learning Specialization — Andrew Ng", desc: "The gold standard ML course" },
                { type: "Article", title: "Towards Data Science: Neural Networks 101",  desc: "Clear explanations with visuals" },
                { type: "Project", title: "Image Classifier with TensorFlow/Keras",     desc: "CNN on CIFAR-10 dataset" }
            ]
        },
        advanced: {
            label: "Advanced",
            desc: "Excellent foundation! Tackle transformers, deployment, and production ML systems.",
            resources: [
                { type: "Video",   title: "Andrej Karpathy — Neural Networks Zero to Hero", desc: "Build GPT from scratch" },
                { type: "Article", title: "Attention Is All You Need (paper)",               desc: "The original Transformer paper" },
                { type: "Project", title: "Deploy an ML Model as a REST API",                desc: "FastAPI + Docker + cloud hosting" }
            ]
        }
    }
};

/* ── Track Toggle ──────────────────────────────────────────── */
(function initTrackToggle() {
    var btns        = document.querySelectorAll(".track-btn");
    var hiddenTrack = document.getElementById("selected-track");

    btns.forEach(function (btn) {
        btn.addEventListener("click", function () {
            btns.forEach(function (b) {
                b.classList.remove("active");
                b.setAttribute("aria-pressed", "false");
            });
            btn.classList.add("active");
            btn.setAttribute("aria-pressed", "true");

            if (hiddenTrack) {
                hiddenTrack.value = btn.getAttribute("data-track");
            }
        });
    });
}());

/* ── Validation Helpers ────────────────────────────────────── */
function showFieldError(id, msg) {
    var el = document.getElementById(id);
    if (el) el.textContent = msg;
}

function clearFieldError(id) {
    var el = document.getElementById(id);
    if (el) el.textContent = "";
}

/* ── Determine level from scores ───────────────────────────── */
function getLevel(score) {
    if (score <= 4)  return "beginner";
    if (score <= 7)  return "intermediate";
    return "advanced";
}

/* ── Render results ────────────────────────────────────────── */
function renderResults(track, level, name) {
    var data  = RESOURCES[track][level];
    var panel = document.getElementById("results-panel");

    document.getElementById("results-level").textContent = data.label;
    document.getElementById("results-desc").textContent  = data.desc;

    var list = document.getElementById("resources-list");
    list.innerHTML = "";

    data.resources.forEach(function (r) {
        var card = document.createElement("div");
        card.className = "resource-card";
        card.innerHTML =
            "<p class='resource-type'>" + r.type + "</p>" +
            "<p class='resource-title'>" + r.title + "</p>" +
            "<p class='resource-desc'>" + r.desc + "</p>";
        list.appendChild(card);
    });

    panel.hidden = false;
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ── Retake assessment ─────────────────────────────────────── */
function retakeAssessment() {
    var panel = document.getElementById("results-panel");
    var form  = document.getElementById("assessment-form");
    if (panel) panel.hidden = true;
    if (form) {
        form.reset();
        form.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

/* ── Assessment Form Submit ────────────────────────────────── */
(function initAssessmentForm() {
    var form = document.getElementById("assessment-form");
    if (!form) return;

    form.addEventListener("submit", function (e) {
        e.preventDefault();

        var isValid   = true;
        var errorBanner = document.getElementById("assessment-error");

        /* Validate name */
        var nameInput = document.getElementById("learner-name");
        var nameVal   = nameInput ? nameInput.value.trim() : "";

        if (!nameVal || nameVal.length < 2) {
            showFieldError("name-error", "Please enter your name (at least 2 characters).");
            if (nameInput) nameInput.classList.add("input-error");
            isValid = false;
        } else {
            clearFieldError("name-error");
            if (nameInput) {
                nameInput.classList.remove("input-error");
                nameInput.classList.add("input-valid");
            }
        }

        /* Validate each quiz question */
        var qIds = ["q1", "q2", "q3", "q4"];
        qIds.forEach(function (qId) {
            var selected = document.querySelector("input[name='" + qId + "']:checked");
            if (!selected) {
                showFieldError(qId + "-error", "Please select an answer.");
                isValid = false;
            } else {
                clearFieldError(qId + "-error");
            }
        });

        if (!isValid) {
            if (errorBanner) {
                errorBanner.hidden  = false;
                errorBanner.textContent = "Please answer all questions before submitting.";
            }
            return;
        }

        if (errorBanner) errorBanner.hidden = true;

        /* Calculate score */
        var score = 0;
        ["q1", "q2", "q3"].forEach(function (qId) {
            var sel = document.querySelector("input[name='" + qId + "']:checked");
            score += sel ? parseInt(sel.value, 10) : 0;
        });

        var track = document.getElementById("selected-track")
            ? document.getElementById("selected-track").value
            : "webdev";

        var level = getLevel(score);

        renderResults(track, level, nameVal);
    });
}());
