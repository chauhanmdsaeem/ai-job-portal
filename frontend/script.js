/* =========================================================
   script.js
   -------------------------------------------------------
   What this file does, in order:
   1. Tries to load jobs from the Flask API (GET /api/jobs).
   2. If that fails (e.g. you just opened index.html directly
      in a browser, with no backend running), it falls back
      to a small static array so the page still works.
   3. Renders job cards into #job-list.
   4. Builds the location/type filter dropdowns from the data.
   5. Wires up search + filters, all done client-side on the
      array already in memory (no server round-trip needed).
   ========================================================= */

// Fallback data used only if the backend can't be reached.
// This mirrors backend/data/jobs.json structure so the two
// stay interchangeable.
const FALLBACK_JOBS = [
  {
    id: 1,
    title: "Python Developer",
    company: "XYZ Technologies",
    location: "Bengaluru",
    skills: ["Python", "SQL", "Git"],
    job_type: "Full-time",
    description: "Work on backend services and internal tooling using Python and SQL.",
    apply_link: "#"
  },
  {
    id: 2,
    title: "Frontend Developer",
    company: "DEF Solutions",
    location: "Chennai",
    skills: ["HTML", "CSS", "JavaScript"],
    job_type: "Full-time",
    description: "Turn design mockups into responsive, accessible web interfaces.",
    apply_link: "#"
  }
];

// Elements we'll touch more than once — grab them up front.
const jobListEl = document.getElementById("job-list");
const emptyStateEl = document.getElementById("empty-state");
const resultsCountEl = document.getElementById("results-count");
const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const locationFilter = document.getElementById("location-filter");
const typeFilter = document.getElementById("type-filter");
const dataSourceEl = document.getElementById("data-source");

// This holds whatever job list we end up with (API or fallback).
// Filtering never mutates this — it's always the full set.
let allJobs = [];

// Who's logged in (from auth.js's fetchCurrentUser), and which job
// ids the candidate has already applied to — both set once in
// loadJobs() and read by createJobCard() on every render.
let currentUser = null;
let appliedJobIds = new Set();
let savedJobIds = new Set();
let candidateProfile = null;

/**
 * Build the apply control for one job card. What it looks like
 * depends on who's logged in:
 *   - nobody logged in      -> link to login.html
 *   - a recruiter/admin     -> plain note, recruiters don't apply
 *   - a candidate           -> "Apply" button, or "Applied ✓" if
 *                              appliedJobIds already has this job
 */
function createApplyControl(job) {
  if (!currentUser) {
    const link = document.createElement("a");
    link.className = "apply-link";
    link.href = "login.html";
    link.textContent = "Log in to apply →";
    return link;
  }

  if (currentUser.role !== "candidate") {
    const note = document.createElement("span");
    note.className = "apply-note";
    note.textContent = "Recruiter view";
    return note;
  }

  if (appliedJobIds.has(job.id)) {
    const applied = document.createElement("span");
    applied.className = "apply-applied";
    applied.textContent = "Applied ✓";
    return applied;
  }

  const button = document.createElement("button");
  button.type = "button";
  button.className = "apply-link apply-button";
  button.textContent = "Apply →";

  button.addEventListener("click", () => {
    openApplyModal(job, button);
  });
  
  const controls = document.createElement("div");
  controls.className = "job-controls";
  controls.style.display = "flex";
  controls.style.gap = "12px";
  controls.style.alignItems = "center";
  
  if (candidateProfile && candidateProfile.resume) {
    const matchBtn = document.createElement("button");
    matchBtn.type = "button";
    matchBtn.className = "ghost-btn";
    matchBtn.textContent = "✨ See Match Score";
    
    const matchResult = document.createElement("div");
    matchResult.className = "match-result";
    matchResult.hidden = true;
    
    matchBtn.addEventListener("click", async () => {
      matchBtn.disabled = true;
      matchBtn.textContent = "Calculating...";
      try {
        const res = await fetch(`/api/jobs/${job.id}/match`);
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        matchResult.innerHTML = `<strong>Match: ${data.score}%</strong> - ${data.summary}`;
        matchResult.hidden = false;
        matchBtn.hidden = true;
      } catch (err) {
        matchBtn.textContent = "Failed to match";
      }
    });
    
    controls.append(matchBtn, matchResult, button);
  } else {
    controls.append(button);
  }
  
  // Save/Bookmark button
  if (currentUser.role === "candidate") {
    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.className = "ghost-btn";
    
    const isSaved = savedJobIds.has(job.id);
    saveBtn.textContent = isSaved ? "🔖 Saved" : "🔖 Save";
    
    saveBtn.addEventListener("click", async () => {
      saveBtn.disabled = true;
      try {
        if (savedJobIds.has(job.id)) {
          await fetch(`/api/jobs/${job.id}/save`, { method: "DELETE" });
          savedJobIds.delete(job.id);
          saveBtn.textContent = "🔖 Save";
        } else {
          await fetch(`/api/jobs/${job.id}/save`, { method: "POST" });
          savedJobIds.add(job.id);
          saveBtn.textContent = "🔖 Saved";
        }
      } catch (err) {
        console.error(err);
      } finally {
        saveBtn.disabled = false;
      }
    });
    
    controls.append(saveBtn);
  }

  return controls;
}

// Modal handling logic
const applyModal = document.getElementById("apply-modal");
const closeModalBtn = document.getElementById("close-modal");
const modalJobTitle = document.getElementById("modal-job-title");
const modalJobCompany = document.getElementById("modal-job-company");
const applyForm = document.getElementById("apply-form");
const applyError = document.getElementById("apply-error");
const submitAppBtn = document.getElementById("submit-application-btn");

let currentApplyingJob = null;
let currentApplyingButton = null;

function openApplyModal(job, buttonEl) {
  if (!applyModal) return; // safety check
  
  currentApplyingJob = job;
  currentApplyingButton = buttonEl;
  
  modalJobTitle.textContent = job.title;
  modalJobCompany.textContent = job.company;
  
  const resumeInput = document.getElementById("resume-input");
  resumeInput.value = candidateProfile && candidateProfile.resume ? candidateProfile.resume : "";
  
  applyForm.reset();
  applyError.hidden = true;
  submitAppBtn.disabled = false;
  submitAppBtn.textContent = "Submit Application";
  
  applyModal.showModal();
}

if (applyModal) {
  closeModalBtn.addEventListener("click", () => {
    applyModal.close();
  });

  applyModal.addEventListener("click", (e) => {
    if (e.target === applyModal) applyModal.close(); // click outside to close
  });

  applyForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    if (!currentApplyingJob) return;
    
    const resumeVal = document.getElementById("resume-input").value.trim();
    const expVal = document.getElementById("experience-input").value.trim();
    const salaryVal = document.getElementById("salary-input").value.trim();
    const noticeVal = document.getElementById("notice-input").value;
    const portfolioVal = document.getElementById("portfolio-input").value.trim();
    
    submitAppBtn.disabled = true;
    submitAppBtn.textContent = "Submitting…";
    applyError.hidden = true;

    try {
      const response = await fetch(`/api/jobs/${currentApplyingJob.id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          resume: resumeVal,
          experience: expVal,
          expected_salary: salaryVal,
          notice_period: noticeVal,
          portfolio_url: portfolioVal
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        submitAppBtn.disabled = false;
        submitAppBtn.textContent = "Submit Application";
        applyError.textContent = data.error || "Could not submit your application.";
        applyError.hidden = false;
        return;
      }

      appliedJobIds.add(currentApplyingJob.id);
      
      const applied = document.createElement("span");
      applied.className = "apply-applied";
      applied.textContent = "Applied ✓";
      
      if (currentApplyingButton && currentApplyingButton.parentNode) {
        currentApplyingButton.replaceWith(applied);
      }
      
      applyModal.close();
    } catch (err) {
      submitAppBtn.disabled = false;
      submitAppBtn.textContent = "Submit Application";
      applyError.textContent = "Network error — please try again.";
      applyError.hidden = false;
    }
  });

  const btnTailor = document.getElementById("btn-tailor-resume");
  const btnGenerateAts = document.getElementById("btn-generate-ats");
  
  if (btnTailor) {
    btnTailor.addEventListener("click", async () => {
      if (!currentApplyingJob) return;
      const resumeInput = document.getElementById("resume-input");
      
      const originalText = resumeInput.value.trim();
      if (!originalText) {
        alert("Please paste your master resume or some notes first!");
        return;
      }
      
      btnTailor.disabled = true;
      btnTailor.textContent = "Tailoring...";
      try {
        const res = await fetch("/api/me/resume/tailor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            job_id: currentApplyingJob.id,
            master_resume: originalText
          })
        });
        if (res.ok) {
          const data = await res.json();
          resumeInput.value = data.resume;
        } else {
          alert("Failed to tailor resume.");
        }
      } catch (err) {
        alert("Error connecting to AI.");
      } finally {
        btnTailor.disabled = false;
        btnTailor.textContent = "✨ Auto-Tailor";
      }
    });
  }

  if (btnGenerateAts) {
    btnGenerateAts.addEventListener("click", async () => {
      const resumeInput = document.getElementById("resume-input");
      
      const rawNotes = resumeInput.value.trim();
      if (!rawNotes || rawNotes.length < 20) {
        alert("Please paste some rough notes, skills, or bullet points about your experience first (at least 20 chars).");
        return;
      }
      
      btnGenerateAts.disabled = true;
      btnGenerateAts.textContent = "Generating...";
      try {
        const res = await fetch("/api/me/resume/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ raw_notes: rawNotes })
        });
        if (res.ok) {
          const data = await res.json();
          resumeInput.value = data.resume;
        } else {
          alert("Failed to generate ATS resume.");
        }
      } catch (err) {
        alert("Error connecting to AI.");
      } finally {
        btnGenerateAts.disabled = false;
        btnGenerateAts.textContent = "✨ Generate ATS";
      }
    });
  }
}

/**
 * Build a single job card as a DOM node.
 * Using createElement + textContent (not innerHTML with
 * template strings) so job data can never be interpreted
 * as HTML — a small but real defense against XSS if this
 * data ever comes from user input later (e.g. recruiter posts).
 */
function createJobCard(job) {
  const card = document.createElement("article");
  card.className = "job-card";
  card.dataset.type = job.job_type;

  const top = document.createElement("div");
  top.className = "job-card-top";

  const title = document.createElement("h3");
  title.className = "job-title";
  title.textContent = job.title;

  const typeTag = document.createElement("span");
  typeTag.className = "job-type-tag";
  typeTag.textContent = job.job_type;

  top.append(title, typeTag);

  const company = document.createElement("p");
  company.className = "job-company";
  company.textContent = job.company;

  const location = document.createElement("p");
  location.className = "job-location";
  location.textContent = job.location;

  const skillsList = document.createElement("ul");
  skillsList.className = "job-skills";
  job.skills.forEach((skill) => {
    const li = document.createElement("li");
    li.textContent = skill;
    skillsList.appendChild(li);
  });

  const desc = document.createElement("p");
  desc.className = "job-desc";
  desc.textContent = job.description;

  const applyControl = createApplyControl(job);

  card.append(top, company, location, skillsList, desc, applyControl);
  return card;
}

/** Render a given array of jobs into the grid. */
function renderJobs(jobs) {
  jobListEl.innerHTML = ""; // clear previous render

  if (jobs.length === 0) {
    emptyStateEl.hidden = false;
  } else {
    emptyStateEl.hidden = true;
    const fragment = document.createDocumentFragment();
    jobs.forEach((job) => fragment.appendChild(createJobCard(job)));
    jobListEl.appendChild(fragment);
  }

  resultsCountEl.textContent = `${jobs.length} role${jobs.length === 1 ? "" : "s"}`;
}

/** Populate the two <select> filters from the loaded job data. */
function populateFilters(jobs) {
  const locations = [...new Set(jobs.map((j) => j.location))].sort();
  const types = [...new Set(jobs.map((j) => j.job_type))].sort();

  locations.forEach((loc) => {
    const opt = document.createElement("option");
    opt.value = loc;
    opt.textContent = loc;
    locationFilter.appendChild(opt);
  });

  types.forEach((type) => {
    const opt = document.createElement("option");
    opt.value = type;
    opt.textContent = type;
    typeFilter.appendChild(opt);
  });
}

/** Apply the current search text + filter selections to allJobs. */
function applyFilters() {
  const query = searchInput.value.trim().toLowerCase();
  const location = locationFilter.value;
  const type = typeFilter.value;

  const filtered = allJobs.filter((job) => {
    const matchesQuery =
      query === "" ||
      job.title.toLowerCase().includes(query) ||
      job.company.toLowerCase().includes(query) ||
      job.skills.some((s) => s.toLowerCase().includes(query));

    const matchesLocation = location === "" || job.location === location;
    const matchesType = type === "" || job.job_type === type;

    return matchesQuery && matchesLocation && matchesType;
  });

  renderJobs(filtered);
}

/** Load jobs from the Flask API, falling back to static data. */
async function loadJobs() {
  // fetchCurrentUser() comes from auth.js, loaded before this file.
  currentUser = await fetchCurrentUser();

  if (currentUser && currentUser.role === "candidate") {
    try {
      const res = await fetch("/api/applications");
      if (res.ok) {
        const applications = await res.json();
        appliedJobIds = new Set(applications.map((a) => a.job_id));
      }
      
      const savedRes = await fetch("/api/jobs/saved");
      if (savedRes.ok) {
        const savedJobs = await savedRes.json();
        savedJobIds = new Set(savedJobs.map((j) => j.id));
      }
      
      const profileRes = await fetch("/api/me/profile");
      if (profileRes.ok) {
        candidateProfile = await profileRes.json();
      }
    } catch (err) {
      console.warn("Could not load candidate data:", err.message);
    }
  }

  try {
    const response = await fetch("/api/jobs");
    if (!response.ok) throw new Error(`API responded with ${response.status}`);
    allJobs = await response.json();
    dataSourceEl.textContent = "Flask API (/api/jobs)";
  } catch (err) {
    // Backend not running, or page opened directly as a file —
    // fall back so the UI still demonstrates itself.
    console.warn("Could not load /api/jobs, using fallback data:", err.message);
    allJobs = FALLBACK_JOBS;
    dataSourceEl.textContent = "static fallback data";
  }

  populateFilters(allJobs);
  renderJobs(allJobs);
  
  if (candidateProfile && candidateProfile.resume) {
    loadRecommendations();
  }
}

async function loadRecommendations() {
  const container = document.getElementById("recommendations-container");
  const listEl = document.getElementById("recommendations-list");
  
  try {
    container.hidden = false;
    listEl.innerHTML = "<p>Finding the perfect roles for you with AI...</p>";
    
    const res = await fetch("/api/jobs/recommendations");
    if (!res.ok) throw new Error("Failed");
    const data = await res.json();
    
    listEl.innerHTML = "";
    if (!data.recommendations || data.recommendations.length === 0) {
      listEl.innerHTML = "<p>No recommendations found right now.</p>";
      return;
    }
    
    data.recommendations.forEach(rec => {
      const job = allJobs.find(j => j.id === rec.job_id);
      if (job) {
        const card = createJobCard(job);
        
        const insight = document.createElement("div");
        insight.className = "ai-insights";
        insight.style.marginTop = "16px";
        insight.innerHTML = `<strong>✨ ${rec.match_score}% Match:</strong> ${rec.reason}`;
        card.appendChild(insight);
        
        listEl.appendChild(card);
      }
    });
  } catch (err) {
    listEl.innerHTML = "<p>Could not load recommendations.</p>";
  }
}

// Re-filter as the person types or changes a dropdown —
// no need to wait for the "Search" button.
searchInput.addEventListener("input", applyFilters);
locationFilter.addEventListener("change", applyFilters);
typeFilter.addEventListener("change", applyFilters);

// Prevent full page reload on submit; we already filter live.
searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  applyFilters();
});

// Kick things off once the DOM is ready.
document.addEventListener("DOMContentLoaded", loadJobs);