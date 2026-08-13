const profileForm = document.getElementById("profile-form");
const resumeInput = document.getElementById("profile-resume");
const errorEl = document.getElementById("profile-error");
const successEl = document.getElementById("profile-success");

async function loadProfile() {
  const user = await fetchCurrentUser();
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  
  if (user.role !== "candidate") {
    alert("Only candidates have a profile page.");
    window.location.href = "index.html";
    return;
  }
  
  try {
    const res = await fetch("/api/me/profile");
    if (!res.ok) throw new Error("Could not load profile");
    const data = await res.json();
    resumeInput.value = data.resume || "";
  } catch (err) {
    console.error(err);
  }
}

profileForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorEl.hidden = true;
  successEl.hidden = true;
  
  const submitBtn = document.getElementById("save-profile-btn");
  submitBtn.disabled = true;
  submitBtn.textContent = "Saving...";
  
  try {
    const res = await fetch("/api/me/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resume: resumeInput.value })
    });
    
    if (!res.ok) throw new Error("Failed to save profile");
    successEl.hidden = false;
  } catch (err) {
    errorEl.textContent = "Could not save profile. Please try again.";
    errorEl.hidden = false;
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Save Profile";
  }
});

document.addEventListener("DOMContentLoaded", loadProfile);
