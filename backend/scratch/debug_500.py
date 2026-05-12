import requests
import json

base_url = "http://localhost:8000"

def test_endpoint(endpoint):
    print(f"Testing {endpoint}...")
    try:
        # We need a token. Let's try to get one if we don't have it.
        # But for now, let's just see if it returns 500 without auth or with 401.
        # If it returns 500, it's a server crash.
        resp = requests.get(f"{base_url}{endpoint}")
        print(f"Status: {resp.status_code}")
        if resp.status_code == 500:
            print("ERROR: 500 Internal Server Error")
            # Try to see if there's any HTML error page with traceback
            if "traceback" in resp.text.lower():
                print("Traceback found in response!")
    except Exception as e:
        print(f"Connection failed: {e}")

test_endpoint("/api/donations/categories/")
test_endpoint("/api/inventory/items/")
test_endpoint("/api/chat/messages/total_unread/")
