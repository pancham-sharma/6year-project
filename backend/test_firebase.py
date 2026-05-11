import os
import sys
import json
import firebase_admin
from firebase_admin import credentials

def test_init():
    json_path = "firebase-service-account.json"
    if not os.path.exists(json_path):
        print(f"File {json_path} not found")
        return

    print(f"Testing {json_path}...")
    try:
        with open(json_path, 'r') as f:
            data = json.load(f)
            print("JSON is valid")
            key = data.get('private_key', '')
            print(f"Key length: {len(key)}")
            print(f"Key starts with: {key[:30]}")
            print(f"Key ends with: {key[-30:]}")
            
        cred = credentials.Certificate(json_path)
        app = firebase_admin.initialize_app(cred, name='test')
        print("✅ Success!")
        firebase_admin.delete_app(app)
    except Exception as e:
        print(f"❌ Failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_init()
