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
