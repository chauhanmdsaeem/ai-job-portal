import time

def generate_job_description(title: str, company: str, location: str, skills: str) -> str:
    """
    Simulates calling an LLM (like Google Gemini or OpenAI) to generate a professional job description.
    In a production environment, this function would build a prompt using the inputs and call the API.
    """
    # Simulate network/LLM generation delay
    time.sleep(2)
    
    skills_list = [s.strip() for s in skills.split(',') if s.strip()]
    skills_bullets = "\n".join([f"- {skill}" for skill in skills_list]) if skills_list else "- Relevant industry skills"
    
    # Generate a realistic-looking JD based on inputs
    return f"""**About {company}**
We are a forward-thinking company based in {location}, looking for a talented {title} to join our growing team. We value innovation, collaboration, and building products that make a real impact.

**The Role**
As a {title}, you will be instrumental in shaping the future of our core platforms. You will work closely with cross-functional teams to design, build, and deploy highly scalable solutions.

**Key Responsibilities**
- Design and implement robust, scalable, and secure features.
- Collaborate with product managers, designers, and other engineers.
- Write clean, maintainable, and well-tested code.
- Participate in code reviews and mentor junior team members.
- Optimize application performance and resolve complex technical issues.

**Requirements**
- Proven experience working as a {title} or in a similar role.
- Strong proficiency in the following areas:
{skills_bullets}
- Excellent problem-solving skills and attention to detail.
- Ability to work both independently and collaboratively in a fast-paced environment.

**Why Join Us?**
- Competitive salary and equity packages.
- Comprehensive health, dental, and vision insurance.
- Flexible remote work options and unlimited PTO.
- A culture that prioritizes continuous learning and growth.

*If you are passionate about technology and want to make a difference at {company}, we encourage you to apply!*"""


def tailor_resume(master_resume: str, job_description: str) -> str:
    """
    Simulates calling an LLM to tailor a candidate's master resume to a specific job description.
    """
    # Simulate network/LLM generation delay
    time.sleep(3)
    
    if not master_resume or len(master_resume.strip()) < 10:
        return master_resume
        
    return f"""[AI TAILORED RESUME]

{master_resume}

---
[AI OPTIMIZATION NOTES]
- Highlighted keywords matching the job description to improve ATS compatibility.
- Re-ordered experience bullets to prioritize relevant skills.
- Generated a custom professional summary based on the role requirements."""
