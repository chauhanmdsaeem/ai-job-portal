
const accessDeniedEl = document.getElementById("access-denied");
const contentEl = document.getElementById("company-content");
const formEl = document.getElementById("company-form");
const msgEl = document.getElementById("company-msg");

async function initCompanyDashboard() {
  const user = await fetchCurrentUser();
  if (!user || user.role !== "recruiter") {
    accessDeniedEl.hidden = false;
    contentEl.hidden = true;
    return;
  }
  
  accessDeniedEl.hidden = true;
  contentEl.hidden = false;
  
  document.getElementById("company-name").value = user.company_name || "";
  document.getElementById("company-website").value = user.company_website || "";
  document.getElementById("company-desc").value = user.company_desc || "";
  
  formEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = formEl.querySelector("button[type='submit']");
    btn.disabled = true;
    msgEl.textContent = "Saving...";
    msgEl.style.color = "var(--ink-light)";
    
    const company_name = document.getElementById("company-name").value;
    const company_website = document.getElementById("company-website").value;
    const company_desc = document.getElementById("company-desc").value;
    
    try {
      const csrfResponse = await fetch("/api/csrf-token");
      const { csrf_token } = await csrfResponse.json();
      
      const res = await fetch("/api/me/company", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrf_token
        },
        body: JSON.stringify({ company_name, company_website, company_desc })
      });
      
      if (!res.ok) throw new Error("Failed to save");
      
      msgEl.textContent = "✓ Company profile updated successfully!";
      msgEl.style.color = "var(--accent-primary)";
      
      // Update global current user cache
      if (window.currentUser) {
        window.currentUser.company_name = company_name;
        window.currentUser.company_website = company_website;
        window.currentUser.company_desc = company_desc;
      }
    } catch (err) {
      console.error(err);
      msgEl.textContent = "Could not save company profile. Please try again.";
      msgEl.style.color = "var(--danger)";
    } finally {
      btn.disabled = false;
    }
  });
}

document.addEventListener("DOMContentLoaded", initCompanyDashboard);
