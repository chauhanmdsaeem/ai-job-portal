const profileForm = document.getElementById("profile-form");
const resumeInput = document.getElementById("profile-resume");
const errorEl = document.getElementById("profile-error");
const successEl = document.getElementById("profile-success");
const uploadBtn = document.getElementById("upload-pdf-btn");
const fileInput = document.getElementById("resume-upload");
const uploadStatus = document.getElementById("upload-status");

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
  
  loadSavedJobs();
}

async function loadSavedJobs() {
  try {
    const res = await fetch("/api/jobs/saved");
    if (!res.ok) throw new Error();
    const jobs = await res.json();
    
    const listEl = document.getElementById("saved-jobs-list");
    const emptyEl = document.getElementById("saved-jobs-empty");
    
    if (jobs.length === 0) {
      emptyEl.hidden = false;
      return;
    }
    
    emptyEl.hidden = true;
    listEl.innerHTML = jobs.map(job => `
      <div style="border: 1px solid #ddd; padding: 16px; border-radius: 8px;">
        <h3 style="margin: 0 0 8px 0;">${job.title} <span style="font-size: 12px; font-weight: normal; background: #eee; padding: 2px 6px; border-radius: 12px;">${job.job_type}</span></h3>
        <p style="margin: 0 0 4px 0; color: #555;">${job.company} · ${job.location}</p>
        <p style="margin: 0; font-size: 14px;"><a href="index.html#jobs">View on Job Board →</a></p>
      </div>
    `).join("");
    
  } catch (err) {
    console.error("Could not load saved jobs", err);
  }
}

if (uploadBtn) {
  uploadBtn.addEventListener("click", async () => {
    const file = fileInput.files[0];
    if (!file) {
      uploadStatus.textContent = "Please select a PDF file first.";
      uploadStatus.style.color = "red";
      return;
    }
    
    uploadStatus.textContent = "Extracting...";
    uploadStatus.style.color = "#666";
    uploadBtn.disabled = true;
    
    const formData = new FormData();
    formData.append("resume", file);
    
    try {
      const res = await fetch("/api/me/resume/upload", {
        method: "POST",
        body: formData
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload");
      
      resumeInput.value = data.resume;
      uploadStatus.textContent = "Extracted successfully!";
      uploadStatus.style.color = "green";
      
      // Clear file input
      fileInput.value = "";
    } catch (err) {
      uploadStatus.textContent = err.message;
      uploadStatus.style.color = "red";
    } finally {
      uploadBtn.disabled = false;
    }
  });
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
