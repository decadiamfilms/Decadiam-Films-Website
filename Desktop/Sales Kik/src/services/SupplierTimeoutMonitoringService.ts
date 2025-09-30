// Supplier Timeout Monitoring Service
// Handles automatic confirmation timeouts, escalations, and unresponsive supplier management

export interface SupplierTimeoutRule {
  id: string;
  name: string;
  triggerAfterHours: number;
  action: 'STATUS_UPDATE' | 'ESCALATION_EMAIL' | 'MANAGER_NOTIFICATION' | 'URGENT_ALERT';
  targetStatus?: string;
  escalationLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recipients: string[];
  emailTemplate: string;
  isActive: boolean;
  conditions?: {
    priorityLevels?: string[];
    supplierTypes?: string[];
    orderValueThreshold?: number;
  };
}

export interface SupplierTimeoutEvent {
  id: string;
  purchaseOrderId: string;
  purchaseOrderNumber: string;
  supplierId: string;
  supplierName: string;
  supplierEmail: string;
  currentStatus: string;
  sentToSupplierAt: Date;
  hoursWithoutConfirmation: number;
  timeoutRuleId: string;
  escalationLevel: string;
  nextEscalationAt?: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolutionMethod?: 'SUPPLIER_CONFIRMED' | 'MANUAL_OVERRIDE' | 'ORDER_CANCELLED';
  escalationHistory: {
    level: string;
    sentAt: Date;
    recipients: string[];
    emailsSent: number;
  }[];
}

export interface OverdueSupplierAlert {
  supplierId: string;
  supplierName: string;
  supplierEmail: string;
  overdueOrders: {
    purchaseOrderId: string;
    purchaseOrderNumber: string;
    hoursOverdue: number;
    totalAmount: number;
    priority: string;
  }[];
  totalOverdueOrders: number;
  totalOverdueValue: number;
  averageResponseTime: number;
  responseRate: number;
  lastResponseDate?: Date;
  escalationRequired: boolean;
}

class SupplierTimeoutMonitoringService {
  private static instance: SupplierTimeoutMonitoringService;
  private timeoutRules: SupplierTimeoutRule[] = [];
  private timeoutEvents: SupplierTimeoutEvent[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeTimeoutRules();
    this.loadTimeoutEvents();
    this.startTimeoutMonitoring();
  }

  public static getInstance(): SupplierTimeoutMonitoringService {
    if (!SupplierTimeoutMonitoringService.instance) {
      SupplierTimeoutMonitoringService.instance = new SupplierTimeoutMonitoringService();
    }
    return SupplierTimeoutMonitoringService.instance;
  }

  private initializeTimeoutRules(): void {
    this.timeoutRules = [
      {
        id: 'supplier-reminder-24h',
        name: '24 Hour Supplier Reminder',
        triggerAfterHours: 24,
        action: 'ESCALATION_EMAIL',
        escalationLevel: 'LOW',
        recipients: ['supplier'],
        emailTemplate: 'supplier-24h-reminder',
        isActive: true
      },
      {
        id: 'supplier-escalation-48h',
        name: '48 Hour Escalation to Management',
        triggerAfterHours: 48,
        action: 'MANAGER_NOTIFICATION',
        targetStatus: 'CONFIRMATION_OVERDUE',
        escalationLevel: 'HIGH',
        recipients: ['procurement-manager', 'operations-manager'],
        emailTemplate: 'supplier-48h-escalation',
        isActive: true
      },
      {
        id: 'urgent-order-escalation-6h',
        name: '6 Hour Urgent Order Escalation',
        triggerAfterHours: 6,
        action: 'URGENT_ALERT',
        escalationLevel: 'CRITICAL',
        recipients: ['procurement-manager', 'operations-director'],
        emailTemplate: 'urgent-supplier-escalation',
        isActive: true,
        conditions: {
          priorityLevels: ['URGENT']
        }
      },
      {
        id: 'high-value-escalation-36h',
        name: '36 Hour High Value Order Escalation',
        triggerAfterHours: 36,
        action: 'MANAGER_NOTIFICATION',
        escalationLevel: 'HIGH',
        recipients: ['procurement-manager', 'finance-manager'],
        emailTemplate: 'high-value-supplier-escalation',
        isActive: true,
        conditions: {
          orderValueThreshold: 10000
        }
      },
      {
        id: 'glass-supplier-escalation-12h',
        name: '12 Hour Glass Supplier Escalation',
        triggerAfterHours: 12,
        action: 'ESCALATION_EMAIL',
        escalationLevel: 'MEDIUM',
        recipients: ['supplier', 'procurement-team'],
        emailTemplate: 'glass-supplier-escalation',
        isActive: true,
        conditions: {
          supplierTypes: ['glass-specialist']
        }
      },
      {
        id: 'automatic-overdue-status-72h',
        name: '72 Hour Automatic Overdue Status',
        triggerAfterHours: 72,
        action: 'STATUS_UPDATE',
        targetStatus: 'CONFIRMATION_OVERDUE',
        escalationLevel: 'CRITICAL',
        recipients: ['all-managers'],
        emailTemplate: 'automatic-overdue-notification',
        isActive: true
      }
    ];

    localStorage.setItem('saleskik-supplier-timeout-rules', JSON.stringify(this.timeoutRules));
  }

  private loadTimeoutEvents(): void {
    const savedEvents = localStorage.getItem('saleskik-supplier-timeout-events');
    if (savedEvents) {
      try {
        this.timeoutEvents = JSON.parse(savedEvents).map((event: any) => ({
          ...event,
          sentToSupplierAt: new Date(event.sentToSupplierAt),
          nextEscalationAt: event.nextEscalationAt ? new Date(event.nextEscalationAt) : undefined,
          resolvedAt: event.resolvedAt ? new Date(event.resolvedAt) : undefined,
          escalationHistory: event.escalationHistory.map((hist: any) => ({
            ...hist,
            sentAt: new Date(hist.sentAt)
          }))
        }));
      } catch (error) {
        console.error('Error loading timeout events:', error);
        this.timeoutEvents = [];
      }
    }
  }

  private saveTimeoutEvents(): void {
    localStorage.setItem('saleskik-supplier-timeout-events', JSON.stringify(this.timeoutEvents));
  }

  // Start monitoring for supplier timeouts
  private startTimeoutMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    // Monitor every 10 minutes
    this.monitoringInterval = setInterval(() => {
      this.checkForTimeouts();
    }, 10 * 60 * 1000);

    // Run initial check
    this.checkForTimeouts();
  }

  private async checkForTimeouts(): Promise<void> {
    console.log('Checking for supplier confirmation timeouts...');

    const purchaseOrders = JSON.parse(localStorage.getItem('saleskik-purchase-orders') || '[]');
    const now = new Date();

    // Find orders awaiting supplier confirmation
    const ordersAwaitingConfirmation = purchaseOrders.filter((order: any) => 
      order.status === 'SENT_TO_SUPPLIER' && !order.supplierConfirmedDate
    );

    for (const order of ordersAwaitingConfirmation) {
      const sentDate = new Date(order.updatedAt || order.createdAt);
      const hoursWithoutConfirmation = (now.getTime() - sentDate.getTime()) / (1000 * 60 * 60);

      // Check each timeout rule
      for (const rule of this.timeoutRules) {
        if (!rule.isActive) continue;

        // Check if rule conditions are met
        if (!this.evaluateRuleConditions(rule, order, hoursWithoutConfirmation)) {
          continue;
        }

        // Check if this rule has already been triggered for this order
        const existingEvent = this.timeoutEvents.find(event => 
          event.purchaseOrderId === order.id && 
          event.timeoutRuleId === rule.id && 
          !event.resolved
        );

        if (existingEvent) {
          // Check for additional escalations
          await this.checkForAdditionalEscalations(existingEvent, hoursWithoutConfirmation);
        } else {
          // Create new timeout event
          await this.createTimeoutEvent(order, rule, hoursWithoutConfirmation);
        }
      }
    }

    // Check for orders that need automatic status updates
    await this.processAutomaticStatusUpdates();
    
    // Generate overdue supplier alerts
    await this.generateOverdueSupplierAlerts(ordersAwaitingConfirmation);
  }

  private evaluateRuleConditions(rule: SupplierTimeoutRule, order: any, hoursWithoutConfirmation: number): boolean {
    // Check if enough time has passed
    if (hoursWithoutConfirmation < rule.triggerAfterHours) {
      return false;
    }

    // Check priority level conditions
    if (rule.conditions?.priorityLevels && 
        !rule.conditions.priorityLevels.includes(order.priorityLevel)) {
      return false;
    }

    // Check order value conditions
    if (rule.conditions?.orderValueThreshold && 
        order.totalAmount < rule.conditions.orderValueThreshold) {
      return false;
    }

    // Check supplier type conditions
    if (rule.conditions?.supplierTypes) {
      const supplierType = order.supplier.isLocalGlassSupplier ? 'glass-specialist' : 'general';
      if (!rule.conditions.supplierTypes.includes(supplierType)) {
        return false;
      }
    }

    return true;
  }

  private async createTimeoutEvent(order: any, rule: SupplierTimeoutRule, hoursWithoutConfirmation: number): Promise<void> {
    const timeoutEvent: SupplierTimeoutEvent = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      purchaseOrderId: order.id,
      purchaseOrderNumber: order.purchaseOrderNumber,
      supplierId: order.supplier.id,
      supplierName: order.supplier.supplierName,
      supplierEmail: order.supplier.emailAddress,
      currentStatus: order.status,
      sentToSupplierAt: new Date(order.updatedAt || order.createdAt),
      hoursWithoutConfirmation,
      timeoutRuleId: rule.id,
      escalationLevel: rule.escalationLevel,
      nextEscalationAt: this.calculateNextEscalation(rule, hoursWithoutConfirmation),
      resolved: false,
      escalationHistory: []
    };

    this.timeoutEvents.push(timeoutEvent);
    this.saveTimeoutEvents();

    // Execute the timeout action
    await this.executeTimeoutAction(timeoutEvent, rule, order);
  }

  private calculateNextEscalation(rule: SupplierTimeoutRule, currentHours: number): Date | undefined {
    // Find next escalation level
    const nextRule = this.timeoutRules.find(r => 
      r.triggerAfterHours > rule.triggerAfterHours && 
      r.escalationLevel !== rule.escalationLevel &&
      r.isActive
    );

    if (nextRule) {
      const hoursToNext = nextRule.triggerAfterHours - currentHours;
      return new Date(Date.now() + hoursToNext * 60 * 60 * 1000);
    }

    return undefined;
  }

  private async executeTimeoutAction(event: SupplierTimeoutEvent, rule: SupplierTimeoutRule, order: any): Promise<void> {
    console.log(`Executing timeout action: ${rule.name} for ${order.purchaseOrderNumber}`);

    switch (rule.action) {
      case 'STATUS_UPDATE':
        await this.updateOrderStatus(order, rule.targetStatus || 'CONFIRMATION_OVERDUE');
        break;
      case 'ESCALATION_EMAIL':
        await this.sendEscalationEmail(event, rule, order);
        break;
      case 'MANAGER_NOTIFICATION':
        await this.sendManagerNotification(event, rule, order);
        break;
      case 'URGENT_ALERT':
        await this.sendUrgentAlert(event, rule, order);
        break;
    }

    // Log escalation in event history
    event.escalationHistory.push({
      level: rule.escalationLevel,
      sentAt: new Date(),
      recipients: await this.resolveRecipients(rule.recipients, order),
      emailsSent: rule.recipients.length
    });

    this.saveTimeoutEvents();
  }

  private async updateOrderStatus(order: any, newStatus: string): Promise<void> {
    try {
      const purchaseOrders = JSON.parse(localStorage.getItem('saleskik-purchase-orders') || '[]');
      const updatedOrders = purchaseOrders.map((po: any) => 
        po.id === order.id 
          ? { 
              ...po, 
              status: newStatus,
              confirmatonOverdueAt: new Date(),
              updatedAt: new Date()
            }
          : po
      );
      
      localStorage.setItem('saleskik-purchase-orders', JSON.stringify(updatedOrders));
      
      // Broadcast status change via WebSocket
      const wsService = (await import('./PurchaseOrderWebSocketService')).default.getInstance();
      wsService.notifyStatusChange(order, order.status, newStatus, 'timeout-system');
      
      console.log(`Order ${order.purchaseOrderNumber} status updated to ${newStatus} due to supplier timeout`);
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  }

  private async sendEscalationEmail(event: SupplierTimeoutEvent, rule: SupplierTimeoutRule, order: any): Promise<void> {
    try {
      const emailService = (await import('./EmailDeliveryService')).default.getInstance();
      
      const variables = {
        companyName: 'Ecco Hardware',
        purchaseOrderNumber: order.purchaseOrderNumber,
        supplierName: order.supplier.supplierName,
        totalAmount: `$${order.totalAmount.toLocaleString('en-AU', { minimumFractionDigits: 2 })}`,
        hoursOverdue: Math.floor(event.hoursWithoutConfirmation),
        originalSentDate: event.sentToSupplierAt.toLocaleDateString(),
        urgencyLevel: rule.escalationLevel,
        confirmationUrl: `${window.location.origin}/supplier/confirm/${order.id}?token=existing-token`,
        contactPerson: 'Adam Smith',
        contactEmail: 'adam@eccohardware.com.au',
        contactPhone: '+61 2 9876 5432'
      };

      const recipients = await this.resolveRecipients(rule.recipients, order);
      
      // Create escalation email based on rule level
      const emailTemplate = this.getEscalationEmailTemplate(rule.escalationLevel);
      const renderedTemplate = emailService.renderTemplate(emailTemplate, variables);

      const emailMessage = {
        id: Date.now().toString(),
        templateId: emailTemplate,
        to: recipients,
        subject: renderedTemplate.subject,
        htmlContent: renderedTemplate.html,
        textContent: renderedTemplate.text,
        variables,
        priority: rule.escalationLevel === 'CRITICAL' ? 'URGENT' as const : 
                  rule.escalationLevel === 'HIGH' ? 'HIGH' as const : 'MEDIUM' as const,
        createdAt: new Date()
      };

      await emailService.queueEmail(emailMessage);
      
      console.log(`Escalation email sent: ${rule.name} for ${order.purchaseOrderNumber}`);
    } catch (error) {
      console.error('Error sending escalation email:', error);
    }
  }

  private async sendManagerNotification(event: SupplierTimeoutEvent, rule: SupplierTimeoutRule, order: any): Promise<void> {
    try {
      const notification = {
        id: Date.now().toString(),
        type: 'SUPPLIER_TIMEOUT',
        title: `Supplier Confirmation Overdue`,
        message: `${order.supplier.supplierName} has not confirmed ${order.purchaseOrderNumber} for ${Math.floor(event.hoursWithoutConfirmation)} hours`,
        priority: rule.escalationLevel,
        purchaseOrderId: order.id,
        supplierId: order.supplier.id,
        hoursOverdue: Math.floor(event.hoursWithoutConfirmation),
        escalationLevel: rule.escalationLevel,
        actionRequired: true,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      };

      // Save notification for dashboard display
      const existingNotifications = JSON.parse(localStorage.getItem('saleskik-manager-notifications') || '[]');
      existingNotifications.push(notification);
      localStorage.setItem('saleskik-manager-notifications', JSON.stringify(existingNotifications));

      // Send email to managers
      await this.sendEmailToManagers(notification, rule, order);

      console.log(`Manager notification sent: ${rule.name} for ${order.purchaseOrderNumber}`);
    } catch (error) {
      console.error('Error sending manager notification:', error);
    }
  }

  private async sendUrgentAlert(event: SupplierTimeoutEvent, rule: SupplierTimeoutRule, order: any): Promise<void> {
    try {
      // Broadcast urgent alert via WebSocket
      const wsService = (await import('./PurchaseOrderWebSocketService')).default.getInstance();
      wsService.notifyUrgentAlert(
        `URGENT: ${order.supplier.supplierName} has not confirmed ${order.purchaseOrderNumber} for ${Math.floor(event.hoursWithoutConfirmation)} hours`,
        order.id
      );

      // Send urgent email notification
      const emailService = (await import('./EmailDeliveryService')).default.getInstance();
      const recipients = await this.resolveRecipients(rule.recipients, order);

      const variables = {
        companyName: 'Ecco Hardware',
        purchaseOrderNumber: order.purchaseOrderNumber,
        supplierName: order.supplier.supplierName,
        hoursOverdue: Math.floor(event.hoursWithoutConfirmation),
        totalAmount: `$${order.totalAmount.toLocaleString('en-AU', { minimumFractionDigits: 2 })}`,
        priority: order.priorityLevel,
        urgentMessage: `${order.supplier.supplierName} has been unresponsive for ${Math.floor(event.hoursWithoutConfirmation)} hours`
      };

      const renderedTemplate = emailService.renderTemplate('urgent-supplier-alert', variables);

      const emailMessage = {
        id: Date.now().toString(),
        templateId: 'urgent-supplier-alert',
        to: recipients,
        subject: `🚨 URGENT: Supplier Confirmation Overdue - ${order.purchaseOrderNumber}`,
        htmlContent: renderedTemplate.html,
        textContent: renderedTemplate.text,
        variables,
        priority: 'URGENT' as const,
        createdAt: new Date()
      };

      await emailService.queueEmail(emailMessage);

      console.log(`Urgent alert sent: ${rule.name} for ${order.purchaseOrderNumber}`);
    } catch (error) {
      console.error('Error sending urgent alert:', error);
    }
  }

  private async resolveRecipients(recipientTypes: string[], order: any): Promise<string[]> {
    const recipients: string[] = [];

    for (const recipientType of recipientTypes) {
      switch (recipientType) {
        case 'supplier':
          recipients.push(order.supplier.emailAddress);
          break;
        case 'procurement-manager':
          recipients.push('procurement@eccohardware.com.au');
          break;
        case 'operations-manager':
          recipients.push('operations@eccohardware.com.au');
          break;
        case 'operations-director':
          recipients.push('director@eccohardware.com.au');
          break;
        case 'finance-manager':
          recipients.push('finance@eccohardware.com.au');
          break;
        case 'procurement-team':
          recipients.push('procurement-team@eccohardware.com.au');
          break;
        case 'all-managers':
          recipients.push('managers@eccohardware.com.au');
          break;
        default:
          // Assume it's an email address
          if (recipientType.includes('@')) {
            recipients.push(recipientType);
          }
      }
    }

    return [...new Set(recipients)]; // Remove duplicates
  }

  private getEscalationEmailTemplate(escalationLevel: string): string {
    switch (escalationLevel) {
      case 'CRITICAL':
        return 'urgent-supplier-alert';
      case 'HIGH':
        return 'supplier-48h-escalation';
      case 'MEDIUM':
        return 'glass-supplier-escalation';
      case 'LOW':
      default:
        return 'supplier-24h-reminder';
    }
  }

  private async sendEmailToManagers(notification: any, rule: SupplierTimeoutRule, order: any): Promise<void> {
    const emailService = (await import('./EmailDeliveryService')).default.getInstance();
    const recipients = await this.resolveRecipients(rule.recipients, order);

    const variables = {
      companyName: 'Ecco Hardware',
      purchaseOrderNumber: order.purchaseOrderNumber,
      supplierName: order.supplier.supplierName,
      totalAmount: `$${order.totalAmount.toLocaleString('en-AU', { minimumFractionDigits: 2 })}`,
      hoursOverdue: notification.hoursOverdue,
      escalationLevel: rule.escalationLevel,
      actionRequired: 'Contact supplier or override confirmation',
      purchaseOrderUrl: `${window.location.origin}/inventory/purchase-orders/${order.id}`
    };

    const renderedTemplate = emailService.renderTemplate(rule.emailTemplate, variables);

    const emailMessage = {
      id: Date.now().toString(),
      templateId: rule.emailTemplate,
      to: recipients,
      subject: renderedTemplate.subject,
      htmlContent: renderedTemplate.html,
      textContent: renderedTemplate.text,
      variables,
      priority: rule.escalationLevel === 'CRITICAL' ? 'URGENT' as const : 'HIGH' as const,
      createdAt: new Date()
    };

    await emailService.queueEmail(emailMessage);
  }

  private async checkForAdditionalEscalations(event: SupplierTimeoutEvent, currentHours: number): Promise<void> {
    if (!event.nextEscalationAt || new Date() < event.nextEscalationAt) {
      return;
    }

    // Find next escalation rule
    const nextRule = this.timeoutRules.find(rule => 
      rule.triggerAfterHours > currentHours && 
      rule.escalationLevel !== event.escalationLevel &&
      rule.isActive
    );

    if (nextRule) {
      const order = await this.getPurchaseOrder(event.purchaseOrderId);
      if (order) {
        await this.executeTimeoutAction(event, nextRule, order);
        event.nextEscalationAt = this.calculateNextEscalation(nextRule, currentHours);
        this.saveTimeoutEvents();
      }
    }
  }

  private async processAutomaticStatusUpdates(): Promise<void> {
    const statusUpdateRule = this.timeoutRules.find(rule => 
      rule.action === 'STATUS_UPDATE' && rule.isActive
    );

    if (!statusUpdateRule) return;

    const purchaseOrders = JSON.parse(localStorage.getItem('saleskik-purchase-orders') || '[]');
    const now = new Date();

    const ordersForStatusUpdate = purchaseOrders.filter((order: any) => {
      if (order.status !== 'SENT_TO_SUPPLIER' || order.supplierConfirmedDate) {
        return false;
      }

      const sentDate = new Date(order.updatedAt || order.createdAt);
      const hoursWithoutConfirmation = (now.getTime() - sentDate.getTime()) / (1000 * 60 * 60);

      return hoursWithoutConfirmation >= statusUpdateRule.triggerAfterHours;
    });

    for (const order of ordersForStatusUpdate) {
      await this.updateOrderStatus(order, statusUpdateRule.targetStatus || 'CONFIRMATION_OVERDUE');
    }
  }

  private async generateOverdueSupplierAlerts(ordersAwaitingConfirmation: any[]): Promise<void> {
    // Group orders by supplier
    const supplierGroups: { [supplierId: string]: any[] } = {};
    
    ordersAwaitingConfirmation.forEach(order => {
      const supplierId = order.supplier.id;
      if (!supplierGroups[supplierId]) {
        supplierGroups[supplierId] = [];
      }
      supplierGroups[supplierId].push(order);
    });

    const overdueSuppliers: OverdueSupplierAlert[] = [];

    Object.entries(supplierGroups).forEach(([supplierId, orders]) => {
      const supplier = orders[0].supplier;
      const now = new Date();

      const overdueOrders = orders.map(order => {
        const sentDate = new Date(order.updatedAt || order.createdAt);
        const hoursOverdue = (now.getTime() - sentDate.getTime()) / (1000 * 60 * 60);

        return {
          purchaseOrderId: order.id,
          purchaseOrderNumber: order.purchaseOrderNumber,
          hoursOverdue: Math.floor(hoursOverdue),
          totalAmount: order.totalAmount,
          priority: order.priorityLevel
        };
      }).filter(order => order.hoursOverdue >= 24); // Only orders overdue by 24+ hours

      if (overdueOrders.length > 0) {
        const totalOverdueValue = overdueOrders.reduce((sum, order) => sum + order.totalAmount, 0);
        const maxHoursOverdue = Math.max(...overdueOrders.map(order => order.hoursOverdue));

        const alert: OverdueSupplierAlert = {
          supplierId,
          supplierName: supplier.supplierName,
          supplierEmail: supplier.emailAddress,
          overdueOrders,
          totalOverdueOrders: overdueOrders.length,
          totalOverdueValue,
          averageResponseTime: this.calculateSupplierAverageResponseTime(supplierId),
          responseRate: this.calculateSupplierResponseRate(supplierId),
          lastResponseDate: this.getLastSupplierResponseDate(supplierId),
          escalationRequired: maxHoursOverdue >= 48 || overdueOrders.some(order => order.priority === 'URGENT')
        };

        overdueSuppliers.push(alert);
      }
    });

    // Save overdue supplier alerts
    localStorage.setItem('saleskik-overdue-supplier-alerts', JSON.stringify(overdueSuppliers));

    // Send summary notification to management if there are critical alerts
    const criticalAlerts = overdueSuppliers.filter(alert => alert.escalationRequired);
    if (criticalAlerts.length > 0) {
      await this.sendOverdueSupplierSummary(criticalAlerts);
    }
  }

  private calculateSupplierAverageResponseTime(supplierId: string): number {
    // Calculate average response time for this supplier
    const purchaseOrders = JSON.parse(localStorage.getItem('saleskik-purchase-orders') || '[]');
    const supplierOrders = purchaseOrders.filter((order: any) => 
      order.supplier.id === supplierId && order.supplierConfirmedDate
    );

    if (supplierOrders.length === 0) return 0;

    const totalResponseTime = supplierOrders.reduce((sum: number, order: any) => {
      const sentDate = new Date(order.updatedAt || order.createdAt);
      const confirmedDate = new Date(order.supplierConfirmedDate);
      return sum + (confirmedDate.getTime() - sentDate.getTime()) / (1000 * 60 * 60);
    }, 0);

    return totalResponseTime / supplierOrders.length;
  }

  private calculateSupplierResponseRate(supplierId: string): number {
    const purchaseOrders = JSON.parse(localStorage.getItem('saleskik-purchase-orders') || '[]');
    const supplierOrders = purchaseOrders.filter((order: any) => order.supplier.id === supplierId);
    const sentOrders = supplierOrders.filter((order: any) => order.status !== 'DRAFT');
    const confirmedOrders = supplierOrders.filter((order: any) => order.supplierConfirmedDate);

    return sentOrders.length > 0 ? (confirmedOrders.length / sentOrders.length) * 100 : 100;
  }

  private getLastSupplierResponseDate(supplierId: string): Date | undefined {
    const purchaseOrders = JSON.parse(localStorage.getItem('saleskik-purchase-orders') || '[]');
    const supplierOrders = purchaseOrders
      .filter((order: any) => order.supplier.id === supplierId && order.supplierConfirmedDate)
      .sort((a: any, b: any) => new Date(b.supplierConfirmedDate).getTime() - new Date(a.supplierConfirmedDate).getTime());

    return supplierOrders.length > 0 ? new Date(supplierOrders[0].supplierConfirmedDate) : undefined;
  }

  private async sendOverdueSupplierSummary(criticalAlerts: OverdueSupplierAlert[]): Promise<void> {
    try {
      const emailService = (await import('./EmailDeliveryService')).default.getInstance();
      
      const variables = {
        companyName: 'Ecco Hardware',
        overdueSupplierCount: criticalAlerts.length,
        totalOverdueOrders: criticalAlerts.reduce((sum, alert) => sum + alert.totalOverdueOrders, 0),
        totalOverdueValue: `$${criticalAlerts.reduce((sum, alert) => sum + alert.totalOverdueValue, 0).toLocaleString('en-AU')}`,
        supplierSummary: criticalAlerts.map(alert => ({
          name: alert.supplierName,
          orders: alert.totalOverdueOrders,
          value: `$${alert.totalOverdueValue.toLocaleString('en-AU')}`,
          responseRate: `${alert.responseRate.toFixed(1)}%`
        })),
        dashboardUrl: `${window.location.origin}/inventory/purchase-orders`
      };

      const emailMessage = {
        id: Date.now().toString(),
        templateId: 'overdue-suppliers-summary',
        to: ['management@eccohardware.com.au', 'procurement@eccohardware.com.au'],
        subject: `🚨 URGENT: ${criticalAlerts.length} Suppliers Overdue on Confirmations`,
        htmlContent: this.createOverdueSummaryEmail(variables),
        textContent: this.createOverdueSummaryTextEmail(variables),
        variables,
        priority: 'URGENT' as const,
        createdAt: new Date()
      };

      await emailService.queueEmail(emailMessage);
      
      console.log(`Overdue supplier summary sent to management: ${criticalAlerts.length} critical alerts`);
    } catch (error) {
      console.error('Error sending overdue supplier summary:', error);
    }
  }

  private createOverdueSummaryEmail(variables: any): string {
    return `
      <div class="email-container">
        <div class="header" style="background: linear-gradient(135deg, #DC2626, #EF4444);">
          <h1 class="company-name">{{companyName}}</h1>
          <p class="subtitle">🚨 URGENT: Supplier Response Required</p>
        </div>
        
        <div class="content">
          <div class="alert-box alert-urgent">
            <h3>⚠️ Critical Supplier Delays</h3>
            <p>${variables.overdueSupplierCount} suppliers have not confirmed ${variables.totalOverdueOrders} purchase orders worth ${variables.totalOverdueValue}</p>
          </div>
          
          <h3>Overdue Suppliers Summary:</h3>
          ${variables.supplierSummary.map((supplier: any) => `
            <div style="margin: 15px 0; padding: 15px; background-color: #FEF2F2; border: 1px solid #FCA5A5; border-radius: 8px;">
              <h4 style="margin: 0 0 10px 0; color: #991B1B;">${supplier.name}</h4>
              <p style="margin: 5px 0; color: #B91C1C;">Orders: ${supplier.orders} • Value: ${supplier.value} • Response Rate: ${supplier.responseRate}</p>
            </div>
          `).join('')}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${variables.dashboardUrl}" class="cta-button" style="background: #DC2626;">
              Review Purchase Orders Dashboard
            </a>
          </div>
        </div>
      </div>
    `;
  }

  private createOverdueSummaryTextEmail(variables: any): string {
    return `
URGENT: Supplier Confirmation Overdue

${variables.companyName} has ${variables.overdueSupplierCount} suppliers with overdue confirmations:

Total Overdue Orders: ${variables.totalOverdueOrders}
Total Value: ${variables.totalOverdueValue}

Overdue Suppliers:
${variables.supplierSummary.map((supplier: any) => 
  `- ${supplier.name}: ${supplier.orders} orders, ${supplier.value}, ${supplier.responseRate} response rate`
).join('\n')}

Action Required: Contact suppliers or review purchase orders dashboard
Dashboard: ${variables.dashboardUrl}
    `;
  }

  private async getPurchaseOrder(purchaseOrderId: string): Promise<any> {
    const purchaseOrders = JSON.parse(localStorage.getItem('saleskik-purchase-orders') || '[]');
    return purchaseOrders.find((po: any) => po.id === purchaseOrderId);
  }

  // Public API methods
  public async manuallyResolveTimeout(eventId: string, resolutionMethod: string): Promise<boolean> {
    const event = this.timeoutEvents.find(e => e.id === eventId);
    if (!event) return false;

    event.resolved = true;
    event.resolvedAt = new Date();
    event.resolutionMethod = resolutionMethod as any;

    this.saveTimeoutEvents();
    console.log(`Timeout event manually resolved: ${eventId} via ${resolutionMethod}`);
    return true;
  }

  public getOverdueSupplierAlerts(): OverdueSupplierAlert[] {
    const alerts = localStorage.getItem('saleskik-overdue-supplier-alerts');
    return alerts ? JSON.parse(alerts) : [];
  }

  public getActiveTimeoutEvents(): SupplierTimeoutEvent[] {
    return this.timeoutEvents.filter(event => !event.resolved);
  }

  public getSupplierTimeoutHistory(supplierId: string): SupplierTimeoutEvent[] {
    return this.timeoutEvents.filter(event => event.supplierId === supplierId);
  }

  public getTimeoutStatistics(): {
    totalTimeoutEvents: number;
    activeTimeouts: number;
    resolvedTimeouts: number;
    averageResolutionTime: number;
    mostProblematicSupplier?: string;
    timeoutsByEscalationLevel: { [level: string]: number };
  } {
    const totalEvents = this.timeoutEvents.length;
    const activeEvents = this.timeoutEvents.filter(e => !e.resolved);
    const resolvedEvents = this.timeoutEvents.filter(e => e.resolved);

    const resolvedWithTimes = resolvedEvents.filter(e => e.resolvedAt && e.sentToSupplierAt);
    const averageResolutionTime = resolvedWithTimes.length > 0
      ? resolvedWithTimes.reduce((sum, event) => {
          const resolutionTime = event.resolvedAt!.getTime() - event.sentToSupplierAt.getTime();
          return sum + resolutionTime;
        }, 0) / resolvedWithTimes.length / (1000 * 60 * 60) // Convert to hours
      : 0;

    // Find most problematic supplier
    const supplierTimeoutCounts: { [supplierId: string]: { name: string; count: number } } = {};
    this.timeoutEvents.forEach(event => {
      if (!supplierTimeoutCounts[event.supplierId]) {
        supplierTimeoutCounts[event.supplierId] = { name: event.supplierName, count: 0 };
      }
      supplierTimeoutCounts[event.supplierId].count++;
    });

    const mostProblematic = Object.entries(supplierTimeoutCounts)
      .sort(([, a], [, b]) => b.count - a.count)[0];

    // Count by escalation level
    const timeoutsByLevel: { [level: string]: number } = {};
    this.timeoutEvents.forEach(event => {
      timeoutsByLevel[event.escalationLevel] = (timeoutsByLevel[event.escalationLevel] || 0) + 1;
    });

    return {
      totalTimeoutEvents: totalEvents,
      activeTimeouts: activeEvents.length,
      resolvedTimeouts: resolvedEvents.length,
      averageResolutionTime,
      mostProblematicSupplier: mostProblematic ? mostProblematic[1].name : undefined,
      timeoutsByEscalationLevel: timeoutsByLevel
    };
  }

  // Configuration management
  public updateTimeoutRule(ruleId: string, updates: Partial<SupplierTimeoutRule>): boolean {
    const ruleIndex = this.timeoutRules.findIndex(rule => rule.id === ruleId);
    if (ruleIndex === -1) return false;

    this.timeoutRules[ruleIndex] = { ...this.timeoutRules[ruleIndex], ...updates };
    localStorage.setItem('saleskik-supplier-timeout-rules', JSON.stringify(this.timeoutRules));
    
    console.log(`Timeout rule updated: ${ruleId}`);
    return true;
  }

  public addCustomTimeoutRule(rule: Omit<SupplierTimeoutRule, 'id'>): string {
    const newRule: SupplierTimeoutRule = {
      id: Date.now().toString(),
      ...rule
    };

    this.timeoutRules.push(newRule);
    localStorage.setItem('saleskik-supplier-timeout-rules', JSON.stringify(this.timeoutRules));
    
    console.log(`Custom timeout rule added: ${newRule.name}`);
    return newRule.id;
  }

  public getTimeoutRules(): SupplierTimeoutRule[] {
    return [...this.timeoutRules];
  }

  // Emergency controls
  public pauseTimeoutMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    console.log('Supplier timeout monitoring paused');
  }

  public resumeTimeoutMonitoring(): void {
    this.startTimeoutMonitoring();
    console.log('Supplier timeout monitoring resumed');
  }

  public forceTimeoutCheck(): Promise<void> {
    return this.checkForTimeouts();
  }
}

export default SupplierTimeoutMonitoringService;