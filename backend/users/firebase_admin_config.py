import os
import firebase_admin
from firebase_admin import credentials, auth

def initialize_firebase_sdk():
    """
    Centralized Firebase initialization for Django + Render.
    Uses environment variables for security.
    """
    if not firebase_admin._apps:
        try:
            # Construct credentials from environment variables
            private_key = os.getenv("FIREBASE_PRIVATE_KEY")
            if private_key:
                # Critical fix for Render: Ensure line breaks are handled correctly
                private_key = private_key.replace("\\n", "\n")

            cred_dict = {
                "type": "service_account",
                "project_id": os.getenv("FIREBASE_PROJECT_ID"),
                "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID"),
                "private_key": private_key,
                "client_email": os.getenv("FIREBASE_CLIENT_EMAIL"),
                "client_id": os.getenv("FIREBASE_CLIENT_ID"),
                "token_uri": "https://oauth2.googleapis.com/token"
            }

            # Only initialize if we have the essential fields
            if cred_dict["project_id"] and cred_dict["private_key"]:
                cred = credentials.Certificate(cred_dict)
                firebase_admin.initialize_app(cred)
                print(f"✅ Firebase Admin SDK initialized for: {cred_dict['project_id']}")
            else:
                print("⚠️ Firebase credentials incomplete in environment variables.")
        except Exception as e:
            print(f"❌ Firebase SDK Initialization Error: {str(e)}")

# Auto-initialize on import
initialize_firebase_sdk()
