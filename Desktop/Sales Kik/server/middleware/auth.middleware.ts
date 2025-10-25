import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: {
    id: string;
    companyId: string;
    email: string;
  };
  session?: {
    id: string;
    token: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

    // Check if session exists and is valid
    console.log('Auth middleware: Looking for session with token length:', token.length);
    console.log('Auth middleware: Token prefix:', token.substring(0, 50) + '...');
    
    const session = await prisma.authSession.findUnique({
      where: { token },
      include: { user: true },
    });

    console.log('Auth middleware: Session found:', !!session);
    if (session) {
      console.log('Auth middleware: Session ID:', session.id);
      console.log('Auth middleware: Session token matches:', session.token === token);
    }

    if (!session || session.expiresAt < new Date()) {
      console.log('Auth middleware: No session found or session expired');
      res.status(401).json({ error: 'Session expired' });
      return;
    }

    // Update last activity
    await prisma.authSession.update({
      where: { id: session.id },
      data: { lastActivity: new Date() },
    });

    req.user = {
      id: session.user.id,
      companyId: session.user.company_id,
      email: session.user.email,
    };
    req.session = {
      id: session.id,
      token: session.token,
    };

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const authorize = (permissions: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      // Get user's groups and permissions
      const userGroups = await prisma.userGroupMembership.findMany({
        where: { userId: req.user.id },
        include: { group: true },
      });

      // Check if user has any of the required permissions
      const hasPermission = userGroups.some(membership => {
        const groupPermissions = membership.group.permissions as any;
        return permissions.some(permission => {
          const [module, action] = permission.split('.');
          return groupPermissions[module]?.[action] === true;
        });
      });

      if (!hasPermission) {
        res.status(403).json({ error: 'Insufficient permissions' });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({ error: 'Authorization check failed' });
    }
  };
};