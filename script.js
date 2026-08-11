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

  const applyLink = document.createElement("a");
  applyLink.className = "apply-link";
  applyLink.href = job.apply_link || "#";
  applyLink.textContent = "Apply →";

  card.append(top, company, location, skillsList, desc, applyLink);
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
