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
    {"name": "Saeem Chauhan", "email": "candidate@example.com", "password": "password123", "role": "candidate", "resume": "Software Engineering graduate (BCA 9.31 CGPA) with a strong foundation in Python, Java, C, and Backend Development. Hands-on experience building Python-based applications using FastAPI, PostgreSQL, WebSockets, and Docker. Strong background in Data & ML including Pandas, NumPy, Scikit-Learn, NLP, TF-IDF, and LangChain. Engineered 'Smart Factory Digital Twin' integrating Groq AI and 'AI Resume Screening System' using TF-IDF & cosine similarity."},
    {"name": "Alice Developer", "email": "alice@example.com", "password": "password123", "role": "candidate", "resume": "Experienced Python Developer with 5 years in Django and Flask. Expert in building scalable APIs and deploying to AWS."},
    {"name": "Bob Frontend", "email": "bob@example.com", "password": "password123", "role": "candidate", "resume": "Frontend Engineer focused on React, Vue, and modern JavaScript. I build responsive and accessible web applications."},
    {"name": "Charlie Data", "email": "charlie@example.com", "password": "password123", "role": "candidate", "resume": "Data Scientist with a background in machine learning and statistics. Proficient in Python, Pandas, TensorFlow, and PyTorch."},
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
    {"title": "Python Gen AI Engineer", "company": "Google", "location": "Bengaluru", "description": "Design and integrate scalable LLM applications using Python and LangChain. Must have experience with FastAPI and Prompt Engineering.", "skills": "Python, LangChain, FastAPI, Gen AI", "job_type": "Full-time"},
    {"title": "Backend Developer (Python/AI)", "company": "TechCorp", "location": "Remote", "description": "Build robust scalable systems using Python to support AI model inference. Experience with Docker and PostgreSQL required.", "skills": "Python, FastAPI, Docker, PostgreSQL", "job_type": "Full-time"},
    {"title": "Machine Learning Engineer (NLP)", "company": "AI Solutions", "location": "Hyderabad", "description": "Develop and deploy NLP models in production. Experience with TF-IDF, Scikit-Learn, and Python is essential.", "skills": "Python, NLP, Scikit-Learn, Pandas", "job_type": "Full-time"},
    {"title": "RAG Systems Architect", "company": "Cognizant", "location": "Bengaluru", "description": "Lead the design of our Retrieval-Augmented Generation systems. Need deep knowledge of Python backends and Vector DBs.", "skills": "Python, RAG, LLMs, Vector DB", "job_type": "Full-time"},
    {"title": "Junior Python Developer", "company": "StartupX", "location": "Remote", "description": "Great opportunity for a junior developer to learn full-stack AI integration using Flask and APIs.", "skills": "Python, Flask, API, WebSockets", "job_type": "Full-time"},
    {"title": "AI Integration Specialist", "company": "DataInsights", "location": "Mumbai", "description": "Integrate third-party LLMs (OpenAI, Gemini, Groq) into existing enterprise systems.", "skills": "Python, Groq API, Gemini, LLMs", "job_type": "Full-time"},
    {"title": "Prompt Engineer", "company": "Webify", "location": "Remote", "description": "Craft highly optimized prompts for various LLM agents. Python scripting required for automated testing.", "skills": "Prompt Engineering, Python, AI", "job_type": "Contract"},
    {"title": "Cloud Architect (AI Workloads)", "company": "TechCorp", "location": "Bengaluru", "description": "Design cloud infrastructure on AWS for heavy AI workloads.", "skills": "AWS, Docker, Architecture", "job_type": "Full-time"},
    {"title": "Python Scripting & Automation Engineer", "company": "AutoCorp", "location": "Pune", "description": "Write Python scripts for automation tasks involving AI parsing.", "skills": "Python, Automation, Scripting", "job_type": "Part-time"},
    {"title": "Senior Backend AI Engineer", "company": "FinTech Inc", "location": "Mumbai", "description": "Lead backend development for our AI-driven banking application using Python.", "skills": "Python, Backend, System Design", "job_type": "Full-time"},
    {"title": "NLP Data Scientist", "company": "AI Solutions", "location": "Hyderabad", "description": "Work on natural language processing models and fine-tuning.", "skills": "Python, NLP, PyTorch", "job_type": "Full-time"},
    {"title": "AI MLOps Engineer", "company": "CloudNative", "location": "Remote", "description": "Ensure our LLM inference systems are highly available and scalable.", "skills": "Docker, Kubernetes, Python, MLOps", "job_type": "Full-time"},
    {"title": "Software Engineer (Java/Python)", "company": "DesignHub", "location": "Pune", "description": "Develop multi-lingual enterprise software leveraging both Java and Python.", "skills": "Java, Python, OOP", "job_type": "Full-time"},
    {"title": "Data Engineer (ML Pipelines)", "company": "TechCorp", "location": "Bengaluru", "description": "Build robust data pipelines for ML model training using Pandas and NumPy.", "skills": "Python, Pandas, NumPy, SQL", "job_type": "Full-time"}
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

