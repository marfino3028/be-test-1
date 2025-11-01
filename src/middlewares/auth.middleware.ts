import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../utils/auth.utils';
import { errorResponse } from '../utils/response.utils';


declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Middleware to authenticate requests using JWT
 * Expects Authorization header with Bearer token
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json(
        errorResponse('Authentication required. Please provide a valid token.')
      );
      return;
    }

    
    const token = authHeader.substring(7); 

    
    const decoded = verifyToken(token);

    
    req.user = decoded;

    next();
  } catch (error) {
    res.status(401).json(
      errorResponse('Invalid or expired token. Please login again.')
    );
  }
};

/**
 * Optional auth middleware - doesn't fail if no token provided
 * Useful for endpoints that work with or without authentication
 */
export const optionalAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      req.user = decoded;
    }

    next();
  } catch (error) {
    
    next();
  }
};
