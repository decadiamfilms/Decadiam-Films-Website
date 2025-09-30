// SMS Notification Service for Purchase Orders
// Handles Twilio integration, urgent alerts, delivery confirmations, and SMS preferences

export interface SMSProvider {
  type: 'TWILIO' | 'AWS_SNS' | 'MESSAGEBIRD' | 'CLICKSEND';
  config: {
    accountSid?: string;
    authToken?: string;
    fromNumber?: string;
    apiKey?: string;
    apiSecret?: string;
  };
  isActive: boolean;
  priority: number;
  costPerSMS: number;
  supportedCountries: string[];
}

export interface SMSMessage {
  id: string;
  toNumber: string;
  fromNumber: string;
  message: string;
  type: 'URGENT_ALERT' | 'DELIVERY_CONFIRMATION' | 'SUPPLIER_REMINDER' | 'APPROVAL_ALERT' | 'EMERGENCY_ESCALATION';
  purchaseOrderId?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  scheduledFor?: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  status: 'QUEUED' | 'SENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'CANCELLED';
  deliveryStatus?: {
    status: string;
    errorCode?: string;
    errorMessage?: string;
    cost?: number;
    segments?: number;
  };
  retryCount: number;
  maxRetries: number;
  providerUsed?: string;
  metadata?: {
    [key: string]: any;
  };
}

export interface SMSTemplate {
  id: string;
  name: string;
  type: SMSMessage['type'];
  template: string;
  variables: string[];
  characterLimit: number;
  isActive: boolean;
}

export interface SMSPreferences {
  userId: string;
  phoneNumber?: string;
  preferences: {
    urgentOrders: boolean;
    deliveryConfirmations: boolean;
    supplierReminders: boolean;
    approvalAlerts: boolean;
    emergencyEscalations: boolean;
  };
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    timezone: string;
  };
  emergencyBypass: boolean; // Allow urgent SMS even during quiet hours
  isActive: boolean;
}

class SMSNotificationService {
  private static instance: SMSNotificationService;
  private providers: SMSProvider[] = [];
  private smsQueue: SMSMessage[] = [];
  private templates: SMSTemplate[] = [];
  private userPreferences: Map<string, SMSPreferences> = new Map();
  private processingInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeProviders();
    this.initializeTemplates();
    this.loadUserPreferences();
    this.loadSMSQueue();
    this.startSMSProcessor();
  }

  public static getInstance(): SMSNotificationService {
    if (!SMSNotificationService.instance) {
      SMSNotificationService.instance = new SMSNotificationService();
    }
    return SMSNotificationService.instance;
  }

  private initializeProviders(): void {
    this.providers = [
      {
        type: 'TWILIO',
        config: {
          accountSid: process.env.TWILIO_ACCOUNT_SID || 'your-twilio-account-sid',
          authToken: process.env.TWILIO_AUTH_TOKEN || 'your-twilio-auth-token',
          fromNumber: process.env.TWILIO_FROM_NUMBER || '+61400000000'
        },
        isActive: true,
        priority: 3,
        costPerSMS: 0.08,
        supportedCountries: ['AU', 'US', 'GB', 'CA', 'NZ']
      },
      {
        type: 'AWS_SNS',
        config: {
          apiKey: process.env.AWS_ACCESS_KEY_ID || 'your-aws-access-key',
          apiSecret: process.env.AWS_SECRET_ACCESS_KEY || 'your-aws-secret'
        },
        isActive: true,
        priority: 2,
        costPerSMS: 0.06,
        supportedCountries: ['AU', 'US', 'GB', 'CA']
      },
      {
        type: 'CLICKSEND',
        config: {
          apiKey: process.env.CLICKSEND_API_KEY || 'your-clicksend-api-key',
          fromNumber: process.env.CLICKSEND_FROM_NUMBER || 'SalesKik'
        },
        isActive: true,
        priority: 1,
        costPerSMS: 0.12,
        supportedCountries: ['AU', 'NZ']
      }
    ];

    console.log('SMS providers initialized:', this.providers.length);
  }

  private initializeTemplates(): void {
    this.templates = [
      {
        id: 'urgent-order-alert',
        name: 'Urgent Order Alert',
        type: 'URGENT_ALERT',
        template: '🚨 URGENT: PO {{poNumber}} for {{supplier}} (${{amount}}) requires immediate attention. Delivery needed by {{deliveryDate}}. Contact {{contactPerson}} {{contactPhone}}',
        variables: ['poNumber', 'supplier', 'amount', 'deliveryDate', 'contactPerson', 'contactPhone'],
        characterLimit: 160,
        isActive: true
      },
      {
        id: 'delivery-confirmation',
        name: 'Delivery Confirmation',
        type: 'DELIVERY_CONFIRMATION',
        template: '✅ DELIVERY: {{supplier}} delivered PO {{poNumber}} (${{amount}}). Received by {{receivedBy}} at {{deliveryTime}}. {{itemCount}} items confirmed.',
        variables: ['supplier', 'poNumber', 'amount', 'receivedBy', 'deliveryTime', 'itemCount'],
        characterLimit: 160,
        isActive: true
      },
      {
        id: 'supplier-reminder',
        name: 'Supplier Reminder',
        type: 'SUPPLIER_REMINDER',
        template: '⏰ REMINDER: Please confirm PO {{poNumber}} (${{amount}}). {{hoursOverdue}}h overdue. Confirm at {{confirmUrl}} or call {{contactPhone}}',
        variables: ['poNumber', 'amount', 'hoursOverdue', 'confirmUrl', 'contactPhone'],
        characterLimit: 160,
        isActive: true
      },
      {
        id: 'approval-alert',
        name: 'Approval Alert',
        type: 'APPROVAL_ALERT',
        template: '📋 APPROVAL: PO {{poNumber}} (${{amount}}) requires your approval. {{triggerRules}}. Review at {{approvalUrl}}',
        variables: ['poNumber', 'amount', 'triggerRules', 'approvalUrl'],
        characterLimit: 160,
        isActive: true
      },
      {
        id: 'emergency-escalation',
        name: 'Emergency Escalation',
        type: 'EMERGENCY_ESCALATION',
        template: '🚨 CRITICAL: {{emergencyType}} - PO {{poNumber}}. {{message}}. IMMEDIATE ACTION REQUIRED. Call {{emergencyContact}}',
        variables: ['emergencyType', 'poNumber', 'message', 'emergencyContact'],
        characterLimit: 160,
        isActive: true
      }
    ];
  }

  private loadUserPreferences(): void {
    const saved = localStorage.getItem('saleskik-sms-preferences');
    if (saved) {
      try {
        const preferences = JSON.parse(saved);
        preferences.forEach((pref: SMSPreferences) => {
          this.userPreferences.set(pref.userId, pref);
        });
      } catch (error) {
        console.error('Error loading SMS preferences:', error);
      }
    }

    // Create default preferences for current user
    if (!this.userPreferences.has('current-user')) {
      this.createDefaultPreferences('current-user');
    }
  }

  private createDefaultPreferences(userId: string): void {
    const defaultPrefs: SMSPreferences = {
      userId,
      phoneNumber: '+61400000000', // Default Australian mobile
      preferences: {
        urgentOrders: true,
        deliveryConfirmations: false,
        supplierReminders: false,
        approvalAlerts: true,
        emergencyEscalations: true
      },
      quietHours: {
        enabled: true,
        startTime: '18:00',
        endTime: '08:00',
        timezone: 'Australia/Sydney'
      },
      emergencyBypass: true,
      isActive: false // Disabled by default until user opts in
    };

    this.userPreferences.set(userId, defaultPrefs);
    this.saveUserPreferences();
  }

  private loadSMSQueue(): void {
    const saved = localStorage.getItem('saleskik-sms-queue');
    if (saved) {
      try {
        this.smsQueue = JSON.parse(saved).map((sms: any) => ({
          ...sms,
          scheduledFor: sms.scheduledFor ? new Date(sms.scheduledFor) : undefined,
          sentAt: sms.sentAt ? new Date(sms.sentAt) : undefined,
          deliveredAt: sms.deliveredAt ? new Date(sms.deliveredAt) : undefined
        }));
      } catch (error) {
        console.error('Error loading SMS queue:', error);
      }
    }
  }

  private startSMSProcessor(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }

    // Process SMS queue every 30 seconds
    this.processingInterval = setInterval(() => {
      this.processSMSQueue();
    }, 30000);

    // Process immediately
    this.processSMSQueue();
  }

  private async processSMSQueue(): Promise<void> {
    const now = new Date();
    const readyToSend = this.smsQueue.filter(sms => 
      sms.status === 'QUEUED' && 
      (!sms.scheduledFor || sms.scheduledFor <= now)
    );

    if (readyToSend.length === 0) return;

    console.log(`Processing ${readyToSend.length} SMS messages`);

    // Process up to 5 SMS per batch to avoid rate limits
    const batch = readyToSend.slice(0, 5);
    
    for (const sms of batch) {
      await this.sendSMS(sms);
    }

    this.saveSMSQueue();
  }

  private async sendSMS(sms: SMSMessage): Promise<void> {
    sms.status = 'SENDING';
    sms.retryCount = (sms.retryCount || 0) + 1;

    try {
      // Get active provider in priority order
      const provider = this.providers
        .filter(p => p.isActive)
        .sort((a, b) => b.priority - a.priority)[0];

      if (!provider) {
        throw new Error('No active SMS providers available');
      }

      // Send via provider
      const result = await this.sendViaSMSProvider(sms, provider);
      
      if (result.success) {
        sms.status = 'SENT';
        sms.sentAt = new Date();
        sms.providerUsed = provider.type;
        sms.deliveryStatus = result.deliveryStatus;
        
        console.log(`SMS sent successfully via ${provider.type}: ${sms.id}`);
      } else {
        throw new Error(result.error || 'SMS sending failed');
      }
    } catch (error) {
      console.error('SMS sending error:', error);
      
      if (sms.retryCount >= sms.maxRetries) {
        sms.status = 'FAILED';
        sms.deliveryStatus = {
          status: 'failed',
          errorMessage: error.message
        };
      } else {
        // Schedule retry with exponential backoff
        const retryDelay = Math.pow(2, sms.retryCount) * 60 * 1000; // 2^retry minutes
        sms.scheduledFor = new Date(Date.now() + retryDelay);
        sms.status = 'QUEUED';
      }
    }
  }

  private async sendViaSMSProvider(sms: SMSMessage, provider: SMSProvider): Promise<{
    success: boolean;
    deliveryStatus?: any;
    error?: string;
  }> {
    switch (provider.type) {
      case 'TWILIO':
        return await this.sendViaTwilio(sms, provider);
      case 'AWS_SNS':
        return await this.sendViaAWSSNS(sms, provider);
      case 'CLICKSEND':
        return await this.sendViaClickSend(sms, provider);
      default:
        return { success: false, error: 'Unsupported SMS provider' };
    }
  }

  private async sendViaTwilio(sms: SMSMessage, provider: SMSProvider): Promise<any> {
    try {
      // In production, use actual Twilio API
      const response = await fetch('https://api.twilio.com/2010-04-01/Accounts/' + provider.config.accountSid + '/Messages.json', {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(provider.config.accountSid + ':' + provider.config.authToken),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          To: sms.toNumber,
          From: provider.config.fromNumber!,
          Body: sms.message
        })
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          deliveryStatus: {
            status: data.status,
            cost: provider.costPerSMS,
            segments: Math.ceil(sms.message.length / 160),
            sid: data.sid
          }
        };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message };
      }
    } catch (error) {
      console.log('Twilio SMS simulation:', { to: sms.toNumber, message: sms.message });
      
      // Simulate successful sending for demo
      return {
        success: Math.random() > 0.1, // 90% success rate
        deliveryStatus: {
          status: 'sent',
          cost: provider.costPerSMS,
          segments: Math.ceil(sms.message.length / 160)
        }
      };
    }
  }

  private async sendViaAWSSNS(sms: SMSMessage, provider: SMSProvider): Promise<any> {
    // AWS SNS implementation simulation
    console.log('AWS SNS SMS simulation:', { to: sms.toNumber, message: sms.message });
    
    return {
      success: Math.random() > 0.05, // 95% success rate
      deliveryStatus: {
        status: 'sent',
        cost: provider.costPerSMS
      }
    };
  }

  private async sendViaClickSend(sms: SMSMessage, provider: SMSProvider): Promise<any> {
    // ClickSend implementation simulation
    console.log('ClickSend SMS simulation:', { to: sms.toNumber, message: sms.message });
    
    return {
      success: Math.random() > 0.15, // 85% success rate
      deliveryStatus: {
        status: 'sent',
        cost: provider.costPerSMS
      }
    };
  }

  // Public API methods for purchase order events
  public async sendUrgentOrderAlert(purchaseOrder: any, recipients: string[]): Promise<boolean> {
    const template = this.templates.find(t => t.id === 'urgent-order-alert');
    if (!template) return false;

    const variables = {
      poNumber: purchaseOrder.purchaseOrderNumber,
      supplier: purchaseOrder.supplier.supplierName,
      amount: purchaseOrder.totalAmount.toLocaleString('en-AU'),
      deliveryDate: purchaseOrder.expectedDeliveryDate ? 
        new Date(purchaseOrder.expectedDeliveryDate).toLocaleDateString() : 'ASAP',
      contactPerson: 'Adam Smith',
      contactPhone: '+61 2 9876 5432'
    };

    let sentCount = 0;

    for (const phoneNumber of recipients) {
      const userPrefs = this.getUserPreferencesByPhone(phoneNumber);
      
      if (userPrefs && userPrefs.isActive && userPrefs.preferences.urgentOrders) {
        if (await this.isQuietHours(userPrefs) && !userPrefs.emergencyBypass) {
          console.log(`Skipping SMS to ${phoneNumber} due to quiet hours`);
          continue;
        }

        const message = this.renderTemplate(template.template, variables);
        await this.queueSMS({
          toNumber: phoneNumber,
          message,
          type: 'URGENT_ALERT',
          purchaseOrderId: purchaseOrder.id,
          priority: 'URGENT'
        });
        
        sentCount++;
      }
    }

    console.log(`Urgent order SMS alerts sent to ${sentCount} recipients`);
    return sentCount > 0;
  }

  public async sendDeliveryConfirmation(purchaseOrder: any, receiptData: any): Promise<boolean> {
    const template = this.templates.find(t => t.id === 'delivery-confirmation');
    if (!template) return false;

    const variables = {
      supplier: purchaseOrder.supplier.supplierName,
      poNumber: purchaseOrder.purchaseOrderNumber,
      amount: purchaseOrder.totalAmount.toLocaleString('en-AU'),
      receivedBy: receiptData.receivedBy,
      deliveryTime: new Date().toLocaleTimeString(),
      itemCount: purchaseOrder.lineItems.length
    };

    // Send to procurement team
    const recipients = this.getRecipientsByRole(['PROCUREMENT_MANAGER', 'OPERATIONS_MANAGER']);
    let sentCount = 0;

    for (const phoneNumber of recipients) {
      const userPrefs = this.getUserPreferencesByPhone(phoneNumber);
      
      if (userPrefs && userPrefs.isActive && userPrefs.preferences.deliveryConfirmations) {
        const message = this.renderTemplate(template.template, variables);
        await this.queueSMS({
          toNumber: phoneNumber,
          message,
          type: 'DELIVERY_CONFIRMATION',
          purchaseOrderId: purchaseOrder.id,
          priority: 'MEDIUM'
        });
        
        sentCount++;
      }
    }

    return sentCount > 0;
  }

  public async sendSupplierReminder(purchaseOrder: any, hoursOverdue: number): Promise<boolean> {
    const template = this.templates.find(t => t.id === 'supplier-reminder');
    if (!template) return false;

    // Get supplier phone number
    const supplierPhone = purchaseOrder.supplier.phoneNumber;
    if (!supplierPhone) return false;

    const variables = {
      poNumber: purchaseOrder.purchaseOrderNumber,
      amount: purchaseOrder.totalAmount.toLocaleString('en-AU'),
      hoursOverdue: hoursOverdue.toString(),
      confirmUrl: `${window.location.origin}/supplier/confirm/${purchaseOrder.id}`,
      contactPhone: '+61 2 9876 5432'
    };

    const message = this.renderTemplate(template.template, variables);
    
    await this.queueSMS({
      toNumber: supplierPhone,
      message,
      type: 'SUPPLIER_REMINDER',
      purchaseOrderId: purchaseOrder.id,
      priority: hoursOverdue > 48 ? 'HIGH' : 'MEDIUM'
    });

    // Also notify internal team
    const internalRecipients = this.getRecipientsByRole(['PROCUREMENT_MANAGER']);
    for (const phoneNumber of internalRecipients) {
      await this.queueSMS({
        toNumber: phoneNumber,
        message: `Supplier reminder sent: ${purchaseOrder.supplier.supplierName} - ${purchaseOrder.purchaseOrderNumber} (${hoursOverdue}h overdue)`,
        type: 'SUPPLIER_REMINDER',
        purchaseOrderId: purchaseOrder.id,
        priority: 'MEDIUM'
      });
    }

    return true;
  }

  public async sendApprovalAlert(purchaseOrder: any, approverPhones: string[]): Promise<boolean> {
    const template = this.templates.find(t => t.id === 'approval-alert');
    if (!template) return false;

    const variables = {
      poNumber: purchaseOrder.purchaseOrderNumber,
      amount: purchaseOrder.totalAmount.toLocaleString('en-AU'),
      triggerRules: 'High value order',
      approvalUrl: `${window.location.origin}/inventory/purchase-orders?approvals=true`
    };

    let sentCount = 0;

    for (const phoneNumber of approverPhones) {
      const userPrefs = this.getUserPreferencesByPhone(phoneNumber);
      
      if (userPrefs && userPrefs.isActive && userPrefs.preferences.approvalAlerts) {
        const message = this.renderTemplate(template.template, variables);
        await this.queueSMS({
          toNumber: phoneNumber,
          message,
          type: 'APPROVAL_ALERT',
          purchaseOrderId: purchaseOrder.id,
          priority: 'HIGH'
        });
        
        sentCount++;
      }
    }

    return sentCount > 0;
  }

  public async sendEmergencyEscalation(
    emergencyType: string,
    message: string,
    purchaseOrderId?: string
  ): Promise<boolean> {
    const template = this.templates.find(t => t.id === 'emergency-escalation');
    if (!template) return false;

    const variables = {
      emergencyType,
      poNumber: purchaseOrderId ? await this.getPurchaseOrderNumber(purchaseOrderId) : 'SYSTEM',
      message,
      emergencyContact: '+61 2 9876 5432'
    };

    // Send to all users with emergency escalation enabled
    const emergencyRecipients = Array.from(this.userPreferences.values())
      .filter(prefs => prefs.isActive && prefs.preferences.emergencyEscalations)
      .map(prefs => prefs.phoneNumber!)
      .filter(phone => phone);

    let sentCount = 0;

    for (const phoneNumber of emergencyRecipients) {
      const smsMessage = this.renderTemplate(template.template, variables);
      await this.queueSMS({
        toNumber: phoneNumber,
        message: smsMessage,
        type: 'EMERGENCY_ESCALATION',
        purchaseOrderId,
        priority: 'URGENT'
      });
      
      sentCount++;
    }

    console.log(`Emergency escalation SMS sent to ${sentCount} recipients`);
    return sentCount > 0;
  }

  // Queue SMS for sending
  private async queueSMS(smsData: {
    toNumber: string;
    message: string;
    type: SMSMessage['type'];
    purchaseOrderId?: string;
    priority: SMSMessage['priority'];
    scheduledFor?: Date;
  }): Promise<string> {
    const sms: SMSMessage = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      fromNumber: this.providers[0].config.fromNumber || '+61400000000',
      retryCount: 0,
      maxRetries: smsData.priority === 'URGENT' ? 5 : 3,
      status: 'QUEUED',
      ...smsData
    };

    this.smsQueue.push(sms);
    this.saveSMSQueue();

    console.log(`SMS queued: ${sms.type} to ${sms.toNumber}`);
    return sms.id;
  }

  // Helper methods
  private renderTemplate(template: string, variables: { [key: string]: any }): string {
    let rendered = template;
    
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, String(value || ''));
    });

    return rendered;
  }

  private getUserPreferencesByPhone(phoneNumber: string): SMSPreferences | null {
    for (const prefs of this.userPreferences.values()) {
      if (prefs.phoneNumber === phoneNumber) {
        return prefs;
      }
    }
    return null;
  }

  private async isQuietHours(userPrefs: SMSPreferences): Promise<boolean> {
    if (!userPrefs.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = now.toTimeString().substring(0, 5); // HH:MM
    
    const start = userPrefs.quietHours.startTime;
    const end = userPrefs.quietHours.endTime;

    // Handle overnight quiet hours (e.g., 18:00 to 08:00)
    if (start > end) {
      return currentTime >= start || currentTime <= end;
    } else {
      return currentTime >= start && currentTime <= end;
    }
  }

  private getRecipientsByRole(roles: string[]): string[] {
    // Map roles to phone numbers (in production, this would query user database)
    const rolePhoneMap: { [role: string]: string[] } = {
      'PROCUREMENT_MANAGER': ['+61400111111'],
      'OPERATIONS_MANAGER': ['+61400222222'],
      'WAREHOUSE_MANAGER': ['+61400333333'],
      'CEO': ['+61400444444'],
      'EMERGENCY_CONTACT': ['+61400555555']
    };

    const recipients: string[] = [];
    roles.forEach(role => {
      const phones = rolePhoneMap[role] || [];
      recipients.push(...phones);
    });

    return [...new Set(recipients)]; // Remove duplicates
  }

  private async getPurchaseOrderNumber(purchaseOrderId: string): Promise<string> {
    const orders = JSON.parse(localStorage.getItem('saleskik-purchase-orders') || '[]');
    const order = orders.find((o: any) => o.id === purchaseOrderId);
    return order?.purchaseOrderNumber || purchaseOrderId;
  }

  // User preference management
  public updateUserSMSPreferences(userId: string, preferences: Partial<SMSPreferences>): void {
    const existing = this.userPreferences.get(userId) || this.createDefaultPreferences(userId);
    const updated = { ...existing, ...preferences };
    this.userPreferences.set(userId, updated);
    this.saveUserPreferences();
  }

  public getUserSMSPreferences(userId: string): SMSPreferences | null {
    return this.userPreferences.get(userId) || null;
  }

  // Statistics and monitoring
  public getSMSStatistics(): {
    totalSent: number;
    totalFailed: number;
    successRate: number;
    avgDeliveryTime: number;
    costToday: number;
    queueLength: number;
    providerPerformance: { [provider: string]: { sent: number; failed: number; cost: number } };
  } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySMS = this.smsQueue.filter(sms => 
      sms.sentAt && sms.sentAt >= today
    );

    const totalSent = this.smsQueue.filter(sms => sms.status === 'SENT').length;
    const totalFailed = this.smsQueue.filter(sms => sms.status === 'FAILED').length;
    const successRate = (totalSent + totalFailed) > 0 ? (totalSent / (totalSent + totalFailed)) * 100 : 100;

    const deliveredSMS = this.smsQueue.filter(sms => sms.sentAt && sms.deliveredAt);
    const avgDeliveryTime = deliveredSMS.length > 0
      ? deliveredSMS.reduce((sum, sms) => {
          const deliveryTime = sms.deliveredAt!.getTime() - sms.sentAt!.getTime();
          return sum + deliveryTime;
        }, 0) / deliveredSMS.length / 1000 / 60 // Convert to minutes
      : 0;

    const costToday = todaySMS.reduce((sum, sms) => 
      sum + (sms.deliveryStatus?.cost || 0), 0
    );

    // Provider performance analysis
    const providerPerformance: { [provider: string]: { sent: number; failed: number; cost: number } } = {};
    
    this.smsQueue.forEach(sms => {
      if (sms.providerUsed) {
        if (!providerPerformance[sms.providerUsed]) {
          providerPerformance[sms.providerUsed] = { sent: 0, failed: 0, cost: 0 };
        }
        
        if (sms.status === 'SENT') {
          providerPerformance[sms.providerUsed].sent++;
          providerPerformance[sms.providerUsed].cost += sms.deliveryStatus?.cost || 0;
        } else if (sms.status === 'FAILED') {
          providerPerformance[sms.providerUsed].failed++;
        }
      }
    });

    return {
      totalSent,
      totalFailed,
      successRate,
      avgDeliveryTime,
      costToday,
      queueLength: this.smsQueue.filter(sms => sms.status === 'QUEUED').length,
      providerPerformance
    };
  }

  // Storage methods
  private saveSMSQueue(): void {
    localStorage.setItem('saleskik-sms-queue', JSON.stringify(this.smsQueue));
  }

  private saveUserPreferences(): void {
    const prefsArray = Array.from(this.userPreferences.values());
    localStorage.setItem('saleskik-sms-preferences', JSON.stringify(prefsArray));
  }

  // Emergency controls
  public pauseSMSDelivery(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    console.log('SMS delivery paused');
  }

  public resumeSMSDelivery(): void {
    this.startSMSProcessor();
    console.log('SMS delivery resumed');
  }

  public cancelQueuedSMS(smsId: string): boolean {
    const sms = this.smsQueue.find(s => s.id === smsId);
    if (sms && sms.status === 'QUEUED') {
      sms.status = 'CANCELLED';
      this.saveSMSQueue();
      return true;
    }
    return false;
  }
}

export default SMSNotificationService;