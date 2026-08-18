<div align="center">

# 🔮 Fieldnote: AI-Powered Job Portal

**A Premium Full-Stack Platform Integrating Generative AI with High-End Web Design**

[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![Flask](https://img.shields.io/badge/Flask-3.0.0-lightgrey.svg)](https://flask.palletsprojects.com/)
[![Gemini API](https://img.shields.io/badge/AI-Google_Gemini-orange.svg)](https://deepmind.google/technologies/gemini/)
[![Vanilla JS](https://img.shields.io/badge/JavaScript-Vanilla-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![CSS](https://img.shields.io/badge/CSS3-Dark_Mode_Ready-purple.svg)](https://developer.mozilla.org/en-US/docs/Web/CSS)

[Features](#-key-features) • [Tech Stack](#-core-tech-stack) • [Installation](#-quick-start) • [Architecture](#-architecture)

</div>

---

Fieldnote is a high-performance, full-stack job portal designed to demonstrate advanced **Python Backend Engineering**, **Generative AI Integration**, and **Premium UI/UX Design**. Built with a strict Bauhaus-inspired 1px grid aesthetic and fluid animations, it acts as a sandbox for evaluating LLM orchestration, custom AI wrappers, and rapid API development.

---

## ✨ Key Features

### 🎨 Premium UI & Global Dark Mode
- **Zero-FOUC Dark Mode:** A seamlessly integrated dark/light theme switch globally applied across all pages with zero "Flash of Unstyled Content" on load.
- **Micro-animations & Glowing Elements:** Carefully crafted button hovers, dynamic SVG paths, and glowing UI snippets for a futuristic, high-end feel.
- **Scroll-to-Top Integration:** A sleek floating widget that dynamically appears when navigating long lists.

### 🤖 Generative AI Integrations (Powered by Google Gemini)
- **Magic AI Job Descriptions:** Recruiters can auto-generate highly detailed, professional Job Descriptions (JDs) with a single click.
- **AI Resume Analysis:** Recruiters can use the "Magic AI" button on candidate profiles to instantly evaluate their resume against the job requirements and get an AI-driven compatibility summary.
- **AI Job Matching:** Candidates receive personalized AI match scores and job recommendations based on their uploaded profile and skills.
- **Floating AI Chatbot:** A persistent, context-aware chatbot widget globally available to assist candidates and recruiters with navigation, job tips, and portal queries.

### 👨‍💼 For Candidates
- Browse, search, and filter jobs with live UI updates (powered by true Server-Side Pagination).
- Centralized Candidate Dashboard tracking applications, saved jobs, and AI match scores.
- "Master Resume" profile builder.

### 🏢 For Recruiters
- Dashboard tracking active jobs, total applications, and hiring pipeline metrics.
- Create, edit, and manage job postings.
- Review applications, update statuses (Shortlist, Interview, Hire), and analyze resumes with AI.

---

## 🔒 Enterprise Security & Performance Upgrades
Recent updates driven by a rigorous QA audit have significantly hardened the platform:
- **Two-Factor Authentication (2FA):** OTP-based 2FA integration for all logins and registrations.
- **CSRF Protection:** Integrated `SameSite=Strict` policies and a unified `fetch` interceptor validating dynamic `X-CSRF-Token`s.
- **Brute-Force Rate Limiting:** Custom `@brute_force_limit` throttles authentication endpoints, protecting against credential stuffing.
- **Strict File Upload Validation:** Enforced 5MB limits and robust MIME-type validation for resume PDF uploads, mitigating DoS & XSS vectors.
- **Server-Side Pagination:** Replaced legacy in-memory filtering with highly scalable SQL `LIMIT/OFFSET` pagination on the job feed.

---

## 🧠 Core Tech Stack

- **Backend**: Python 3, Flask, REST APIs
- **Generative AI**: Google Gemini API, Custom LLM Wrappers, Prompt Engineering
- **Data & Storage**: SQLite (with PostgreSQL-ready schemas)
- **Frontend**: Vanilla JavaScript, Custom CSS Variables, HTML5
- **Security**: Werkzeug password hashing, Secure HttpOnly sessions

---

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Modern web browser

### Installation & Setup

**1. Clone the repository**
```bash
git clone https://github.com/chauhanmdsaeem/ai-job-portal.git
cd ai-job-portal
```

**2. Create a Python virtual environment**
```bash
python -m venv venv

# On Windows:
venv\Scripts\activate

# On macOS/Linux:
source venv/bin/activate
```

**3. Install dependencies**
```bash
pip install -r requirements.txt
# Alternatively: pip install flask werkzeug requests
```

**4. Initialize the database**
```bash
python database/seed.py
```
*This creates `database/job_portal.db` and seeds it with sample jobs and test accounts.*

**5. Start the Server**
```bash
python backend/app.py
```
The server will run at: `http://127.0.0.1:5000/`

### Test Accounts
- **Candidate:** `candidate@example.com` / `password123`
- **Recruiter:** `recruiter@example.com` / `password123`

---

## 🏗️ Architecture

```text
Browser (Frontend)
    │ (Vanilla JS, Fetch API, Global Dark Mode, Animations)
    ↓ HTTP/JSON
Flask Backend (Python)
    ├── Routes (Auth, Jobs, Applications, AI Chat, AI Analysis)
    ├── Models (User, Job, Application)
    └── Integrations (Google Gemini API Wrapper)
    ↓ SQL
SQLite Database
    ├── Users (candidates, recruiters, admins)
    ├── Jobs (postings with owner info)
    └── Applications (candidate applications)
```

---

## 📁 Project Structure

```text
ai-job-portal/
├── frontend/                     # User Interface
│   ├── index.html               # Landing page & job listings
│   ├── dashboard.html           # Candidate/recruiter dashboards
│   ├── style.css                # CSS variables, animations, dark mode
│   ├── script.js                # Core UI functionality
│   ├── auth.js                  # Authentication & Nav rendering
│   └── chatbot.js               # Floating AI chatbot widget logic
│
├── backend/                      # Server & API
│   ├── app.py                   # Flask application entry point
│   ├── db.py                    # Database connection wrapper
│   ├── routes/                  # API endpoints (auth, jobs, ai)
│   └── utils/                   # Authentication & LLM helpers
│
└── database/                     # Data Layer
    ├── schema.sql               # Table definitions
    └── seed.py                  # Sample data initialization
```

---

## 🔐 Security Features

- ✅ **Password hashing** using `werkzeug.security` with salts.
- ✅ **Session-based authentication** with signed, HttpOnly cookies preventing XSS token theft.
- ✅ **Role-Based Access Control (RBAC)** ensuring candidate/recruiter isolation.
- ✅ **Ownership validation** to ensure recruiters can only modify their own postings.
- ✅ **Input sanitization** against common injection attacks.

---

> *"Good design makes a product useful. Every pixel must earn its place on the screen."*
