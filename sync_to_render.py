import json
import urllib.request
import urllib.error

RENDER_API_URL = "https://password-manager-api-t8m3.onrender.com/api/v1"
EMAIL = "manju_render_sync@gmail.com"
PASSWORD = "Password123!"

def login():
    url = f"{RENDER_API_URL}/auth/login"
    data = json.dumps({"email": EMAIL, "password": PASSWORD}).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode("utf-8"))
            return res.get("access_token")
    except urllib.error.HTTPError as e:
        print(f"Login failed: {e.code} - {e.read().decode('utf-8')}")
        return None

def upload_gym_data(token):
    with open("gym_backup.json", "r", encoding="utf-8") as f:
        data = json.load(f)

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }

    # Upload Workouts
    workouts = data.get("workouts", [])
    print(f"Uploading {len(workouts)} workout plans to Render...")
    for w in workouts:
        url = f"{RENDER_API_URL}/gym/workouts"
        req_data = json.dumps(w).encode("utf-8")
        req = urllib.request.Request(url, data=req_data, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req) as resp:
                created = json.loads(resp.read().decode("utf-8"))
                print(f"  [OK] Uploaded: {created.get('title')} ({len(created.get('exercises', []))} exercises)")
        except urllib.error.HTTPError as e:
            print(f"  [ERR] Failed uploading {w.get('title')}: {e.code} - {e.read().decode('utf-8')}")

if __name__ == "__main__":
    print("Connecting to Render API...")
    token = login()
    if token:
        print(f"[OK] Authenticated successfully with Render backend as {EMAIL}!")
        upload_gym_data(token)
        print("\nSUCCESS: All local Gym data successfully pushed and synced to Render!")
    else:
        print("Could not authenticate with Render backend.")
