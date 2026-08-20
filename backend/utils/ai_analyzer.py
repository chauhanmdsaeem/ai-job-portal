import json
import os
from typing import List
from groq import Groq

def get_client():
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        return None
    return Groq(api_key=api_key)

def mock_ai_analyze_resume(job_description, job_skills, resume_text):
    if not resume_text:
        return {
            "score": 0,
            "matched_skills": [],
            "missing_skills": job_skills,
            "summary": "No resume provided for analysis."
        }
        
    client = get_client()
    if not client:
        return {
            "score": 0,
            "matched_skills": [],
            "missing_skills": job_skills,
            "summary": "Error: GROQ_API_KEY environment variable is not set."
        }

    prompt = f"""
    You are an expert technical recruiter. Evaluate the following resume against the job description and required skills.
    
    Job Description:
    {job_description}
    
    Required Skills:
    {', '.join(job_skills)}
    
    Candidate Resume:
    {resume_text}
    
    Respond strictly in JSON format matching this schema:
    {{
        "score": 85, // integer from 0 to 100
        "matched_skills": ["python", "sql"], // list of strings
        "missing_skills": ["aws"], // list of strings
        "summary": "A brief summary evaluating the fit"
    }}
    """
    
    try:
        response = client.chat.completions.create(
            model='qwen/qwen3.6-27b',
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.1
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"Groq API Error: {e}")
        return {
            "score": 0,
            "matched_skills": [],
            "missing_skills": job_skills,
            "summary": f"Failed to analyze with AI: {str(e)}"
        }

def ai_candidate_match(resume_text, job):
    if not resume_text:
        return {"score": 0, "summary": "Please save your resume in your profile first."}
        
    client = get_client()
    if not client:
        return {"score": 0, "summary": "AI is currently unavailable."}
    
    prompt = f"""
    Evaluate this candidate's resume against the following job opening.
    
    Job Title: {job['title']}
    Job Description: {job['description']}
    Required Skills: {job['skills']}
    
    Candidate Resume:
    {resume_text}
    
    Respond strictly in JSON format matching this schema:
    {{
        "score": 85, // integer from 0 to 100
        "summary": "A brief summary evaluating the fit"
    }}
    """
    
    try:
        response = client.chat.completions.create(
            model='qwen/qwen3.6-27b',
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.1
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"Groq API Error: {e}")
        return {"score": 0, "summary": "Failed to calculate match score."}

def ai_recommend_jobs(resume_text, open_jobs):
    if not resume_text or not open_jobs:
        return {"recommendations": []}
        
    client = get_client()
    if not client:
        return {"recommendations": []}
    
    jobs_context = []
    for job in open_jobs:
        jobs_context.append(f"Job ID: {job['id']}\nTitle: {job['title']}\nCompany: {job['company']}\nSkills: {job['skills']}\nDescription: {job['description']}")
    
    prompt = f"""
    You are an expert career counselor. Given the candidate's resume and a list of open jobs, identify the top 3 best matching jobs for this candidate.
    
    Candidate Resume:
    {resume_text}
    
    Open Jobs:
    {chr(10).join(jobs_context)}
    
    Respond strictly in JSON format matching this schema:
    {{
        "recommendations": [
            {{
                "job_id": 1, // integer ID of the recommended job
                "match_score": 90, // integer from 0 to 100
                "reason": "Why this job is a good fit"
            }}
        ] // list of up to 3 recommendations
    }}
    """
    
    try:
        response = client.chat.completions.create(
            model='qwen/qwen3.6-27b',
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.1
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"Groq API Error: {e}")
        return {"recommendations": []}

def ai_generate_job_description(title, company, location, skills):
    client = get_client()
    if not client:
        import sys
        sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
        from services.ai_service import generate_job_description
        return {"description": generate_job_description(title, company, location, skills)}
    
    prompt = f"""
    You are an expert technical recruiter and copywriter.
    Write a highly professional, engaging job description for the following position:
    
    Job Title: {title}
    Company: {company}
    Location: {location}
    Required Skills: {skills}
    
    The description should include a brief introduction about the role, what the candidate will do, and qualifications.
    Format as clean markdown text. Do not include the title itself in the generated text, just the body of the description.
    
    Respond strictly in JSON format matching this schema:
    {{
        "description": "The fully generated markdown job description string"
    }}
    """
    
    try:
        response = client.chat.completions.create(
            model='qwen/qwen3.6-27b',
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.7
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"Groq API Error: {e}")
        return {"description": f"Failed to generate JD: {str(e)}"}

def ai_tailor_resume(resume_text, job_title, job_description, job_skills):
    client = get_client()
    if not client:
        import sys
        sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
        from services.ai_service import tailor_resume as simulate_tailor_resume
        return {"resume": simulate_tailor_resume(resume_text, job_description)}
    
    prompt = f"""
    You are an expert career coach. Tailor the candidate's master resume to be a perfect fit for the specific job description below.
    Highlight the most relevant experiences, align the terminology with the job description, and add a brief customized professional summary at the top.
    Do not invent or fabricate experience, just emphasize what's most relevant.
    
    Job Title: {job_title}
    Job Description: {job_description}
    Required Skills: {job_skills}
    
    Candidate's Master Resume:
    {resume_text}
    
    Respond strictly in JSON format matching this schema:
    {{
        "resume": "The tailored markdown resume string"
    }}
    """
    
    try:
        response = client.chat.completions.create(
            model='qwen/qwen3.6-27b',
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.5
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"Groq API Error: {e}")
        return {"resume": resume_text}

def ai_generate_ats_resume(raw_notes):
    client = get_client()
    if not client:
        return {"resume": raw_notes}
    
    prompt = f"""
    You are an expert resume writer. The candidate has provided some rough notes about their background.
    Expand these notes into a highly professional, ATS-friendly resume. 
    Use strong action verbs, quantify achievements where possible (or suggest placeholders), and format it cleanly using Markdown.
    Include standard sections: Professional Summary, Skills, Experience, and Education (if mentioned).
    
    Candidate's Notes:
    {raw_notes}
    
    Respond strictly in JSON format matching this schema:
    {{
        "resume": "The fully generated markdown resume string"
    }}
    """
    
    try:
        response = client.chat.completions.create(
            model='qwen/qwen3.6-27b',
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.5
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"Groq API Error: {e}")
        return {"resume": raw_notes}

def ai_site_assistant(message, history="", role="guest", context_data=""):
    client = get_client()
    if not client:
        return {"reply": "Sorry, the AI assistant is currently unavailable (API key missing)."}

    if role == "candidate":
        base_prompt = "You are a Career Assistant for Fieldnote Careers. Your goal is to help job seekers find roles, optimize resumes, and prepare for interviews. Tone: Encouraging, supportive, professional. You have access to public job listings provided in the Context Data below."
    elif role == "recruiter":
        base_prompt = "You are a Talent Acquisition Copilot for Fieldnote Careers. Your goal is to help recruiters draft job descriptions, screen applicants, and match talent. Tone: Analytical, efficient, corporate. You have access to applicants applied to your jobs provided in the Context Data below."
    else:
        base_prompt = "You are 'Fieldnote AI', the helpful virtual assistant for the Fieldnote Careers job portal. Your goal is to help users navigate the platform and showcase your LLM capabilities. Tone: concise, friendly, and professional."

    system_prompt = f"""
{base_prompt}

Capabilities of the platform you can mention:
- Smart Job Matching (>90% accuracy)
- Auto-tailoring resumes to specific job descriptions
- Automated ATS resume generation from rough notes
- Recruiter tools to instantly generate job descriptions

If a user asks how to contact the developer, owner, or support team, direct them to click the "Contact" link in the footer or visit the /contact.html page. DO NOT provide fake email addresses like support@fieldnote.careers.

--- Context Data (from database) ---
{context_data}

--- Conversation History ---
{history}

--- User Message ---
{message}

Respond strictly in JSON format matching this schema:
{{
    "reply": "The conversational reply from the AI assistant"
}}
"""
    
    try:
        response = client.chat.completions.create(
            model='qwen/qwen3.6-27b',
            messages=[{"role": "user", "content": system_prompt}],
            response_format={"type": "json_object"},
            temperature=0.7
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"Groq API Error: {e}")
        return {"reply": "I'm having trouble connecting to my brain right now. Please try again later!"}
