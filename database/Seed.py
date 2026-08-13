"""
database/seed.py
---------------------------------------------------------
Massive Realistic Data Seeding for Fieldnote Job Portal
Adds 5 recruiters, 5 candidates, 20 jobs, and multiple applications.
"""
import json
import sqlite3
import random
from pathlib import Path

from werkzeug.security import generate_password_hash

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DB_PATH = PROJECT_ROOT / "database" / "job_portal.db"
SCHEMA_PATH = PROJECT_ROOT / "database" / "schema.sql"

CANDIDATES = [
    {"name": "Alice Developer", "email": "alice@example.com", "password": "password123", "role": "candidate", "resume": "Experienced Python Developer with 5 years in Django and Flask. Expert in building scalable APIs and deploying to AWS."},
    {"name": "Bob Frontend", "email": "bob@example.com", "password": "password123", "role": "candidate", "resume": "Frontend Engineer focused on React, Vue, and modern JavaScript. I build responsive and accessible web applications."},
    {"name": "Charlie Data", "email": "charlie@example.com", "password": "password123", "role": "candidate", "resume": "Data Scientist with a background in machine learning and statistics. Proficient in Python, Pandas, TensorFlow, and PyTorch."},
    {"name": "Diana Designer", "email": "diana@example.com", "password": "password123", "role": "candidate", "resume": "UI/UX Designer with a passion for user-centered design. Skilled in Figma, Adobe Creative Suite, and HTML/CSS."},
    {"name": "Eve Ops", "email": "eve@example.com", "password": "password123", "role": "candidate", "resume": "DevOps Engineer specializing in CI/CD pipelines, Docker, Kubernetes, and infrastructure as code using Terraform."}
]

RECRUITERS = [
    {"name": "Recruiter One", "email": "recruiter1@example.com", "password": "password123", "role": "recruiter"},
    {"name": "Recruiter Two", "email": "recruiter2@example.com", "password": "password123", "role": "recruiter"},
    {"name": "Recruiter Three", "email": "recruiter3@example.com", "password": "password123", "role": "recruiter"},
    {"name": "Recruiter Four", "email": "recruiter4@example.com", "password": "password123", "role": "recruiter"},
    {"name": "Recruiter Five", "email": "recruiter5@example.com", "password": "password123", "role": "recruiter"}
]

JOBS = [
    {"title": "Senior Python Backend Developer", "company": "TechCorp", "location": "Bengaluru", "description": "Build robust scalable systems using Python and Django. Must have AWS experience.", "skills": "Python, Django, AWS, SQL", "job_type": "Full-time"},
    {"title": "React Frontend Engineer", "company": "Webify", "location": "Remote", "description": "Create amazing user interfaces with React and Redux.", "skills": "JavaScript, React, CSS, HTML", "job_type": "Full-time"},
    {"title": "Machine Learning Engineer", "company": "AI Solutions", "location": "Hyderabad", "description": "Develop and deploy machine learning models in production.", "skills": "Python, TensorFlow, PyTorch, Pandas", "job_type": "Full-time"},
    {"title": "UI/UX Product Designer", "company": "DesignHub", "location": "Pune", "description": "Lead the design of our flagship product. Expert in Figma required.", "skills": "Figma, Sketch, UI, UX", "job_type": "Full-time"},
    {"title": "DevOps Platform Engineer", "company": "CloudNative", "location": "Bengaluru", "description": "Manage our Kubernetes clusters and CI/CD pipelines.", "skills": "Kubernetes, Docker, Terraform, CI/CD", "job_type": "Full-time"},
    {"title": "Junior Web Developer", "company": "StartupX", "location": "Remote", "description": "Great opportunity for a junior developer to learn full-stack.", "skills": "HTML, CSS, JavaScript", "job_type": "Internship"},
    {"title": "Data Analyst", "company": "DataInsights", "location": "Mumbai", "description": "Analyze large datasets to find business insights.", "skills": "SQL, Excel, Python", "job_type": "Full-time"},
    {"title": "Vue.js Developer", "company": "Webify", "location": "Remote", "description": "Join our frontend team building single-page applications.", "skills": "Vue, JavaScript, HTML, CSS", "job_type": "Contract"},
    {"title": "Cloud Architect", "company": "TechCorp", "location": "Bengaluru", "description": "Design cloud infrastructure on AWS and GCP.", "skills": "AWS, GCP, Architecture", "job_type": "Full-time"},
    {"title": "Python Scripting Engineer", "company": "AutoCorp", "location": "Pune", "description": "Write Python scripts for automation tasks.", "skills": "Python, Bash, Linux", "job_type": "Part-time"},
    {"title": "Senior React Developer", "company": "FinTech Inc", "location": "Mumbai", "description": "Lead frontend development for our banking application.", "skills": "React, TypeScript, Redux", "job_type": "Full-time"},
    {"title": "NLP Data Scientist", "company": "AI Solutions", "location": "Hyderabad", "description": "Work on natural language processing models.", "skills": "Python, NLP, PyTorch", "job_type": "Full-time"},
    {"title": "Site Reliability Engineer", "company": "CloudNative", "location": "Remote", "description": "Ensure our systems are always up and running.", "skills": "Linux, Kubernetes, Monitoring", "job_type": "Full-time"},
    {"title": "Graphic Designer", "company": "DesignHub", "location": "Pune", "description": "Create marketing materials and brand assets.", "skills": "Photoshop, Illustrator, Branding", "job_type": "Full-time"},
    {"title": "Full Stack Django Developer", "company": "TechCorp", "location": "Bengaluru", "description": "Work on both frontend and backend of our Django application.", "skills": "Python, Django, JavaScript, HTML", "job_type": "Full-time"},
    {"title": "JavaScript Engineer", "company": "StartupX", "location": "Remote", "description": "Build fast and scalable Node.js backend services.", "skills": "Node.js, JavaScript, Express", "job_type": "Full-time"},
    {"title": "Database Administrator", "company": "DataInsights", "location": "Mumbai", "description": "Manage and optimize our PostgreSQL databases.", "skills": "PostgreSQL, SQL, Tuning", "job_type": "Full-time"},
    {"title": "Cloud Security Engineer", "company": "TechCorp", "location": "Bengaluru", "description": "Secure our cloud infrastructure against threats.", "skills": "AWS Security, CyberSecurity, Python", "job_type": "Full-time"},
    {"title": "Mobile App Developer", "company": "AppMakers", "location": "Hyderabad", "description": "Develop iOS and Android apps using React Native.", "skills": "React Native, Mobile, JavaScript", "job_type": "Full-time"},
    {"title": "Technical Writer", "company": "CloudNative", "location": "Remote", "description": "Write clear documentation for our developer tools.", "skills": "Writing, Markdown, API Documentation", "job_type": "Part-time"}
]

def main():
    DB_PATH.parent.mkdir(exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")

    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        conn.executescript(f.read())

    print("Clearing database...")
    conn.execute("DELETE FROM applications")
    conn.execute("DELETE FROM jobs")
    conn.execute("DELETE FROM users")
    
    candidate_ids = []
    recruiter_ids = []
    
    print("Seeding Users...")
    for user in CANDIDATES:
        cur = conn.execute(
            "INSERT INTO users (name, email, password_hash, role, resume) VALUES (?, ?, ?, ?, ?)",
            (user["name"], user["email"], generate_password_hash(user["password"]), user["role"], user["resume"])
        )
        candidate_ids.append(cur.lastrowid)

    for user in RECRUITERS:
        cur = conn.execute(
            "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
            (user["name"], user["email"], generate_password_hash(user["password"]), user["role"])
        )
        recruiter_ids.append(cur.lastrowid)
        
    print("Seeding Jobs...")
    job_ids = []
    for job in JOBS:
        recruiter_id = random.choice(recruiter_ids)
        cur = conn.execute(
            """INSERT INTO jobs (title, company, location, description, skills, salary, job_type, created_by)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                job["title"],
                job["company"],
                job["location"],
                job["description"],
                job["skills"],
                job.get("salary", ""),
                job["job_type"],
                recruiter_id,
            )
        )
        job_ids.append(cur.lastrowid)

    print("Seeding Applications...")
    for c_id in candidate_ids:
        # Apply to 3 random jobs
        applied_jobs = random.sample(job_ids, 3)
        for j_id in applied_jobs:
            score = random.randint(20, 95)
            status = "Applied"
            if score >= 80: status = "Shortlisted"
            elif score < 40: status = "Rejected"
            
            ai_analysis = json.dumps({
                "score": score,
                "matched_skills": ["Python", "SQL"] if score > 50 else [],
                "missing_skills": ["AWS"] if score < 80 else [],
                "summary": f"Seeded AI mock analysis with score {score}."
            })
            
            conn.execute(
                """INSERT INTO applications (job_id, candidate_id, resume, experience, expected_salary, notice_period, portfolio_url, status, ai_analysis)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (j_id, c_id, "Seeded Resume", random.randint(1, 10), "100k", "1 Month", "https://github.com", status, ai_analysis)
            )

    conn.commit()
    conn.close()

    print(f"Database ready at {DB_PATH}")
    print(f"Seeded {len(CANDIDATES)} candidates, {len(RECRUITERS)} recruiters, {len(JOBS)} jobs, and {len(CANDIDATES)*3} applications.")
    
    print("\n--- Demo Accounts ---")
    for r in RECRUITERS:
        print(f"Recruiter: {r['email']} / password123")
    for c in CANDIDATES:
        print(f"Candidate: {c['email']} / password123")

if __name__ == "__main__":
    main()

