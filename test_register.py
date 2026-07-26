import urllib.request
import json
import ssl

url = "https://password-manager-api-t8m3.onrender.com/api/v1/auth/register"
payload = {
    "email": "testuser_debug_123@example.com",
    "password": "SuperSecurePassword123!"
}
data = json.dumps(payload).encode('utf-8')

req = urllib.request.Request(
    url,
    data=data,
    headers={"Content-Type": "application/json"},
    method="POST"
)

try:
    ctx = ssl.create_default_context()
    with urllib.request.urlopen(req, context=ctx) as response:
        print("Status Code:", response.status)
        print("Response Body:", response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print("HTTP Error Status Code:", e.code)
    print("HTTP Error Body:", e.read().decode('utf-8'))
except Exception as e:
    print("General Error:", str(e))
