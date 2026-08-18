/* =========================================================
   auth-forms.js
   -------------------------------------------------------
   Handles the actual submit behaviour of #login-form and
   #register-form. Only one of these forms will exist on any
   given page, so each block below checks the element exists
   before wiring a listener to it.
   ========================================================= */

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
