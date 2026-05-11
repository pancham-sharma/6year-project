import { Router } from 'express';
import { googleAuth, checkEmailStatus } from '../controllers/auth.controller';

const router = Router();

// Endpoint: POST /api/users/auth/google/
router.post('/google', googleAuth);

// Endpoint: GET /api/users/auth/check-email-status/:email
router.get('/check-email-status/:email', checkEmailStatus);

export default router;
