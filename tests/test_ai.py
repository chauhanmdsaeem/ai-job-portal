import json
from unittest.mock import patch

def test_ai_recommendations_no_resume(client):
    client.post('/api/login', json={"email": "candidate@test.com", "password": "password"})
    response = client.get('/api/jobs/recommendations')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert "recommendations" in data
    assert len(data["recommendations"]) == 0

@patch('backend.routes.jobs.ai_recommend_jobs')
def test_ai_recommendations_with_resume(mock_ai, client):
    # Setup mock return value
    mock_ai.return_value = {
        "recommendations": [
            {"job_id": 1, "match_score": 95, "reason": "Perfect match"}
        ]
    }
    
    # Login and add resume
    client.post('/api/login', json={"email": "candidate@test.com", "password": "password"})
    client.put('/api/me/profile', json={"resume": "I am a developer."})
    
    # Create a job first so there is a job to recommend
    client.post('/api/login', json={"email": "recruiter@test.com", "password": "password"})
    client.post('/api/jobs', json={
        "title": "Developer", "company": "Tech Corp", "location": "Remote"
    })
    
    # Login as candidate again
    client.post('/api/login', json={"email": "candidate@test.com", "password": "password"})
    response = client.get('/api/jobs/recommendations')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert len(data["recommendations"]) == 1
    assert data["recommendations"][0]["match_score"] == 95
