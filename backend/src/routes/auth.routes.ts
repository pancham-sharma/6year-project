import { Router } from 'express';
import { googleAuth } from '../controllers/auth.controller';

const router = Router();

// Endpoint: POST /api/users/auth/google/
router.post('/google', googleAuth);

export default router;
