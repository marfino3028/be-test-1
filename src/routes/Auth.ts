import { Router } from 'express';
import AuthController from '../controllers/rest/AuthController';

const router = Router();

/**
 * Authentication Routes
 * Base path: /auth
 */

// POST /auth/register - Register new user
router.post('/register', AuthController.register);

// POST /auth/login - Login user
router.post('/login', AuthController.login);

// GET /auth/profile - Get current user profile (requires authentication)
router.get('/profile', AuthController.getProfile);

export default router;
