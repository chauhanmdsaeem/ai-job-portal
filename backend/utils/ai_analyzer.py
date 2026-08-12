import json
import time
import random
import re

def mock_ai_analyze_resume(job_description, job_skills, resume_text):
    """
    Simulates an AI evaluating a resume against job requirements.
    In a real application, this would call an LLM API like Gemini or OpenAI.
    """
    # Simulate API latency
    time.sleep(1.5)

    if not resume_text:
        return {
            "score": 0,
            "matched_skills": [],
            "missing_skills": job_skills,
            "summary": "No resume provided for analysis."
        }

    # Normalize inputs for naive keyword matching
    resume_lower = resume_text.lower()
    
    # Very naive word boundary matching to avoid partial matches like "Java" matching "JavaScript"
    def has_skill(skill_str, text):
        escaped = re.escape(skill_str.lower().strip())
        # Using word boundaries \b
        pattern = r'\b' + escaped + r'\b'
        return bool(re.search(pattern, text))

    matched = []
    missing = []
    
    for skill in job_skills:
        skill = skill.strip()
        if not skill:
            continue
        if has_skill(skill, resume_lower):
            matched.append(skill)
        else:
            missing.append(skill)

    # Calculate score
    total_skills = len(job_skills)
    if total_skills == 0:
        score = 80 + random.randint(0, 20)  # Default high score if no specific skills required
    else:
        score = int((len(matched) / total_skills) * 100)
    
    # Add some randomness to make it feel more "AI-like" 
    # (sometimes it infers related skills, though our mock won't be that smart)
    
    if score >= 80:
        summary = "Strong candidate. Their resume demonstrates solid experience matching the core requirements of this role."
    elif score >= 50:
        summary = "Moderate fit. The candidate has some relevant skills but may require training in key areas."
    else:
        summary = "Weak fit. The resume lacks many of the required skills for this position."

    return {
        "score": score,
        "matched_skills": matched,
        "missing_skills": missing,
        "summary": summary
    }
