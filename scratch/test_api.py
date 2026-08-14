import requests

session = requests.Session()

# 1. Login
print("Logging in...")
login_res = session.post("http://127.0.0.1:5000/api/login", json={
    "email": "recruiter1@example.com",
    "password": "password123"
})
print("Login status:", login_res.status_code)
if login_res.status_code != 200:
    print(login_res.text)

# 2. Generate JD
print("Generating JD...")
res = session.post("http://127.0.0.1:5000/api/jobs/generate-jd", json={
    "title": "React Developer",
    "company": "Tech Innovators",
    "location": "Remote",
    "skills": "React, Node, TypeScript"
})
print("Generate JD status:", res.status_code)
print("Response:", res.text)
