export interface Product {
  id: number;
  name: string;
  sku: string;
  barcode?: string;
  category_id: number;
  category_name?: string;
  image_url?: string;
  is_active: boolean;
}

export interface ProductInventory {
  id: number;
  product_id: number;
  warehouse_id: number;
  quantity_on_hand: number;
  quantity_reserved: number;
  quantity_available: number;
  quantity_pending_in: number;
  quantity_allocated: number;
  reorder_point: number;
  reorder_quantity: number;
  average_cost: number;
  last_cost: number;
  total_value: number;
  bin_location?: string;
}

export interface Warehouse {
  id: number;
  name: string;
  code: string;
  is_active: boolean;
  is_default: boolean;
}

export interface StockCheckFilter {
  value: 'all' | 'low' | 'out' | 'reorder';
  label: string;
  icon: string;
  count: number | null;
}

export interface StockAdjustment {
  product_id: number;
  warehouse_id: number;
  movement_type: 'adjustment';
  quantity: number;
  reason: string;
  notes?: string;
}