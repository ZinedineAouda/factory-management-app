import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { dbGet } from '../database/db';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username?: string;
    email?: string;
    role: string;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('Auth header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader) {
      console.error('Authentication failed: No authorization header');
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      console.error('Authentication failed: Token is empty');
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    req.user = decoded;
    console.log('Authentication successful for user:', decoded.id, 'role:', decoded.role);
    next();
  } catch (error: any) {
    console.error('Authentication error:', error.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Check permission from role_permissions table
export const requirePermission = (permissionField: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Admin always has all permissions
    if (req.user.role === 'admin') {
      return next();
    }

    try {
      // Get role permissions from database
      const rolePermissions = await dbGet(
        'SELECT * FROM role_permissions WHERE role = ?',
        [req.user.role]
      );

      if (!rolePermissions) {
        console.warn(`No permissions found for role: ${req.user.role}`);
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      // Check if the specific permission is enabled
      const hasPermission = (rolePermissions as any)[permissionField] === 1;
      
      if (!hasPermission) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      next();
    } catch (error: any) {
      console.error('Permission check error:', error);
      return res.status(500).json({ error: 'Failed to check permissions' });
    }
  };
};

