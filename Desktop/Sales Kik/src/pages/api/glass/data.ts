import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const glassTypes = await prisma.glassType.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' }
      });

      const processingOptions = await prisma.glassProcessingOption.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' }
      });

      const groupedProcessing = processingOptions.reduce((acc, option) => {
        if (!acc[option.type]) acc[option.type] = [];
        acc[option.type].push(option);
        return acc;
      }, {} as Record<string, any[]>);

      return res.json({
        glassTypes,
        processing: groupedProcessing,
        thicknesses: [4, 5, 6, 8, 10, 12, 15]
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Glass data API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}