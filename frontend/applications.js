/* =========================================================
   applications.js
   -------------------------------------------------------
   Fetches and renders the current candidate's applications
   from GET /api/applications.
   ========================================================= */

const applicationsListEl = document.getElementById("applications-list");
const emptyStateEl = document.getElementById("empty-state");
const accessDeniedEl = document.getElementById("access-denied");
const resultsCountEl = document.getElementById("results-count");

function getStatusClass(status) {
  const normalized = status.toLowerCase().replace(" ", "-");
  return `status-${normalized}`;
}

function createApplicationCard(app) {
  const card = document.createElement("article");
  card.className = "application-card";

  const top = document.createElement("div");
  top.className = "application-top";

  const title = document.createElement("h3");
  title.textContent = app.job_title;

  const statusPill = document.createElement("span");
  statusPill.className = `status-pill ${getStatusClass(app.status)}`;
  statusPill.textContent = app.status;

  top.append(title, statusPill);

  const meta = document.createElement("p");
  meta.className = "application-meta";
  meta.textContent = `${app.job_company} — ${app.job_location}`;

  const dateStr = new Date(app.applied_at).toLocaleDateString(undefined, {
    year: "numeric", month: "short", day: "numeric"
  });

  const dateEl = document.createElement("p");
  dateEl.className = "application-date";
  dateEl.textContent = `Applied on ${dateStr}`;

  card.append(top, meta, dateEl);

  if (app.job_status && app.job_status !== "open") {
    const closedNote = document.createElement("p");
    closedNote.className = "application-closed-note";
    closedNote.textContent = "This job posting is no longer open.";
    card.append(closedNote);
  }

  return card;
}

async function initApplicationsDashboard() {
  const user = await fetchCurrentUser();
  
  if (!user || user.role !== "candidate") {
    accessDeniedEl.hidden = false;
    applicationsListEl.hidden = true;
    return;
  }

  try {
    const res = await fetch("/api/applications");
    if (!res.ok) {
      throw new Error(`Failed to fetch applications: ${res.status}`);
    }
    
    const applications = await res.json();
    
    if (applications.length === 0) {
      emptyStateEl.hidden = false;
      resultsCountEl.textContent = "0 applications";
      return;
    }

    resultsCountEl.textContent = `${applications.length} application${applications.length === 1 ? "" : "s"}`;
    
    const fragment = document.createDocumentFragment();
    applications.forEach(app => fragment.appendChild(createApplicationCard(app)));
    applicationsListEl.appendChild(fragment);

  } catch (err) {
    console.error("Could not load applications:", err);
    alert("Could not load your applications. Please try again later.");
  }
}

document.addEventListener("DOMContentLoaded", initApplicationsDashboard);
