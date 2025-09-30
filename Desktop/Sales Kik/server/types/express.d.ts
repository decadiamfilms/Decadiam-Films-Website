import { User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
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
  }
}

export {};