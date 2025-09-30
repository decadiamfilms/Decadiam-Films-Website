import Joi from 'joi';

// Product CRUD validation schemas
export const createProductSchema = Joi.object({
  sku: Joi.string().optional(),
  name: Joi.string().required().min(1).max(255),
  description: Joi.string().optional().allow('', null),
  cost: Joi.number().positive().optional(),
  weight: Joi.number().positive().optional(),
  unitOfMeasure: Joi.string().valid('each', 'sqm', 'lm', 'perimeter', 'weight').optional(),
  supplierName: Joi.string().optional().allow('', null),
  categoryIds: Joi.array().items(Joi.string().uuid()).optional(),
  primaryCategory: Joi.string().optional(),
  subcategory: Joi.string().optional(),
  productType: Joi.string().optional(),
  prices: Joi.array().items(Joi.object({
    priceListId: Joi.string().uuid().required(),
    price: Joi.number().positive().required()
  })).optional()
});

export const updateProductSchema = Joi.object({
  sku: Joi.string().optional(),
  name: Joi.string().min(1).max(255).optional(),
  description: Joi.string().optional().allow('', null),
  cost: Joi.number().positive().optional(),
  weight: Joi.number().positive().optional(),
  unitOfMeasure: Joi.string().valid('each', 'sqm', 'lm', 'perimeter', 'weight').optional(),
  supplierName: Joi.string().optional().allow('', null),
  categoryIds: Joi.array().items(Joi.string().uuid()).optional(),
  prices: Joi.array().items(Joi.object({
    priceListId: Joi.string().uuid().required(),
    price: Joi.number().positive().required()
  })).optional(),
  isActive: Joi.boolean().optional()
}).min(1);

export const productQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  search: Joi.string().optional(),
  categoryId: Joi.string().uuid().optional(),
  subcategoryId: Joi.string().uuid().optional(),
  isActive: Joi.boolean().optional(),
  sortBy: Joi.string().valid('name', 'sku', 'updatedAt', 'cost', 'price').optional(),
  sortOrder: Joi.string().valid('asc', 'desc').optional()
});

// SKU management validation
export const skuSuggestionSchema = Joi.object({
  name: Joi.string().optional(),
  category: Joi.string().optional(),
  subcategory: Joi.string().optional(),
  productType: Joi.string().optional()
}).min(1);

// Bulk operations validation
export const bulkUploadSchema = Joi.object({
  file: Joi.any().required()
});

export const bulkUpdateSchema = Joi.object({
  products: Joi.array().items(Joi.object({
    id: Joi.string().uuid().required(),
    sku: Joi.string().optional(),
    name: Joi.string().min(1).max(255).optional(),
    description: Joi.string().optional().allow('', null),
    cost: Joi.number().positive().optional(),
    weight: Joi.number().positive().optional(),
    unitOfMeasure: Joi.string().valid('each', 'sqm', 'lm', 'perimeter', 'weight').optional(),
    supplierName: Joi.string().optional().allow('', null),
    isActive: Joi.boolean().optional()
  })).required()
});

export const bulkDeleteSchema = Joi.object({
  productIds: Joi.array().items(Joi.string().uuid()).min(1).required()
});

// Category management validation
export const createCategorySchema = Joi.object({
  name: Joi.string().required().min(1).max(100),
  parentId: Joi.string().uuid().optional().allow(null),
  sortOrder: Joi.number().integer().optional()
});

export const updateCategorySchema = Joi.object({
  name: Joi.string().min(1).max(100).optional(),
  parentId: Joi.string().uuid().optional().allow(null),
  sortOrder: Joi.number().integer().optional()
}).min(1);

// Price list management validation
export const createPriceListSchema = Joi.object({
  name: Joi.string().required().min(1).max(100),
  isDefault: Joi.boolean().optional(),
  markup: Joi.number().positive().optional(),
  effectiveFrom: Joi.date().optional(),
  effectiveTo: Joi.date().optional()
});

export const updatePriceListSchema = Joi.object({
  name: Joi.string().min(1).max(100).optional(),
  isDefault: Joi.boolean().optional(),
  markup: Joi.number().positive().optional(),
  effectiveFrom: Joi.date().optional(),
  effectiveTo: Joi.date().optional()
}).min(1);

// Product package validation
export const createPackageSchema = Joi.object({
  name: Joi.string().required().min(1).max(255),
  description: Joi.string().optional().allow('', null),
  hasOwnPrice: Joi.boolean().required(),
  packagePrice: Joi.when('hasOwnPrice', {
    is: true,
    then: Joi.number().positive().required(),
    otherwise: Joi.number().optional()
  }),
  components: Joi.array().items(Joi.object({
    productId: Joi.string().uuid().required(),
    quantity: Joi.number().positive().required(),
    unitPrice: Joi.number().positive().optional()
  })).min(1).required()
});

export const updatePackageSchema = Joi.object({
  name: Joi.string().min(1).max(255).optional(),
  description: Joi.string().optional().allow('', null),
  hasOwnPrice: Joi.boolean().optional(),
  packagePrice: Joi.number().positive().optional(),
  components: Joi.array().items(Joi.object({
    productId: Joi.string().uuid().required(),
    quantity: Joi.number().positive().required(),
    unitPrice: Joi.number().positive().optional()
  })).min(1).optional()
}).min(1);

// Formula pricing validation
export const formulaPricingSchema = Joi.object({
  formulaName: Joi.string().required().min(1).max(100),
  formula: Joi.object({
    type: Joi.string().valid('calculation', 'lookup', 'conditional').required(),
    expression: Joi.string().required(),
    dependencies: Joi.array().items(Joi.string()).optional()
  }).required(),
  variables: Joi.array().items(Joi.object({
    name: Joi.string().required(),
    type: Joi.string().valid('number', 'percentage', 'lookup').required(),
    defaultValue: Joi.number().optional(),
    lookupTable: Joi.string().optional()
  })).required()
});

// Advanced search validation
export const advancedSearchSchema = Joi.object({
  search: Joi.string().optional(),
  categories: Joi.array().items(Joi.string().uuid()).optional(),
  suppliers: Joi.array().items(Joi.string()).optional(),
  priceMin: Joi.number().positive().optional(),
  priceMax: Joi.number().positive().optional(),
  costMin: Joi.number().positive().optional(),
  costMax: Joi.number().positive().optional(),
  hasStock: Joi.boolean().optional(),
  isActive: Joi.boolean().optional()
});

// Export validation
export const exportQuerySchema = Joi.object({
  format: Joi.string().valid('csv', 'pdf').optional(),
  categories: Joi.array().items(Joi.string().uuid()).optional(),
  includeInactive: Joi.boolean().optional()
});