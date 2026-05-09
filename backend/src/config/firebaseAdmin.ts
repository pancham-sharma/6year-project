import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * PRODUCTION-READY FIREBASE ADMIN SDK CONFIGURATION
 * Specifically designed for Render/Node.js to solve "Project ID required" errors.
 */

const validateEnv = () => {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  const missing = [];
  if (!projectId) missing.push('FIREBASE_PROJECT_ID / GOOGLE_CLOUD_PROJECT');
  if (!clientEmail) missing.push('FIREBASE_CLIENT_EMAIL');
  if (!privateKey) missing.push('FIREBASE_PRIVATE_KEY');

  if (missing.length > 0) {
    console.error('❌ CRITICAL: Missing Firebase Environment Variables:', missing.join(', '));
    console.error('Render Deployment Tip: Ensure these are added in the Environment section of your Dashboard.');
    throw new Error(`Missing Firebase configuration: ${missing.join(', ')}`);
  }

  return { projectId, clientEmail, privateKey };
};

const initializeFirebase = () => {
  try {
    // Prevent multiple initializations
    if (admin.apps.length > 0) {
      console.log('ℹ️ Firebase Admin already initialized. Using existing instance.');
      return admin.app();
    }

    const { projectId, clientEmail, privateKey } = validateEnv();

    console.log('--- Firebase Debugging Info ---');
    console.log(`📡 Project ID: ${projectId}`);
    console.log(`📧 Client Email: ${clientEmail}`);
    
    // Handle Render/Unix newline characters (\n literal vs real newline)
    const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

    if (!formattedPrivateKey.includes('BEGIN PRIVATE KEY')) {
      console.error('❌ ERROR: FIREBASE_PRIVATE_KEY is malformed. It must start with "-----BEGIN PRIVATE KEY-----"');
      throw new Error('Malformed FIREBASE_PRIVATE_KEY');
    }

    const app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: projectId,
        clientEmail: clientEmail,
        privateKey: formattedPrivateKey,
      }),
      projectId: projectId, // CRITICAL: Explicitly set to prevent "A project ID is required" error
    });

    console.log('✅ Firebase Admin SDK initialized successfully for project:', projectId);
    return app;
  } catch (error: any) {
    console.error('💥 FATAL: Firebase Initialization Failed!');
    console.error('Error Details:', error.message);
    throw error; // Stop the server if Firebase isn't ready
  }
};

// Execute initialization
const firebaseApp = initializeFirebase();

// Export the Auth service for use in controllers
export const auth = admin.auth(); 
export default firebaseApp;
