import { generatePONumber, calculatePurchaseOrderTotals } from '../components/inventory/PurchaseOrderTemplate';

interface OrderItem {
  id: string;
  product: any;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface OrderData {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  orderId: string;
  reference: string;
  projectName: string;
  jobSections: any[];
  orderDate: Date;
  amount: number;
  status: string;
}

interface SupplierGroup {
  supplier: any;
  items: OrderItem[];
  totalCost: number;
}

// Mock supplier database - in real app this would come from backend
const getSupplierForProduct = (product: any) => {
  // Glass products go to glass suppliers
  if (product.categoryName === 'Glass Products' || product.code?.includes('GLASS')) {
    return {
      id: '1',
      supplierName: 'Sydney Glass Co',
      supplierCode: 'SYD001',
      contactPerson: 'Tony Williams',
      emailAddress: 'orders@sydneyglass.com.au',
      phoneNumber: '+61 2 9555 0123',
      paymentTerms: '30 days',
      isLocalGlassSupplier: true,
      isApprovedSupplier: true,
      performanceRating: 4.8,
      totalOrdersCount: 24,
      status: 'active',
      notes: 'Premium glass supplier'
    };
  }
  
  // Hardware products go to hardware suppliers
  if (product.categoryName === 'Hardware' || product.code?.includes('STEEL') || product.code?.includes('ALU')) {
    return {
      id: '2',
      supplierName: 'Hardware Direct',
      supplierCode: 'HRD001',
      contactPerson: 'Sarah Chen',
      emailAddress: 'purchasing@hardwaredirect.com.au',
      phoneNumber: '+61 2 9666 0456',
      paymentTerms: '14 days',
      isLocalGlassSupplier: false,
      isApprovedSupplier: true,
      performanceRating: 4.2,
      totalOrdersCount: 18,
      status: 'active',
      notes: 'Reliable general hardware'
    };
  }
  
  // Default supplier for other products
  return {
    id: '3',
    supplierName: 'General Supplies Co',
    supplierCode: 'GEN001',
    contactPerson: 'Mike Wilson',
    emailAddress: 'orders@generalsupplies.com.au',
    phoneNumber: '+61 2 9777 0123',
    paymentTerms: '21 days',
    isLocalGlassSupplier: false,
    isApprovedSupplier: true,
    performanceRating: 4.0,
    totalOrdersCount: 12,
    status: 'active',
    notes: 'General supplier'
  };
};

export class AutoPurchaseOrderService {
  static generatePurchaseOrdersFromOrder(orderData: OrderData): any[] {
    console.log('🔄 Auto-generating purchase orders from customer order:', orderData.orderId);
    
    // Extract all products from job sections
    const allItems: OrderItem[] = [];
    orderData.jobSections.forEach(section => {
      section.items.forEach((item: any) => {
        allItems.push({
          id: item.id,
          product: item.product,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice
        });
      });
    });

    if (allItems.length === 0) {
      console.log('⚠️ No items found in order - no purchase orders needed');
      return [];
    }

    // Group items by supplier
    const supplierGroups: { [supplierId: string]: SupplierGroup } = {};
    
    allItems.forEach(item => {
      const supplier = getSupplierForProduct(item.product);
      
      if (!supplierGroups[supplier.id]) {
        supplierGroups[supplier.id] = {
          supplier,
          items: [],
          totalCost: 0
        };
      }
      
      // Convert selling price back to estimated cost price (assume 40% markup)
      const estimatedCostPrice = item.unitPrice * 0.7;
      const costTotal = estimatedCostPrice * item.quantity;
      
      supplierGroups[supplier.id].items.push({
        ...item,
        unitPrice: estimatedCostPrice, // Use cost price for PO
        totalPrice: costTotal
      });
      
      supplierGroups[supplier.id].totalCost += costTotal;
    });

    // Create purchase orders for each supplier
    const purchaseOrders: any[] = [];
    
    Object.values(supplierGroups).forEach(group => {
      const poNumber = generatePONumber();
      const totals = calculatePurchaseOrderTotals(group.items.map(item => ({
        totalCost: item.totalPrice
      })));
      
      const purchaseOrder = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        poNumber,
        customerName: orderData.customerName,
        customerReference: `Order ${orderData.orderId}`,
        supplierName: group.supplier.supplierName,
        totalAmount: totals.total,
        status: totals.total > 2000 ? 'pending_approval' : 'approved',
        priority: 'normal' as const,
        orderDate: new Date().toISOString().split('T')[0],
        expectedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days
        lineItemCount: group.items.length,
        invoiceRequired: true,
        invoiceCreated: false,
        dispatchBlocked: true,
        approvalRequired: totals.total > 2000,
        createdBy: 'System (Auto-generated)',
        attachmentCount: 0,
        orderSummary: group.items.map(item => `${item.quantity}x ${item.product.name}`).join(', '),
        lastActivity: 'Just created',
        notes: `Auto-generated from customer order ${orderData.orderId}`,
        
        // Additional data for template generation
        customer: {
          customerName: orderData.customerName,
          customerReference: `Order ${orderData.orderId}`,
          email: orderData.customerEmail
        },
        supplier: group.supplier,
        lineItems: group.items.map(item => ({
          id: item.id,
          product: item.product,
          quantity: item.quantity,
          unitCost: item.unitPrice,
          totalCost: item.totalPrice,
          customModuleFlag: item.product.categoryName === 'Glass Products'
        })),
        projectName: orderData.projectName,
        referenceNumber: orderData.reference,
        specialInstructions: `Auto-generated purchase order for customer order ${orderData.orderId}`,
        totals,
        createdAt: new Date().toISOString()
      };
      
      purchaseOrders.push(purchaseOrder);
      
      console.log(`✅ Created PO ${poNumber} for ${group.supplier.supplierName} - ${group.items.length} items - $${totals.total.toFixed(2)}`);
    });

    return purchaseOrders;
  }

  static savePurchaseOrdersToStorage(purchaseOrders: any[]) {
    try {
      // Get existing purchase orders
      const existingPOs = JSON.parse(localStorage.getItem('saleskik-purchase-orders') || '[]');
      
      // Add new purchase orders
      const updatedPOs = [...existingPOs, ...purchaseOrders];
      
      // Save back to localStorage
      localStorage.setItem('saleskik-purchase-orders', JSON.stringify(updatedPOs));
      
      console.log(`💾 Saved ${purchaseOrders.length} purchase orders to storage`);
      
      return true;
    } catch (error) {
      console.error('❌ Error saving purchase orders:', error);
      return false;
    }
  }

  static createPurchaseOrdersFromOrder(orderData: OrderData): { success: boolean; purchaseOrders: any[] } {
    try {
      const purchaseOrders = this.generatePurchaseOrdersFromOrder(orderData);
      
      if (purchaseOrders.length === 0) {
        return { success: true, purchaseOrders: [] };
      }
      
      const saved = this.savePurchaseOrdersToStorage(purchaseOrders);
      
      if (saved) {
        // Show notification
        const supplierNames = purchaseOrders.map(po => po.supplierName).join(', ');
        const totalPOs = purchaseOrders.length;
        
        setTimeout(() => {
          alert(`🔄 Auto-generated ${totalPOs} purchase order${totalPOs > 1 ? 's' : ''} for: ${supplierNames}`);
        }, 1000);
        
        return { success: true, purchaseOrders };
      }
      
      return { success: false, purchaseOrders: [] };
      
    } catch (error) {
      console.error('❌ Error creating purchase orders from order:', error);
      return { success: false, purchaseOrders: [] };
    }
  }
}