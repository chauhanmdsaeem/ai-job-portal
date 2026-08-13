import sqlite3

db = sqlite3.connect('database/job_portal.db')
cursor = db.cursor()

# Get or create a recruiter to own these jobs
cursor.execute("SELECT id FROM users WHERE role = 'recruiter' LIMIT 1")
recruiter = cursor.fetchone()
if not recruiter:
    cursor.execute("INSERT INTO users (name, email, password_hash, role) VALUES ('System Recruiter', 'recruiter@system.com', 'hash', 'recruiter')")
    recruiter_id = cursor.lastrowid
else:
    recruiter_id = recruiter[0]

jobs = [
    ("Senior Software Engineer", "Google", "Mountain View, CA / Remote", "We are looking for an experienced Software Engineer to build scalable backend systems. You will work on high-traffic microservices.", "Python, Go, Kubernetes, SQL", "$150k - $200k", "Full-time"),
    ("Frontend React Developer", "Meta", "Menlo Park, CA / Remote", "Join our core UI team to build seamless and performant web interfaces. Must have deep knowledge of React hooks and state management.", "JavaScript, React, CSS, TypeScript", "$130k - $180k", "Full-time"),
    ("Data Scientist", "Amazon", "Seattle, WA", "Seeking a Data Scientist to build machine learning models that optimize supply chain logistics.", "Python, Machine Learning, SQL, Pandas", "$140k - $190k", "Full-time"),
    ("Cloud Solutions Architect", "Microsoft", "Redmond, WA", "Design and deploy enterprise cloud infrastructure for top-tier clients using Azure.", "Azure, Networking, Kubernetes, Terraform", "$160k - $210k", "Full-time"),
    ("Product Manager", "Apple", "Cupertino, CA", "Lead the development of next-generation hardware products from conception to launch.", "Product Management, Agile, UI/UX", "$150k - $195k", "Full-time"),
    ("iOS Developer", "Spotify", "New York, NY / Remote", "Help build the most popular music streaming app in the world. Experience with Swift and audio streaming is a plus.", "Swift, iOS, Objective-C", "$120k - $160k", "Full-time"),
    ("DevOps Engineer", "Netflix", "Los Gatos, CA", "Ensure our streaming platform remains highly available. Automate deployments and manage AWS infrastructure.", "AWS, Docker, Linux, CI/CD", "$145k - $185k", "Full-time"),
    ("Machine Learning Engineer", "OpenAI", "San Francisco, CA", "Train and deploy large language models. Strong background in deep learning required.", "Python, PyTorch, Deep Learning", "$180k - $250k", "Full-time"),
    ("Backend Engineer (Node.js)", "Stripe", "San Francisco, CA / Remote", "Build robust payment processing APIs handling millions of transactions.", "JavaScript, Node.js, PostgreSQL", "$140k - $180k", "Full-time"),
    ("Cybersecurity Analyst", "CrowdStrike", "Austin, TX", "Monitor and protect enterprise networks from advanced cyber threats.", "Security, Networking, SIEM, Python", "$110k - $150k", "Full-time")
]

for job in jobs:
    cursor.execute('''
        INSERT INTO jobs (title, company, location, description, skills, salary, job_type, created_by, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open')
    ''', (*job, recruiter_id))

db.commit()
print(f"Successfully seeded {len(jobs)} jobs into the database.")
