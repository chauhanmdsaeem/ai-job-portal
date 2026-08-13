# 🤖 AI Job Portal

A full-stack job portal connecting candidates with opportunities and helping recruiters manage applications.

**Current Status:** ✅ **Fully Functional** (9/11 Phases Complete)  
**Latest Features:** AI Resume Analysis, AI Job Matching, Candidate Profiles

This is a **practical learning project** demonstrating full-stack development: frontend (HTML/CSS/JS), backend (Python/Flask), database (SQLite), and authentication.

**For detailed progress:** See [PROJECT_STATUS_REPORT.md](PROJECT_STATUS_REPORT.md)

---

## 📌 Current Status

**Overall Progress:** 9 out of 11 Phases Complete (81%)

### ✅ Completed Milestones

| Phase | Status | Description |
|-------|--------|-------------|
| **1** | ✅ Complete | Frontend UI (HTML/CSS/JavaScript) |
| **2** | ✅ Complete | Python Flask Backend |
| **3** | ✅ Complete | SQLite Database |
| **4** | ✅ Complete | User Authentication & Authorization |
| **5** | ✅ Complete | Job Management (CRUD) |
| **6** | ✅ Complete | Candidate Features (Applications, Profile, Tracking) |
| **7** | ✅ Complete | Recruiter Features (Application Management) |
| **8** | ✅ Complete | AI Resume Analysis |
| **9** | ✅ Complete | AI Job Matching & Recommendations |
| **10** | ✅ Complete | Testing & Security |
| **11** | ⏳ Planned | Deployment |

---

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- pip (Python package manager)
- Modern web browser

### Installation & Setup

**1. Clone the repository**
```bash
git clone <repo-url>
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
pip install flask werkzeug
```

**4. Initialize the database**
```bash
python database/seed.py
```

This creates `database/job_portal.db` and seeds it with sample jobs and test accounts.

**5. Start the Flask server**
```bash
python backend/app.py
```

The server will run at: `http://127.0.0.1:5000/`

### Test Accounts

After seeding, use these accounts to explore:

**Candidate Account:**
- Email: `candidate@example.com`
- Password: `password123`

**Recruiter Account:**
- Email: `recruiter@example.com`
- Password: `password123`

---

## 💻 What Works Now

### For Candidates
- ✅ Create account (registration)
- ✅ Log in securely
- ✅ Browse all available jobs
- ✅ **Search jobs** by title, company, or skills
- ✅ **Filter jobs** by location and job type
- ✅ View detailed job information
- ✅ Access candidate dashboard
- ✅ Save "Master Resume" to Profile
- ✅ Apply to jobs and track application status
- ✅ See AI-driven Job Match Scores before applying
- ✅ Get AI Job Recommendations based on profile

### For Recruiters
- ✅ Create recruiter account
- ✅ Log in securely
- ✅ **Create job postings** with full details
- ✅ **Edit own jobs**
- ✅ Delete/close jobs
- ✅ View recruiter dashboard
- ✅ See all posted jobs
- ✅ Review candidate applications
- ✅ Change application status (Shortlist, Reject, etc.)
- ✅ Use AI to analyze candidate resumes against job requirements

### System-Wide
- ✅ Secure password hashing
- ✅ Session-based authentication
- ✅ Role-based access control (candidate/recruiter/admin)
- ✅ SQLite database with persistent data
- ✅ RESTful JSON API
- ✅ Responsive design (mobile-friendly)

---

## 🏗️ Architecture

```
Browser (Frontend)
    ↓ HTTP/JSON
    ↓
Flask Backend (Python)
    ├── Routes (auth, jobs, applications)
    ├── Models (user, job, application)
    └── Utils (authentication, validation)
    ↓ SQL
    ↓
SQLite Database
    ├── users (candidates, recruiters, admins)
    ├── jobs (postings with owner info)
    └── applications (candidate applications)
```

---

## 📁 Project Structure

```
ai-job-portal/
├── README.md                     # This file
├── PROJECT_STATUS_REPORT.md      # Detailed progress report
│
├── frontend/                     # User Interface
│   ├── index.html               # Landing page & job listings
│   ├── login.html               # Login form
│   ├── register.html            # Registration form
│   ├── dashboard.html           # Candidate/recruiter dashboard
│   ├── applications.html        # Application tracking
│   ├── style.css                # Styling & responsive layout
│   ├── script.js                # Main functionality
│   ├── auth.js                  # Authentication logic
│   ├── auth-forms.js            # Form handlers
│   └── dashboard.js             # Dashboard functionality
│
├── backend/                      # Server & API
│   ├── app.py                   # Flask application
│   ├── db.py                    # Database wrapper
│   │
│   ├── routes/
│   │   ├── auth.py              # Auth endpoints
│   │   ├── jobs.py              # Job endpoints
│   │   └── applications.py      # Application endpoints
│   │
│   ├── models/
│   │   ├── user.py              # User management
│   │   ├── job.py               # Job management
│   │   └── application.py       # Application management
│   │
│   └── utils/
│       └── auth_utils.py        # Authentication decorators
│
├── database/                     # Data Layer
│   ├── schema.sql               # Table definitions
│   ├── seed.py                  # Sample data & initialization
│   └── job_portal.db            # SQLite database (created by seed.py)
│
└── data/
    └── Jobs.json                # Reference job data
```

---

## 🔌 API Endpoints

### Authentication
```
POST   /api/register     Create account
POST   /api/login        Log in
POST   /api/logout       Log out
GET    /api/me           Get current user info
```

### Jobs
```
GET    /api/jobs                    List all jobs (with optional filters)
GET    /api/jobs?location=&job_type=&q=   Search/filter jobs
GET    /api/jobs/<id>               Get job details
POST   /api/jobs                    Create job (recruiter/admin only)
PUT    /api/jobs/<id>               Update job (owner/admin only)
DELETE /api/jobs/<id>               Delete job (owner/admin only)
GET    /api/my-jobs                 Get recruiter's own jobs
```

### Applications (Coming Soon)
```
POST   /api/jobs/<id>/apply         Apply for a job
GET    /api/applications            List user's applications
GET    /api/applications/<id>       Get application details
PUT    /api/applications/<id>       Update application status
```

---

## 🎯 Current User Flows

### Candidate: Search & View Jobs
```
Register as Candidate
    ↓
Log In
    ↓
View All Jobs
    ↓
Search/Filter by Title, Location, Skills, Type
    ↓
View Job Details
    ↓
(Soon) Apply for Job
```

### Recruiter: Post & Manage Jobs
```
Register as Recruiter
    ↓
Log In
    ↓
Create Job Posting
    ↓
Recruiter Dashboard: View All Posted Jobs
    ↓
Edit Job Details
    ↓
Close/Delete Job 
    ↓
Review Applications (Change Status)
    ↓
Use AI to Analyze Resumes
```

---

## 🎓 Learning Outcomes Achieved

### Frontend
- ✅ HTML semantic structure
- ✅ CSS layout (grid, flexbox, responsive design)
- ✅ JavaScript DOM manipulation
- ✅ Event handling and form handling
- ✅ API communication from frontend
- ✅ Session/cookie management

### Backend
- ✅ Flask framework and blueprints
- ✅ RESTful API design
- ✅ HTTP methods and status codes
- ✅ Request/response handling
- ✅ Modular route organization

### Database
- ✅ Relational database design
- ✅ SQL table creation
- ✅ Foreign key relationships
- ✅ CRUD operations
- ✅ Database integration with Python/Flask

### Authentication & Security
- ✅ Password hashing (werkzeug.security)
- ✅ Session-based authentication
- ✅ Role-based access control (RBAC)
- ✅ Authorization and ownership validation
- ✅ Secure cookie handling

---

## 🗺️ Development Roadmap

---

### Next Steps (Planned)

**Phase 6 — Candidate Features** (Complete)
- [x] Resume upload functionality
- [x] Submit job applications
- [x] Application tracking & status updates
- [x] View application history

**Phase 7 — Recruiter Features** (Complete)
- [x] View candidate applications
- [x] Review candidate profiles
- [x] Update application status (shortlist, interview, reject, hire)
- [x] Filter and sort applications

**Phase 8-9 — AI Features** (Complete)
- [x] Resume text extraction
- [x] Resume skill analysis
- [x] Job requirement matching
- [x] Compatibility scoring
- [x] Job recommendations

**Phase 10-11 — Polish & Deploy** (Planned)
- [ ] Automated testing
- [ ] Security hardening
- [ ] Cloud deployment (Heroku/AWS/DigitalOcean)
- [ ] Performance optimization

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | HTML5, CSS3, JavaScript (ES6) | User interface |
| **Backend** | Python, Flask | Server & API |
| **Database** | SQLite (dev), PostgreSQL (planned) | Data persistence |
| **Auth** | werkzeug.security | Password hashing & verification |
| **Session** | Flask session with signed cookies | User state management |

---

## 📚 Database Schema

### Users Table
```sql
id              INTEGER PRIMARY KEY
name            TEXT NOT NULL
email           TEXT NOT NULL UNIQUE
password_hash   TEXT NOT NULL
role            TEXT (candidate/recruiter/admin)
created_at      TEXT (timestamp)
```

### Jobs Table
```sql
id          INTEGER PRIMARY KEY
title       TEXT NOT NULL
company     TEXT NOT NULL
location    TEXT NOT NULL
description TEXT
skills      TEXT (comma-separated)
salary      TEXT
job_type    TEXT (Full-time/Part-time/Contract/Remote)
created_by  INTEGER FOREIGN KEY (users.id)
created_at  TEXT (timestamp)
```

### Applications Table
```sql
id              INTEGER PRIMARY KEY
job_id          INTEGER FOREIGN KEY (jobs.id)
candidate_id    INTEGER FOREIGN KEY (users.id)
resume          TEXT
status          TEXT (Applied/Under Review/Shortlisted/Interview/Rejected/Selected)
applied_at      TEXT (timestamp)
```

---

## 🔐 Security Features

### Currently Implemented
- ✅ Password hashing with salt
- ✅ Session-based authentication
- ✅ Signed session cookies (cannot be forged)
- ✅ Role-based access control
- ✅ Ownership validation (recruiters can only edit their own jobs)
- ✅ Input validation

### Best Practices Followed
- Database uses parameterized queries
- Passwords are hashed, never stored plain text
- Sessions expire automatically
- Each route checks user permissions before allowing action
- User IDs are stored in signed session cookies

---

## 🧪 Testing

To test the application manually:

1. **Test Registration:**
   - Try creating a candidate account
   - Try creating a recruiter account
   - Verify email uniqueness constraint

2. **Test Authentication:**
   - Log in with correct credentials
   - Try wrong password (should fail)
   - Try non-existent email (should fail)
   - Verify logout clears session

3. **Test Job Listing:**
   - Verify all jobs display on homepage
   - Test search functionality
   - Test location filter
   - Test job type filter
   - Click on job to view details

4. **Test Job Management (Recruiter):**
   - Create a new job
   - Edit the job
   - Delete the job
   - Verify recruiter dashboard shows only their jobs

5. **Test Authorization:**
   - Verify recruiters can only edit/delete their own jobs
   - Try accessing recruiter endpoints as candidate (should fail)

---

- **Resume Analysis:** Extract skills, education, experience, projects
- **Job Matching:** Compare candidate profiles to job requirements
- **Compatibility Scoring:** Rate how well a candidate fits a job
- **Skill Gap Analysis:** Identify missing skills for a role
- **Recommendations:** Suggest jobs based on candidate profile

---

## 💡 Development Principles

This project follows specific principles:

1. **Build Small, Build Working** — Each phase is complete and tested before the next begins
2. **Understand the Code** — Every feature is implemented with clear understanding, not just copied
3. **Clean Architecture** — Separated frontend, backend, and database layers
4. **Proper Git Workflow** — Each milestone has meaningful commits
5. **Learn While Building** — The goal is to understand full-stack development
6. **Use Git Properly** — Commits describe actual changes

---

## 📖 How to Contribute or Extend

### Adding a New Feature

1. Create a branch: `git checkout -b feature/your-feature`
2. Make changes and test thoroughly
3. Commit with clear message: `git commit -m "feat: add your feature"`
4. Submit for review or merge to main

### Code Style
- Use descriptive variable names
- Add docstrings to functions
- Keep functions small and focused
- Organize imports alphabetically
- Use consistent indentation (4 spaces Python, 2 spaces JS)

---

## 🚀 Deployment (Planned)

When ready for production:

### Frontend
- Static file hosting (Vercel, Netlify, or AWS S3)
- CDN for assets

### Backend
- Python hosting (Heroku, PythonAnywhere, or AWS)
- Environment variables for secrets
- Database migrations

### Database
- PostgreSQL for production
- Automated backups
- Connection pooling

---

## 📝 License

This project is created for educational and portfolio purposes.

---

## 🙋 Questions? Issues?

If you encounter problems:

1. Check that Flask is running: `python backend/app.py`
2. Verify database exists: `database/job_portal.db`
3. Ensure you're using test accounts from seeding
4. Check browser console for JavaScript errors (F12)
5. Check terminal for Flask errors

---

## 📌 Quick Reference

**Start development:**
```bash
source venv/bin/activate  # or venv\Scripts\activate on Windows
python backend/app.py
# Open http://127.0.0.1:5000/
```

**Reset database:**
```bash
rm database/job_portal.db
python database/seed.py
```

**View in browser:**
```bash
http://127.0.0.1:5000/           # Homepage
http://127.0.0.1:5000/register   # Registration
http://127.0.0.1:5000/login      # Login
http://127.0.0.1:5000/dashboard  # Dashboard
```

---

**Status:** ✅ Production-Ready (Current Features)  
**Last Updated:** August 13, 2026  
**Next Phase:** Testing & Security