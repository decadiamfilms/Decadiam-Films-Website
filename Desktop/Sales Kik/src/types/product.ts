import { Decimal } from '@prisma/client/runtime/library';

// Core Product Types
export interface Product {
  id: string;
  companyId: string;
  sku: string;
  name: string;
  description?: string | null;
  cost: number | null;
  weight?: number | null;
  unitOfMeasure?: string | null;
  supplierName?: string | null;
  isActive: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  categories?: ProductCategory[];
  prices?: ProductPrice[];
  formulaPricing?: FormulaPricing | null;
}

export enum UnitOfMeasure {
  EACH = 'each',
  SQM = 'sqm',
  LM = 'lm',
  PERIMETER = 'perimeter',
  WEIGHT = 'weight'
}

// Category Types
export interface ProductCategory {
  id: string;
  companyId: string;
  name: string;
  parentId?: string | null;
  sortOrder: number;
  level?: CategoryLevel;
  fullPath?: string; // "Category > Subcategory > Product Type"
  children?: ProductCategory[];
  parent?: ProductCategory | null;
}

export enum CategoryLevel {
  CATEGORY = 'category',
  SUBCATEGORY = 'subcategory',
  PRODUCT_TYPE = 'product_type'
}

// Pricing Types
export interface PriceList {
  id: string;
  companyId: string;
  name: string;
  isDefault: boolean;
  markup?: number | null;
  effectiveFrom?: Date | null;
  effectiveTo?: Date | null;
  prices?: ProductPrice[];
}

export interface ProductPrice {
  id: string;
  productId: string;
  priceListId: string;
  price: number;
  effectiveFrom: Date;
  effectiveTo?: Date | null;
  priceList?: PriceList;
}

// Package Types
export interface ProductPackage {
  id: string;
  companyId: string;
  name: string;
  description?: string | null;
  hasOwnPrice: boolean;
  packagePrice?: number | null;
  components?: PackageComponent[];
}

export interface PackageComponent {
  id: string;
  packageId: string;
  productId: string;
  quantity: number;
  unitPrice?: number | null;
  product?: Product;
}

// Formula Pricing
export interface FormulaPricing {
  id: string;
  productId: string;
  formulaName: string;
  formula: string; // JSON string
  variables: string; // JSON string
}

// SKU Pattern Learning
export interface SKUPattern {
  id: string;
  companyId: string;
  pattern: string;
  category?: string | null;
  subcategory?: string | null;
  usageCount: number;
}

// Request/Response Types
export interface CreateProductRequest {
  sku?: string;
  name: string;
  description?: string;
  cost?: number;
  weight?: number;
  unitOfMeasure?: string;
  supplierName?: string;
  categoryIds?: string[];
  primaryCategory?: string;
  subcategory?: string;
  productType?: string;
  prices?: CreateProductPriceRequest[];
}

export interface CreateProductPriceRequest {
  priceListId: string;
  price: number;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  isActive?: boolean;
}

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  subcategoryId?: string;
  isActive?: boolean;
  sortBy?: 'name' | 'sku' | 'updatedAt' | 'cost' | 'price';
  sortOrder?: 'asc' | 'desc';
}

export interface ProductsResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Bulk Upload Types
export interface BulkUploadResult {
  successCount: number;
  errorCount: number;
  errors: BulkUploadError[];
  warnings: BulkUploadWarning[];
  createdProducts?: Product[];
}

export interface BulkUploadError {
  row: number;
  field: string;
  message: string;
  value: any;
}

export interface BulkUploadWarning {
  row: number;
  field: string;
  message: string;
  suggestion?: string;
}

export interface BulkUploadRow {
  sku?: string;
  name: string;
  description?: string;
  cost?: string | number;
  weight?: string | number;
  unit_of_measure?: string;
  supplier?: string;
  category?: string;
  subcategory?: string;
  product_type?: string;
  retail_price?: string | number;
  trade_price?: string | number;
}

// SKU Suggestion Types
export interface SKUSuggestionRequest {
  name?: string;
  category?: string;
  subcategory?: string;
  productType?: string;
}

export interface SKUSuggestionResponse {
  suggestions: string[];
  patterns: string[];
}

// Category Management Types
export interface CreateCategoryRequest {
  name: string;
  parentId?: string;
  sortOrder?: number;
}

export interface CategoryTreeNode {
  id: string;
  name: string;
  level: CategoryLevel;
  children: CategoryTreeNode[];
  productCount?: number;
}

// Price List Management
export interface CreatePriceListRequest {
  name: string;
  isDefault?: boolean;
  markup?: number;
  effectiveFrom?: Date;
  effectiveTo?: Date;
}

export interface UpdatePriceListRequest extends Partial<CreatePriceListRequest> {}

// Product Package Management
export interface CreatePackageRequest {
  name: string;
  description?: string;
  hasOwnPrice: boolean;
  packagePrice?: number;
  components: CreatePackageComponentRequest[];
}

export interface CreatePackageComponentRequest {
  productId: string;
  quantity: number;
  unitPrice?: number;
}

// Formula Pricing Types
export interface CreateFormulaPricingRequest {
  productId: string;
  formulaName: string;
  formula: FormulaStructure;
  variables: FormulaVariable[];
}

export interface FormulaStructure {
  type: 'calculation' | 'lookup' | 'conditional';
  expression: string;
  dependencies?: string[];
}

export interface FormulaVariable {
  name: string;
  type: 'number' | 'percentage' | 'lookup';
  defaultValue?: number;
  lookupTable?: string;
}

// Validation Types
export interface ProductValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

// Export all types
export * from './common';