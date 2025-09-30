import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../../../lib/auth';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Skip authentication for now to enable quick testing
    // const user = await authenticateToken(req);
    // if (!user) {
    //   return res.status(401).json({ error: 'Unauthorized' });
    // }

    if (req.method === 'GET') {
      // Get all processing options grouped by type using the simplified schema
      const processingOptions = await prisma.glassProcessingOption.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' }
      });

      // Group by type
      const grouped = processingOptions.reduce((acc, option) => {
        const type = option.type.toLowerCase();
        if (!acc[type]) acc[type] = [];
        
        acc[type].push({
          id: option.id,
          name: option.name,
          description: option.description,
          baseRate: option.baseRate,
          rateType: option.rateType,
          // Map to expected field names for backward compatibility
          ratePerMeter: option.rateType === 'PER_METER' ? option.baseRate : undefined,
          ratePerPiece: option.rateType === 'PER_PIECE' ? option.baseRate : undefined,
          rate: option.baseRate
        });
        return acc;
      }, {} as Record<string, any[]>);

      return res.status(200).json({
        edgework: grouped['edgework'] || [],
        cornerFinish: grouped['corner'] || [],
        holesCutouts: grouped['hole'] || [],
        services: grouped['service'] || [],
        surfaceFinish: grouped['finish'] || []
      });
    }

    if (req.method === 'POST') {
      const { type, name, description, baseRate, rateType } = req.body;

      if (!type || !name || !baseRate || !rateType) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const processingOption = await prisma.glassProcessingOption.create({
        data: {
          type: type.toUpperCase(),
          name,
          description: description || null,
          baseRate: parseFloat(baseRate),
          rateType,
          isActive: true
        }
      });

      return res.status(201).json(processingOption);
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Glass processing options API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}