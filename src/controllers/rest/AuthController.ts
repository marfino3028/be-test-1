import { Request, Response } from 'express';
import AuthService from '../../services/AuthService';
import { prisma } from '../../utils/prisma.utils';
import { successResponse, errorResponse } from '../../utils/response.utils';

const authService = new AuthService(prisma);

/**
 * Auth Controller
 * Handles authentication-related HTTP requests
 */
export default class AuthController {
  /**
   * Register a new user
   * POST /auth/register
   */
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { firstName, lastName, email, password, phoneNumber, country, bio } = req.body;

      
      if (!firstName || !lastName || !email || !password) {
        res.status(400).json(
          errorResponse('First name, last name, email, and password are required')
        );
        return;
      }

     
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json(errorResponse('Invalid email format'));
        return;
      }

      
      if (password.length < 6) {
        res.status(400).json(
          errorResponse('Password must be at least 6 characters long')
        );
        return;
      }

      const result = await authService.register({
        firstName,
        lastName,
        email,
        password,
        phoneNumber,
        country,
        bio,
      });

      res.status(201).json(
        successResponse(result, 'User registered successfully')
      );
    } catch (error: any) {
      if (error.message === 'User with this email already exists') {
        res.status(409).json(errorResponse(error.message));
      } else {
        res.status(500).json(errorResponse('Failed to register user'));
      }
    }
  }

  /**
   * Login user
   * POST /auth/login
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      
      if (!email || !password) {
        res.status(400).json(errorResponse('Email and password are required'));
        return;
      }

      const result = await authService.login({ email, password });

      res.status(200).json(
        successResponse(result, 'Login successful')
      );
    } catch (error: any) {
      if (error.message === 'Invalid email or password') {
        res.status(401).json(errorResponse(error.message));
      } else {
        res.status(500).json(errorResponse('Failed to login'));
      }
    }
  }

  /**
   * Get current user profile
   * GET /auth/profile
   * Requires authentication
   */
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(errorResponse('Authentication required'));
        return;
      }

      const user = await authService.getProfile(req.user.userId);

      res.status(200).json(
        successResponse(user, 'Profile retrieved successfully')
      );
    } catch (error: any) {
      res.status(500).json(errorResponse('Failed to get profile'));
    }
  }
}
