"use strict";
var RULES = {
    first_name: {
        required: true,
        minLength: 2,
        maxLength: 50,
        pattern: /^[A-Za-z\u0600-\u06FF\s]+$/,
        messages: {
            required:  "First name is required.",
            minLength: "First name must be at least 2 characters.",
            maxLength: "First name cannot exceed 50 characters.",
            pattern:   "First name may only contain letters."
        }
    },
    last_name: {
        required: true,
        minLength: 2,
        maxLength: 50,
        pattern: /^[A-Za-z\u0600-\u06FF\s\-]+$/,
        messages: {
            required:  "Last name is required.",
            minLength: "Last name must be at least 2 characters.",
            maxLength: "Last name cannot exceed 50 characters.",
            pattern:   "Last name may only contain letters and hyphens."
        }
    },
    mobile: {
        required: true,
        pattern: /^\+?[0-9\s\-]{7,20}$/,
        messages: {
            required: "Mobile number is required.",
            pattern:  "Enter a valid phone number (e.g. +966 5X XXX XXXX)."
        }
    },
    dob: {
        required: true,
        messages: {
            required: "Date of birth is required.",
            range:    "Please enter a valid date of birth (must be born before 2009)."
        }
    },
    email: {
        required: true,
        maxLength: 100,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        messages: {
            required:  "Email address is required.",
            maxLength: "Email cannot exceed 100 characters.",
            pattern:   "Please enter a valid email address."
        }
    },
    language: {
        required: true,
        messages: {
            required: "Please select a language."
        }
    },
    message: {
        required: true,
        minLength: 10,
        maxLength: 1000,
        messages: {
            required:  "Message is required.",
            minLength: "Message must be at least 10 characters.",
            maxLength: "Message cannot exceed 1000 characters."
        }
    }
};
function showError(fieldId, message) {
    var input = document.getElementById(fieldId);
    var error = document.getElementById(fieldId + "-error");
    if (!input || !error) return;
    error.textContent = message;
    input.classList.add("input-error");
    input.classList.remove("input-valid");
    input.setAttribute("aria-invalid", "true");
}
function clearError(fieldId) {
    var input = document.getElementById(fieldId);
    var error = document.getElementById(fieldId + "-error");
    if (!input || !error) return;
    error.textContent = "";
    input.classList.remove("input-error");
    input.classList.add("input-valid");
    input.setAttribute("aria-invalid", "false");
}
function validateField(name, value) {
    var rule = RULES[name];
    if (!rule) return null;
    if (rule.required && !value.trim()) {
        return rule.messages.required;
    }
    if (!value.trim()) return null; 
    if (rule.minLength && value.trim().length < rule.minLength) {
        return rule.messages.minLength;
    }
    if (rule.maxLength && value.trim().length > rule.maxLength) {
        return rule.messages.maxLength;
    }
    if (rule.pattern && !rule.pattern.test(value.trim())) {
        return rule.messages.pattern;
    }
    if (name === "dob" && value) {
        var dob  = new Date(value);
        var now  = new Date();
        var minD = new Date("1950-01-01");
        if (isNaN(dob.getTime()) || dob >= now || dob < minD) {
            return rule.messages.range;
        }
    }
    return null; 
}
function validateGender() {
    var selected = document.querySelector("input[name='gender']:checked");
    var error    = document.getElementById("gender-error");
    if (!error) return true;
    if (!selected) {
        error.textContent = "Please select a gender.";
        return false;
    }
    error.textContent = "";
    return true;
}
(function initLiveValidation() {
    var fields = ["first-name", "last-name", "mobile", "dob", "email", "language", "message"];
    fields.forEach(function (fieldId) {
        var input = document.getElementById(fieldId);
        if (!input) return;
        var name  = fieldId.replace("-", "_");
        input.addEventListener("blur", function () {
            var msg = validateField(name, input.value);
            if (msg) {
                showError(fieldId, msg);
            } else {
                clearError(fieldId);
            }
        });
        input.addEventListener("input", function () {
            if (input.classList.contains("input-error")) {
                var msg = validateField(name, input.value);
                if (!msg) clearError(fieldId);
            }
        });
    });
    document.querySelectorAll("input[name='gender']").forEach(function (radio) {
        radio.addEventListener("change", validateGender);
    });
}());
(function initFormSubmit() {
    var form = document.getElementById("contact-form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
        e.preventDefault();
        var isValid = true;
        var fieldMap = {
            "first-name": "first_name",
            "last-name":  "last_name",
            "mobile":     "mobile",
            "dob":        "dob",
            "email":      "email",
            "language":   "language",
            "message":    "message"
        };
        Object.keys(fieldMap).forEach(function (fieldId) {
            var name  = fieldMap[fieldId];
            var input = document.getElementById(fieldId);
            if (!input) return;
            var msg = validateField(name, input.value);
            if (msg) {
                showError(fieldId, msg);
                isValid = false;
            } else {
                clearError(fieldId);
            }
        });
        if (!validateGender()) {
            isValid = false;
        }
        if (!isValid) {
            var firstErr = form.querySelector(".input-error");
            if (firstErr) firstErr.focus();
            return;
        }
        var successBanner = document.getElementById("form-success");
        if (successBanner) {
            successBanner.hidden = false;
            successBanner.style.display = "flex";
            successBanner.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        form.reset();
        form.querySelectorAll(".input-valid").forEach(function (el) {
            el.classList.remove("input-valid");
        });
    });
}());