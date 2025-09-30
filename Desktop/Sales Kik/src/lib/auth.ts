import { NextApiRequest } from 'next';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthUser {
  id: string;
  companyId: string;
  email: string;
}

export const authenticateToken = async (req: NextApiRequest): Promise<AuthUser | null> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return null;
    }

    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

    // Check if session exists and is valid
    const session = await prisma.authSession.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    // Update last activity
    await prisma.authSession.update({
      where: { id: session.id },
      data: { lastActivity: new Date() },
    });

    return {
      id: session.user.id,
      companyId: session.user.companyId,
      email: session.user.email,
    };

  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
};