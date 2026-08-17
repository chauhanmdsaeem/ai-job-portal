/* =========================================================
   dashboard.js
   -------------------------------------------------------
   Powers dashboard.html for recruiters (and admins):
   1. Guards the page — redirects if not logged in, shows a
      denial message if logged in as a candidate.
   2. Posts new jobs via POST /api/jobs.
   3. Lists the recruiter's own postings (open + closed) via
      GET /api/my-jobs, with close/reopen buttons.
   4. Lets each posting expand into its applicant list via
      GET /api/jobs/<id>/applicants, with a status dropdown
      per applicant that PUTs /api/applications/<id>.
   ========================================================= */

const accessDeniedEl = document.getElementById("access-denied");
const dashboardContentEl = document.getElementById("dashboard-content");
const postJobForm = document.getElementById("post-job-form");
const formErrorEl = document.getElementById("form-error");
const myJobsListEl = document.getElementById("my-jobs-list");
const myJobsCountEl = document.getElementById("my-jobs-count");

const APPLICATION_STATUSES = [
  "Applied",
  "Under Review",
  "Shortlisted",
  "Interview",
  "Rejected",
  "Selected",
];

function statusClass(status) {
  return "status-" + status.toLowerCase().replace(/\s+/g, "-");
}

/** Build the (initially collapsed) applicants panel for one job. */
function createApplicantsPanel(job) {
  const panel = document.createElement("div");
  panel.className = "applicants-panel";
  panel.hidden = true;

  let allApplicants = [];
  let currentFilter = "All";
  let currentSort = "desc";

  const renderApplicants = () => {
    panel.innerHTML = "";

    // Toolbar
    const toolbar = document.createElement("div");
    toolbar.className = "applicants-toolbar";
    
    const filterSelect = document.createElement("select");
    const allOpt = document.createElement("option");
    allOpt.value = "All";
    allOpt.textContent = "All Statuses";
    filterSelect.appendChild(allOpt);
    APPLICATION_STATUSES.forEach(status => {
      const opt = document.createElement("option");
      opt.value = status;
      opt.textContent = status;
      filterSelect.appendChild(opt);
    });
    filterSelect.value = currentFilter;
    filterSelect.addEventListener("change", (e) => {
      currentFilter = e.target.value;
      renderApplicants();
    });

    const sortSelect = document.createElement("select");
    const descOpt = document.createElement("option");
    descOpt.value = "desc";
    descOpt.textContent = "Newest First";
    const ascOpt = document.createElement("option");
    ascOpt.value = "asc";
    ascOpt.textContent = "Oldest First";
    sortSelect.append(descOpt, ascOpt);
    sortSelect.value = currentSort;
    sortSelect.addEventListener("change", (e) => {
      currentSort = e.target.value;
      renderApplicants();
    });

    toolbar.append(filterSelect, sortSelect);
    panel.appendChild(toolbar);

    let filtered = allApplicants;
    if (currentFilter !== "All") {
      filtered = filtered.filter(a => a.status === currentFilter);
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.applied_at);
      const dateB = new Date(b.applied_at);
      return currentSort === "desc" ? dateB - dateA : dateA - dateB;
    });

    if (filtered.length === 0) {
      const empty = document.createElement("p");
      empty.className = "applicants-empty";
      empty.textContent = "No applicants match the current filters.";
      panel.appendChild(empty);
      return;
    }

    filtered.forEach((app) => {
      const container = document.createElement("div");
      container.className = "applicant-row-container";

      const row = document.createElement("div");
      row.className = "applicant-row";

      const info = document.createElement("div");
      info.className = "applicant-info";

      const name = document.createElement("p");
      name.className = "applicant-name";
      name.textContent = app.candidate_name;

      const email = document.createElement("p");
      email.className = "applicant-email";
      email.textContent = app.candidate_email;

      const dateStr = new Date(app.applied_at).toLocaleDateString();
      const applied = document.createElement("p");
      applied.className = "applicant-date";
      applied.textContent = `Applied ${dateStr}`;
      
      const extraInfo = document.createElement("div");
      extraInfo.style.fontSize = "13px";
      extraInfo.style.color = "#666";
      extraInfo.style.marginTop = "8px";
      
      let extrasHTML = "";
      if (app.experience) extrasHTML += `<strong>Exp:</strong> ${app.experience} yrs &nbsp;|&nbsp; `;
      if (app.expected_salary) extrasHTML += `<strong>Salary:</strong> ${app.expected_salary} &nbsp;|&nbsp; `;
      if (app.notice_period) extrasHTML += `<strong>Notice:</strong> ${app.notice_period}<br>`;
      if (app.portfolio_url) extrasHTML += `<strong>Portfolio:</strong> <a href="${app.portfolio_url}" target="_blank">${app.portfolio_url}</a>`;
      extraInfo.innerHTML = extrasHTML;

      const toggleResumeBtn = document.createElement("button");
      toggleResumeBtn.className = "toggle-resume-btn";
      toggleResumeBtn.textContent = "View Resume";

      const analyzeBtn = document.createElement("button");
      analyzeBtn.className = "analyze-btn";
      analyzeBtn.textContent = "✨ Analyze with AI";
      analyzeBtn.type = "button";
      // Hide analyzeBtn since Auto-Screening does it automatically now, but we keep it for legacy ones that don't have analysis.
      if (app.ai_analysis) analyzeBtn.hidden = true;

      info.append(name, email, applied, extraInfo, toggleResumeBtn, analyzeBtn);

      const select = document.createElement("select");
      select.className = "status-select " + statusClass(app.status);
      APPLICATION_STATUSES.forEach((status) => {
        const option = document.createElement("option");
        option.value = status;
        option.textContent = status;
        if (status === app.status) option.selected = true;
        select.appendChild(option);
      });

      select.addEventListener("change", async () => {
        const newStatus = select.value;
        select.disabled = true;
        try {
          const res = await fetch(`/api/applications/${app.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus }),
          });
          if (!res.ok) throw new Error("update failed");
          select.className = "status-select " + statusClass(newStatus);
          app.status = newStatus; // update local model
        } catch (err) {
          alert("Could not update status — please try again.");
          select.value = app.status; // revert
        } finally {
          select.disabled = false;
        }
      });

      row.append(info, select);
      container.appendChild(row);

      const resumeBox = document.createElement("div");
      resumeBox.className = "resume-box";
      resumeBox.hidden = true;
      
      const resumeContent = app.resume ? app.resume.trim() : "No resume provided.";
      
      if (resumeContent.startsWith("http://") || resumeContent.startsWith("https://")) {
        const link = document.createElement("a");
        link.href = resumeContent;
        link.target = "_blank";
        link.textContent = resumeContent;
        resumeBox.appendChild(link);
      } else {
        resumeBox.textContent = resumeContent;
      }

      toggleResumeBtn.addEventListener("click", () => {
        resumeBox.hidden = !resumeBox.hidden;
        toggleResumeBtn.textContent = resumeBox.hidden ? "View Resume" : "Hide Resume";
      });

      container.appendChild(resumeBox);

      const aiInsightsBox = document.createElement("div");
      aiInsightsBox.className = "ai-insights";
      aiInsightsBox.hidden = true;

      const renderAiInsights = (analysis) => {
        aiInsightsBox.hidden = false;
        aiInsightsBox.innerHTML = `
          <div class="ai-insights-header">
            <span class="ai-insights-title">AI Compatibility Analysis</span>
            <span class="ai-score ${analysis.score >= 80 ? 'score-high' : analysis.score >= 50 ? 'score-med' : 'score-low'}">
              ${analysis.score}%
            </span>
          </div>
          <div class="ai-insights-body">${analysis.summary}</div>
          <div class="ai-skills">
            <strong>Skills Matched:</strong>
            <div class="skill-list">
              ${analysis.matched_skills.map(s => `<span class="skill-tag matched">${s}</span>`).join('')}
              ${analysis.matched_skills.length === 0 ? '<span class="skill-tag">None</span>' : ''}
            </div>
            <strong>Skills Missing:</strong>
            <div class="skill-list">
              ${analysis.missing_skills.map(s => `<span class="skill-tag missing">${s}</span>`).join('')}
              ${analysis.missing_skills.length === 0 ? '<span class="skill-tag">None</span>' : ''}
            </div>
          </div>
        `;
        analyzeBtn.textContent = "✨ AI Analysis Complete";
        analyzeBtn.disabled = true;
      };

      if (app.ai_analysis) {
        renderAiInsights(app.ai_analysis);
      }

      analyzeBtn.addEventListener("click", async () => {
        analyzeBtn.disabled = true;
        analyzeBtn.textContent = "Analyzing...";
        try {
          const res = await fetch(`/api/applications/${app.id}/analyze`, { method: "POST" });
          if (!res.ok) throw new Error("failed");
          const updatedApp = await res.json();
          app.ai_analysis = updatedApp.ai_analysis;
          renderAiInsights(app.ai_analysis);
        } catch (err) {
          alert("AI Analysis failed.");
          analyzeBtn.disabled = false;
          analyzeBtn.textContent = "✨ Analyze with AI";
        }
      });

      container.appendChild(aiInsightsBox);
      panel.appendChild(container);
    });
  };

  const loadAndRender = async () => {
    panel.textContent = "Loading…";
    try {
      const res = await fetch(`/api/jobs/${job.id}/applicants`);
      if (!res.ok) throw new Error(`API responded with ${res.status}`);
      allApplicants = await res.json();
      
      if (allApplicants.length === 0) {
        panel.textContent = "";
        const empty = document.createElement("p");
        empty.className = "applicants-empty";
        empty.textContent = "No applicants yet.";
        panel.appendChild(empty);
      } else {
        renderApplicants();
      }
    } catch (err) {
      panel.textContent = "Could not load applicants right now.";
    }
  };

  return { panel, loadAndRender };
}

function createMyJobCard(job) {
  const card = document.createElement("article");
  card.className = "job-card my-job-card";
  card.dataset.type = job.job_type;

  const top = document.createElement("div");
  top.className = "job-card-top";

  const title = document.createElement("h3");
  title.className = "job-title";
  title.textContent = `Job #${job.id} — ${job.title}`;

  const statusBadge = document.createElement("span");
  statusBadge.className = "job-status-badge job-status-" + job.status;
  statusBadge.textContent = job.status;

  top.append(title, statusBadge);

  const meta = document.createElement("p");
  meta.className = "job-company";
  meta.textContent = `${job.company} · ${job.location}`;

  const actions = document.createElement("div");
  actions.className = "my-job-actions";

  const toggleApplicantsBtn = document.createElement("button");
  toggleApplicantsBtn.type = "button";
  toggleApplicantsBtn.className = "ghost-btn";
  toggleApplicantsBtn.textContent = "View applicants";

  const { panel, loadAndRender } = createApplicantsPanel(job);
  let loaded = false;

  toggleApplicantsBtn.addEventListener("click", async () => {
    panel.hidden = !panel.hidden;
    if (!panel.hidden && !loaded) {
      loaded = true;
      await loadAndRender();
    }
  });

  const toggleStatusBtn = document.createElement("button");
  toggleStatusBtn.type = "button";
  toggleStatusBtn.className = "ghost-btn";
  toggleStatusBtn.textContent = job.status === "open" ? "Close posting" : "Reopen posting";

  toggleStatusBtn.addEventListener("click", async () => {
    const action = job.status === "open" ? "close" : "reopen";
    toggleStatusBtn.disabled = true;
    try {
      const res = await fetch(`/api/jobs/${job.id}/${action}`, { method: "POST" });
      if (!res.ok) throw new Error("failed");
      const updated = await res.json();
      job.status = updated.status;
      statusBadge.textContent = updated.status;
      statusBadge.className = "job-status-badge job-status-" + updated.status;
      toggleStatusBtn.textContent = updated.status === "open" ? "Close posting" : "Reopen posting";
    } catch (err) {
      alert("Could not update the posting — please try again.");
    } finally {
      toggleStatusBtn.disabled = false;
    }
  });

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "ghost-btn";
  deleteBtn.style.color = "var(--danger)";
  deleteBtn.style.borderColor = "var(--danger)";
  deleteBtn.textContent = "Delete";

  deleteBtn.addEventListener("click", async () => {
    if (!confirm("Are you sure you want to permanently delete this job posting?")) return;
    deleteBtn.disabled = true;
    try {
      const res = await fetch(`/api/jobs/${job.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("failed");
      card.remove(); // Remove from UI
      // Update count
      const myJobsListEl = document.getElementById("my-jobs-list");
      const myJobsCountEl = document.getElementById("my-jobs-count");
      if (myJobsListEl && myJobsCountEl) {
        const count = myJobsListEl.children.length;
        myJobsCountEl.textContent = count + (count === 1 ? " posting" : " postings");
      }
    } catch (err) {
      alert("Could not delete the posting — please try again.");
      deleteBtn.disabled = false;
    }
  });

  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "ghost-btn";
  editBtn.textContent = "Edit";

  editBtn.addEventListener("click", () => {
    document.getElementById("edit-job-id").value = job.id;
    document.getElementById("edit-title").value = job.title;
    document.getElementById("edit-company").value = job.company;
    document.getElementById("edit-location").value = job.location;
    document.getElementById("edit-job_type").value = job.job_type;
    document.getElementById("edit-skills").value = job.skills ? job.skills.join(", ") : "";
    document.getElementById("edit-salary").value = job.salary || "";
    document.getElementById("edit-description").value = job.description || "";
    document.getElementById("edit-form-error").hidden = true;
    document.getElementById("edit-job-modal").showModal();
  });

  actions.append(toggleApplicantsBtn, toggleStatusBtn, editBtn, deleteBtn);
  card.append(top, meta, actions, panel);
  return card;
}

async function loadMyJobs() {
  try {
    const res = await fetch("/api/my-jobs");
    if (!res.ok) throw new Error(`API responded with ${res.status}`);
    const jobs = await res.json();

    myJobsCountEl.textContent = `${jobs.length} posting${jobs.length === 1 ? "" : "s"}`;
    myJobsListEl.innerHTML = "";

    if (jobs.length === 0) {
      myJobsListEl.textContent = "You haven't posted any jobs yet — use the form above.";
      return;
    }

    const fragment = document.createDocumentFragment();
    jobs.forEach((job) => fragment.appendChild(createMyJobCard(job)));
    myJobsListEl.appendChild(fragment);
  } catch (err) {
    myJobsListEl.textContent = "Could not load your postings right now.";
  }
}

postJobForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  formErrorEl.hidden = true;

  const skillsRaw = document.getElementById("skills").value;
  const payload = {
    title: document.getElementById("title").value.trim(),
    company: document.getElementById("company").value.trim(),
    location: document.getElementById("location").value.trim(),
    job_type: document.getElementById("job_type").value,
    skills: skillsRaw.split(",").map((s) => s.trim()).filter(Boolean),
    salary: document.getElementById("salary").value.trim(),
    description: document.getElementById("description").value.trim(),
  };

  try {
    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      formErrorEl.textContent = data.error || "Could not post the job.";
      formErrorEl.hidden = false;
      return;
    }

    postJobForm.reset();
    await loadMyJobs();
  } catch (err) {
    formErrorEl.textContent = "Network error — please try again.";
    formErrorEl.hidden = false;
  }
});

const btnGenerateJd = document.getElementById("btn-generate-jd");
if (btnGenerateJd) {
  btnGenerateJd.addEventListener("click", async () => {
    const title = document.getElementById("title").value.trim();
    const company = document.getElementById("company").value.trim();
    const location = document.getElementById("location").value.trim();
    const skills = document.getElementById("skills").value.trim();
    
    if (!title || !company) {
      formErrorEl.textContent = "Please enter a Title and Company first to generate a JD.";
      formErrorEl.hidden = false;
      return;
    }
    
    btnGenerateJd.disabled = true;
    btnGenerateJd.textContent = "Generating...";
    formErrorEl.hidden = true;
    
    try {
      const res = await fetch("/api/jobs/generate-jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, company, location, skills })
      });
      const data = await res.json();
      
      if (res.ok) {
        document.getElementById("description").value = data.description;
      } else {
        formErrorEl.textContent = data.error || "Failed to generate JD.";
        formErrorEl.hidden = false;
      }
    } catch (err) {
      formErrorEl.textContent = "Error connecting to AI.";
      formErrorEl.hidden = false;
    } finally {
      btnGenerateJd.disabled = false;
      btnGenerateJd.textContent = "✨ Generate JD";
    }
  });
}

async function initDashboard() {
  const user = await fetchCurrentUser(); // from auth.js

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  if (user.role !== "recruiter" && user.role !== "admin") {
    accessDeniedEl.hidden = false;
    return;
  }

  dashboardContentEl.hidden = false;
  await loadMyJobs();
}

document.addEventListener("DOMContentLoaded", initDashboard);

// ===== Edit Job Modal =====
const editModal = document.getElementById("edit-job-modal");
const closeEditBtn = document.getElementById("close-edit-modal");
const editForm = document.getElementById("edit-job-form");
const editErrorEl = document.getElementById("edit-form-error");

if (closeEditBtn) {
  closeEditBtn.addEventListener("click", () => {
    editModal.close();
  });
}

if (editForm) {
  editForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    editErrorEl.hidden = true;

    const id = document.getElementById("edit-job-id").value;
    const title = document.getElementById("edit-title").value.trim();
    const company = document.getElementById("edit-company").value.trim();
    const location = document.getElementById("edit-location").value.trim();
    const job_type = document.getElementById("edit-job_type").value;
    const skillsStr = document.getElementById("edit-skills").value.trim();
    const salary = document.getElementById("edit-salary").value.trim();
    const description = document.getElementById("edit-description").value.trim();

    if (!title || !company || !location) {
      editErrorEl.textContent = "Title, Company, and Location are required.";
      editErrorEl.hidden = false;
      return;
    }

    const skills = skillsStr
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const submitBtn = editForm.querySelector("button[type='submit']");
    submitBtn.disabled = true;

    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          company,
          location,
          job_type,
          skills,
          salary,
          description,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update job.");

      editForm.reset();
      editModal.close();
      loadMyJobs(); // Re-render the list
    } catch (err) {
      editErrorEl.textContent = err.message;
      editErrorEl.hidden = false;
    } finally {
      submitBtn.disabled = false;
    }
  });
}