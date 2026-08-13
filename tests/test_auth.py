import json

def test_register_candidate(client):
    response = client.post('/api/register', json={
        "name": "New User",
        "email": "newuser@test.com",
        "password": "password123",
        "role": "candidate"
    })
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data["email"] == "newuser@test.com"

def test_login_success(client):
    response = client.post('/api/login', json={
        "email": "candidate@test.com",
        "password": "password"
    })
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data["email"] == "candidate@test.com"

def test_login_failure(client):
    response = client.post('/api/login', json={
        "email": "candidate@test.com",
        "password": "wrongpassword"
    })
    assert response.status_code == 401
    
def test_get_me_unauthenticated(client):
    response = client.get('/api/me')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data["user"] is None

def test_get_me_authenticated(client):
    client.post('/api/login', json={
        "email": "candidate@test.com",
        "password": "password"
    })
    response = client.get('/api/me')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data["user"]["email"] == "candidate@test.com"
