// Common types used across the application

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postCode: string;
  country: string;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface FileUpload {
  filename: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface SearchFilters {
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  status?: string[];
  tags?: string[];
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export interface BatchOperationResult {
  successCount: number;
  errorCount: number;
  errors: BatchError[];
}

export interface BatchError {
  index: number;
  id?: string;
  error: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  changes?: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
}

export interface Permission {
  module: string;
  action: string;
  resource?: string;
}

export interface UserContext {
  id: string;
  companyId: string;
  email: string;
  firstName: string;
  lastName: string;
  permissions: Permission[];
}