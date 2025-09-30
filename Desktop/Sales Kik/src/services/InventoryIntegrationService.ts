// Real Inventory Integration Service for Purchase Orders
// Handles live stock levels, automatic adjustments, reorder points, and SalesKik integration

export interface InventoryLevel {
  productId: string;
  locationId: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  quantityOnOrder: number; // From purchase orders
  reorderPoint: number;
  maxLevel: number;
  lastUpdated: Date;
  averageUsage: number; // Units per day
  leadTimeDays: number;
  costPerUnit: number;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  locationId: string;
  movementType: 'PURCHASE_ORDER_RECEIVED' | 'ADJUSTMENT' | 'RESERVATION' | 'RELEASE' | 'TRANSFER';
  quantity: number;
  reason: string;
  referenceType: 'PURCHASE_ORDER' | 'GOODS_RECEIPT' | 'MANUAL_ADJUSTMENT';
  referenceId: string;
  performedBy: string;
  timestamp: Date;
  costImpact?: number;
  notes?: string;
}

export interface ReorderSuggestion {
  productId: string;
  productName: string;
  currentStock: number;
  reorderPoint: number;
  suggestedQuantity: number;
  estimatedCost: number;
  recommendedSupplier: {
    id: string;
    name: string;
    lastPrice: number;
    leadTimeDays: number;
    performanceRating: number;
  };
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reasoning: string[];
}

export interface InventoryDiscrepancy {
  id: string;
  purchaseOrderId: string;
  purchaseOrderNumber: string;
  lineItemId: string;
  productId: string;
  productName: string;
  quantityOrdered: number;
  quantityReceived: number;
  discrepancyAmount: number;
  discrepancyPercentage: number;
  discrepancyType: 'SHORTAGE' | 'OVERAGE' | 'DAMAGE' | 'QUALITY_ISSUE';
  reportedBy: string;
  reportedAt: Date;
  resolution?: {
    action: 'SUPPLIER_CREDIT' | 'REORDER' | 'ACCEPT_AS_IS' | 'RETURN_TO_SUPPLIER';
    resolvedBy: string;
    resolvedAt: Date;
    notes: string;
  };
  financialImpact: number;
}

class InventoryIntegrationService {
  private static instance: InventoryIntegrationService;
  private inventoryLevels: Map<string, InventoryLevel> = new Map();
  private inventoryMovements: InventoryMovement[] = [];
  private reorderSuggestions: ReorderSuggestion[] = [];
  private discrepancies: InventoryDiscrepancy[] = [];

  private constructor() {
    this.loadInventoryData();
    this.startReorderAnalysis();
  }

  public static getInstance(): InventoryIntegrationService {
    if (!InventoryIntegrationService.instance) {
      InventoryIntegrationService.instance = new InventoryIntegrationService();
    }
    return InventoryIntegrationService.instance;
  }

  private loadInventoryData(): void {
    // Load existing SalesKik inventory data
    const savedProducts = localStorage.getItem('saleskik-products-structured');
    const savedInventory = localStorage.getItem('saleskik-inventory-levels');
    
    if (savedProducts) {
      try {
        const products = JSON.parse(savedProducts);
        
        // Convert product data to inventory levels
        products.forEach((product: any) => {
          const inventoryLevel: InventoryLevel = {
            productId: product.id,
            locationId: 'main-warehouse', // Default location
            quantityOnHand: product.inventory?.currentStock || 0,
            quantityReserved: 0,
            quantityAvailable: product.inventory?.currentStock || 0,
            quantityOnOrder: this.calculateQuantityOnOrder(product.id),
            reorderPoint: product.inventory?.reorderPoint || this.calculateReorderPoint(product),
            maxLevel: product.inventory?.maxLevel || 1000,
            lastUpdated: new Date(product.inventory?.lastUpdated || Date.now()),
            averageUsage: this.calculateAverageUsage(product.id),
            leadTimeDays: product.inventory?.leadTimeDays || 14,
            costPerUnit: product.priceT1 || 0
          };
          
          this.inventoryLevels.set(product.id, inventoryLevel);
        });
        
        console.log(`Loaded ${this.inventoryLevels.size} inventory levels for purchase order integration`);
      } catch (error) {
        console.error('Error loading inventory data:', error);
      }
    }

    // Load saved movements and discrepancies
    this.loadInventoryMovements();
    this.loadInventoryDiscrepancies();
  }

  private loadInventoryMovements(): void {
    const saved = localStorage.getItem('saleskik-inventory-movements');
    if (saved) {
      try {
        this.inventoryMovements = JSON.parse(saved).map((movement: any) => ({
          ...movement,
          timestamp: new Date(movement.timestamp)
        }));
      } catch (error) {
        console.error('Error loading inventory movements:', error);
      }
    }
  }

  private loadInventoryDiscrepancies(): void {
    const saved = localStorage.getItem('saleskik-inventory-discrepancies');
    if (saved) {
      try {
        this.discrepancies = JSON.parse(saved).map((disc: any) => ({
          ...disc,
          reportedAt: new Date(disc.reportedAt),
          resolution: disc.resolution ? {
            ...disc.resolution,
            resolvedAt: new Date(disc.resolution.resolvedAt)
          } : undefined
        }));
      } catch (error) {
        console.error('Error loading inventory discrepancies:', error);
      }
    }
  }

  // Live stock level display during order creation
  public getLiveStockLevel(productId: string): {
    available: number;
    onHand: number;
    reserved: number;
    onOrder: number;
    reorderPoint: number;
    status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'REORDER_REQUIRED';
    recommendedOrderQuantity?: number;
  } {
    const level = this.inventoryLevels.get(productId);
    
    if (!level) {
      return {
        available: 0,
        onHand: 0,
        reserved: 0,
        onOrder: 0,
        reorderPoint: 0,
        status: 'OUT_OF_STOCK'
      };
    }

    let status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'REORDER_REQUIRED';
    
    if (level.quantityAvailable <= 0) {
      status = 'OUT_OF_STOCK';
    } else if (level.quantityAvailable <= level.reorderPoint) {
      status = 'REORDER_REQUIRED';
    } else if (level.quantityAvailable <= level.reorderPoint * 1.5) {
      status = 'LOW_STOCK';
    } else {
      status = 'IN_STOCK';
    }

    const recommendedOrderQuantity = status === 'REORDER_REQUIRED' || status === 'OUT_OF_STOCK'
      ? this.calculateRecommendedOrderQuantity(level)
      : undefined;

    return {
      available: level.quantityAvailable,
      onHand: level.quantityOnHand,
      reserved: level.quantityReserved,
      onOrder: level.quantityOnOrder,
      reorderPoint: level.reorderPoint,
      status,
      recommendedOrderQuantity
    };
  }

  // Automatic inventory adjustments when goods received
  public async processGoodsReceipt(
    purchaseOrderId: string,
    lineItemReceipts: Array<{
      lineItemId: string;
      productId: string;
      quantityReceived: number;
      quantityOrdered: number;
      condition: 'GOOD' | 'DAMAGED' | 'PARTIAL';
      notes?: string;
    }>,
    performedBy: string
  ): Promise<{
    success: boolean;
    adjustments: InventoryMovement[];
    discrepancies: InventoryDiscrepancy[];
    reorderSuggestions: ReorderSuggestion[];
  }> {
    const adjustments: InventoryMovement[] = [];
    const discrepancies: InventoryDiscrepancy[] = [];
    const reorderSuggestions: ReorderSuggestion[] = [];

    try {
      for (const receipt of lineItemReceipts) {
        const level = this.inventoryLevels.get(receipt.productId);
        if (!level) continue;

        // Calculate discrepancy
        const discrepancyAmount = receipt.quantityReceived - receipt.quantityOrdered;
        const discrepancyPercentage = receipt.quantityOrdered > 0 
          ? Math.abs(discrepancyAmount / receipt.quantityOrdered) * 100 
          : 0;

        // Process inventory adjustment
        const adjustment: InventoryMovement = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          productId: receipt.productId,
          locationId: level.locationId,
          movementType: 'PURCHASE_ORDER_RECEIVED',
          quantity: receipt.quantityReceived,
          reason: `Goods received from purchase order`,
          referenceType: 'PURCHASE_ORDER',
          referenceId: purchaseOrderId,
          performedBy,
          timestamp: new Date(),
          costImpact: receipt.quantityReceived * level.costPerUnit,
          notes: receipt.notes
        };

        adjustments.push(adjustment);

        // Update inventory levels
        level.quantityOnHand += receipt.quantityReceived;
        level.quantityOnOrder = Math.max(0, level.quantityOnOrder - receipt.quantityOrdered);
        level.quantityAvailable = level.quantityOnHand - level.quantityReserved;
        level.lastUpdated = new Date();

        // Record discrepancy if significant
        if (Math.abs(discrepancyAmount) > 0 || receipt.condition !== 'GOOD') {
          const discrepancy: InventoryDiscrepancy = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            purchaseOrderId,
            purchaseOrderNumber: await this.getPurchaseOrderNumber(purchaseOrderId),
            lineItemId: receipt.lineItemId,
            productId: receipt.productId,
            productName: await this.getProductName(receipt.productId),
            quantityOrdered: receipt.quantityOrdered,
            quantityReceived: receipt.quantityReceived,
            discrepancyAmount,
            discrepancyPercentage,
            discrepancyType: discrepancyAmount < 0 ? 'SHORTAGE' : 
                            discrepancyAmount > 0 ? 'OVERAGE' : 'DAMAGE',
            reportedBy: performedBy,
            reportedAt: new Date(),
            financialImpact: Math.abs(discrepancyAmount) * level.costPerUnit
          };

          discrepancies.push(discrepancy);
          this.discrepancies.push(discrepancy);
        }

        // Check for reorder suggestions
        if (level.quantityAvailable <= level.reorderPoint) {
          const suggestion = await this.generateReorderSuggestion(level);
          if (suggestion) {
            reorderSuggestions.push(suggestion);
          }
        }

        // Update inventory levels in storage
        this.inventoryLevels.set(receipt.productId, level);
      }

      // Save all changes
      this.saveInventoryMovements();
      this.saveInventoryDiscrepancies();
      this.updateSalesKikInventory();

      console.log(`Processed goods receipt: ${adjustments.length} adjustments, ${discrepancies.length} discrepancies`);

      return {
        success: true,
        adjustments,
        discrepancies,
        reorderSuggestions
      };
    } catch (error) {
      console.error('Error processing goods receipt:', error);
      return {
        success: false,
        adjustments: [],
        discrepancies: [],
        reorderSuggestions: []
      };
    }
  }

  // Calculate quantities on order from active purchase orders
  private calculateQuantityOnOrder(productId: string): number {
    const purchaseOrders = JSON.parse(localStorage.getItem('saleskik-purchase-orders') || '[]');
    
    return purchaseOrders.reduce((total: number, order: any) => {
      if (!['APPROVED', 'SENT_TO_SUPPLIER', 'SUPPLIER_CONFIRMED', 'PARTIALLY_RECEIVED'].includes(order.status)) {
        return total;
      }

      const lineItem = order.lineItems.find((item: any) => item.productId === productId);
      if (lineItem) {
        const quantityPending = lineItem.quantityOrdered - (lineItem.quantityReceived || 0);
        return total + Math.max(0, quantityPending);
      }

      return total;
    }, 0);
  }

  // Calculate reorder point based on usage patterns
  private calculateReorderPoint(product: any): number {
    const leadTimeDays = product.inventory?.leadTimeDays || 14;
    const averageUsage = this.calculateAverageUsage(product.id);
    const safetyStock = averageUsage * 3; // 3 days safety stock
    
    return Math.ceil((averageUsage * leadTimeDays) + safetyStock);
  }

  // Calculate average daily usage from historical data
  private calculateAverageUsage(productId: string): number {
    // Analyze movements over last 90 days
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const recentMovements = this.inventoryMovements.filter(movement => 
      movement.productId === productId && 
      movement.timestamp >= ninetyDaysAgo &&
      movement.movementType === 'PURCHASE_ORDER_RECEIVED'
    );

    if (recentMovements.length === 0) return 1; // Default to 1 unit per day

    const totalUsage = recentMovements.reduce((sum, movement) => sum + movement.quantity, 0);
    const days = (Date.now() - ninetyDaysAgo.getTime()) / (1000 * 60 * 60 * 24);
    
    return Math.max(0.1, totalUsage / days); // Minimum 0.1 units per day
  }

  // Generate intelligent reorder suggestions
  private async generateReorderSuggestion(level: InventoryLevel): Promise<ReorderSuggestion | null> {
    try {
      const product = await this.getProductDetails(level.productId);
      const recommendedSupplier = await this.getRecommendedSupplier(level.productId);
      
      if (!product || !recommendedSupplier) return null;

      const daysUntilStockout = level.quantityAvailable / Math.max(level.averageUsage, 0.1);
      const urgency: ReorderSuggestion['urgency'] = 
        daysUntilStockout <= 1 ? 'CRITICAL' :
        daysUntilStockout <= 3 ? 'HIGH' :
        daysUntilStockout <= 7 ? 'MEDIUM' : 'LOW';

      const suggestedQuantity = this.calculateRecommendedOrderQuantity(level);
      
      const reasoning = [];
      if (level.quantityAvailable <= 0) {
        reasoning.push('Out of stock - immediate reorder required');
      } else if (level.quantityAvailable <= level.reorderPoint) {
        reasoning.push(`Below reorder point (${level.reorderPoint} units)`);
      }
      
      if (daysUntilStockout <= 7) {
        reasoning.push(`Estimated ${daysUntilStockout.toFixed(1)} days until stockout`);
      }

      return {
        productId: level.productId,
        productName: product.name,
        currentStock: level.quantityAvailable,
        reorderPoint: level.reorderPoint,
        suggestedQuantity,
        estimatedCost: suggestedQuantity * recommendedSupplier.lastPrice,
        recommendedSupplier,
        urgency,
        reasoning
      };
    } catch (error) {
      console.error('Error generating reorder suggestion:', error);
      return null;
    }
  }

  private calculateRecommendedOrderQuantity(level: InventoryLevel): number {
    // Calculate economic order quantity (simplified)
    const dailyUsage = level.averageUsage;
    const leadTimeDays = level.leadTimeDays;
    const safetyStock = dailyUsage * 3;
    
    // Order enough to reach max level or cover 60 days usage, whichever is smaller
    const targetStock = Math.min(level.maxLevel, dailyUsage * 60);
    const orderQuantity = Math.max(0, targetStock - level.quantityAvailable - level.quantityOnOrder);
    
    return Math.ceil(orderQuantity);
  }

  private async getRecommendedSupplier(productId: string): Promise<ReorderSuggestion['recommendedSupplier'] | null> {
    try {
      // Find suppliers for this product from purchase order history
      const purchaseOrders = JSON.parse(localStorage.getItem('saleskik-purchase-orders') || '[]');
      const suppliers = JSON.parse(localStorage.getItem('saleskik-suppliers') || '[]');
      
      const productOrders = purchaseOrders.filter((order: any) =>
        order.lineItems.some((item: any) => item.productId === productId)
      );

      if (productOrders.length === 0) {
        // Default to first approved supplier
        const defaultSupplier = suppliers.find((supplier: any) => 
          supplier.isApprovedSupplier || supplier.status === 'active'
        );
        
        return defaultSupplier ? {
          id: defaultSupplier.id,
          name: defaultSupplier.supplierName || defaultSupplier.name,
          lastPrice: 0,
          leadTimeDays: 14,
          performanceRating: defaultSupplier.performanceRating || 5.0
        } : null;
      }

      // Find best performing supplier for this product
      const supplierPerformance = new Map();
      
      productOrders.forEach((order: any) => {
        const lineItem = order.lineItems.find((item: any) => item.productId === productId);
        if (lineItem) {
          const supplierId = order.supplier.id;
          if (!supplierPerformance.has(supplierId)) {
            supplierPerformance.set(supplierId, {
              supplier: order.supplier,
              orders: 0,
              totalValue: 0,
              lastPrice: 0,
              averageDeliveryTime: 0,
              confirmationRate: 0
            });
          }
          
          const perf = supplierPerformance.get(supplierId);
          perf.orders++;
          perf.totalValue += lineItem.subtotal;
          perf.lastPrice = lineItem.unitPrice;
        }
      });

      // Select best supplier (highest order count, then highest performance rating)
      let bestSupplier = null;
      let bestScore = 0;

      for (const [supplierId, perf] of supplierPerformance) {
        const score = perf.orders * 10 + (perf.supplier.performanceRating || 5.0);
        if (score > bestScore) {
          bestScore = score;
          bestSupplier = perf;
        }
      }

      return bestSupplier ? {
        id: bestSupplier.supplier.id,
        name: bestSupplier.supplier.supplierName,
        lastPrice: bestSupplier.lastPrice,
        leadTimeDays: 14, // Default lead time
        performanceRating: bestSupplier.supplier.performanceRating || 5.0
      } : null;
    } catch (error) {
      console.error('Error getting recommended supplier:', error);
      return null;
    }
  }

  // Reserve inventory when purchase order approved
  public reserveInventory(purchaseOrderId: string, lineItems: Array<{
    productId: string;
    quantity: number;
  }>): { success: boolean; reservations: string[]; errors: string[] } {
    const reservations: string[] = [];
    const errors: string[] = [];

    try {
      lineItems.forEach(item => {
        const level = this.inventoryLevels.get(item.productId);
        if (level && level.quantityAvailable >= item.quantity) {
          level.quantityReserved += item.quantity;
          level.quantityAvailable -= item.quantity;
          level.lastUpdated = new Date();
          
          reservations.push(`Reserved ${item.quantity} units of ${item.productId}`);
          
          // Log movement
          this.recordInventoryMovement({
            productId: item.productId,
            locationId: level.locationId,
            movementType: 'RESERVATION',
            quantity: -item.quantity, // Negative for reservation
            reason: 'Purchase order approved - inventory reserved',
            referenceType: 'PURCHASE_ORDER',
            referenceId: purchaseOrderId,
            performedBy: 'system',
            timestamp: new Date()
          });
        } else {
          errors.push(`Insufficient inventory for ${item.productId}: ${item.quantity} required, ${level?.quantityAvailable || 0} available`);
        }
      });

      if (reservations.length > 0) {
        this.updateSalesKikInventory();
      }

      return { success: errors.length === 0, reservations, errors };
    } catch (error) {
      console.error('Error reserving inventory:', error);
      return { success: false, reservations, errors: ['System error during reservation'] };
    }
  }

  // Release inventory reservation if order cancelled
  public releaseInventoryReservation(purchaseOrderId: string): void {
    const movements = this.inventoryMovements.filter(movement => 
      movement.referenceId === purchaseOrderId && movement.movementType === 'RESERVATION'
    );

    movements.forEach(movement => {
      const level = this.inventoryLevels.get(movement.productId);
      if (level) {
        const reservedQuantity = Math.abs(movement.quantity);
        level.quantityReserved = Math.max(0, level.quantityReserved - reservedQuantity);
        level.quantityAvailable += reservedQuantity;
        level.lastUpdated = new Date();

        // Log release movement
        this.recordInventoryMovement({
          productId: movement.productId,
          locationId: level.locationId,
          movementType: 'RELEASE',
          quantity: reservedQuantity,
          reason: 'Purchase order cancelled - inventory released',
          referenceType: 'PURCHASE_ORDER',
          referenceId: purchaseOrderId,
          performedBy: 'system',
          timestamp: new Date()
        });
      }
    });

    this.updateSalesKikInventory();
  }

  // Update existing SalesKik inventory data
  private updateSalesKikInventory(): void {
    try {
      const savedProducts = localStorage.getItem('saleskik-products-structured');
      if (savedProducts) {
        const products = JSON.parse(savedProducts);
        
        const updatedProducts = products.map((product: any) => {
          const level = this.inventoryLevels.get(product.id);
          if (level) {
            return {
              ...product,
              inventory: {
                ...product.inventory,
                currentStock: level.quantityOnHand,
                availableStock: level.quantityAvailable,
                reservedStock: level.quantityReserved,
                onOrderStock: level.quantityOnOrder,
                reorderPoint: level.reorderPoint,
                lastUpdated: level.lastUpdated.toISOString()
              }
            };
          }
          return product;
        });

        localStorage.setItem('saleskik-products-structured', JSON.stringify(updatedProducts));
        console.log('Updated SalesKik inventory data with purchase order integration');
      }
    } catch (error) {
      console.error('Error updating SalesKik inventory:', error);
    }
  }

  // Record inventory movement
  private recordInventoryMovement(movement: Omit<InventoryMovement, 'id'>): void {
    const fullMovement: InventoryMovement = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      ...movement
    };

    this.inventoryMovements.push(fullMovement);
    this.saveInventoryMovements();
  }

  // Reorder analysis service
  private startReorderAnalysis(): void {
    // Analyze reorder needs every 4 hours
    setInterval(() => {
      this.analyzeReorderNeeds();
    }, 4 * 60 * 60 * 1000);

    // Run initial analysis
    this.analyzeReorderNeeds();
  }

  private async analyzeReorderNeeds(): Promise<void> {
    const suggestions: ReorderSuggestion[] = [];
    
    for (const [productId, level] of this.inventoryLevels) {
      if (level.quantityAvailable <= level.reorderPoint) {
        const suggestion = await this.generateReorderSuggestion(level);
        if (suggestion) {
          suggestions.push(suggestion);
        }
      }
    }

    this.reorderSuggestions = suggestions;
    localStorage.setItem('saleskik-reorder-suggestions', JSON.stringify(suggestions));

    if (suggestions.length > 0) {
      console.log(`Generated ${suggestions.length} reorder suggestions`);
      
      // Notify procurement team of critical reorders
      const criticalSuggestions = suggestions.filter(s => s.urgency === 'CRITICAL');
      if (criticalSuggestions.length > 0) {
        await this.notifyReorderRequired(criticalSuggestions);
      }
    }
  }

  private async notifyReorderRequired(criticalSuggestions: ReorderSuggestion[]): Promise<void> {
    // Send notification to procurement team
    const notificationService = (await import('./NotificationCenterService')).default.getInstance();
    
    criticalSuggestions.forEach(suggestion => {
      // Create mock purchase order for notification
      const mockPO = {
        id: 'reorder-' + suggestion.productId,
        purchaseOrderNumber: `REORDER-${suggestion.productName}`,
        supplier: suggestion.recommendedSupplier,
        totalAmount: suggestion.estimatedCost,
        priorityLevel: 'URGENT',
        lineItems: []
      };

      notificationService.createPurchaseOrderNotification(
        'URGENT_ALERT',
        mockPO,
        { 
          message: `Critical reorder required: ${suggestion.productName} (${suggestion.currentStock} remaining)`,
          reorderData: suggestion
        }
      );
    });
  }

  // Helper methods
  private async getPurchaseOrderNumber(purchaseOrderId: string): Promise<string> {
    const orders = JSON.parse(localStorage.getItem('saleskik-purchase-orders') || '[]');
    const order = orders.find((o: any) => o.id === purchaseOrderId);
    return order?.purchaseOrderNumber || purchaseOrderId;
  }

  private async getProductName(productId: string): Promise<string> {
    const products = JSON.parse(localStorage.getItem('saleskik-products-structured') || '[]');
    const product = products.find((p: any) => p.id === productId);
    return product?.name || productId;
  }

  private async getProductDetails(productId: string): Promise<any> {
    const products = JSON.parse(localStorage.getItem('saleskik-products-structured') || '[]');
    return products.find((p: any) => p.id === productId);
  }

  // Storage methods
  private saveInventoryMovements(): void {
    localStorage.setItem('saleskik-inventory-movements', JSON.stringify(this.inventoryMovements));
  }

  private saveInventoryDiscrepancies(): void {
    localStorage.setItem('saleskik-inventory-discrepancies', JSON.stringify(this.discrepancies));
  }

  // Public API methods
  public getInventoryLevel(productId: string): InventoryLevel | null {
    return this.inventoryLevels.get(productId) || null;
  }

  public getReorderSuggestions(): ReorderSuggestion[] {
    return [...this.reorderSuggestions];
  }

  public getInventoryDiscrepancies(): InventoryDiscrepancy[] {
    return [...this.discrepancies];
  }

  public getInventoryMovements(productId?: string): InventoryMovement[] {
    return productId 
      ? this.inventoryMovements.filter(movement => movement.productId === productId)
      : [...this.inventoryMovements];
  }

  public getInventoryStats(): {
    totalProducts: number;
    inStock: number;
    lowStock: number;
    outOfStock: number;
    reorderRequired: number;
    totalValue: number;
    movementsToday: number;
    discrepanciesToday: number;
  } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let inStock = 0, lowStock = 0, outOfStock = 0, reorderRequired = 0, totalValue = 0;

    for (const level of this.inventoryLevels.values()) {
      totalValue += level.quantityOnHand * level.costPerUnit;
      
      if (level.quantityAvailable <= 0) {
        outOfStock++;
      } else if (level.quantityAvailable <= level.reorderPoint) {
        reorderRequired++;
      } else if (level.quantityAvailable <= level.reorderPoint * 1.5) {
        lowStock++;
      } else {
        inStock++;
      }
    }

    const movementsToday = this.inventoryMovements.filter(m => m.timestamp >= today).length;
    const discrepanciesToday = this.discrepancies.filter(d => d.reportedAt >= today).length;

    return {
      totalProducts: this.inventoryLevels.size,
      inStock,
      lowStock,
      outOfStock,
      reorderRequired,
      totalValue,
      movementsToday,
      discrepanciesToday
    };
  }
}

export default InventoryIntegrationService;