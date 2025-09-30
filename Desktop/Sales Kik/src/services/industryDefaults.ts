// Smart Business Defaults - Glass Industry Focus

export interface GlassBusinessDefaults {
  commonDimensions: Array<{
    width: number;
    height: number;
    description: string;
    usage: string;
  }>;
  standardProducts: Array<{
    name: string;
    sku: string;
    category: string;
    subcategory: string;
    basePrice: number;
    pricingMethod: 'each' | 'sqm' | 'box';
    commonSizes: Array<{ width: number; height: number; description: string }>;
  }>;
  businessTemplates: Array<{
    name: string;
    description: string;
    products: string[];
    averageOrderValue: number;
  }>;
  smartRecommendations: Array<{
    trigger: string;
    recommendation: string;
    businessImpact: string;
  }>;
}

export class IndustryDefaultsService {
  
  static getGlassBusinessDefaults(): GlassBusinessDefaults {
    return {
      commonDimensions: [
        { width: 1000, height: 2000, description: "Standard Shower Door", usage: "Most common size" },
        { width: 800, height: 2000, description: "Compact Shower Door", usage: "Small bathrooms" },
        { width: 1200, height: 2000, description: "Wide Shower Door", usage: "Luxury bathrooms" },
        { width: 600, height: 2000, description: "Return Panel", usage: "Corner installations" },
        { width: 1000, height: 1200, description: "Pool Gate Panel", usage: "Standard pool gates" },
        { width: 1500, height: 1200, description: "Pool Fixed Panel", usage: "Pool boundary fencing" }
      ],

      standardProducts: [
        {
          name: "10mm Clear Shower Door",
          sku: "SSD-10C",
          category: "Shower Screens",
          subcategory: "Glass Panels", 
          basePrice: 420,
          pricingMethod: "sqm",
          commonSizes: [
            { width: 1000, height: 2000, description: "Standard" },
            { width: 800, height: 2000, description: "Compact" },
            { width: 1200, height: 2000, description: "Wide" }
          ]
        },
        {
          name: "10mm Frosted Shower Door",
          sku: "SSD-10F",
          category: "Shower Screens",
          subcategory: "Glass Panels",
          basePrice: 450,
          pricingMethod: "sqm",
          commonSizes: [
            { width: 1000, height: 2000, description: "Standard" },
            { width: 800, height: 2000, description: "Compact" }
          ]
        },
        {
          name: "12mm Clear Pool Panel",
          sku: "PPF-12C",
          category: "Pool Fencing",
          subcategory: "Frameless",
          basePrice: 520,
          pricingMethod: "sqm",
          commonSizes: [
            { width: 1000, height: 1200, description: "Standard Gate" },
            { width: 1500, height: 1200, description: "Fixed Panel" }
          ]
        },
        {
          name: "Stainless Steel Hardware Set",
          sku: "SSH-001",
          category: "Hardware",
          subcategory: "Hinges & Locks",
          basePrice: 85,
          pricingMethod: "each",
          commonSizes: []
        },
        {
          name: "Anti-Slip Coating",
          sku: "ASC-001",
          category: "Specials",
          subcategory: "Coatings",
          basePrice: 50,
          pricingMethod: "sqm",
          commonSizes: []
        },
        {
          name: "Professional Installation",
          sku: "PI-001",
          category: "Specials",
          subcategory: "Labor",
          basePrice: 200,
          pricingMethod: "each",
          commonSizes: []
        }
      ];

      return standardProducts;
    },

    businessTemplates: [
      {
        name: "Standard Shower Installation",
        description: "Complete shower screen with door and return panel",
        products: ["SSD-10C", "SSH-001", "PI-001"],
        averageOrderValue: 2400
      },
      {
        name: "Pool Fencing Project", 
        description: "Pool compliance fencing with gate",
        products: ["PPF-12C", "SSH-001", "ASC-001"],
        averageOrderValue: 4800
      },
      {
        name: "Commercial Shower Block",
        description: "Multiple shower installations for commercial",
        products: ["SSD-10C", "SSH-001", "PI-001"],
        averageOrderValue: 12000
      }
    ],

    smartRecommendations: [
      {
        trigger: "Creating shower door quote",
        recommendation: "Most customers also need return panels and installation",
        businessImpact: "Increases average order value by 35%"
      },
      {
        trigger: "Pool fencing quote over $3000",
        recommendation: "Suggest anti-slip coating for safety compliance",
        businessImpact: "Adds $200-400 per project"
      },
      {
        trigger: "Customer ordering 3+ panels",
        recommendation: "Offer bulk pricing discount (5-10%)",
        businessImpact: "Improves conversion rate by 23%"
      },
      {
        trigger: "Repeat customer (3+ orders)",
        recommendation: "Offer preferred customer pricing",
        businessImpact: "Increases customer lifetime value"
      }
    ]
  };
}

// Business Intelligence Service
export class BusinessIntelligenceService {
  
  static getTimeSavings(action: string): { minutes: number; description: string } {
    const timeSavings = {
      'create_quote': { minutes: 12, description: 'vs manual calculation' },
      'bulk_upload': { minutes: 180, description: 'vs manual data entry' },
      'duplicate_product': { minutes: 5, description: 'vs creating from scratch' },
      'auto_pricing': { minutes: 8, description: 'vs manual price lookup' },
      'stock_check': { minutes: 3, description: 'vs physical inventory check' }
    };

    return timeSavings[action] || { minutes: 0, description: 'estimated' };
  }

  static getMoneySavings(action: string, orderValue: number): { amount: number; description: string } {
    switch (action) {
      case 'bulk_pricing':
        return { 
          amount: orderValue * 0.05, 
          description: '5% bulk discount optimization' 
        };
      case 'upsell_suggestion':
        return { 
          amount: 300, 
          description: 'average upsell value' 
        };
      case 'price_optimization':
        return { 
          amount: orderValue * 0.08, 
          description: '8% margin improvement' 
        };
      default:
        return { amount: 0, description: 'estimated savings' };
    }
  }

  static getBusinessInsights(data: any): Array<{
    type: 'success' | 'warning' | 'info';
    title: string;
    description: string;
    action: string;
    impact: string;
  }> {
    return [
      {
        type: 'warning',
        title: 'Reorder Glass Panels',
        description: 'Based on sales pattern, you typically reorder 10mm clear panels every 3 weeks',
        action: 'Create Purchase Order',
        impact: 'Prevent stockouts'
      },
      {
        type: 'success', 
        title: 'Quote Conversion Above Average',
        description: 'Your 68% conversion rate beats industry average of 58%',
        action: 'View Best Practices',
        impact: 'Maintain competitive edge'
      },
      {
        type: 'info',
        title: 'Follow Up Pending Quotes',
        description: '5 quotes from last week haven\'t received responses',
        action: 'Send Follow-ups',
        impact: 'Recover $8,400 potential revenue'
      }
    ];
  }
}

export default IndustryDefaultsService;