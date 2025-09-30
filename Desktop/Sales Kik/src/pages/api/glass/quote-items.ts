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

    if (req.method === 'POST') {
      const {
        quoteId,
        glassTypeId,
        thickness,
        productType = 'NOT_TOUGHENED',
        quantity,
        heightMm,
        widthMm,
        squareMeters,
        itemCode,
        basePrice,
        totalBasePrice,
        edgeworkSelections,
        cornerFinishSelections,
        holesAndCutouts,
        serviceSelections,
        surfaceFinishSelections,
        totalProcessingCost,
        totalItemCost
      } = req.body;

      if (!quoteId || !glassTypeId || !quantity || !heightMm || !widthMm) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      try {
        // Create the glass quote item using simplified schema
        const glassQuoteItem = await prisma.glassQuoteItem.create({
          data: {
            quoteId,
            glassTypeId,
            thickness: parseFloat(thickness),
            productType,
            quantity: parseInt(quantity),
            heightMm: parseFloat(heightMm),
            widthMm: parseFloat(widthMm),
            squareMeters: parseFloat(squareMeters),
            itemCode: itemCode || undefined,
            
            // Processing as simple strings for speed
            edgework: edgeworkSelections ? JSON.stringify(edgeworkSelections) : undefined,
            cornerFinish: cornerFinishSelections ? JSON.stringify(cornerFinishSelections) : undefined,
            holesAndCutouts: holesAndCutouts ? JSON.stringify(holesAndCutouts) : undefined,
            services: serviceSelections ? JSON.stringify(serviceSelections) : undefined,
            surfaceFinishes: surfaceFinishSelections ? JSON.stringify(surfaceFinishSelections) : undefined,
            
            // Pricing
            pricePerSqm: parseFloat(basePrice),
            basePrice: parseFloat(totalBasePrice),
            processingCost: parseFloat(totalProcessingCost) || 0,
            totalPrice: parseFloat(totalItemCost)
          },
          include: {
            glassType: true,
            quote: true
          }
        });

        return res.status(201).json(glassQuoteItem);

      } catch (error) {
        console.error('Error creating glass quote item:', error);
        return res.status(500).json({ error: 'Failed to create glass quote item' });
      }
    }

    if (req.method === 'GET') {
      const { quoteId } = req.query;

      if (!quoteId) {
        return res.status(400).json({ error: 'Quote ID is required' });
      }

      try {
        const glassQuoteItems = await prisma.glassQuoteItem.findMany({
          where: { quoteId: quoteId as string },
          include: {
            glassType: true,
            quote: true
          },
          orderBy: { createdAt: 'asc' }
        });

        return res.status(200).json(glassQuoteItems);

      } catch (error) {
        console.error('Error fetching glass quote items:', error);
        return res.status(500).json({ error: 'Failed to fetch glass quote items' });
      }
    }

    if (req.method === 'DELETE') {
      const { itemId } = req.query;

      if (!itemId) {
        return res.status(400).json({ error: 'Item ID is required' });
      }

      try {
        await prisma.glassQuoteItem.delete({
          where: { id: itemId as string }
        });

        return res.status(200).json({ message: 'Glass quote item deleted successfully' });

      } catch (error) {
        console.error('Error deleting glass quote item:', error);
        return res.status(500).json({ error: 'Failed to delete glass quote item' });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Glass quote items API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}