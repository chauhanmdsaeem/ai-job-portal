import json
import os
import google.generativeai as genai

# Use the environment variable for security
API_KEY = os.environ.get("GEMINI_API_KEY")
if not API_KEY:
    print("WARNING: GEMINI_API_KEY is not set!")
genai.configure(api_key=API_KEY)

# Use Gemini 3.7 Flash for fast, reliable JSON responses
model = genai.GenerativeModel('gemini-3.7-flash', generation_config={"response_mime_type": "application/json"})

def mock_ai_analyze_resume(job_description, job_skills, resume_text):
    if not resume_text:
        return {
            "score": 0,
            "matched_skills": [],
            "missing_skills": job_skills,
            "summary": "No resume provided."
        }
    return {
        "score": 85,
        "matched_skills": ["Python", "SQL"],
        "missing_skills": ["AWS"],
        "summary": "Strong candidate with good backend skills."
    }

def ai_candidate_match(resume_text, job):
    if not resume_text:
        return {"score": 0, "summary": "Please save your resume in your profile first."}
        
    prompt = f"""
    Evaluate this candidate's resume against the following job opening.
    
    Job Title: {job['title']}
    Job Description: {job['description']}
    Required Skills: {job['skills']}
    
    Candidate Resume:
    {resume_text}
    
    Calculate a match score from 0 to 100 based on how well the resume matches the job.
    Provide a brief summary of the candidate's fit.
    
    Respond strictly in JSON format matching this schema:
    {{
        "score": 85,
        "summary": "Brief explanation of the score"
    }}
    """
    
    response = model.generate_content(prompt)
    return json.loads(response.text)

def ai_recommend_jobs(resume_text, open_jobs):
    if not resume_text or not open_jobs:
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
                "job_id": 1,
                "match_score": 90,
                "reason": "Why this job is a good fit"
            }}
        ]
    }}
    """
    
    response = model.generate_content(prompt)
    return json.loads(response.text)

def ai_generate_job_description(title, company, location, skills):
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
    
    response = model.generate_content(prompt)
    return json.loads(response.text)

def ai_tailor_resume(resume_text, job_title, job_description, job_skills):
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
    
    response = model.generate_content(prompt)
    return json.loads(response.text)

def ai_generate_ats_resume(raw_notes):
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
    
    response = model.generate_content(prompt)
    return json.loads(response.text)

def ai_site_assistant(message, history="", role="guest", context_data=""):
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
    
    response = model.generate_content(system_prompt)
    return json.loads(response.text)
