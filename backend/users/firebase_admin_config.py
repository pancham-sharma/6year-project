import os
import firebase_admin
from firebase_admin import credentials, auth
from django.conf import settings
import json

def initialize_firebase():
    """Robust initialization of Firebase Admin SDK"""
    if not firebase_admin._apps:
        try:
            print("🚀 Initializing Firebase Admin SDK...")
            
            # 1. Try local JSON file first (it's the most reliable)
            # Check multiple possible locations
            base_dir = getattr(settings, 'BASE_DIR', os.getcwd())
            possible_paths = [
                os.path.join(base_dir, "firebase-service-account.json"),
                os.path.join(base_dir, "firebase-service-account (2).json"),
                "/etc/secrets/firebase-service-account.json",
            ]
            
            for path in possible_paths:
                if os.path.exists(path):
                    try:
                        with open(path, 'r') as f:
                            cert_dict = json.load(f)
                        
                        # Sanitize the private key inside the dict just in case
                        if 'private_key' in cert_dict:
                            key = cert_dict['private_key']
                            if "\\n" in key:
                                cert_dict['private_key'] = key.replace("\\n", "\n")
                        
                        cred = credentials.Certificate(cert_dict)
                        firebase_admin.initialize_app(cred)
                        print(f"✅ Firebase Admin SDK initialized from: {os.path.basename(path)}")
                        return True
                    except Exception as e:
                        print(f"⚠️ Failed to init from {path}: {e}")

            # 2. Fallback to Environment Variables
            project_id = os.getenv("FIREBASE_PROJECT_ID")
            private_key = os.getenv("FIREBASE_PRIVATE_KEY")
            client_email = os.getenv("FIREBASE_CLIENT_EMAIL")

            if project_id and private_key:
                print("📝 Attempting initialization from Environment Variables...")
                # Thorough cleaning of the private key
                clean_key = private_key.strip().strip('"').strip("'")
                
                # Replace literal \n with actual newlines
                clean_key = clean_key.replace("\\n", "\n")
                clean_key = clean_key.replace("\\\\n", "\n")
                
                # If it still has multiple \n but they are literal, handle them
                # (sometimes env vars get messy)
                
                # Ensure headers
                if "-----BEGIN PRIVATE KEY-----" not in clean_key:
                    clean_key = f"-----BEGIN PRIVATE KEY-----\n{clean_key}\n-----END PRIVATE KEY-----"

                cred_dict = {
                    "type": "service_account",
                    "project_id": project_id,
                    "private_key": clean_key,
                    "client_email": client_email,
                    "token_uri": "https://oauth2.googleapis.com/token",
                }
                
                # Add optional fields if they exist
                for field in ["private_key_id", "client_id"]:
                    val = os.getenv(f"FIREBASE_{field.upper()}")
                    if val: cred_dict[field] = val

                cred = credentials.Certificate(cred_dict)
                firebase_admin.initialize_app(cred)
                print("✅ Firebase Admin SDK successfully initialized from environment variables.")
                return True
            else:
                print("⚠️ Firebase credentials missing in both JSON file and environment variables.")
                return False
        except Exception as e:
            print(f"❌ Firebase Initialization Error: {str(e)}")
            import traceback
            # Log the full error to help debug the PEM issue
            traceback.print_exc()
            return False
    return True

# Auto-initialize on import
initialize_firebase()
