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

    const notifDiv = document.getElementById("nav-notifications");
    if (notifDiv) {
      notifDiv.style.display = "inline-block";
      loadNotifications(user.role);
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

async function logoutUser() {
  await fetch("/api/logout", { method: "POST" });
  window.location.reload();
}

async function loadNotifications(userRole) {
  try {
    const res = await fetch("/api/notifications");
    if (!res.ok) return;
    
    const notifs = await res.json();
    const unreadCount = notifs.filter(n => !n.is_read).length;
    
    const badge = document.getElementById("notif-badge");
    const dropdown = document.getElementById("notif-dropdown");
    const notifContainer = document.getElementById("nav-notifications");
    
    if (unreadCount > 0) {
      badge.textContent = unreadCount;
      badge.style.display = "inline-block";
    } else {
      badge.style.display = "none";
    }
    
    if (notifs.length > 0) {
      const targetPage = userRole === "recruiter" ? "dashboard.html" : "applications.html";
      dropdown.innerHTML = notifs.map(n => `
        <div style="padding: 8px; border-bottom: 1px solid #eee; cursor: pointer; ${n.is_read ? 'opacity: 0.6;' : 'font-weight: bold;'}"
             onclick="if(event.target.tagName !== 'BUTTON') { window.location.href = '${targetPage}'; }">
          <p style="font-size: 13px; margin: 0; color: #333;">${n.message}</p>
          <small style="color: #999; font-size: 10px;">${n.created_at}</small>
          ${!n.is_read ? `<button onclick="markNotifRead(${n.id}, '${userRole}', this)" style="font-size: 10px; margin-top: 4px; padding: 2px 6px;">Mark read</button>` : ''}
        </div>
      `).join("");
    }
    
    // Toggle dropdown on click
    notifContainer.onclick = function(e) {
      if (e.target.tagName !== 'BUTTON') {
        dropdown.style.display = dropdown.style.display === "none" ? "block" : "none";
      }
    };
    
  } catch (err) {
    console.error("Could not load notifications:", err);
  }
}

window.markNotifRead = async function(id, userRole, btn) {
  // Optimistic UI Update for instant feedback
  if (btn) {
    btn.textContent = "✓";
    btn.disabled = true;
    btn.parentElement.style.opacity = "0.6";
    btn.parentElement.style.fontWeight = "normal";
    
    const badge = document.getElementById("notif-badge");
    if (badge && badge.style.display !== "none") {
      const current = parseInt(badge.textContent) || 0;
      if (current > 1) {
        badge.textContent = current - 1;
      } else {
        badge.style.display = "none";
      }
    }
  }
  
  try {
    // Send request in background
    fetch(`/api/notifications/${id}/read`, { method: "PUT" });
  } catch (err) {}
}

document.addEventListener("DOMContentLoaded", initNavAuth);