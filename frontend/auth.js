/* =========================================================
   auth.js
   -------------------------------------------------------
   Shared on every page (index, login, register). Handles:
   - Asking the backend who's logged in (GET /api/me)
   - Rendering the right thing into the <span id="nav-auth-slot">
     in the header: "Log in / Register" or "Name · role  Log out"
   - The actual logout button click handler

   Session state lives in an httpOnly-ish signed cookie set by
   Flask (see backend/routes/auth.py) — this file never reads
   or writes that cookie directly, it just asks the server.
   ========================================================= */

async function fetchCurrentUser() {
  try {
    const response = await fetch("/api/me");
    const data = await response.json();
    return data.user; // null when nobody is logged in
  } catch (err) {
    console.warn("Could not reach /api/me:", err.message);
    return null;
  }
}

function renderNavAuth(user) {
  const slot = document.getElementById("nav-auth-slot");
  if (!slot) return; // page doesn't have a nav slot (shouldn't happen, but be safe)

  slot.innerHTML = "";

  if (user) {
    const roleLink = document.createElement("a");
    if (user.role === "candidate") {
      roleLink.href = "applications.html";
      roleLink.textContent = "My applications";
      
      const profileLink = document.createElement("a");
      profileLink.href = "profile.html";
      profileLink.textContent = "My Profile";
      
      const greeting = document.createElement("span");
      greeting.className = "nav-user";
      greeting.textContent = `${user.name} · ${user.role}`;

      const logoutBtn = document.createElement("button");
      logoutBtn.type = "button";
      logoutBtn.className = "nav-logout";
      logoutBtn.textContent = "Log out";
      logoutBtn.addEventListener("click", async () => {
        await fetch("/api/logout", { method: "POST" });
        window.location.href = "index.html";
      });

      slot.append(roleLink, profileLink, greeting, logoutBtn);
    } else {
      roleLink.href = "dashboard.html";
      roleLink.textContent = "Dashboard";

      const greeting = document.createElement("span");
      greeting.className = "nav-user";
      greeting.textContent = `${user.name} · ${user.role}`;

      const logoutBtn = document.createElement("button");
      logoutBtn.type = "button";
      logoutBtn.className = "nav-logout";
      logoutBtn.textContent = "Log out";
      logoutBtn.addEventListener("click", async () => {
        await fetch("/api/logout", { method: "POST" });
        window.location.href = "index.html";
      });

      slot.append(roleLink, greeting, logoutBtn);
    }


  } else {
    const loginLink = document.createElement("a");
    loginLink.href = "login.html";
    loginLink.textContent = "Log in";

    const registerLink = document.createElement("a");
    registerLink.href = "register.html";
    registerLink.className = "nav-register";
    registerLink.textContent = "Register";

    slot.append(loginLink, registerLink);
  }
}

/**
 * Runs on every page. Returns the current user (or null) so
 * pages like login.html can redirect away if you're already
 * signed in.
 */
async function initNavAuth() {
  const user = await fetchCurrentUser();
  renderNavAuth(user);
  return user;
}

document.addEventListener("DOMContentLoaded", initNavAuth);