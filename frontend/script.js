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
let currentPage = 1;
let totalPages = 1;

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
  
  controls.append(button);
  
  // Save/Bookmark button
  if (currentUser && currentUser.role === "candidate") {
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
  
  applyForm.reset();
  
  const resumeInput = document.getElementById("resume-input");
  resumeInput.value = candidateProfile && candidateProfile.resume ? candidateProfile.resume : "";
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
          const errText = await res.text();
          alert("Failed to tailor resume. The AI service is currently unavailable.");
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
          const errText = await res.text();
          alert("Failed to generate ATS resume. The AI service is currently unavailable.");
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
function createJobCard(job, index = 1) {
  const card = document.createElement("article");
  card.className = "job-card";
  card.dataset.type = job.job_type;
  
  const formattedIndex = index.toString().padStart(2, '0');
  
  let whyMatchBtnHtml = "";
  
  if (currentUser && currentUser.role === "candidate") {
    // We will add real AI matching logic here later.
    // For now, do not show fake match data.
    whyMatchBtnHtml = "";
  }

  card.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; margin-bottom: 16px;">
      <h3 style="font-family: var(--font-display); font-size: 1.5rem; letter-spacing: -0.02em; margin: 0; line-height: 1.1;">
        ${job.title}
      </h3>
    </div>
    
    <div style="font-family: var(--font-mono); font-size: 0.85rem; margin-bottom: 16px; border-bottom: 1px solid var(--line-light); padding-bottom: 16px;">
      <strong style="color: var(--ink-main); display: block; margin-bottom: 8px;">${job.company}</strong>
      <span style="color: var(--ink-light); margin-right: 16px;">📍 ${job.location}</span>
      <span style="color: var(--ink-light); margin-right: 16px;">🕒 ${job.job_type}</span>
      ${job.salary ? `<span style="color: var(--ink-light);">💰 ${job.salary}</span>` : ''}
    </div>

    <p style="font-size: 0.95rem; color: var(--ink-light); margin-bottom: 24px; line-height: 1.5; flex-grow: 1;">
      ${job.description ? job.description.substring(0, 150) + "..." : "No description provided."}
    </p>

    <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 24px;">
      ${job.skills.map(skill => `<span style="background: var(--bg-surface); padding: 4px 8px; font-family: var(--font-mono); font-size: 0.75rem; color: var(--ink-main); border: 1px solid var(--line-light);">${skill}</span>`).join('')}
    </div>

    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; border-top: 1px solid var(--line-main); padding-top: 16px;">
      <div class="apply-control-slot" style="width: 100%; text-align: right;"></div>
    </div>
  `;

  // Inject apply controls
  const slot = card.querySelector('.apply-control-slot');
  slot.appendChild(createApplyControl(job));
  
  // Accordion toggle
  if (currentUser && currentUser.role === "candidate") {
    const whyBtn = card.querySelector('.why-match-btn');
    const explainBox = card.querySelector('.ai-explain-box');
    if (whyBtn && explainBox) {
      whyBtn.addEventListener('click', () => {
        explainBox.style.display = explainBox.style.display === 'none' ? 'block' : 'none';
      });
    }
  }

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
    jobs.forEach((job, index) => {
      const card = createJobCard(job, index + 1);
      fragment.appendChild(card);
    });
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

/** Apply the current search text + filter selections. */
function applyFilters() {
  currentPage = 1;
  loadJobs(currentPage, false);
}

/** Load jobs from the Flask API, optionally appending for pagination. */
async function loadJobs(page = 1, append = false) {
  currentPage = page;
  
  if (!append) {
    currentUser = await fetchCurrentUser();
    
    if (currentUser && (currentUser.role === "recruiter" || currentUser.role === "admin")) {
      const heroH1 = document.querySelector(".hero h1");
      if (heroH1) heroH1.innerHTML = "Find candidates that fit<br><i>what your company actually needs.</i>";
      const heroBtn = document.querySelector(".hero button[type='submit']");
      if (heroBtn) heroBtn.textContent = "SEARCH THE PLATFORM →";
      const madlibsLabel = document.querySelector(".madlibs-line");
      if (madlibsLabel && madlibsLabel.firstChild) {
        madlibsLabel.firstChild.textContent = "SEARCH ROLES: ";
      }
    }
    
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
  }

  try {
    const query = searchInput.value.trim();
    const location = locationFilter.value;
    const type = typeFilter.value;
    
    let url = `/api/jobs?page=${page}&limit=10`;
    if (query) url += `&q=${encodeURIComponent(query)}`;
    if (location) url += `&location=${encodeURIComponent(location)}`;
    if (type) url += `&job_type=${encodeURIComponent(type)}`;

    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`API responded with ${response.status}`);
    
    const data = await response.json();
    
    let fetchedJobs = Array.isArray(data) ? data : data.jobs;
    totalPages = data.pages || 1;
    
    if (append) {
      allJobs = allJobs.concat(fetchedJobs);
    } else {
      allJobs = fetchedJobs;
    }
    
    if (dataSourceEl) dataSourceEl.textContent = "Flask API (/api/jobs)";
  } catch (err) {
    console.warn("Could not load /api/jobs, using fallback data:", err.message);
    if (!append) allJobs = FALLBACK_JOBS;
    if (dataSourceEl) dataSourceEl.textContent = "static fallback data";
  }

  if (locationFilter.options.length <= 1) {
    populateFilters(allJobs);
  }
  
  renderJobs(allJobs);
  
  const loadMoreBtn = document.getElementById("load-more-btn");
  if (loadMoreBtn) {
    loadMoreBtn.style.display = (currentPage < totalPages) ? "inline-block" : "none";
  }
  
  if (!append && candidateProfile && candidateProfile.resume) {
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
    
    data.recommendations.forEach((rec, index) => {
      const job = allJobs.find(j => j.id === rec.job_id);
      if (job) {
        const card = createJobCard(job, index + 1);
        
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
locationFilter.addEventListener("change", applyFilters);
typeFilter.addEventListener("change", applyFilters);

// Handle the explicit search button click / enter key
searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  applyFilters();
});

// Load jobs on page load
document.addEventListener("DOMContentLoaded", loadJobs);

document.addEventListener("DOMContentLoaded", () => {
    const loadMoreBtn = document.getElementById("load-more-btn");
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener("click", () => {
            loadJobs(currentPage + 1, true);
        });
    }
});
