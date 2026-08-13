import json

def test_get_jobs_empty(client):
    response = client.get('/api/jobs')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert len(data) == 0

def test_create_job_unauthorized(client):
    response = client.post('/api/jobs', json={
        "title": "Software Engineer",
        "company": "Tech Corp",
        "location": "Remote"
    })
    # Should fail if not logged in
    assert response.status_code == 401
    
    # Should fail if logged in as candidate
    client.post('/api/login', json={"email": "candidate@test.com", "password": "password"})
    response = client.post('/api/jobs', json={
        "title": "Software Engineer",
        "company": "Tech Corp",
        "location": "Remote"
    })
    assert response.status_code == 403

def test_create_job_authorized(client):
    # Log in as recruiter
    client.post('/api/login', json={"email": "recruiter@test.com", "password": "password"})
    response = client.post('/api/jobs', json={
        "title": "Software Engineer",
        "company": "Tech Corp",
        "location": "Remote"
    })
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data["title"] == "Software Engineer"
    assert "id" in data
    
    # Ensure it shows up in GET /api/jobs
    response = client.get('/api/jobs')
    assert len(json.loads(response.data)) == 1
