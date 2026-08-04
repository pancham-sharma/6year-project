# Node.js Backend Deployment on Render

This guide helps you deploy the new Node.js authentication service on Render.

## 1. Environment Variables
Add these to your Render Dashboard under **Environment**:

| Key | Example Value / Description |
|-----|---------------------------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Your Supabase Connection String |
| `FIREBASE_PROJECT_ID` | `your-project-id` |
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk-...@...iam.gserviceaccount.com` |
| `FIREBASE_PRIVATE_KEY` | `-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----` |
| `JWT_SECRET` | A long random string for session tokens |

> [!IMPORTANT]
> **FIREBASE_PRIVATE_KEY**: Copy the entire key including `-----BEGIN...` and `-----END...`. If you are pasting it manually, ensure newlines are represented as `\n`.

## 2. Render Settings
- **Runtime**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

## 3. Why this works
- **Explicit Project ID**: Prevents the "Project ID required" error by bypassing auto-detection.
- **Newline Parsing**: The `firebaseAdmin.ts` uses `.replace(/\\n/g, '\n')` to ensure the private key is read correctly even if Render strips real newlines.
- **PostgreSQL Pool**: Uses `rejectUnauthorized: false` for Supabase SSL compatibility in production.
