// Core Types
export interface Company {
  id: string;
  name: string;
  legalName?: string;
  tradingName?: string;
  abnAcn?: string;
  gstNumber?: string;
  logoUrl?: string;
  email: string;
  phone?: string;
  website?: string;
  address?: Address;
  gstEnabled: boolean;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
}

export enum SubscriptionStatus {
  TRIAL = 'TRIAL',
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  PAST_DUE = 'PAST_DUE',
  SUSPENDED = 'SUSPENDED',
}

export interface User {
  id: string;
  companyId: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  lastLogin?: Date;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  company?: Company;
  groups?: UserGroup[];
}

export interface UserGroup {
  id: string;
  companyId: string;
  name: string;
  permissions: PermissionMatrix;
  createdAt: Date;
  updatedAt: Date;
}

export interface PermissionMatrix {
  quotes: ModulePermissions;
  orders: ModulePermissions;
  invoices: ModulePermissions;
  customers: ModulePermissions;
  products: ModulePermissions;
  inventory: ModulePermissions;
  jobs: ModulePermissions;
  reports: ModulePermissions;
  administration: ModulePermissions;
}

export interface ModulePermissions {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  approve: boolean;
  export: boolean;
}

// Product Types
export interface Product {
  id: string;
  companyId: string;
  sku: string;
  name: string;
  description?: string;
  cost?: number;
  weight?: number;
  unitOfMeasure?: string;
  supplierName?: string;
  isActive: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  categories?: ProductCategory[];
  prices?: ProductPrice[];
}

export interface ProductCategory {
  id: string;
  companyId: string;
  name: string;
  parentId?: string;
  sortOrder: number;
  parent?: ProductCategory;
  children?: ProductCategory[];
}

export interface ProductPrice {
  id: string;
  productId: string;
  priceListId: string;
  price: number;
  effectiveFrom: Date;
  effectiveTo?: Date;
  priceList?: PriceList;
}

export interface PriceList {
  id: string;
  companyId: string;
  name: string;
  isDefault: boolean;
  markup?: number;
  effectiveFrom?: Date;
  effectiveTo?: Date;
}

// Customer Types
export interface Customer {
  id: string;
  companyId: string;
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  billingAddress?: Address;
  shippingAddress?: Address;
  paymentTerms?: string;
  priceListId?: string;
  creditLimit?: number;
  taxExempt: boolean;
  notes?: string;
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  contacts?: CustomerContact[];
  priceList?: PriceList;
}

export interface CustomerContact {
  id: string;
  customerId: string;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  isPrimary: boolean;
}

// Sales Document Types
export interface Quote {
  id: string;
  companyId: string;
  customerId: string;
  quoteNumber: string;
  revision: string;
  status: QuoteStatus;
  subtotal: number;
  taxAmount: number;
  total: number;
  validUntil?: Date;
  sentAt?: Date;
  viewedAt?: Date;
  acceptedAt?: Date;
  declinedAt?: Date;
  notes?: string;
  internalNotes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  customer?: Customer;
  lineItems?: DocumentLineItem[];
}

export enum QuoteStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  SENT = 'SENT',
  VIEWED = 'VIEWED',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  EXPIRED = 'EXPIRED',
}

export interface Order {
  id: string;
  companyId: string;
  customerId: string;
  quoteId?: string;
  orderNumber: string;
  status: OrderStatus;
  subtotal: number;
  taxAmount: number;
  total: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  customer?: Customer;
  quote?: Quote;
  lineItems?: DocumentLineItem[];
}

export enum OrderStatus {
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  READY_FOR_DELIVERY = 'READY_FOR_DELIVERY',
  PARTIALLY_DELIVERED = 'PARTIALLY_DELIVERED',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface Invoice {
  id: string;
  companyId: string;
  customerId: string;
  orderId?: string;
  invoiceNumber: string;
  type: InvoiceType;
  status: InvoiceStatus;
  subtotal: number;
  taxAmount: number;
  total: number;
  dueDate: Date;
  paidAmount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  customer?: Customer;
  order?: Order;
  lineItems?: DocumentLineItem[];
  payments?: Payment[];
}

export enum InvoiceType {
  DEPOSIT = 'DEPOSIT',
  PROGRESS = 'PROGRESS',
  FINAL = 'FINAL',
  STANDALONE = 'STANDALONE',
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  VIEWED = 'VIEWED',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
  UNPAID = 'UNPAID',
}

export interface DocumentLineItem {
  id: string;
  documentType: DocumentType;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  lineTotal: number;
  sortOrder: number;
  product?: Product;
}

export enum DocumentType {
  QUOTE = 'QUOTE',
  ORDER = 'ORDER',
  INVOICE = 'INVOICE',
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: string;
  reference?: string;
  receivedAt: Date;
  createdAt: Date;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Array<{ field: string; message: string }>;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Form Types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName?: string;
}

export interface CreateCustomerFormData {
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  billingAddress?: Address;
  shippingAddress?: Address;
  paymentTerms?: string;
  priceListId?: string;
  creditLimit?: number;
  taxExempt: boolean;
  notes?: string;
  tags: string[];
}

export interface CreateProductFormData {
  sku: string;
  name: string;
  description?: string;
  cost?: number;
  weight?: number;
  unitOfMeasure?: string;
  supplierName?: string;
  categoryIds: string[];
  prices: Array<{
    priceListId: string;
    price: number;
  }>;
}