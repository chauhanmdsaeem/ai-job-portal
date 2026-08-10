# 🤖 AI Job Portal

A full-stack AI-powered job portal designed to connect candidates with relevant job opportunities and help recruiters manage applications.

This project is being developed as a practical learning project to strengthen my skills in **Python, web development, software development, databases, APIs, and AI-assisted application development**.

The project will be developed incrementally. Each feature will be implemented, tested, understood, and documented before moving to the next stage.

---

## 📌 Project Status

**Current Status:** 🚧 In Development

### Current milestone

**Milestone 1 — Job Listing UI**

Currently developing the initial job portal interface using:

- HTML
- CSS
- JavaScript

The current version contains:

- Job portal landing page
- Available jobs section
- Job cards
- Job title
- Company
- Location
- Apply links
- Basic CSS styling

Backend, database, authentication, AI features, and recruiter functionality will be added progressively.

---

# 🎯 Project Goal

The goal of this project is to build a practical job portal that provides two main experiences:

### 👨‍💻 Candidate

Candidates should be able to:

- Create an account
- Create and manage their profile
- Search for jobs
- Filter jobs
- View job details
- Apply for jobs
- Track applications
- Upload resumes
- Receive job recommendations
- Understand why a job is recommended
- Track their application status

### 🏢 Recruiter

Recruiters should be able to:

- Create a recruiter account
- Create company information
- Post jobs
- Edit jobs
- Close job postings
- View applicants
- Review candidate profiles
- Review resumes
- Manage application status
- Search and filter candidates

### 🤖 AI Features

AI functionality will be introduced after the core job portal is working.

Planned AI capabilities include:

- Resume analysis
- Resume-to-job matching
- Candidate-job compatibility scoring
- Skill extraction
- Skill gap identification
- Job recommendations
- Candidate ranking
- Basic AI-assisted career suggestions

AI features will be added only after the underlying application architecture is understood and functional.

---

# 🧠 Learning Objective

This project is not intended to be created entirely through AI-generated code.

The main objective is to understand how a real web application is structured and how its individual components communicate.

During development, AI tools may be used as a coding assistant for:

- Explaining code
- Debugging
- Suggesting solutions
- Explaining errors
- Generating small code examples
- Reviewing implementation

Every AI-assisted implementation should be reviewed and understood before being added to the project.

The objective is:

> **Understand → Implement → Test → Debug → Improve → Commit**

rather than:

> **Generate → Copy → Run**

---

# 🛠️ Planned Technology Stack

The project will be developed in stages so that each technology can be understood before introducing the next one.

## Phase 1 — Frontend Fundamentals

- HTML
- CSS
- JavaScript

Purpose:

Build the basic user interface and understand:

- HTML structure
- CSS selectors
- Classes
- Layout
- Forms
- Buttons
- JavaScript events
- DOM manipulation

---

## Phase 2 — Python Backend

Planned backend:

- Python
- Flask

Purpose:

Learn:

- HTTP requests
- Routes
- Backend logic
- Forms
- Request/response cycle
- Server-side processing

---

## Phase 3 — Database

Initial database:

- SQLite

Later database:

- PostgreSQL

Purpose:

Learn:

- Tables
- Records
- Relationships
- CRUD operations
- SQL queries
- Connecting a Python application to a database

---

## Phase 4 — Authentication

Planned functionality:

- Candidate registration
- Recruiter registration
- Login
- Logout
- Password protection
- User sessions
- Role-based access

Roles:

```text
Candidate
Recruiter
Admin
```

---

## Phase 5 — Job Management

Recruiters will be able to:

```text
Create Job
     ↓
Publish Job
     ↓
Receive Applications
     ↓
Review Candidates
     ↓
Update Application Status
```

Candidates will be able to:

```text
Search Jobs
     ↓
View Job
     ↓
Apply
     ↓
Track Application
```

---

# 🤖 Phase 6 — AI Features

AI features will be introduced after the core application is stable.

## Resume Processing

The system will process a candidate's resume and attempt to identify:

- Name
- Education
- Skills
- Experience
- Projects
- Certifications

---

## Job Matching

The system will compare:

```text
Candidate Profile
        +
Resume
        +
Job Description
        ↓
Matching System
        ↓
Compatibility Score
```

Example:

```text
Python Developer

Python          ✓
HTML            ✓
CSS             ✓
JavaScript      ✓
SQL             ✓
React           Partial

Match Score: 82%
```

The score will be used as an indication of compatibility, not as an absolute hiring decision.

---

## Skill Gap Analysis

Example:

```text
Candidate Skills
----------------
Python
HTML
CSS
JavaScript

Job Requirements
----------------
Python
HTML
CSS
JavaScript
React
SQL
Git

Skill Gaps
----------
React
SQL
Git
```

The system can then provide learning suggestions.

---

# 📁 Planned Project Structure

The project will initially start simple and expand as new functionality is introduced.

```text
ai-job-portal/
│
├── README.md
│
├── frontend/
│   │
│   ├── index.html
│   ├── style.css
│   └── script.js
│
├── backend/
│   │
│   ├── app.py
│   │
│   ├── routes/
│   │   ├── auth.py
│   │   ├── jobs.py
│   │   ├── applications.py
│   │   └── users.py
│   │
│   ├── models/
│   │   ├── user.py
│   │   ├── job.py
│   │   └── application.py
│   │
│   ├── services/
│   │   ├── resume_parser.py
│   │   ├── job_matcher.py
│   │   └── skill_analyzer.py
│   │
│   └── utils/
│       └── helpers.py
│
├── database/
│   ├── schema.sql
│   └── seed.sql
│
├── data/
│   ├── jobs.json
│   └── sample_resumes/
│
├── tests/
│   ├── test_auth.py
│   ├── test_jobs.py
│   └── test_matching.py
│
├── docs/
│   ├── architecture.md
│   ├── api.md
│   └── database.md
│
└── .gitignore
```

> The folder structure will evolve during development. Files should only be created when their functionality is actually introduced.

---

# 🖥️ Frontend Structure

The first version is intentionally simple.

```text
frontend/
│
├── index.html
├── style.css
└── script.js
```

### index.html

Responsible for:

- Page structure
- Navigation
- Search area
- Job listings
- Job cards
- Buttons and links

### style.css

Responsible for:

- Colors
- Typography
- Spacing
- Layout
- Cards
- Buttons
- Responsive design

### script.js

Initially responsible for:

- Search
- Job filtering
- Button interactions
- DOM manipulation

Later it will communicate with the Python backend through APIs.

---

# 💾 Database Design

The initial database will be kept simple.

## Users

```text
users
-----------------------
id
name
email
password
role
created_at
```

Possible roles:

```text
candidate
recruiter
admin
```

---

## Jobs

```text
jobs
-----------------------
id
title
company
location
description
skills
salary
job_type
created_by
created_at
```

---

## Applications

```text
applications
-----------------------
id
job_id
candidate_id
resume
status
applied_at
```

Possible application statuses:

```text
Applied
Under Review
Shortlisted
Interview
Rejected
Selected
```

---

# 🔄 Application Flow

## Candidate

```text
Register
   ↓
Login
   ↓
Create Profile
   ↓
Search Jobs
   ↓
View Job
   ↓
Apply
   ↓
Track Application
```

## Recruiter

```text
Register
   ↓
Login
   ↓
Create Company Profile
   ↓
Post Job
   ↓
Receive Applications
   ↓
Review Candidates
   ↓
Update Status
```

---

# 🔌 Planned API Structure

After the Flask backend is introduced, the application will use API endpoints.

## Authentication

```text
POST /api/register
POST /api/login
POST /api/logout
```

## Jobs

```text
GET    /api/jobs
GET    /api/jobs/<id>
POST   /api/jobs
PUT    /api/jobs/<id>
DELETE /api/jobs/<id>
```

## Applications

```text
POST /api/jobs/<id>/apply
GET  /api/applications
GET  /api/applications/<id>
PUT  /api/applications/<id>
```

## Candidate

```text
GET  /api/profile
PUT  /api/profile
```

These endpoints are planned and will be implemented gradually.

---

# 🔐 Security Considerations

As the project develops, basic security practices will be introduced.

Planned areas include:

- Password hashing
- Input validation
- Authentication
- Authorization
- Session management
- Secure file handling
- Environment variables
- API validation
- Protection against common web vulnerabilities

Sensitive configuration should never be committed to GitHub.

Example:

```text
.env
```

should be included in:

```text
.gitignore
```

---

# 🧪 Testing Strategy

Testing will be introduced gradually.

### Frontend

Test:

- Navigation
- Search
- Filtering
- Buttons
- Forms
- Responsive layout

### Backend

Test:

- Registration
- Login
- Job creation
- Job retrieval
- Applications
- Authentication
- Authorization

### AI

Test:

- Resume extraction
- Skill extraction
- Matching results
- Score calculation
- Edge cases

---

# 📊 Sample Job Data

The first version can use static data while the backend is not yet available.

Example:

```text
Job 1
-----------------------
Title: Python Developer
Company: XYZ Technologies
Location: Bengaluru
Skills: Python, SQL, Git
Type: Full-time


Job 2
-----------------------
Title: Software Developer
Company: ABC Technologies
Location: Hyderabad
Skills: Java, SQL, Git
Type: Full-time


Job 3
-----------------------
Title: Frontend Developer
Company: DEF Solutions
Location: Chennai
Skills: HTML, CSS, JavaScript
Type: Full-time


Job 4
-----------------------
Title: Java Developer
Company: GHI Technologies
Location: Mumbai
Skills: Java, SQL, OOP
Type: Full-time
```

---

# 🗺️ Development Roadmap

## Milestone 1 — Job Listing UI

Status: 🚧 In Progress

- [x] Create project folder
- [x] Create HTML file
- [x] Create CSS file
- [x] Create basic page structure
- [x] Create job cards
- [x] Add job title
- [x] Add company
- [x] Add location
- [x] Add Apply links
- [ ] Improve styling
- [ ] Responsive design

---

## Milestone 2 — JavaScript Interaction

- [ ] Search jobs
- [ ] Filter by location
- [ ] Filter by job type
- [ ] Dynamic job cards
- [ ] Apply button interaction

---

## Milestone 3 — Python Backend

- [ ] Set up Python
- [ ] Set up Flask
- [ ] Create first route
- [ ] Connect frontend to Flask
- [ ] Create job API
- [ ] Retrieve jobs from backend

---

## Milestone 4 — Database

- [ ] Set up SQLite
- [ ] Create tables
- [ ] Insert sample jobs
- [ ] Read jobs from database
- [ ] Add new jobs
- [ ] Update jobs
- [ ] Delete jobs

---

## Milestone 5 — Authentication

- [ ] Candidate registration
- [ ] Recruiter registration
- [ ] Login
- [ ] Logout
- [ ] Password hashing
- [ ] Role-based access

---

## Milestone 6 — Candidate Features

- [ ] Candidate dashboard
- [ ] Candidate profile
- [ ] Resume upload
- [ ] Search jobs
- [ ] Apply for jobs
- [ ] Application tracking

---

## Milestone 7 — Recruiter Features

- [ ] Recruiter dashboard
- [ ] Company profile
- [ ] Create job
- [ ] Edit job
- [ ] Delete/close job
- [ ] View applicants
- [ ] Update application status

---

## Milestone 8 — AI Resume Analysis

- [ ] Resume upload
- [ ] Resume text extraction
- [ ] Skill extraction
- [ ] Education extraction
- [ ] Experience extraction

---

## Milestone 9 — AI Job Matching

- [ ] Extract job requirements
- [ ] Compare candidate skills
- [ ] Calculate matching score
- [ ] Display matched skills
- [ ] Display missing skills
- [ ] Generate recommendations

---

## Milestone 10 — Testing & Security

- [ ] Validate forms
- [ ] Test APIs
- [ ] Test authentication
- [ ] Test authorization
- [ ] Handle errors
- [ ] Secure environment variables
- [ ] Test AI edge cases

---

## Milestone 11 — Deployment

Planned deployment after the application is stable.

Possible deployment components:

```text
Frontend
   ↓
Web Hosting

Backend
   ↓
Python Hosting

Database
   ↓
PostgreSQL
```

The actual deployment services will be selected after the application is working locally.

---

# 🌱 Development Principles

This project follows several principles.

### 1. Build before expanding

A small working feature is better than a large unfinished feature.

### 2. Understand the code

Every major implementation should be understood before moving forward.

### 3. No unnecessary technologies

A technology should be introduced because the project needs it, not simply because it is popular.

### 4. Test every milestone

Each milestone should work before the next one begins.

### 5. Use Git properly

Commits should describe meaningful changes.

Examples:

```text
feat: create job listing page
style: add job card styling
feat: add job search
feat: connect Flask backend
feat: add job database
```

### 6. AI as an assistant

AI can help with:

- Learning
- Debugging
- Explanations
- Code review
- Small implementation tasks

But the developer should understand the resulting code.

---

# 📌 Git Workflow

Recommended workflow:

```bash
git status

git add .

git commit -m "feat: create job listing page"

git push origin main
```

Each meaningful milestone should have its own commit.

---

# 🚀 Future Improvements

After the core application works, possible improvements include:

- Better AI matching
- Resume ranking
- Personalized job recommendations
- Email notifications
- Recruiter analytics
- Candidate analytics
- Saved jobs
- Application reminders
- Interview scheduling
- Admin dashboard
- Advanced job filtering
- Location-based recommendations
- Learning recommendations based on skill gaps

These features are **future possibilities**, not part of the initial implementation.

---

# 📚 What I Expect to Learn From This Project

By completing this project, I aim to improve my understanding of:

- HTML
- CSS
- JavaScript
- Python
- Flask
- SQL
- Databases
- CRUD operations
- Authentication
- APIs
- Git and GitHub
- Web application architecture
- AI/ML integration
- Debugging
- Testing
- Deployment

---

# 👨‍💻 Project Approach

This project is being built as a learning-focused software project.

The objective is not simply to produce a large application. The objective is to understand how the application works from the user interface to the backend, database, APIs, and AI components.

The project will therefore be developed incrementally, with each feature implemented and tested before moving to the next stage.

---

## ⭐ Final Goal

Build a working AI-powered job portal that demonstrates:

```text
Frontend
   ↓
Backend
   ↓
Database
   ↓
Authentication
   ↓
Job Management
   ↓
Applications
   ↓
Resume Processing
   ↓
AI Matching
   ↓
Deployment
```

The final application should be something that can be demonstrated to recruiters as a practical software-development project and explained clearly during interviews.

---

## 📄 License

This project is created for educational and portfolio purposes.