import json
import os
from pydantic import BaseModel, Field
from typing import List
from google import genai

class AIAnalysisResult(BaseModel):
    score: int = Field(description="Compatibility score from 0 to 100")
    matched_skills: List[str] = Field(description="List of skills that the candidate has")
    missing_skills: List[str] = Field(description="List of skills that the candidate is missing")
    summary: str = Field(description="A brief summary evaluating the fit")

class AIRecommendation(BaseModel):
    job_id: int = Field(description="The ID of the recommended job")
    match_score: int = Field(description="Compatibility score from 0 to 100")
    reason: str = Field(description="Why this job is a good fit for the candidate")

class AIRecommendationResult(BaseModel):
    recommendations: List[AIRecommendation] = Field(description="Top 3 recommended jobs")

class AIJobMatchResult(BaseModel):
    score: int = Field(description="Compatibility score from 0 to 100")
    summary: str = Field(description="A brief summary evaluating the fit")

class AIJobDescriptionResult(BaseModel):
    description: str = Field(description="The fully generated job description")

class AIResumeResult(BaseModel):
    resume: str = Field(description="The generated or tailored resume")

def mock_ai_analyze_resume(job_description, job_skills, resume_text):
    """
    Uses Google Gemini AI to evaluate a resume against job requirements.
    """
    if not resume_text:
        return {
            "score": 0,
            "matched_skills": [],
            "missing_skills": job_skills,
            "summary": "No resume provided for analysis."
        }
        
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return {
            "score": 0,
            "matched_skills": [],
            "missing_skills": job_skills,
            "summary": "Error: GEMINI_API_KEY environment variable is not set."
        }

    client = genai.Client(api_key=api_key)
    
    prompt = f"""
    You are an expert technical recruiter. Evaluate the following resume against the job description and required skills.
    
    Job Description:
    {job_description}
    
    Required Skills:
    {', '.join(job_skills)}
    
    Candidate Resume:
    {resume_text}
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-3.5-flash',
            contents=prompt,
            config=genai.types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=AIAnalysisResult,
                temperature=0.1
            ),
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Gemini API Error: {e}")
        return {
            "score": 0,
            "matched_skills": [],
            "missing_skills": job_skills,
            "summary": f"Failed to analyze with AI: {str(e)}"
        }

def ai_candidate_match(resume_text, job):
    """
    Evaluates a candidate's resume against a specific job for a quick match score.
    """
    if not resume_text:
        return {"score": 0, "summary": "Please save your resume in your profile first."}
        
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return {"score": 0, "summary": "AI is currently unavailable."}

    client = genai.Client(api_key=api_key)
    
    prompt = f"""
    Evaluate this candidate's resume against the following job opening.
    
    Job Title: {job['title']}
    Job Description: {job['description']}
    Required Skills: {job['skills']}
    
    Candidate Resume:
    {resume_text}
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-3.5-flash',
            contents=prompt,
            config=genai.types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=AIJobMatchResult,
                temperature=0.1
            ),
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Gemini API Error: {e}")
        return {"score": 0, "summary": "Failed to calculate match score."}

def ai_recommend_jobs(resume_text, open_jobs):
    """
    Analyzes a candidate's resume against all open jobs and returns the top 3 recommendations.
    """
    if not resume_text or not open_jobs:
        return {"recommendations": []}
        
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return {"recommendations": []}
        
    client = genai.Client(api_key=api_key)
    
    # Format the open jobs for the prompt
    jobs_context = []
    for job in open_jobs:
        jobs_context.append(f"Job ID: {job['id']}\nTitle: {job['title']}\nCompany: {job['company']}\nSkills: {job['skills']}\nDescription: {job['description']}")
    
    prompt = f"""
    You are an expert career counselor. Given the candidate's resume and a list of open jobs, identify the top 3 best matching jobs for this candidate.
    
    Candidate Resume:
    {resume_text}
    
    Open Jobs:
    {chr(10).join(jobs_context)}
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-3.5-flash',
            contents=prompt,
            config=genai.types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=AIRecommendationResult,
                temperature=0.1
            ),
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Gemini API Error: {e}")
        return {"recommendations": []}

def ai_generate_job_description(title, company, location, skills):
    """
    Generates a professional job description from a title and skills list.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        import sys
        sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
        from services.ai_service import generate_job_description
        return {"description": generate_job_description(title, company, location, skills)}
        
    client = genai.Client(api_key=api_key)
    
    prompt = f"""
    You are an expert technical recruiter and copywriter.
    Write a highly professional, engaging job description for the following position:
    
    Job Title: {title}
    Company: {company}
    Location: {location}
    Required Skills: {skills}
    
    The description should include a brief introduction about the role, what the candidate will do, and qualifications.
    Format as clean markdown text. Do not include the title itself in the generated text, just the body of the description.
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-3.5-flash',
            contents=prompt,
            config=genai.types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=AIJobDescriptionResult,
                temperature=0.7
            ),
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Gemini API Error: {e}")
        return {"description": f"Failed to generate JD: {str(e)}"}

def ai_tailor_resume(resume_text, job_title, job_description, job_skills):
    """
    Tailors a master resume to perfectly match a specific job posting.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        import sys
        sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
        from services.ai_service import tailor_resume as simulate_tailor_resume
        return {"resume": simulate_tailor_resume(resume_text, job_description)}
        
    client = genai.Client(api_key=api_key)
    
    prompt = f"""
    You are an expert career coach. Tailor the candidate's master resume to be a perfect fit for the specific job description below.
    Highlight the most relevant experiences, align the terminology with the job description, and add a brief customized professional summary at the top.
    Do not invent or fabricate experience, just emphasize what's most relevant.
    
    Job Title: {job_title}
    Job Description: {job_description}
    Required Skills: {job_skills}
    
    Candidate's Master Resume:
    {resume_text}
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-3.5-flash',
            contents=prompt,
            config=genai.types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=AIResumeResult,
                temperature=0.5
            ),
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Gemini API Error: {e}")
        return {"resume": resume_text}

def ai_generate_ats_resume(raw_notes):
    """
    Generates a full ATS-friendly resume from raw bullet points or notes.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return {"resume": raw_notes}
        
    client = genai.Client(api_key=api_key)
    
    prompt = f"""
    You are an expert resume writer. The candidate has provided some rough notes about their background.
    Expand these notes into a highly professional, ATS-friendly resume. 
    Use strong action verbs, quantify achievements where possible (or suggest placeholders), and format it cleanly using Markdown.
    Include standard sections: Professional Summary, Skills, Experience, and Education (if mentioned).
    
    Candidate's Notes:
    {raw_notes}
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-3.5-flash',
            contents=prompt,
            config=genai.types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=AIResumeResult,
                temperature=0.5
            ),
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Gemini API Error: {e}")
        return {"resume": raw_notes}

class AIChatResponse(BaseModel):
    reply: str = Field(description="The conversational reply from the AI assistant")

def ai_site_assistant(message, history=""):
    """
    A general purpose AI assistant for the website.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return {"reply": "Sorry, the AI assistant is currently unavailable (API key missing)."}

    client = genai.Client(api_key=api_key)
    
    system_prompt = f"""
    You are 'Fieldnote AI', the helpful virtual assistant for the Fieldnote Careers job portal.
    Your goal is to help candidates and recruiters navigate the platform and showcase your LLM capabilities.
    Keep your answers concise, friendly, and professional. 
    
    Capabilities of the platform you can mention:
    - Smart Job Matching (>90% accuracy)
    - Auto-tailoring resumes to specific job descriptions
    - Automated ATS resume generation from rough notes
    - Recruiter tools to instantly generate job descriptions
    
    Conversation History:
    {history}
    
    User Message:
    {message}
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-3.5-flash',
            contents=system_prompt,
            config=genai.types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=AIChatResponse,
                temperature=0.7
            ),
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Gemini API Error: {e}")
        return {"reply": "I'm having trouble connecting to my brain right now. Please try again later!"}
