/* =========================================================
   auth-forms.js
   -------------------------------------------------------
   Handles the actual submit behaviour of #login-form and
   #register-form. Only one of these forms will exist on any
   given page, so each block below checks the element exists
   before wiring a listener to it.
   ========================================================= */


function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function checkPasswordStrength(password) {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
}

const passwordInput = document.getElementById("password");
if (passwordInput && document.getElementById("password-strength-container")) {
    passwordInput.addEventListener("input", (e) => {
        const val = e.target.value;
        const score = checkPasswordStrength(val);
        const textEl = document.getElementById("password-strength-text");
        
        const colors = ["var(--line-main)", "var(--danger)", "orange", "#a3e635", "var(--success)"];
        const labels = ["At least 8 characters.", "Weak", "Fair", "Good", "Strong"];
        
        for (let i = 1; i <= 4; i++) {
            const bar = document.getElementById(`strength-bar-${i}`);
            if (bar) {
                bar.style.background = (i <= score) ? colors[score] : "var(--line-main)";
            }
        }
        
        if (val.length === 0) {
            textEl.textContent = "At least 8 characters.";
            textEl.style.color = "var(--ink-light)";
            for (let i=1; i<=4; i++) document.getElementById(`strength-bar-${i}`).style.background = "var(--line-main)";
        } else {
            textEl.textContent = labels[score];
            textEl.style.color = colors[score];
        }
    });
}

function showFormError(message) {
  const errorEl = document.getElementById("form-error");
  if (!errorEl) return;
  errorEl.textContent = message;
  errorEl.hidden = false;
}

function clearFormError() {
  const errorEl = document.getElementById("form-error");
  if (!errorEl) return;
  errorEl.hidden = true;
  errorEl.textContent = "";
}

function show2faError(message) {
  const errorEl = document.getElementById("form-error-2fa");
  if (!errorEl) return;
  errorEl.textContent = message;
  errorEl.hidden = false;
}

function clear2faError() {
  const errorEl = document.getElementById("form-error-2fa");
  if (!errorEl) return;
  errorEl.hidden = true;
  errorEl.textContent = "";
}

async function postJSON(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data };
}

function show2faForm(mainFormId) {
  const mainForm = document.getElementById(mainFormId);
  const twoFaForm = document.getElementById("two-fa-form");
  if (mainForm && twoFaForm) {
    mainForm.style.display = "none";
    twoFaForm.style.display = "block";
  }
}

// ----- 2FA form -----
const twoFaForm = document.getElementById("two-fa-form");
if (twoFaForm) {
  twoFaForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clear2faError();

    const otp = document.getElementById("otp").value.trim();
    const { ok, data } = await postJSON("/api/verify-2fa", { otp });

    if (!ok) {
      show2faError(data.error || "Invalid code. Please try again.");
      return;
    }

    window.location.href = "index.html";
  });
}

// ----- Login form -----
const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearFormError();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
        showFormError("Please fill in all fields.");
        return;
    }
    if (!validateEmail(email)) {
        showFormError("Please enter a valid email address.");
        return;
    }

    const { ok, data } = await postJSON("/api/login", { email, password });

    if (!ok) {
      showFormError(data.error || "Something went wrong. Please try again.");
      return;
    }

    if (data.require_2fa) {
      show2faForm("login-form");
    } else {
      window.location.href = "index.html";
    }
  });
}

// ----- Register form -----
const registerForm = document.getElementById("register-form");
if (registerForm) {
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearFormError();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const role = document.getElementById("role").value;

    if (!name || !email || !password) {
        showFormError("Please fill in all fields.");
        return;
    }
    if (!validateEmail(email)) {
        showFormError("Please enter a valid email address.");
        return;
    }
    if (password.length < 8) {
        showFormError("Password must be at least 8 characters long.");
        return;
    }

    const { ok, data } = await postJSON("/api/register", { name, email, password, role });

    if (!ok) {
      showFormError(data.error || "Something went wrong. Please try again.");
      return;
    }

    if (data.require_2fa) {
      show2faForm("register-form");
    } else {
      window.location.href = "index.html";
    }
  });
}

// If someone who's already logged in lands on login.html or
// register.html directly, send them back to the listing instead.
document.addEventListener("DOMContentLoaded", async () => {
  if (!loginForm && !registerForm) return;
  const user = await fetchCurrentUser();
  if (user) {
    window.location.href = "index.html";
  }
});
