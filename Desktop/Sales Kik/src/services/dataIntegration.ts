// Data Integration Service - Connects Inventory → Quotes → Orders → Invoices

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  productType?: string;
  price: number;
  cost?: number;
  stockLevel: number;
  reorderLevel: number;
  images: string[];
  isActive: boolean;
}

export interface QuoteItem {
  id: string;
  productId: string;
  sku: string;
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  dimensions?: string;
  width?: number;
  height?: number;
  stockAvailable: number;
  stockWarning?: string;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  customerId: string;
  items: QuoteItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  validUntil: Date;
  createdAt: Date;
  createdBy: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  quoteId?: string;
  customerId: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'pending' | 'confirmed' | 'in_production' | 'ready' | 'delivered' | 'cancelled';
  orderDate: Date;
  expectedDelivery?: Date;
  actualDelivery?: Date;
  stockAllocated: boolean;
}

export interface OrderItem {
  id: string;
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  stockAllocated: number;
  stockReserved: Date;
}

class DataIntegrationService {
  // Check stock availability for quote items
  static async checkStockAvailability(items: QuoteItem[]): Promise<QuoteItem[]> {
    try {
      const response = await fetch('/api/inventory/check-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      });
      
      const { updatedItems } = await response.json();
      return updatedItems;
    } catch (error) {
      console.error('Failed to check stock availability:', error);
      return items;
    }
  }

  // Convert quote to order when accepted/paid
  static async convertQuoteToOrder(quoteId: string): Promise<Order | null> {
    try {
      const response = await fetch(`/api/quotes/${quoteId}/convert-to-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const order = await response.json();
        
        // Automatically allocate stock
        await this.allocateStockForOrder(order.id);
        
        return order;
      }
      return null;
    } catch (error) {
      console.error('Failed to convert quote to order:', error);
      return null;
    }
  }

  // Allocate stock when order is confirmed
  static async allocateStockForOrder(orderId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/orders/${orderId}/allocate-stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to allocate stock:', error);
      return false;
    }
  }

  // Update stock levels when order is delivered
  static async fulfillOrder(orderId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/orders/${orderId}/fulfill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to fulfill order:', error);
      return false;
    }
  }

  // Update inventory when purchase orders are received
  static async receivePurchaseOrder(poId: string, items: Array<{productId: string, receivedQuantity: number}>): Promise<boolean> {
    try {
      const response = await fetch(`/api/purchase-orders/${poId}/receive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to receive purchase order:', error);
      return false;
    }
  }

  // Get integrated product data for quoting
  static async getProductsForQuoting(): Promise<Product[]> {
    try {
      const response = await fetch('/api/products/for-quoting');
      const products = await response.json();
      return products;
    } catch (error) {
      console.error('Failed to fetch products for quoting:', error);
      return [];
    }
  }

  // Real-time stock checking for quotes
  static async validateQuoteStock(quoteItems: QuoteItem[]): Promise<{valid: boolean, warnings: string[]}> {
    const warnings: string[] = [];
    let valid = true;

    for (const item of quoteItems) {
      try {
        const response = await fetch(`/api/inventory/product/${item.productId}/stock`);
        const { stockLevel } = await response.json();
        
        if (stockLevel < item.quantity) {
          valid = false;
          warnings.push(`${item.name}: Only ${stockLevel} in stock, ${item.quantity} requested`);
        }
      } catch (error) {
        warnings.push(`${item.name}: Could not verify stock level`);
      }
    }

    return { valid, warnings };
  }
}

export default DataIntegrationService;