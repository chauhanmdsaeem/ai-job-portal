import requests

session = requests.Session()
login_data = {"email": "candidate@example.com", "password": "password123"}
r_login = session.post("http://127.0.0.1:5000/api/login", json=login_data)
print("Login status:", r_login.status_code)
print("Login response:", r_login.text)

if r_login.status_code == 200:
    r_rec = session.get("http://127.0.0.1:5000/api/jobs/recommendations")
    print("Recommendations status:", r_rec.status_code)
    print("Recommendations response:", r_rec.text)
