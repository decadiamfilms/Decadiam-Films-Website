// Advanced Pricing Engine - Handles all pricing methods from specifications

export interface PricingCalculation {
  basePrice: number;
  quantity: number;
  area?: number;
  width?: number;
  height?: number;
  unitPrice: number;
  totalPrice: number;
  method: 'each' | 'sqm' | 'box';
  conversions?: {
    boxes?: number;
    sqm?: number;
    units?: number;
  };
  breakdown: string[];
}

export class PricingEngine {
  
  // Calculate price with all methods from specifications
  static calculatePrice(
    basePrice: number,
    quantity: number,
    pricingMethod: 'each' | 'sqm' | 'box',
    width?: number,
    height?: number,
    boxConversion?: number
  ): PricingCalculation {
    
    const breakdown: string[] = [];
    let area: number | undefined;
    let unitPrice: number;
    let totalPrice: number;
    let conversions: any = {};

    switch (pricingMethod) {
      case 'each':
        unitPrice = basePrice;
        totalPrice = basePrice * quantity;
        breakdown.push(`${quantity} units × $${basePrice.toFixed(2)} = $${totalPrice.toFixed(2)}`);
        break;

      case 'sqm':
        if (width && height) {
          // Convert mm to square meters
          area = (width * height) / 1000000;
          unitPrice = basePrice;
          totalPrice = basePrice * area * quantity;
          conversions.sqm = area * quantity;
          breakdown.push(`${width}mm × ${height}mm = ${area.toFixed(2)} sqm`);
          breakdown.push(`${area.toFixed(2)} sqm × ${quantity} panels = ${(area * quantity).toFixed(2)} sqm`);
          breakdown.push(`${(area * quantity).toFixed(2)} sqm × $${basePrice.toFixed(2)} = $${totalPrice.toFixed(2)}`);
        } else {
          // Fallback to quantity-based
          unitPrice = basePrice;
          totalPrice = basePrice * quantity;
          breakdown.push(`${quantity} sqm × $${basePrice.toFixed(2)} = $${totalPrice.toFixed(2)}`);
        }
        break;

      case 'box':
        unitPrice = basePrice;
        totalPrice = basePrice * quantity;
        conversions.boxes = quantity;
        
        if (boxConversion) {
          conversions.sqm = quantity * boxConversion;
          breakdown.push(`${quantity} boxes × $${basePrice.toFixed(2)} = $${totalPrice.toFixed(2)}`);
          breakdown.push(`Equivalent: ${quantity} boxes = ${conversions.sqm} sqm`);
        } else {
          breakdown.push(`${quantity} boxes × $${basePrice.toFixed(2)} = $${totalPrice.toFixed(2)}`);
        }
        break;

      default:
        unitPrice = basePrice;
        totalPrice = basePrice * quantity;
        breakdown.push(`${quantity} × $${basePrice.toFixed(2)} = $${totalPrice.toFixed(2)}`);
    }

    return {
      basePrice,
      quantity,
      area,
      width,
      height,
      unitPrice,
      totalPrice,
      method: pricingMethod,
      conversions,
      breakdown
    };
  }

  // Calculate bulk pricing discounts
  static applyBulkDiscounts(
    totalPrice: number,
    quantity: number,
    discountTiers: Array<{minQuantity: number, discountPercent: number}>
  ): { finalPrice: number; discountApplied: number; tier: string } {
    
    // Find applicable discount tier
    const applicableTier = discountTiers
      .filter(tier => quantity >= tier.minQuantity)
      .sort((a, b) => b.discountPercent - a.discountPercent)[0];

    if (applicableTier) {
      const discountAmount = totalPrice * (applicableTier.discountPercent / 100);
      const finalPrice = totalPrice - discountAmount;
      
      return {
        finalPrice,
        discountApplied: discountAmount,
        tier: `${applicableTier.discountPercent}% off (${applicableTier.minQuantity}+ qty)`
      };
    }

    return {
      finalPrice: totalPrice,
      discountApplied: 0,
      tier: 'No discount'
    };
  }

  // Box to square meter conversions (from specifications)
  static convertBoxToSqm(boxes: number, conversionRate: number): {
    boxes: number;
    sqm: number;
    rate: number;
  } {
    return {
      boxes,
      sqm: boxes * conversionRate,
      rate: conversionRate
    };
  }

  // Square meter to box conversions
  static convertSqmToBox(sqm: number, conversionRate: number): {
    sqm: number;
    boxes: number;
    boxesRounded: number;
    rate: number;
  } {
    const exactBoxes = sqm / conversionRate;
    const roundedBoxes = Math.ceil(exactBoxes); // Always round up for ordering

    return {
      sqm,
      boxes: exactBoxes,
      boxesRounded: roundedBoxes,
      rate: conversionRate
    };
  }

  // Validate pricing method compatibility
  static validatePricingMethod(
    method: 'each' | 'sqm' | 'box',
    width?: number,
    height?: number,
    quantity?: number
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    switch (method) {
      case 'sqm':
        if (!width || !height) {
          errors.push('Square meter pricing requires width and height dimensions');
        }
        if (width && width <= 0) {
          errors.push('Width must be greater than 0');
        }
        if (height && height <= 0) {
          errors.push('Height must be greater than 0');
        }
        break;

      case 'each':
      case 'box':
        if (!quantity || quantity <= 0) {
          errors.push(`${method} pricing requires quantity greater than 0`);
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default PricingEngine;