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
      analyzeBtn.className = "btn-magic-ai";
      analyzeBtn.style.marginTop = "8px";
      analyzeBtn.innerHTML = `
        <div class="dots_border"></div>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="sparkle">
          <path class="path" stroke-linejoin="round" stroke-linecap="round" stroke="black" fill="black" d="M14.187 8.096L15 5.25L15.813 8.096C16.0231 8.83114 16.4171 9.50062 16.9577 10.0413C17.4984 10.5819 18.1679 10.9759 18.903 11.186L21.75 12L18.904 12.813C18.1689 13.0231 17.4994 13.4171 16.9587 13.9577C16.4181 14.4984 16.0241 15.1679 15.814 15.903L15 18.75L14.187 15.904C13.9769 15.1689 13.5829 14.4994 13.0423 13.9587C12.5016 13.4181 11.8321 13.0241 11.097 12.814L8.25 12L11.096 11.187C11.8311 10.9769 12.5006 10.5829 13.0413 10.0423C13.5819 9.50162 13.9759 8.83214 14.186 8.097L14.187 8.096Z"></path>
          <path class="path" stroke-linejoin="round" stroke-linecap="round" stroke="black" fill="black" d="M6 14.25L5.741 15.285C5.59267 15.8785 5.28579 16.4206 4.85319 16.8532C4.42059 17.2858 3.87853 17.5927 3.285 17.741L2.25 18L3.285 18.259C3.87853 18.4073 4.42059 18.7142 4.85319 19.1468C5.28579 19.5794 5.59267 20.1215 5.741 20.715L6 21.75L6.259 20.715C6.40725 20.1216 6.71398 19.5796 7.14639 19.147C7.5788 18.7144 8.12065 18.4075 8.714 18.259L9.75 18L8.714 17.741C8.12065 17.5925 7.5788 17.2856 7.14639 16.853C6.71398 16.4204 6.40725 15.8784 6.259 15.285L6 14.25Z"></path>
          <path class="path" stroke-linejoin="round" stroke-linecap="round" stroke="black" fill="black" d="M6.5 4L6.303 4.5915C6.24777 4.75718 6.15472 4.90774 6.03123 5.03123C5.90774 5.15472 5.75718 5.24777 5.5915 5.303L5 5.5L5.5915 5.697C5.75718 5.75223 5.90774 5.84528 6.03123 5.96877C6.15472 6.09226 6.24777 6.24282 6.303 6.4085L6.5 7L6.697 6.4085C6.75223 6.24282 6.84528 6.09226 6.96877 5.96877C7.09226 5.84528 7.24282 5.75223 7.4085 5.697L8 5.5L7.4085 5.303C7.24282 5.24777 7.09226 5.15472 6.96877 5.03123C6.84528 4.90774 6.75223 4.75718 6.697 4.5915L6.5 4Z"></path>
        </svg>
        <span class="text_button">Analyze</span>
      `;
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
        const txtSpan = analyzeBtn.querySelector('.text_button');
        if (txtSpan) txtSpan.textContent = "AI Analysis Complete";
        else analyzeBtn.textContent = "AI Analysis Complete";
        analyzeBtn.disabled = true;
      };

      if (app.ai_analysis) {
        renderAiInsights(app.ai_analysis);
      }

      analyzeBtn.addEventListener("click", async () => {
        analyzeBtn.disabled = true;
        const txtSpan = analyzeBtn.querySelector('.text_button');
        if (txtSpan) txtSpan.textContent = "Analyzing...";
        else analyzeBtn.textContent = "Analyzing...";
        try {
          const res = await fetch(`/api/applications/${app.id}/analyze`, { method: "POST" });
          if (!res.ok) throw new Error("failed");
          const updatedApp = await res.json();
          app.ai_analysis = updatedApp.ai_analysis;
          renderAiInsights(app.ai_analysis);
        } catch (err) {
          alert("AI Analysis failed.");
          analyzeBtn.disabled = false;
          const txtSpan = analyzeBtn.querySelector('.text_button');
          if (txtSpan) txtSpan.textContent = "Analyze";
          else analyzeBtn.textContent = "Analyze";
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

const postJobModal = document.getElementById("post-job-modal");
const btnOpenPostJob = document.getElementById("btn-open-post-job");
const btnClosePostJob = document.getElementById("close-post-modal");

if (btnOpenPostJob && postJobModal) {
  btnOpenPostJob.addEventListener("click", () => {
    postJobModal.showModal();
  });
}
if (btnClosePostJob && postJobModal) {
  btnClosePostJob.addEventListener("click", () => {
    postJobModal.close();
  });
}

// Override post form success to also close modal and reload stats
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
    if (postJobModal) postJobModal.close();
    await loadMyJobs();
    await loadDashboardStats();
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
    const txtSpan = btnGenerateJd.querySelector('.text_button');
    if (txtSpan) txtSpan.textContent = "Generating...";
    else btnGenerateJd.textContent = "Generating...";
    formErrorEl.hidden = true;
    
    const overlay = document.getElementById("jd-loader-overlay");
    if (overlay) overlay.classList.add("active");
    
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
      const txtSpan = btnGenerateJd.querySelector('.text_button');
      if (txtSpan) txtSpan.textContent = "Generate JD";
      else btnGenerateJd.textContent = "Generate JD";
      if (overlay) overlay.classList.remove("active");
    }
  });
}

async function loadDashboardStats() {
  try {
    const res = await fetch("/api/dashboard/stats");
    if (!res.ok) return;
    const data = await res.json();
    
    document.getElementById("stat-active-jobs").textContent = data.stats.active_jobs;
    document.getElementById("stat-applications").textContent = data.stats.total_applications;
    document.getElementById("stat-shortlisted").textContent = data.stats.shortlisted;
    document.getElementById("stat-interviews").textContent = data.stats.interviews;
    
    const recentTable = document.getElementById("recent-applications-list");
    recentTable.innerHTML = "";
    if (data.recent_applications.length === 0) {
      recentTable.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--ink-light);">No applications yet.</td></tr>';
    } else {
      data.recent_applications.forEach(app => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td><strong>${app.candidate_name}</strong></td>
          <td>${app.job_title}</td>
          <td>${app.date}</td>
          <td><span class="status-badge ${app.status.toLowerCase()}">${app.status}</span></td>
          <td><a href="#active-jobs-list" class="action-link" onclick="setTimeout(() => window.scrollBy(0, 300), 100)">View</a></td>
        `;
        recentTable.appendChild(tr);
      });
    }
    
    const pendingList = document.getElementById("pending-actions-list");
    pendingList.innerHTML = "";
    data.pending_actions.forEach(action => {
      const li = document.createElement("li");
      li.textContent = action;
      pendingList.appendChild(li);
    });
    
  } catch(err) {
    console.error("Failed to load dashboard stats", err);
  }
}

async function loadCandidateStats() {
  try {
    const res = await fetch("/api/dashboard/candidate-stats");
    if (!res.ok) return;
    const data = await res.json();
    
    document.getElementById("cand-stat-apps").textContent = data.stats.applications;
    document.getElementById("cand-stat-saved").textContent = data.stats.saved_jobs;
    document.getElementById("cand-stat-interviews").textContent = data.stats.interviews;
    document.getElementById("cand-stat-views").textContent = data.stats.profile_views;
    
    // Recommended Jobs
    const recommendedList = document.getElementById("cand-recommended-jobs");
    recommendedList.innerHTML = "";
    if (data.recommended_jobs.length === 0) {
      recommendedList.innerHTML = '<p class="empty-state" style="margin:0;">No matching jobs right now.</p>';
    } else {
      data.recommended_jobs.forEach(job => {
        const div = document.createElement("div");
        div.style.border = "var(--border-thin)";
        div.style.padding = "16px";
        div.style.borderRadius = "8px";
        div.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <div>
              <h4 style="margin: 0; font-size: 1.1rem;">${job.title}</h4>
              <p style="margin: 4px 0 0; color: var(--ink-light); font-size: 0.9rem;">${job.company} · ${job.location}</p>
            </div>
            <span style="font-weight: 600; color: var(--success); font-family: var(--font-mono); font-size: 0.85rem;">${job.match}% Match</span>
          </div>
          <p style="margin: 8px 0; font-size: 0.85rem; color: var(--ink-light);">${job.skills.join(" · ")}</p>
          <div style="text-align: right; margin-top: 12px;">
            <a href="index.html#job-${job.id}" class="ghost-btn" style="padding: 6px 12px; font-size: 0.8rem; text-decoration: none;">View Job</a>
          </div>
        `;
        recommendedList.appendChild(div);
      });
    }

    // Recent Applications
    const recentAppsList = document.getElementById("cand-recent-apps");
    recentAppsList.innerHTML = "";
    if (data.recent_applications.length === 0) {
      recentAppsList.innerHTML = '<p class="empty-state" style="margin:0;">You haven\'t applied to any jobs yet.</p>';
    } else {
      data.recent_applications.forEach(app => {
        const div = document.createElement("div");
        div.style.display = "flex";
        div.style.justifyContent = "space-between";
        div.style.alignItems = "center";
        div.style.padding = "12px 0";
        div.style.borderBottom = "var(--border-thin)";
        
        let pipelinestep = 1;
        if (app.status === 'Under Review') pipelinestep = 2;
        if (app.status === 'Shortlisted') pipelinestep = 3;
        if (app.status === 'Interview') pipelinestep = 4;
        if (app.status === 'Selected') pipelinestep = 5;
        if (app.status === 'Rejected') pipelinestep = 0;
        
        let pipelineHTML = '';
        if (pipelinestep > 0) {
           pipelineHTML = `
           <div style="display: flex; gap: 4px; margin-top: 8px;">
             <div style="height: 4px; flex: 1; background: ${pipelinestep >= 1 ? 'var(--accent-primary)' : 'var(--line-light)'}; border-radius: 2px;"></div>
             <div style="height: 4px; flex: 1; background: ${pipelinestep >= 2 ? 'var(--accent-primary)' : 'var(--line-light)'}; border-radius: 2px;"></div>
             <div style="height: 4px; flex: 1; background: ${pipelinestep >= 3 ? 'var(--accent-primary)' : 'var(--line-light)'}; border-radius: 2px;"></div>
             <div style="height: 4px; flex: 1; background: ${pipelinestep >= 4 ? 'var(--accent-primary)' : 'var(--line-light)'}; border-radius: 2px;"></div>
             <div style="height: 4px; flex: 1; background: ${pipelinestep >= 5 ? 'var(--success)' : 'var(--line-light)'}; border-radius: 2px;"></div>
           </div>
           `;
        } else {
           pipelineHTML = `<p style="color: var(--danger); font-size: 0.8rem; margin: 4px 0 0;">Application Rejected</p>`;
        }

        div.innerHTML = `
          <div style="flex: 1;">
            <p style="margin: 0; font-weight: 600;">${app.job_title}</p>
            <p style="margin: 2px 0 0; font-size: 0.85rem; color: var(--ink-light);">${app.company} · Applied: ${app.date}</p>
            ${pipelineHTML}
          </div>
          <div style="margin-left: 16px;">
            <span class="status-badge ${app.status.toLowerCase().replace(/\s+/g, '-')}">${app.status}</span>
          </div>
        `;
        recentAppsList.appendChild(div);
      });
    }

    // Upcoming Interviews
    const interviewsList = document.getElementById("cand-upcoming-interviews");
    if (data.upcoming_interviews.length > 0) {
      interviewsList.innerHTML = "";
      data.upcoming_interviews.forEach(interview => {
        const div = document.createElement("div");
        div.style.padding = "16px";
        div.style.background = "#f8f9fa";
        div.style.borderLeft = "4px solid var(--accent-primary)";
        div.style.marginBottom = "12px";
        div.innerHTML = `
          <p style="margin: 0 0 4px; font-weight: 600;">${interview.job_title}</p>
          <p style="margin: 0 0 8px; font-size: 0.85rem; color: var(--ink-light);">${interview.company}</p>
          <p style="margin: 0; font-family: var(--font-mono); font-size: 0.85rem; color: var(--ink-main);">📅 ${interview.date} · ⏰ ${interview.time}</p>
          <div style="margin-top: 12px; display: flex; gap: 8px;">
            <button class="ghost-btn" style="padding: 4px 12px; font-size: 0.8rem;">Details</button>
            <button style="padding: 4px 12px; font-size: 0.8rem;">Join</button>
          </div>
        `;
        interviewsList.appendChild(div);
      });
    }

  } catch(err) {
    console.error("Failed to load candidate stats", err);
  }
}

async function initDashboard() {
  const user = await fetchCurrentUser(); // from auth.js

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  // Adjust Top Nav dynamically if candidate
  if (user.role === "candidate") {
    const mainNav = document.querySelector(".main-nav");
    if (mainNav) {
      // Add Dashboard and My Applications if not present
      if (!document.getElementById("nav-dashboard-link")) {
        const dashLink = document.createElement("a");
        dashLink.id = "nav-dashboard-link";
        dashLink.href = "dashboard.html";
        dashLink.textContent = "Dashboard";
        dashLink.style.fontWeight = "600";
        mainNav.insertBefore(dashLink, mainNav.firstChild);
      }
    }
    
    accessDeniedEl.hidden = true;
    document.getElementById("candidate-dashboard-content").hidden = false;
    const nameEl = document.getElementById("candidate-name");
    if (nameEl && user.name) {
      nameEl.textContent = user.name.split(" ")[0]; // First name
    }
    await loadCandidateStats();
  } 
  else if (user.role === "recruiter" || user.role === "admin") {
    accessDeniedEl.hidden = true;
    dashboardContentEl.hidden = false;
    const nameEl = document.getElementById("recruiter-name");
    if (nameEl && user.name) {
      nameEl.textContent = user.name.split(" ")[0]; // First name
    }
    await loadMyJobs();
    await loadDashboardStats();
  }
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