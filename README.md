<div align="center">

# 🔮 Fieldnote: AI-Powered Job Portal

**A Premium Full-Stack Platform Integrating Generative AI with High-End Web Design**

[![Live Demo](https://img.shields.io/badge/Live_Demo-fieldnote--ai.onrender.com-success.svg?style=for-the-badge)](https://fieldnote-ai.onrender.com/)

[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![Flask](https://img.shields.io/badge/Flask-3.0.0-lightgrey.svg)](https://flask.palletsprojects.com/)
[![Groq AI](https://img.shields.io/badge/AI-Groq_Cloud-orange.svg)](https://groq.com/)
[![PostgreSQL](https://img.shields.io/badge/Database-Supabase-green.svg)](https://supabase.com/)

[Live Website](#-live-website) • [Features](#-key-features) • [Tech Stack](#-core-tech-stack) • [Installation](#-quick-start)

</div>

---

Fieldnote is a high-performance, full-stack job portal designed to demonstrate advanced **Python Backend Engineering**, **Generative AI Integration**, and **Premium UI/UX Design**. Built with a strict Bauhaus-inspired 1px grid aesthetic and fluid animations, it acts as a platform for smart job matching, AI-driven resume tailoring, and instant recruiter tooling.

---

## 🌐 Live Website

**[Click here to visit the live platform: fieldnote-ai.onrender.com](https://fieldnote-ai.onrender.com/)**

**What is it for?**
- **Job Seekers:** Create an account to upload your resume, get AI-driven match scores on real job listings, and use the floating AI assistant to automatically tailor your resume.
- **Recruiters:** Register as a recruiter to create job postings with a single click using AI generation, analyze applicant resumes instantly, and manage your hiring pipeline.

*(Note: The platform is currently live for demonstration purposes. Feel free to register and test the AI features!)*

---

## ✨ Key Features

### 🤖 Lightning-Fast Generative AI (Powered by Groq)
- **Magic AI Job Descriptions:** Recruiters can auto-generate highly detailed, professional Job Descriptions (JDs) with a single click.
- **AI Resume Analysis:** Recruiters can use the "Magic AI" button on candidate profiles to instantly evaluate their resume against the job requirements and get an AI-driven compatibility summary.
- **AI Job Matching:** Candidates receive personalized AI match scores and job recommendations based on their uploaded profile and skills.
- **Floating AI Chatbot:** A persistent, context-aware chatbot widget globally available to assist candidates and recruiters with navigation, job tips, and portal queries.

### 🎨 Premium UI & Global Dark Mode
- **Zero-FOUC Dark Mode:** A seamlessly integrated dark/light theme switch globally applied across all pages with zero "Flash of Unstyled Content" on load.
- **Micro-animations & Glowing Elements:** Carefully crafted button hovers, dynamic SVG paths, and glowing UI snippets for a futuristic, high-end feel.
- **Scroll-to-Top Integration:** A sleek floating widget that dynamically appears when navigating long lists.

### 🔒 Enterprise Security & Performance
- **Seamless Authentication:** Custom session management using signed, HttpOnly cookies to protect against XSS and token hijacking.
- **Robust Connection Pooling:** Built for scale with resilient PostgreSQL transaction pooling handling auto-reconnects.
- **Brute-Force Rate Limiting:** Custom `@brute_force_limit` throttles authentication endpoints.
- **Server-Side Pagination:** Highly scalable SQL `LIMIT/OFFSET` pagination on the job feed.

---

## 🧠 Core Tech Stack

- **Backend**: Python 3, Flask, REST APIs
- **Generative AI**: Groq Cloud API (Llama 3 / Qwen models)
- **Data & Storage**: Supabase PostgreSQL
- **Frontend**: Vanilla JavaScript, Custom CSS Variables, HTML5
- **Security**: Werkzeug password hashing, Secure HttpOnly sessions

---

## 🚀 Local Quick Start

### Prerequisites
- Python 3.8+
- Supabase Project (or local PostgreSQL)
- Groq API Key

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
```

**4. Set up Environment Variables**
Create a `.env` file in the root directory:
```env
DATABASE_URL=postgresql://[user]:[password]@[pooler-host]:6543/postgres
GROQ_API_KEY=your_groq_api_key_here
```

**5. Start the Server**
```bash
python backend/app.py
```
The server will run at: `http://127.0.0.1:5000/`

---

## 🏗️ Architecture

```text
Browser (Frontend)
    │ (Vanilla JS, Fetch API, Global Dark Mode, Animations)
    ↓ HTTP/JSON
Flask Backend (Python)
    ├── Routes (Auth, Jobs, Applications, AI Chat, AI Analysis)
    ├── Models (User, Job, Application)
    └── Integrations (Groq AI)
    ↓ SQL (psycopg2)
Supabase PostgreSQL
    ├── Users (candidates, recruiters)
    ├── Jobs (postings with owner info)
    └── Applications (candidate applications)
```

---

> *"Good design makes a product useful. Every pixel must earn its place on the screen."*
