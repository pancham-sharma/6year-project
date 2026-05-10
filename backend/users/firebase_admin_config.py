import os
import firebase_admin
from firebase_admin import credentials, auth

# Critical: Check if already initialized to prevent 500 errors
if not firebase_admin._apps:
    try:
        # Get environment variables
        project_id = os.getenv("FIREBASE_PROJECT_ID")
        private_key_id = os.getenv("FIREBASE_PRIVATE_KEY_ID")
        private_key = os.getenv("FIREBASE_PRIVATE_KEY")
        client_email = os.getenv("FIREBASE_CLIENT_EMAIL")
        client_id = os.getenv("FIREBASE_CLIENT_ID")

        if project_id and private_key:
            # Handle the literal \n characters from Render environment variables
            clean_private_key = private_key.replace("\\n", "\n")
            
            cred = credentials.Certificate({
                "type": "service_account",
                "project_id": project_id,
                "private_key_id": private_key_id,
                "private_key": clean_private_key,
                "client_email": client_email,
                "client_id": client_id,
                "token_uri": "https://oauth2.googleapis.com/token"
            })
            
            firebase_admin.initialize_app(cred)
            print("✅ Firebase Admin SDK successfully initialized.")
        else:
            print("⚠️ Firebase environment variables are missing.")
    except Exception as e:
        print(f"❌ Firebase Initialization Error: {str(e)}")
