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
      const { 
        glassTypeId, 
        thickness, 
        quantity = '1', 
        heightMm, 
        widthMm,
        productType = 'NOT_TOUGHENED',
        edgeworkIds,
        cornerFinishIds,
        holesIds,
        serviceIds,
        finishIds,
        customerId 
      } = req.query;

      if (!glassTypeId || !thickness || !heightMm || !widthMm) {
        return res.json({ total: 0, breakdown: {} });
      }

      try {
        // Find specific glass product by type, thickness, and product type
        const glassProduct = await prisma.glassProduct.findFirst({
          where: {
            glassTypeId: glassTypeId as string,
            thickness: parseFloat(thickness as string),
            productType: productType as string,
            isActive: true
          },
          include: {
            glassType: true,
            supplierPricing: {
              where: { isPrimary: true }
            }
          }
        });

        if (!glassProduct) {
          return res.json({ total: 0, breakdown: {}, error: 'Glass product not found for this thickness and type combination' });
        }

        // Get customer-specific pricing or use product pricing tiers
        let pricePerSqm = glassProduct.priceT2; // Default to T2 pricing

        if (customerId) {
          // Check for customer-specific pricing
          const customerPrice = await prisma.customerGlassPrice.findFirst({
            where: {
              customerId: customerId as string,
              glassTypeId: glassProduct.glassTypeId,
              thickness: parseFloat(thickness as string)
            }
          });
          
          if (customerPrice) {
            pricePerSqm = customerPrice.customerPrice;
          } else {
            // Use customer tier pricing from product
            // You can implement customer tier logic here
            // For now, using T2 as default
            pricePerSqm = glassProduct.priceT2;
          }
        }

        // Calculate dimensions
        const sqmPerPanel = (parseFloat(heightMm as string) / 1000) * (parseFloat(widthMm as string) / 1000);
        const totalSqm = sqmPerPanel * parseInt(quantity as string || '1');
        const basePrice = pricePerSqm * totalSqm;

        // Calculate processing costs using database
        let processingCost = 0;
        const processingBreakdown: string[] = [];
        
        // Get all processing options if any are selected
        const allSelectedIds = [
          ...(edgeworkIds ? (edgeworkIds as string).split(',') : []),
          ...(cornerFinishIds ? (cornerFinishIds as string).split(',') : []),
          ...(holesIds ? (holesIds as string).split(',') : []),
          ...(serviceIds ? (serviceIds as string).split(',') : []),
          ...(finishIds ? (finishIds as string).split(',') : [])
        ].filter(id => id.trim());

        if (allSelectedIds.length > 0) {
          const processingOptions = await prisma.glassProcessingOption.findMany({
            where: { 
              id: { in: allSelectedIds },
              isActive: true 
            }
          });

          const qtyInt = parseInt(quantity as string || '1');
          const perimeterM = ((parseFloat(heightMm as string) + parseFloat(widthMm as string)) * 2 / 1000) * qtyInt;

          for (const option of processingOptions) {
            let optionCost = 0;
            let costDescription = '';

            switch (option.rateType) {
              case 'PER_METER':
                optionCost = perimeterM * option.baseRate;
                costDescription = `${option.name}: ${perimeterM.toFixed(2)}m × $${option.baseRate} = $${optionCost.toFixed(2)}`;
                break;
              case 'PER_PIECE':
                optionCost = qtyInt * option.baseRate;
                costDescription = `${option.name}: ${qtyInt} pcs × $${option.baseRate} = $${optionCost.toFixed(2)}`;
                break;
              case 'PER_SQM':
                optionCost = totalSqm * option.baseRate;
                costDescription = `${option.name}: ${totalSqm.toFixed(3)}m² × $${option.baseRate} = $${optionCost.toFixed(2)}`;
                break;
              case 'FIXED':
              default:
                optionCost = option.baseRate;
                costDescription = `${option.name}: $${optionCost.toFixed(2)}`;
                break;
            }

            processingCost += optionCost;
            processingBreakdown.push(costDescription);
          }
        }

        const total = basePrice + processingCost;

        return res.json({
          total,
          basePrice,
          processingCost,
          pricePerSqm,
          sqm: totalSqm,
          breakdown: {
            glass: `${totalSqm.toFixed(3)}m² × $${pricePerSqm.toFixed(2)} = $${basePrice.toFixed(2)}`,
            processing: processingBreakdown,
            processingTotal: `$${processingCost.toFixed(2)}`,
            total: `$${total.toFixed(2)}`
          }
        });

      } catch (error) {
        console.error('Glass price calculation error:', error);
        return res.json({ total: 0, error: 'Calculation failed' });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Glass calculate price API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

