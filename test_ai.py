import os
import sys
# Add current directory to path so imports work
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from backend.utils.ai_analyzer import ai_recommend_jobs

jobs = [
    {
        "id": 1,
        "title": "Software Engineer",
        "company": "Google",
        "skills": "Python, SQL",
        "description": "Backend dev"
    }
]

resume = "I am a backend developer with Python and SQL."

print("Running test...")
res = ai_recommend_jobs(resume, jobs)
print("Result:", res)
