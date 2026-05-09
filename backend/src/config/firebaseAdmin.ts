import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Initializes the Firebase Admin SDK safely.
 * Solves the "project ID required" error by explicitly passing the ID.
 */
const initializeFirebase = () => {
  try {
    if (admin.apps.length > 0) {
      console.log('Firebase Admin already initialized.');
      return admin.app();
    }

    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    console.log('--- Firebase Initialization Debug ---');
    console.log(`Project ID: ${projectId || 'MISSING'}`);
    console.log(`Client Email: ${clientEmail ? 'EXISTS' : 'MISSING'}`);
    console.log(`Private Key: ${privateKey ? 'EXISTS' : 'MISSING'}`);

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Missing Firebase environment variables (Project ID, Client Email, or Private Key).');
    }

    // Handle Render/Unix newline characters in private key
    const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');
    
    if (!formattedPrivateKey.includes('BEGIN PRIVATE KEY')) {
      console.warn('WARNING: Private key format looks suspicious. Ensure it starts with BEGIN PRIVATE KEY.');
    }

    const app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: projectId,
        clientEmail: clientEmail,
        privateKey: formattedPrivateKey,
      }),
      projectId: projectId, // Explicitly set to prevent "A project ID is required" error
    });

    console.log('✅ Firebase Admin SDK initialized successfully.');
    return app;
  } catch (error: any) {
    console.error('❌ Firebase Admin Initialization Failed:', error.message);
    return null;
  }
};

const firebaseApp = initializeFirebase();

export const auth = admin.auth();
export default firebaseApp;
