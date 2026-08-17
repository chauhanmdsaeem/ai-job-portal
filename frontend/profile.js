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
  
  // loadSavedJobs is currently mocked in the UI for the Career Desk
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

const tabPaste = document.getElementById("tab-paste");
const tabManual = document.getElementById("tab-manual");
const sectionPaste = document.getElementById("section-paste");
const sectionManual = document.getElementById("section-manual");

let activeTab = "paste";

if (tabPaste && tabManual) {
  tabPaste.addEventListener("click", () => {
    activeTab = "paste";
    sectionPaste.style.display = "block";
    sectionManual.style.display = "none";
    tabPaste.style.fontWeight = "bold";
    tabPaste.style.color = "var(--ink-main)";
    tabManual.style.fontWeight = "normal";
    tabManual.style.color = "var(--ink-light)";
  });

  tabManual.addEventListener("click", () => {
    activeTab = "manual";
    sectionManual.style.display = "block";
    sectionPaste.style.display = "none";
    tabManual.style.fontWeight = "bold";
    tabManual.style.color = "var(--ink-main)";
    tabPaste.style.fontWeight = "normal";
    tabPaste.style.color = "var(--ink-light)";
  });
}

profileForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorEl.hidden = true;
  successEl.hidden = true;
  
  const submitBtn = document.getElementById("save-profile-btn");
  submitBtn.disabled = true;
  submitBtn.textContent = "Saving...";
  
  let finalResumeText = resumeInput.value;
  if (activeTab === "manual") {
    const manualSkills = document.getElementById("manual-skills").value.trim();
    const manualExp = document.getElementById("manual-experience").value.trim();
    const manualEdu = document.getElementById("manual-education").value.trim();
    const manualProj = document.getElementById("manual-projects").value.trim();
    
    let parts = [];
    if (manualSkills) parts.push(`## Technical Skills\n${manualSkills}`);
    if (manualExp) parts.push(`## Work Experience\n${manualExp}`);
    if (manualEdu) parts.push(`## Education & Certifications\n${manualEdu}`);
    if (manualProj) parts.push(`## Projects\n${manualProj}`);
    
    finalResumeText = parts.join("\n\n");
    // Optionally backfill the paste textarea so if they switch tabs, it's there
    resumeInput.value = finalResumeText;
  }

  try {
    const res = await fetch("/api/me/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resume: finalResumeText })
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
