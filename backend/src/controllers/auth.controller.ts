import { Request, Response } from 'express';
import { auth } from '../config/firebaseAdmin';
import { query } from '../utils/db';
import * as jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key';

export const googleAuth = async (req: Request, res: Response) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'No token provided' });
  }

  try {
    console.log('--- Google Auth Token Verification ---');
    // Verify the Firebase ID token
    const decodedToken = await auth.verifyIdToken(token);
    const { email, name, picture, uid } = decodedToken;

    console.log(`Verified user: ${email} (UID: ${uid})`);

    if (!email) {
      return res.status(400).json({ error: 'Email not found in token' });
    }

    // Check if user exists in the Django-compatible PostgreSQL table
    // Note: Django table is likely 'users_user'
    const userResult = await query('SELECT * FROM users_user WHERE email = $1', [email]);
    let user = userResult.rows[0];

    if (!user) {
      console.log(`User ${email} not found. Creating new donor...`);
      const username = email.split('@')[0] + Math.floor(Math.random() * 900 + 100);
      const nameParts = (name || '').split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Insert new user following Django's standard schema
      // We set a long random password hash as they login via Google
      const insertResult = await query(
        `INSERT INTO users_user (
          email, username, first_name, last_name, role, is_email_verified, 
          password, is_staff, is_active, is_superuser, date_joined
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW()) RETURNING *`,
        [email, username, firstName, lastName, 'DONOR', true, '!', false, true, false]
      );
      user = insertResult.rows[0];
      console.log(`User created: ${username}`);
    } else {
      console.log(`User ${email} found. Role: ${user.role}`);
      // Ensure email is marked as verified if it wasn't
      if (!user.is_email_verified) {
        await query('UPDATE users_user SET is_email_verified = $1 WHERE id = $2', [true, user.id]);
        user.is_email_verified = true;
      }
    }

    // Generate a custom JWT for the application
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      access: accessToken,
      refresh: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        profile_picture: picture || user.profile_picture
      }
    });

  } catch (error: any) {
    console.error('❌ Google Auth Error:', error.message);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Firebase ID token has expired. Please login again.' });
    }
    
    return res.status(500).json({ 
      error: 'Authentication failed on server', 
      details: error.message 
    });
  }
};
