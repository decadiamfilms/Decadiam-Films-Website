// Internal Notification Center Service
// Handles in-app notifications, badges, counters, and user preferences

export interface InternalNotification {
  id: string;
  type: 'PURCHASE_ORDER_CREATED' | 'APPROVAL_REQUIRED' | 'SUPPLIER_CONFIRMED' | 
        'GOODS_RECEIVED' | 'INVOICE_CREATED' | 'ORDER_COMPLETED' | 
        'URGENT_ALERT' | 'SUPPLIER_TIMEOUT' | 'SYSTEM_ALERT' | 'WORKFLOW_UPDATE';
  category: 'ORDERS' | 'APPROVALS' | 'SUPPLIERS' | 'FINANCE' | 'SYSTEM';
  title: string;
  message: string;
  details?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  userId?: string; // If targeted to specific user
  userRole?: string; // If targeted to specific role
  purchaseOrderId?: string;
  supplierId?: string;
  actionRequired: boolean;
  actionUrl?: string;
  actionText?: string;
  createdAt: Date;
  readAt?: Date;
  dismissedAt?: Date;
  expiresAt?: Date;
  metadata?: {
    [key: string]: any;
  };
}

export interface NotificationPreferences {
  userId: string;
  email: string;
  preferences: {
    orderCreated: { inApp: boolean; email: boolean; push: boolean };
    approvalRequired: { inApp: boolean; email: boolean; push: boolean };
    supplierConfirmed: { inApp: boolean; email: boolean; push: boolean };
    goodsReceived: { inApp: boolean; email: boolean; push: boolean };
    invoiceCreated: { inApp: boolean; email: boolean; push: boolean };
    orderCompleted: { inApp: boolean; email: boolean; push: boolean };
    urgentAlerts: { inApp: boolean; email: boolean; push: boolean };
    supplierTimeouts: { inApp: boolean; email: boolean; push: boolean };
    systemAlerts: { inApp: boolean; email: boolean; push: boolean };
  };
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:MM
    endTime: string; // HH:MM
  };
  frequency: {
    emailDigest: 'IMMEDIATE' | 'HOURLY' | 'DAILY' | 'WEEKLY' | 'DISABLED';
    maxNotificationsPerHour: number;
  };
  filters: {
    categories: string[];
    priorities: string[];
    excludeOwnActions: boolean;
  };
}

export interface NotificationStats {
  totalNotifications: number;
  unreadNotifications: number;
  notificationsByCategory: { [category: string]: number };
  notificationsByPriority: { [priority: string]: number };
  actionRequiredCount: number;
  expiredNotifications: number;
  todaysNotifications: number;
  thisWeeksNotifications: number;
}

class NotificationCenterService {
  private static instance: NotificationCenterService;
  private notifications: InternalNotification[] = [];
  private userPreferences: NotificationPreferences | null = null;
  private subscribers: Map<string, (notifications: InternalNotification[]) => void> = new Map();

  private constructor() {
    this.loadNotifications();
    this.loadUserPreferences();
    this.startNotificationCleanup();
  }

  public static getInstance(): NotificationCenterService {
    if (!NotificationCenterService.instance) {
      NotificationCenterService.instance = new NotificationCenterService();
    }
    return NotificationCenterService.instance;
  }

  private loadNotifications(): void {
    const saved = localStorage.getItem('saleskik-internal-notifications');
    if (saved) {
      try {
        this.notifications = JSON.parse(saved).map((notif: any) => ({
          ...notif,
          createdAt: new Date(notif.createdAt),
          readAt: notif.readAt ? new Date(notif.readAt) : undefined,
          dismissedAt: notif.dismissedAt ? new Date(notif.dismissedAt) : undefined,
          expiresAt: notif.expiresAt ? new Date(notif.expiresAt) : undefined
        }));
      } catch (error) {
        console.error('Error loading notifications:', error);
        this.notifications = [];
      }
    }
  }

  private loadUserPreferences(): void {
    const saved = localStorage.getItem('saleskik-notification-preferences');
    if (saved) {
      try {
        this.userPreferences = JSON.parse(saved);
      } catch (error) {
        console.error('Error loading notification preferences:', error);
      }
    }

    // Create default preferences if none exist
    if (!this.userPreferences) {
      this.createDefaultPreferences();
    }
  }

  private createDefaultPreferences(): void {
    this.userPreferences = {
      userId: 'current-user',
      email: 'user@eccohardware.com.au',
      preferences: {
        orderCreated: { inApp: true, email: false, push: false },
        approvalRequired: { inApp: true, email: true, push: true },
        supplierConfirmed: { inApp: true, email: false, push: false },
        goodsReceived: { inApp: true, email: false, push: false },
        invoiceCreated: { inApp: true, email: true, push: false },
        orderCompleted: { inApp: true, email: false, push: false },
        urgentAlerts: { inApp: true, email: true, push: true },
        supplierTimeouts: { inApp: true, email: true, push: true },
        systemAlerts: { inApp: true, email: false, push: false }
      },
      quietHours: {
        enabled: true,
        startTime: '18:00',
        endTime: '08:00'
      },
      frequency: {
        emailDigest: 'DAILY',
        maxNotificationsPerHour: 10
      },
      filters: {
        categories: ['ORDERS', 'APPROVALS', 'SUPPLIERS', 'FINANCE', 'SYSTEM'],
        priorities: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
        excludeOwnActions: false
      }
    };

    this.saveUserPreferences();
  }

  private saveNotifications(): void {
    localStorage.setItem('saleskik-internal-notifications', JSON.stringify(this.notifications));
    this.notifySubscribers();
  }

  private saveUserPreferences(): void {
    if (this.userPreferences) {
      localStorage.setItem('saleskik-notification-preferences', JSON.stringify(this.userPreferences));
    }
  }

  private notifySubscribers(): void {
    const filteredNotifications = this.getFilteredNotifications();
    this.subscribers.forEach(callback => {
      try {
        callback(filteredNotifications);
      } catch (error) {
        console.error('Error notifying subscriber:', error);
      }
    });
  }

  // Create notifications for different purchase order events
  public createPurchaseOrderNotification(
    type: InternalNotification['type'],
    purchaseOrder: any,
    additionalData?: any
  ): string {
    if (!this.shouldCreateNotification(type)) {
      return '';
    }

    const notification = this.buildNotificationFromPO(type, purchaseOrder, additionalData);
    
    this.notifications.unshift(notification); // Add to beginning
    this.saveNotifications();

    console.log(`Internal notification created: ${type} for ${purchaseOrder.purchaseOrderNumber}`);
    return notification.id;
  }

  private shouldCreateNotification(type: InternalNotification['type']): boolean {
    if (!this.userPreferences) return true;

    const prefKey = this.mapTypeToPreferenceKey(type);
    return this.userPreferences.preferences[prefKey]?.inApp !== false;
  }

  private mapTypeToPreferenceKey(type: InternalNotification['type']): keyof NotificationPreferences['preferences'] {
    const mapping: { [key: string]: keyof NotificationPreferences['preferences'] } = {
      'PURCHASE_ORDER_CREATED': 'orderCreated',
      'APPROVAL_REQUIRED': 'approvalRequired',
      'SUPPLIER_CONFIRMED': 'supplierConfirmed',
      'GOODS_RECEIVED': 'goodsReceived',
      'INVOICE_CREATED': 'invoiceCreated',
      'ORDER_COMPLETED': 'orderCompleted',
      'URGENT_ALERT': 'urgentAlerts',
      'SUPPLIER_TIMEOUT': 'supplierTimeouts',
      'SYSTEM_ALERT': 'systemAlerts'
    };
    return mapping[type] || 'systemAlerts';
  }

  private buildNotificationFromPO(
    type: InternalNotification['type'],
    purchaseOrder: any,
    additionalData?: any
  ): InternalNotification {
    const notificationData = this.getNotificationContent(type, purchaseOrder, additionalData);
    
    return {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type,
      category: this.getCategoryFromType(type),
      title: notificationData.title,
      message: notificationData.message,
      details: notificationData.details,
      priority: notificationData.priority,
      purchaseOrderId: purchaseOrder.id,
      supplierId: purchaseOrder.supplier?.id,
      actionRequired: notificationData.actionRequired,
      actionUrl: notificationData.actionUrl,
      actionText: notificationData.actionText,
      createdAt: new Date(),
      expiresAt: notificationData.expiresAt,
      metadata: {
        purchaseOrderNumber: purchaseOrder.purchaseOrderNumber,
        supplierName: purchaseOrder.supplier?.supplierName,
        totalAmount: purchaseOrder.totalAmount,
        priority: purchaseOrder.priorityLevel,
        ...additionalData
      }
    };
  }

  private getCategoryFromType(type: InternalNotification['type']): InternalNotification['category'] {
    if (['PURCHASE_ORDER_CREATED', 'ORDER_COMPLETED', 'WORKFLOW_UPDATE'].includes(type)) return 'ORDERS';
    if (['APPROVAL_REQUIRED'].includes(type)) return 'APPROVALS';
    if (['SUPPLIER_CONFIRMED', 'SUPPLIER_TIMEOUT'].includes(type)) return 'SUPPLIERS';
    if (['INVOICE_CREATED', 'GOODS_RECEIVED'].includes(type)) return 'FINANCE';
    return 'SYSTEM';
  }

  private getNotificationContent(type: InternalNotification['type'], purchaseOrder: any, additionalData?: any): {
    title: string;
    message: string;
    details?: string;
    priority: InternalNotification['priority'];
    actionRequired: boolean;
    actionUrl?: string;
    actionText?: string;
    expiresAt?: Date;
  } {
    const poNumber = purchaseOrder.purchaseOrderNumber;
    const supplierName = purchaseOrder.supplier?.supplierName;
    const amount = `$${purchaseOrder.totalAmount?.toLocaleString('en-AU')}`;

    switch (type) {
      case 'PURCHASE_ORDER_CREATED':
        return {
          title: 'Purchase Order Created',
          message: `${poNumber} created for ${supplierName} (${amount})`,
          details: `${purchaseOrder.lineItems?.length || 0} items • Priority: ${purchaseOrder.priorityLevel}`,
          priority: purchaseOrder.priorityLevel === 'URGENT' ? 'HIGH' : 'MEDIUM',
          actionRequired: false,
          actionUrl: `/inventory/purchase-orders/${purchaseOrder.id}`,
          actionText: 'View Order'
        };

      case 'APPROVAL_REQUIRED':
        return {
          title: 'Manager Approval Required',
          message: `${poNumber} requires your approval (${amount})`,
          details: `Triggered by: ${additionalData?.triggeringRules?.join(', ') || 'Business rules'}`,
          priority: 'HIGH',
          actionRequired: true,
          actionUrl: `/inventory/purchase-orders?approvals=true`,
          actionText: 'Review & Approve',
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours
        };

      case 'SUPPLIER_CONFIRMED':
        return {
          title: 'Supplier Confirmation Received',
          message: `${supplierName} confirmed ${poNumber}`,
          details: `Delivery: ${additionalData?.confirmedDeliveryDate || 'Date pending'}`,
          priority: 'MEDIUM',
          actionRequired: false,
          actionUrl: `/inventory/purchase-orders/${purchaseOrder.id}`,
          actionText: 'View Details'
        };

      case 'GOODS_RECEIVED':
        return {
          title: 'Goods Receipt Processed',
          message: `${poNumber} ${additionalData?.receiptType?.toLowerCase() || 'partial'} receipt completed`,
          details: `Received by: ${additionalData?.receivedBy || 'Warehouse team'}`,
          priority: 'MEDIUM',
          actionRequired: additionalData?.receiptType === 'FULL',
          actionUrl: `/inventory/purchase-orders/${purchaseOrder.id}`,
          actionText: additionalData?.receiptType === 'FULL' ? 'Create Invoice' : 'View Receipt'
        };

      case 'INVOICE_CREATED':
        return {
          title: 'Invoice Created - Dispatch Unblocked',
          message: `${poNumber} invoice approved - goods ready for dispatch`,
          details: `Order value: ${amount} • Dispatch clearance granted`,
          priority: 'HIGH',
          actionRequired: true,
          actionUrl: `/orders/dispatch/${purchaseOrder.id}`,
          actionText: 'Schedule Dispatch'
        };

      case 'ORDER_COMPLETED':
        return {
          title: 'Purchase Order Completed',
          message: `${poNumber} completed successfully`,
          details: `Supplier: ${supplierName} • Total: ${amount}`,
          priority: 'LOW',
          actionRequired: false,
          actionUrl: `/inventory/purchase-orders/${purchaseOrder.id}`,
          actionText: 'View Completed Order'
        };

      case 'URGENT_ALERT':
        return {
          title: 'URGENT: Immediate Attention Required',
          message: additionalData?.message || `${poNumber} requires immediate action`,
          details: `Priority: ${purchaseOrder.priorityLevel} • Supplier: ${supplierName}`,
          priority: 'URGENT',
          actionRequired: true,
          actionUrl: `/inventory/purchase-orders/${purchaseOrder.id}`,
          actionText: 'Take Action',
          expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours
        };

      case 'SUPPLIER_TIMEOUT':
        return {
          title: 'Supplier Confirmation Overdue',
          message: `${supplierName} has not confirmed ${poNumber}`,
          details: `${additionalData?.hoursOverdue || 0} hours overdue • ${amount}`,
          priority: additionalData?.hoursOverdue > 48 ? 'URGENT' : 'HIGH',
          actionRequired: true,
          actionUrl: `/inventory/purchase-orders?timeouts=true`,
          actionText: 'Contact Supplier',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        };

      default:
        return {
          title: 'Purchase Order Update',
          message: `${poNumber} has been updated`,
          priority: 'MEDIUM',
          actionRequired: false
        };
    }
  }

  // Get filtered notifications based on user preferences
  public getFilteredNotifications(): InternalNotification[] {
    if (!this.userPreferences) return this.notifications;

    return this.notifications.filter(notification => {
      // Filter by category
      if (!this.userPreferences!.filters.categories.includes(notification.category)) {
        return false;
      }

      // Filter by priority
      if (!this.userPreferences!.filters.priorities.includes(notification.priority)) {
        return false;
      }

      // Filter expired notifications
      if (notification.expiresAt && new Date() > notification.expiresAt) {
        return false;
      }

      // Filter dismissed notifications
      if (notification.dismissedAt) {
        return false;
      }

      return true;
    });
  }

  // Get notification statistics
  public getNotificationStats(): NotificationStats {
    const filtered = this.getFilteredNotifications();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisWeek = new Date(today);
    thisWeek.setDate(today.getDate() - 7);

    const unreadNotifications = filtered.filter(n => !n.readAt).length;
    const actionRequiredCount = filtered.filter(n => n.actionRequired && !n.readAt).length;
    const expiredNotifications = this.notifications.filter(n => 
      n.expiresAt && new Date() > n.expiresAt
    ).length;

    const notificationsByCategory = filtered.reduce((acc: any, notification) => {
      acc[notification.category] = (acc[notification.category] || 0) + 1;
      return acc;
    }, {});

    const notificationsByPriority = filtered.reduce((acc: any, notification) => {
      acc[notification.priority] = (acc[notification.priority] || 0) + 1;
      return acc;
    }, {});

    const todaysNotifications = filtered.filter(n => n.createdAt >= today).length;
    const thisWeeksNotifications = filtered.filter(n => n.createdAt >= thisWeek).length;

    return {
      totalNotifications: filtered.length,
      unreadNotifications,
      notificationsByCategory,
      notificationsByPriority,
      actionRequiredCount,
      expiredNotifications,
      todaysNotifications,
      thisWeeksNotifications
    };
  }

  // Notification management
  public markAsRead(notificationId: string): boolean {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification && !notification.readAt) {
      notification.readAt = new Date();
      this.saveNotifications();
      return true;
    }
    return false;
  }

  public markAllAsRead(): number {
    let marked = 0;
    this.notifications.forEach(notification => {
      if (!notification.readAt) {
        notification.readAt = new Date();
        marked++;
      }
    });
    
    if (marked > 0) {
      this.saveNotifications();
    }
    
    return marked;
  }

  public dismissNotification(notificationId: string): boolean {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.dismissedAt = new Date();
      this.saveNotifications();
      return true;
    }
    return false;
  }

  public deleteNotification(notificationId: string): boolean {
    const index = this.notifications.findIndex(n => n.id === notificationId);
    if (index !== -1) {
      this.notifications.splice(index, 1);
      this.saveNotifications();
      return true;
    }
    return false;
  }

  // Subscription management for real-time updates
  public subscribe(subscriberId: string, callback: (notifications: InternalNotification[]) => void): void {
    this.subscribers.set(subscriberId, callback);
    
    // Immediately call with current notifications
    callback(this.getFilteredNotifications());
  }

  public unsubscribe(subscriberId: string): void {
    this.subscribers.delete(subscriberId);
  }

  // User preferences management
  public updateNotificationPreferences(updates: Partial<NotificationPreferences>): void {
    if (this.userPreferences) {
      this.userPreferences = { ...this.userPreferences, ...updates };
      this.saveUserPreferences();
    }
  }

  public getUserPreferences(): NotificationPreferences | null {
    return this.userPreferences;
  }

  // Batch operations
  public markCategoryAsRead(category: InternalNotification['category']): number {
    let marked = 0;
    this.notifications.forEach(notification => {
      if (notification.category === category && !notification.readAt) {
        notification.readAt = new Date();
        marked++;
      }
    });
    
    if (marked > 0) {
      this.saveNotifications();
    }
    
    return marked;
  }

  public clearOldNotifications(daysToKeep: number = 30): number {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    const initialCount = this.notifications.length;
    
    this.notifications = this.notifications.filter(notification => 
      notification.createdAt > cutoffDate || 
      (notification.actionRequired && !notification.readAt) // Keep unread action items
    );

    const cleanedCount = initialCount - this.notifications.length;
    if (cleanedCount > 0) {
      this.saveNotifications();
      console.log(`Cleaned up ${cleanedCount} old notifications`);
    }

    return cleanedCount;
  }

  // Cleanup service
  private startNotificationCleanup(): void {
    // Clean up old notifications every 24 hours
    setInterval(() => {
      this.clearOldNotifications(30);
      this.cleanupExpiredNotifications();
    }, 24 * 60 * 60 * 1000);
    
    // Run initial cleanup
    this.cleanupExpiredNotifications();
  }

  private cleanupExpiredNotifications(): void {
    const now = new Date();
    let cleaned = 0;

    this.notifications.forEach(notification => {
      if (notification.expiresAt && now > notification.expiresAt && !notification.dismissedAt) {
        notification.dismissedAt = now;
        cleaned++;
      }
    });

    if (cleaned > 0) {
      this.saveNotifications();
      console.log(`Auto-dismissed ${cleaned} expired notifications`);
    }
  }

  // Integration with WebSocket for real-time updates
  public handleWebSocketMessage(message: any): void {
    // Convert WebSocket messages to internal notifications
    if (message.type && message.data?.purchaseOrderNumber) {
      const mockPO = {
        id: message.purchaseOrderId,
        purchaseOrderNumber: message.data.purchaseOrderNumber,
        supplier: { 
          id: message.data.supplierId,
          supplierName: message.data.supplierName 
        },
        totalAmount: message.data.totalAmount || 0,
        priorityLevel: message.data.priority || 'MEDIUM',
        lineItems: []
      };

      this.createPurchaseOrderNotification(
        message.type as InternalNotification['type'],
        mockPO,
        message.data
      );
    }
  }

  // Quick action methods
  public getUnreadCount(): number {
    return this.getFilteredNotifications().filter(n => !n.readAt).length;
  }

  public getActionRequiredCount(): number {
    return this.getFilteredNotifications().filter(n => n.actionRequired && !n.readAt).length;
  }

  public getUrgentCount(): number {
    return this.getFilteredNotifications().filter(n => n.priority === 'URGENT' && !n.readAt).length;
  }

  public getNotificationsByCategory(category: InternalNotification['category']): InternalNotification[] {
    return this.getFilteredNotifications().filter(n => n.category === category);
  }

  public getRecentActivity(limit: number = 10): InternalNotification[] {
    return this.getFilteredNotifications()
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  // Notification creation helpers for purchase order events
  public notifyOrderCreated(purchaseOrder: any): void {
    this.createPurchaseOrderNotification('PURCHASE_ORDER_CREATED', purchaseOrder);
  }

  public notifyApprovalRequired(purchaseOrder: any, triggeringRules: string[]): void {
    this.createPurchaseOrderNotification('APPROVAL_REQUIRED', purchaseOrder, { triggeringRules });
  }

  public notifySupplierConfirmed(purchaseOrder: any, confirmationData: any): void {
    this.createPurchaseOrderNotification('SUPPLIER_CONFIRMED', purchaseOrder, confirmationData);
  }

  public notifyGoodsReceived(purchaseOrder: any, receiptData: any): void {
    this.createPurchaseOrderNotification('GOODS_RECEIVED', purchaseOrder, receiptData);
  }

  public notifyInvoiceCreated(purchaseOrder: any): void {
    this.createPurchaseOrderNotification('INVOICE_CREATED', purchaseOrder);
  }

  public notifyOrderCompleted(purchaseOrder: any): void {
    this.createPurchaseOrderNotification('ORDER_COMPLETED', purchaseOrder);
  }

  public notifyUrgentAlert(message: string, purchaseOrder: any): void {
    this.createPurchaseOrderNotification('URGENT_ALERT', purchaseOrder, { message });
  }

  public notifySupplierTimeout(purchaseOrder: any, hoursOverdue: number): void {
    this.createPurchaseOrderNotification('SUPPLIER_TIMEOUT', purchaseOrder, { hoursOverdue });
  }
}

export default NotificationCenterService;