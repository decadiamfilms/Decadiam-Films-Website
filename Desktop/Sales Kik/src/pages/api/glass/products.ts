import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Skip authentication for development
    // const user = await authenticateToken(req);
    // if (!user) {
    //   return res.status(401).json({ error: 'Unauthorized' });
    // }

    if (req.method === 'GET') {
      // Get all glass products with their supplier pricing
      const glassProducts = await prisma.glassProduct.findMany({
        where: { isActive: true },
        include: {
          glassType: true,
          supplierPricing: {
            orderBy: { isPrimary: 'desc' } // Primary supplier first
          }
        },
        orderBy: [
          { glassType: { name: 'asc' } },
          { thickness: 'asc' },
          { productType: 'asc' }
        ]
      });

      return res.status(200).json(glassProducts);
    }

    if (req.method === 'POST') {
      const {
        glassTypeName,
        sku,
        thickness,
        productType = 'N/A',
        priceT1,
        priceT2,
        priceT3,
        priceRetail,
        supplierPricing = []
      } = req.body;

      if (!glassTypeName || !sku || !thickness || !priceT1 || !priceT2 || !priceT3 || !priceRetail) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      if (!supplierPricing.length || !supplierPricing[0].supplier || !supplierPricing[0].costPrice) {
        return res.status(400).json({ error: 'At least one supplier with cost price is required' });
      }

      try {
        // Find or create glass type
        let glassType = await prisma.glassType.findFirst({
          where: { name: glassTypeName }
        });

        if (!glassType) {
          glassType = await prisma.glassType.create({
            data: {
              name: glassTypeName,
              basePrice: parseFloat(priceT2), // Use T2 as base price for reference
              isActive: true
            }
          });
        }

        // Create glass product
        const glassProduct = await prisma.glassProduct.create({
          data: {
            glassTypeId: glassType.id,
            sku,
            thickness: parseFloat(thickness),
            productType,
            priceT1: parseFloat(priceT1),
            priceT2: parseFloat(priceT2),
            priceT3: parseFloat(priceT3),
            priceRetail: parseFloat(priceRetail),
            isActive: true
          }
        });

        // Create supplier pricing entries
        for (let i = 0; i < supplierPricing.length; i++) {
          const pricing = supplierPricing[i];
          if (pricing.supplier && pricing.costPrice) {
            await prisma.glassSupplierPricing.create({
              data: {
                glassProductId: glassProduct.id,
                supplierName: pricing.supplier.name,
                supplierSku: pricing.supplierSku || null,
                costPrice: parseFloat(pricing.costPrice),
                isPrimary: i === 0 // First supplier is primary
              }
            });
          }
        }

        // Return created product with supplier pricing
        const createdProduct = await prisma.glassProduct.findUnique({
          where: { id: glassProduct.id },
          include: {
            glassType: true,
            supplierPricing: true
          }
        });

        return res.status(201).json(createdProduct);

      } catch (error) {
        console.error('Error creating glass product:', error);
        return res.status(500).json({ error: 'Failed to create glass product' });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Glass products API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}