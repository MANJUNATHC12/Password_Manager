import json
import urllib.request
import urllib.error

RENDER_API_URL = "https://password-manager-api-t8m3.onrender.com/api/v1"
EMAIL = "manjuck9380@gmail.com"
PASSWORD = "Password123!"
FULL_NAME = "Manjunath"

def login():
    url = f"{RENDER_API_URL}/auth/login"
    data = json.dumps({"email": EMAIL, "password": PASSWORD}).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode("utf-8"))
            return res.get("access_token")
    except urllib.error.HTTPError as e:
        if e.code == 401:
            print("User not found or credentials mismatch on Render. Attempting register...")
            return register()
        print(f"Login failed: {e.code} - {e.read().decode('utf-8')}")
        return None

def register():
    url = f"{RENDER_API_URL}/auth/register"
    payload = {
        "email": EMAIL,
        "password": PASSWORD,
        "full_name": FULL_NAME
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode("utf-8"))
            print("✓ Account registered successfully on Render!")
            return login()
    except urllib.error.HTTPError as e:
        print(f"Registration failed: {e.code} - {e.read().decode('utf-8')}")
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
                print(f"  ✓ Uploaded: {created.get('title')} ({len(created.get('exercises', []))} exercises)")
        except urllib.error.HTTPError as e:
            print(f"  ✗ Failed uploading {w.get('title')}: {e.code} - {e.read().decode('utf-8')}")

    # Upload Diet Logs
    diets = data.get("diet", [])
    if diets:
        print(f"Uploading {len(diets)} diet logs to Render...")
        for d in diets:
            url = f"{RENDER_API_URL}/gym/diet"
            req_data = json.dumps(d).encode("utf-8")
            req = urllib.request.Request(url, data=req_data, headers=headers, method="POST")
            try:
                with urllib.request.urlopen(req) as resp:
                    print(f"  ✓ Uploaded diet: {d.get('food_name')}")
            except urllib.error.HTTPError as e:
                print(f"  ✗ Failed uploading diet {d.get('food_name')}: {e.code}")

    # Upload Weight Logs
    weights = data.get("weight", [])
    if weights:
        print(f"Uploading {len(weights)} weight logs to Render...")
        for wt in weights:
            url = f"{RENDER_API_URL}/gym/weight"
            req_data = json.dumps(wt).encode("utf-8")
            req = urllib.request.Request(url, data=req_data, headers=headers, method="POST")
            try:
                with urllib.request.urlopen(req) as resp:
                    print(f"  ✓ Uploaded weight: {wt.get('weight_kg')} kg")
            except urllib.error.HTTPError as e:
                print(f"  ✗ Failed uploading weight {wt.get('weight_kg')} kg: {e.code}")

if __name__ == "__main__":
    print("Connecting to Render API...")
    token = login()
    if token:
        print("✓ Authenticated successfully with Render backend!")
        upload_gym_data(token)
        print("\n🎉 All local Gym data successfully pushed and synced to Render!")
    else:
        print("Could not authenticate with Render backend.")
