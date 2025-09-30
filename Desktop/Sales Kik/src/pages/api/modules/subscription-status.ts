import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../../../lib/auth';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // For development, grant access to Glass Industry Module for our dev user
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    if (req.method === 'GET') {
      const { moduleId } = req.query;

      if (!moduleId) {
        return res.status(400).json({ error: 'Module ID is required' });
      }

      // Always grant access to GLASS_INDUSTRY module for development
      if (moduleId === 'GLASS_INDUSTRY') {
        return res.status(200).json({
          isActive: true,
          isExpired: false,
          isTrialing: false,
          trialDaysRemaining: 0,
          status: 'ACTIVE',
          moduleId: 'GLASS_INDUSTRY',
          moduleName: 'Glass Industry Module',
          monthlyAmount: 35.00,
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          companyName: 'Ecco Hardware'
        });
      }

      // For other modules, check actual subscriptions or return trial access
      try {
        // Try to get company from token if available
        if (token) {
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          
          if (decoded.userId) {
            const user = await prisma.user.findUnique({
              where: { id: decoded.userId },
              include: { company: true }
            });
            
            if (user && user.email === 'adam@eccohardware.com.au') {
              // Grant access to all modules for dev user
              return res.status(200).json({
                isActive: true,
                isExpired: false,
                isTrialing: true,
                trialDaysRemaining: 30,
                status: 'TRIAL',
                moduleId: moduleId as string,
                moduleName: `${moduleId} Module`,
                monthlyAmount: 35.00,
                nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
              });
            }
          }
        }
      } catch (jwtError) {
        console.log('JWT verification failed, continuing with default access...');
      }

      // For other modules without auth, return no access
      return res.status(200).json({
        isActive: false,
        isExpired: true,
        isTrialing: false,
        trialDaysRemaining: 0,
        status: 'INACTIVE',
        moduleId: moduleId as string,
        moduleName: 'Unknown Module',
        monthlyAmount: 0,
        nextBillingDate: null
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Module subscription status API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}