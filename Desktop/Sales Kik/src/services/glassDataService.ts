/**
 * Glass Data Service
 * 
 * This service connects the Glass Module Admin configuration
 * to the front-end quoting system, providing access to all
 * configured glass types, processing options, templates, and pricing.
 */

// Import types from admin component
export interface GlassType {
  id: string;
  name: string; // Clear Glass, Ultra Clear, Mirror, etc.
  description?: string;
  productTypes: ProductType[];
  isActive: boolean;
  isComplete: boolean;
}

export interface ProductType {
  id: string;
  name: 'Toughened' | 'Not Toughened';
  glassTypeId: string;
  thicknesses: GlassThickness[];
}

export interface GlassThickness {
  id: string;
  sku: string;
  thickness: number;
  pricePerMm: number | string;
  leadTimeBusinessDays: number;
  isActive: boolean;
  tierPrices?: {
    t1: number | string;
    t2: number | string;
    t3: number | string;
    retail: number | string;
  };
}

export interface ProcessingCategory {
  id: string;
  name: string;
  sequenceOrder: number;
  isThicknessBased?: boolean;
}

export interface ProcessingOption {
  id: string;
  categoryId: string;
  name: string;
  supplierId?: string;
  description?: string;
  pricingType: 'per-linear-meter' | 'each' | 'per-sqmeter';
  basePrice?: number;
  flatPricing?: {
    costPrice: string;
    t1: string;
    t2: string;
    t3: string;
    retail: string;
  };
  variations?: {
    id: string;
    range: string;
    pricing: {
      costPrice: string;
      t1: string;
      t2: string;
      t3: string;
      retail: string;
    };
  }[];
  thicknessPricing?: {
    [thickness: string]: {
      costPrice: string;
      t1: string;
      t2: string;
      t3: string;
      retail: string;
    }
  };
  displayOrder: number;
  isActive: boolean;
}

export interface GlassTemplate {
  id: string;
  name: string;
  description?: string;
  svgPath?: string;
  pricingRule?: {
    type: 'fixed' | 'percentage' | 'per-sqm';
    value: number;
  };
  specifications?: {
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
  };
  isActive: boolean;
}

export interface TierLabels {
  t1: string;
  t2: string;
  t3: string;
  retail: string;
}

class GlassDataService {
  private readonly API_BASE = '/api/glass';
  private readonly ADMIN_STORAGE_KEYS = {
    GLASS_TYPES: 'saleskik-glass-types-complete',
    PROCESSING_CATEGORIES: 'saleskik-processing-categories', // Updated to match comprehensive admin
    PROCESSING_OPTIONS: 'saleskik-processing-options', // Updated to match comprehensive admin
    TEMPLATES: 'saleskik-glass-templates'
  };
  
  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    const response = await fetch(`${this.API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Get all active glass types from comprehensive admin configuration
   */
  async getGlassTypes(): Promise<GlassType[]> {
    // First try comprehensive admin localStorage
    const adminData = localStorage.getItem(this.ADMIN_STORAGE_KEYS.GLASS_TYPES);
    if (adminData) {
      try {
        const glassTypes = JSON.parse(adminData) as GlassType[];
        const activeTypes = glassTypes.filter(gt => gt.isActive && gt.isComplete);
        console.log('Loaded glass types from comprehensive admin:', activeTypes);
        return activeTypes;
      } catch (error) {
        console.error('Error parsing comprehensive admin glass types:', error);
      }
    }
    
    // Fallback to API
    try {
      const glassTypes = await this.makeRequest('/types');
      return glassTypes.map((type: any) => ({
        id: type.id,
        name: type.name,
        description: `Base price: $${type.basePrice}/m²`,
        isActive: type.isActive,
        isComplete: true,
        productTypes: this.transformProducts(type.glassProducts || [])
      }));
    } catch (error) {
      console.error('Error fetching glass types from API:', error);
      return [];
    }
  }
  
  private transformProducts(products: any[]): ProductType[] {
    const grouped = products.reduce((acc, product) => {
      if (!acc[product.productType]) {
        acc[product.productType] = {
          id: `pt-${product.productType.toLowerCase()}`,
          name: product.productType === 'TOUGHENED' ? 'Toughened' : 'Not Toughened',
          glassTypeId: product.glassTypeId,
          thicknesses: []
        };
      }
      
      acc[product.productType].thicknesses.push({
        id: product.id,
        sku: product.sku,
        thickness: product.thickness,
        pricePerMm: product.priceRetail,
        leadTimeBusinessDays: 3,
        isActive: product.isActive,
        tierPrices: {
          t1: product.priceT1,
          t2: product.priceT2,
          t3: product.priceT3,
          retail: product.priceRetail
        }
      });
      
      return acc;
    }, {});
    
    return Object.values(grouped);
  }

  /**
   * Get a specific glass type by ID
   */
  async getGlassType(id: string): Promise<GlassType | null> {
    const glassTypes = await this.getGlassTypes();
    return glassTypes.find(gt => gt.id === id) || null;
  }

  /**
   * Get product types for a specific glass type
   */
  async getProductTypes(glassTypeId: string): Promise<ProductType[]> {
    const glassType = await this.getGlassType(glassTypeId);
    return glassType?.productTypes || [];
  }

  /**
   * Get available thicknesses for a specific product type
   */
  async getThicknesses(glassTypeId: string, productTypeName: 'Toughened' | 'Not Toughened'): Promise<GlassThickness[]> {
    const productTypes = await this.getProductTypes(glassTypeId);
    const productType = productTypes.find(pt => pt.name === productTypeName);
    return productType?.thicknesses.filter(t => t.isActive) || [];
  }

  /**
   * Get processing options from comprehensive admin configuration
   */
  async getProcessingOptions(): Promise<any> {
    // First try comprehensive admin localStorage
    const adminOptions = localStorage.getItem(this.ADMIN_STORAGE_KEYS.PROCESSING_OPTIONS);
    if (adminOptions) {
      try {
        const options = JSON.parse(adminOptions) as ProcessingOption[];
        const activeOptions = options.filter(opt => opt.isActive);
        
        // Group by category for UI consumption
        const grouped = {
          edgework: activeOptions.filter(opt => opt.categoryId?.includes('edgework')),
          cornerFinish: activeOptions.filter(opt => opt.categoryId?.includes('corner')),
          holesCutouts: activeOptions.filter(opt => opt.categoryId?.includes('hole')),
          services: activeOptions.filter(opt => opt.categoryId?.includes('service')),
          surfaceFinish: activeOptions.filter(opt => opt.categoryId?.includes('surface'))
        };
        
        console.log('Loaded processing options from comprehensive admin:', grouped);
        return grouped;
      } catch (error) {
        console.error('Error parsing comprehensive admin processing options:', error);
      }
    }
    
    // Fallback to API
    try {
      return await this.makeRequest('/processing-options');
    } catch (error) {
      console.error('Error fetching processing options from API:', error);
      return {
        edgework: [],
        cornerFinish: [],
        holesCutouts: [],
        services: [],
        surfaceFinish: []
      };
    }
  }



  /**
   * Get all templates from comprehensive admin configuration
   */
  async getTemplates(): Promise<GlassTemplate[]> {
    // First try comprehensive admin localStorage
    const adminTemplates = localStorage.getItem(this.ADMIN_STORAGE_KEYS.TEMPLATES);
    if (adminTemplates) {
      try {
        const templates = JSON.parse(adminTemplates) as GlassTemplate[];
        const activeTemplates = templates.filter(t => t.isActive);
        console.log('Loaded templates from comprehensive admin:', activeTemplates);
        return activeTemplates;
      } catch (error) {
        console.error('Error parsing comprehensive admin templates:', error);
      }
    }
    
    // Fallback to API
    try {
      const templates = await this.makeRequest('/templates');
      return templates.map((template: any) => ({
        id: template.id,
        name: template.name,
        description: `Template for ${template.name}`,
        isActive: true,
        pricingRule: { type: 'fixed', value: 0 }
      }));
    } catch (error) {
      console.error('Error fetching templates from API:', error);
      return [];
    }
  }

  /**
   * Get tier labels for pricing display
   */
  getTierLabels(): TierLabels {
    return {
      t1: 'T1',
      t2: 'T2',
      t3: 'T3',
      retail: 'Retail'
    };
  }

  /**
   * Calculate price for a glass configuration (simplified)
   */
  async calculatePrice(config: {
    glassTypeId: string;
    productType: 'Toughened' | 'Not Toughened';
    thickness: number;
    widthMm: number;
    heightMm: number;
    quantity: number;
    customerTier: 'T1' | 'T2' | 'T3' | 'Retail';
    processingOptions?: {
      edgework?: string[];
      corners?: string[];
      holes?: string[];
      services?: string[];
      surface?: string[];
    };
    template?: string;
  }): Promise<{
    basePrice: number;
    processingCost: number;
    templateCost: number;
    totalPerUnit: number;
    totalPrice: number;
    breakdown: any;
  }> {
    try {
      // Get glass thickness pricing
      const thicknesses = await this.getThicknesses(config.glassTypeId, config.productType);
      const selectedThickness = thicknesses.find(t => t.thickness === config.thickness);
      
      if (!selectedThickness) {
        throw new Error(`Thickness ${config.thickness}mm not available for selected glass type`);
      }

      // Calculate area in square meters
      const areaSqm = (config.widthMm / 1000) * (config.heightMm / 1000);
      
      // Get base price based on customer tier
      let basePrice = 0;
      const tierPrices = selectedThickness.tierPrices;
      if (tierPrices) {
        const tierKey = config.customerTier.toLowerCase() as 't1' | 't2' | 't3' | 'retail';
        basePrice = parseFloat(String(tierPrices[tierKey] || selectedThickness.pricePerMm)) * areaSqm * config.quantity;
      } else {
        basePrice = parseFloat(String(selectedThickness.pricePerMm)) * areaSqm * config.quantity;
      }

      // Simplified processing cost calculation
      let processingCost = 0;
      const processingBreakdown: any[] = [];

      // Template cost (simplified)
      let templateCost = 0;

      const totalPerUnit = (basePrice + processingCost + templateCost) / config.quantity;
      const totalPrice = basePrice + processingCost + templateCost;

      return {
        basePrice,
        processingCost,
        templateCost,
        totalPerUnit,
        totalPrice,
        breakdown: {
          glassBase: basePrice,
          processing: processingBreakdown,
          template: templateCost,
          quantity: config.quantity,
          areaSqm,
          perimeter: 2 * ((config.widthMm / 1000) + (config.heightMm / 1000))
        }
      };
    } catch (error) {
      console.error('Error calculating price:', error);
      return {
        basePrice: 0,
        processingCost: 0,
        templateCost: 0,
        totalPerUnit: 0,
        totalPrice: 0,
        breakdown: {}
      };
    }
  }

  /**
   * Initialize database with default data if empty
   */
  async initializeDefaultData(): Promise<void> {
    try {
      await this.makeRequest('/seed-initial-data', { method: 'POST' });
    } catch (error) {
      console.error('Error initializing default data:', error);
    }
  }
}

// Export singleton instance
export const glassDataService = new GlassDataService();

// Initialize default data on first load (async)
glassDataService.initializeDefaultData().catch(console.error);