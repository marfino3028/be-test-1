import { Router } from 'express';
import AuthController from '../controllers/rest/AuthController';

const router = Router();

/**
 * Authentication Routes
 * Base path: /auth
 */


router.post('/register', AuthController.register);


router.post('/login', AuthController.login);


router.get('/profile', AuthController.getProfile);

export default router;
