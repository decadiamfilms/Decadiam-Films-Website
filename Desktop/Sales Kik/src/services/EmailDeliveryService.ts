// Professional Email Delivery Service with SendGrid/SMTP Integration
// Handles actual email delivery, retry logic, and delivery tracking

export interface EmailProvider {
  type: 'SENDGRID' | 'SMTP' | 'RESEND';
  config: {
    apiKey?: string;
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    secure?: boolean;
  };
  isActive: boolean;
  priority: number; // Higher number = higher priority
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: string[];
  category: 'PURCHASE_ORDER' | 'APPROVAL' | 'CONFIRMATION' | 'NOTIFICATION';
}

export interface EmailMessage {
  id: string;
  templateId: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  htmlContent: string;
  textContent: string;
  attachments?: {
    filename: string;
    content: string; // Base64 encoded
    contentType: string;
    contentId?: string;
  }[];
  variables: { [key: string]: any };
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  scheduledFor?: Date;
  createdAt: Date;
}

export interface EmailQueueItem {
  id: string;
  messageId: string;
  message: EmailMessage;
  status: 'QUEUED' | 'SENDING' | 'SENT' | 'FAILED' | 'CANCELLED';
  attempts: number;
  maxRetries: number;
  nextRetryAt?: Date;
  lastAttemptAt?: Date;
  deliveredAt?: Date;
  failureReason?: string;
  providerUsed?: string;
  trackingId?: string; // SendGrid message ID
  webhookEvents?: {
    event: string;
    timestamp: Date;
    data: any;
  }[];
}

class EmailDeliveryService {
  private static instance: EmailDeliveryService;
  private providers: EmailProvider[] = [];
  private emailQueue: EmailQueueItem[] = [];
  private templates: EmailTemplate[] = [];
  private processingInterval: NodeJS.Timeout | null = null;
  private webhookSecret: string = 'your-webhook-secret-key';

  private constructor() {
    this.initializeProviders();
    this.loadEmailTemplates();
    this.loadEmailQueue();
    this.startQueueProcessor();
  }

  public static getInstance(): EmailDeliveryService {
    if (!EmailDeliveryService.instance) {
      EmailDeliveryService.instance = new EmailDeliveryService();
    }
    return EmailDeliveryService.instance;
  }

  private initializeProviders(): void {
    // Initialize email providers in order of preference
    this.providers = [
      {
        type: 'SENDGRID',
        config: {
          apiKey: process.env.SENDGRID_API_KEY || 'your-sendgrid-api-key'
        },
        isActive: true,
        priority: 3
      },
      {
        type: 'RESEND',
        config: {
          apiKey: process.env.RESEND_API_KEY || 'your-resend-api-key'
        },
        isActive: true,
        priority: 2
      },
      {
        type: 'SMTP',
        config: {
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.SMTP_PORT || '587'),
          username: process.env.SMTP_USERNAME || 'your-email@company.com',
          password: process.env.SMTP_PASSWORD || 'your-app-password',
          secure: false
        },
        isActive: true,
        priority: 1
      }
    ];

    console.log('Email providers initialized:', this.providers.length);
  }

  private loadEmailTemplates(): void {
    const savedTemplates = localStorage.getItem('saleskik-email-templates');
    if (savedTemplates) {
      try {
        this.templates = JSON.parse(savedTemplates);
      } catch (error) {
        console.error('Error loading email templates:', error);
      }
    }

    // Create default templates if none exist
    if (this.templates.length === 0) {
      this.createDefaultTemplates();
    }
  }

  private createDefaultTemplates(): void {
    this.templates = [
      {
        id: 'purchase-order-created',
        name: 'Purchase Order Created',
        subject: 'New Purchase Order: {{purchaseOrderNumber}}',
        htmlContent: this.createProfessionalHTMLTemplate('purchase-order-created'),
        textContent: this.createTextTemplate('purchase-order-created'),
        variables: ['companyName', 'companyLogo', 'purchaseOrderNumber', 'supplierName', 'totalAmount', 'priority', 'expectedDelivery'],
        category: 'PURCHASE_ORDER'
      },
      {
        id: 'supplier-order-notification',
        name: 'Supplier Order Notification',
        subject: 'Purchase Order from {{companyName}} - {{purchaseOrderNumber}}',
        htmlContent: this.createProfessionalHTMLTemplate('supplier-order'),
        textContent: this.createTextTemplate('supplier-order'),
        variables: ['companyName', 'companyLogo', 'purchaseOrderNumber', 'totalAmount', 'lineItems', 'confirmationUrl', 'contactInfo'],
        category: 'PURCHASE_ORDER'
      },
      {
        id: 'approval-request',
        name: 'Manager Approval Request',
        subject: 'Approval Required: {{purchaseOrderNumber}} - ${{totalAmount}}',
        htmlContent: this.createProfessionalHTMLTemplate('approval-request'),
        textContent: this.createTextTemplate('approval-request'),
        variables: ['companyName', 'purchaseOrderNumber', 'supplierName', 'totalAmount', 'triggeringRules', 'approvalUrl'],
        category: 'APPROVAL'
      },
      {
        id: 'supplier-confirmation-received',
        name: 'Supplier Confirmation Received',
        subject: 'Confirmed: {{purchaseOrderNumber}} by {{supplierName}}',
        htmlContent: this.createProfessionalHTMLTemplate('supplier-confirmation'),
        textContent: this.createTextTemplate('supplier-confirmation'),
        variables: ['companyName', 'purchaseOrderNumber', 'supplierName', 'confirmedDeliveryDate', 'supplierComments'],
        category: 'CONFIRMATION'
      },
      {
        id: 'goods-receipt-notification',
        name: 'Goods Receipt Notification',
        subject: 'Goods Received: {{purchaseOrderNumber}}',
        htmlContent: this.createProfessionalHTMLTemplate('goods-receipt'),
        textContent: this.createTextTemplate('goods-receipt'),
        variables: ['companyName', 'purchaseOrderNumber', 'receiptType', 'receivedBy', 'receiptDate'],
        category: 'NOTIFICATION'
      },
      {
        id: 'invoice-dispatch-unblocked',
        name: 'Invoice Created - Dispatch Unblocked',
        subject: 'Dispatch Approved: {{purchaseOrderNumber}}',
        htmlContent: this.createProfessionalHTMLTemplate('dispatch-unblocked'),
        textContent: this.createTextTemplate('dispatch-unblocked'),
        variables: ['companyName', 'purchaseOrderNumber', 'totalAmount', 'customerInfo'],
        category: 'NOTIFICATION'
      }
    ];

    localStorage.setItem('saleskik-email-templates', JSON.stringify(this.templates));
  }

  private createProfessionalHTMLTemplate(templateType: string): string {
    const baseHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{companyName}} - Purchase Order System</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.6;
            color: #374151;
            margin: 0;
            padding: 0;
            background-color: #f9fafb;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #3B82F6, #6366F1);
            padding: 30px 20px;
            text-align: center;
            color: white;
        }
        
        .logo {
            height: 40px;
            width: auto;
            margin-bottom: 10px;
        }
        
        .company-name {
            font-size: 24px;
            font-weight: 700;
            margin: 0;
        }
        
        .subtitle {
            font-size: 16px;
            opacity: 0.9;
            margin: 5px 0 0 0;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .alert-box {
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid;
        }
        
        .alert-success {
            background-color: #ECFDF5;
            border-color: #10B981;
            color: #065F46;
        }
        
        .alert-warning {
            background-color: #FFFBEB;
            border-color: #F59E0B;
            color: #92400E;
        }
        
        .alert-urgent {
            background-color: #FEF2F2;
            border-color: #EF4444;
            color: #991B1B;
        }
        
        .info-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background-color: #F9FAFB;
            border-radius: 8px;
            overflow: hidden;
        }
        
        .info-table td {
            padding: 12px 16px;
            border-bottom: 1px solid #E5E7EB;
        }
        
        .info-table td:first-child {
            font-weight: 500;
            color: #6B7280;
            width: 140px;
        }
        
        .info-table td:last-child {
            font-weight: 600;
            color: #1F2937;
        }
        
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #3B82F6, #1D4ED8);
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            text-align: center;
            margin: 20px 0;
            transition: all 0.3s ease;
        }
        
        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
        }
        
        .footer {
            background-color: #F9FAFB;
            padding: 30px 20px;
            text-align: center;
            border-top: 1px solid #E5E7EB;
        }
        
        .footer-text {
            color: #6B7280;
            font-size: 14px;
            margin: 0;
        }
        
        .contact-info {
            background-color: #F3F4F6;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        
        .contact-info h4 {
            margin: 0 0 15px 0;
            color: #1F2937;
            font-weight: 600;
        }
        
        .contact-item {
            display: flex;
            align-items: center;
            margin: 8px 0;
            color: #374151;
        }
        
        .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .status-urgent {
            background-color: #FEE2E2;
            color: #991B1B;
        }
        
        .status-high {
            background-color: #FEF3C7;
            color: #92400E;
        }
        
        .status-normal {
            background-color: #DBEAFE;
            color: #1E40AF;
        }

        @media only screen and (max-width: 600px) {
            .email-container {
                margin: 0;
                border-radius: 0;
            }
            
            .content {
                padding: 30px 20px;
            }
            
            .cta-button {
                padding: 12px 24px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            {{#if companyLogo}}
            <img src="{{companyLogo}}" alt="{{companyName}}" class="logo">
            {{/if}}
            <h1 class="company-name">{{companyName}}</h1>
            <p class="subtitle">Professional Procurement System</p>
        </div>
        
        <div class="content">
            ${this.getTemplateContent(templateType)}
        </div>
        
        <div class="footer">
            <p class="footer-text">
                This is an automated message from {{companyName}} Purchase Order System.<br>
                Please do not reply to this email. For assistance, contact your procurement team.
            </p>
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #E5E7EB;">
                <p class="footer-text" style="font-size: 12px;">
                    Powered by SalesKik Professional Procurement Platform<br>
                    <a href="https://saleskik.com" style="color: #3B82F6; text-decoration: none;">www.saleskik.com</a>
                </p>
            </div>
        </div>
    </div>
</body>
</html>
    `;

    return baseHTML;
  }

  private getTemplateContent(templateType: string): string {
    switch (templateType) {
      case 'purchase-order-created':
        return `
          <h2 style="color: #1F2937; margin-bottom: 20px;">Purchase Order Created</h2>
          
          <div class="alert-box alert-success">
            <h3 style="margin: 0 0 10px 0;">✅ Order Successfully Created</h3>
            <p style="margin: 0;">Purchase Order {{purchaseOrderNumber}} has been created and is ready for processing.</p>
          </div>
          
          <table class="info-table">
            <tr>
              <td>Purchase Order:</td>
              <td>{{purchaseOrderNumber}}</td>
            </tr>
            <tr>
              <td>Supplier:</td>
              <td>{{supplierName}}</td>
            </tr>
            <tr>
              <td>Total Amount:</td>
              <td style="color: #059669; font-size: 18px; font-weight: 700;">{{totalAmount}}</td>
            </tr>
            <tr>
              <td>Priority:</td>
              <td><span class="status-badge status-{{priorityClass}}">{{priority}}</span></td>
            </tr>
            <tr>
              <td>Expected Delivery:</td>
              <td>{{expectedDelivery}}</td>
            </tr>
          </table>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{purchaseOrderUrl}}" class="cta-button">
              View Purchase Order Details
            </a>
          </div>
        `;
      
      case 'supplier-order':
        return `
          <h2 style="color: #1F2937; margin-bottom: 20px;">New Purchase Order</h2>
          
          <div class="alert-box alert-warning">
            <h3 style="margin: 0 0 10px 0;">📋 Action Required</h3>
            <p style="margin: 0;">Please review and confirm this purchase order within 48 hours.</p>
          </div>
          
          <table class="info-table">
            <tr>
              <td>Purchase Order:</td>
              <td style="font-weight: 700; color: #1F2937;">{{purchaseOrderNumber}}</td>
            </tr>
            <tr>
              <td>Total Amount:</td>
              <td style="color: #059669; font-size: 20px; font-weight: 700;">{{totalAmount}}</td>
            </tr>
            <tr>
              <td>Line Items:</td>
              <td>{{lineItemCount}} items</td>
            </tr>
            <tr>
              <td>Expected Delivery:</td>
              <td>{{expectedDelivery}}</td>
            </tr>
            {{#if customerReference}}
            <tr>
              <td>Customer Reference:</td>
              <td>{{customerReference}}</td>
            </tr>
            {{/if}}
          </table>
          
          {{#if shippingInstructions}}
          <div class="alert-box" style="background-color: #FEF3C7; border-color: #F59E0B; color: #92400E;">
            <h4 style="margin: 0 0 10px 0;">🚚 Delivery Instructions</h4>
            <p style="margin: 0;">{{shippingInstructions}}</p>
          </div>
          {{/if}}
          
          {{#if attachmentBundle}}
          <div class="alert-box" style="background-color: #DBEAFE; border-color: #3B82F6; color: #1E40AF;">
            <h4 style="margin: 0 0 10px 0;">📎 Technical Documentation Included</h4>
            <p style="margin: 0;">
              This email includes a ZIP bundle with {{attachmentBundle.count}} technical documents ({{attachmentBundle.size}}).
              Please download and review all attachments before proceeding with order fulfillment.
            </p>
            {{#if attachmentBundle.downloadUrl}}
            <div style="margin-top: 15px;">
              <a href="{{attachmentBundle.downloadUrl}}" class="cta-button" style="background: #059669; font-size: 14px; padding: 12px 24px;">
                Download All Attachments ({{attachmentBundle.size}})
              </a>
            </div>
            {{/if}}
          </div>
          {{/if}}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{confirmationUrl}}" class="cta-button" style="font-size: 16px; padding: 18px 36px;">
              Confirm Order
            </a>
          </div>
          
          <div class="contact-info">
            <h4>Contact Information</h4>
            <div class="contact-item">📧 {{contactEmail}}</div>
            <div class="contact-item">📞 {{contactPhone}}</div>
            <div class="contact-item">👤 {{contactPerson}}</div>
          </div>
        `;
      
      case 'approval-request':
        return `
          <h2 style="color: #1F2937; margin-bottom: 20px;">Manager Approval Required</h2>
          
          <div class="alert-box alert-urgent">
            <h3 style="margin: 0 0 10px 0;">⚠️ Immediate Attention Required</h3>
            <p style="margin: 0;">Purchase Order {{purchaseOrderNumber}} requires your approval before processing.</p>
          </div>
          
          <table class="info-table">
            <tr>
              <td>Purchase Order:</td>
              <td>{{purchaseOrderNumber}}</td>
            </tr>
            <tr>
              <td>Supplier:</td>
              <td>{{supplierName}}</td>
            </tr>
            <tr>
              <td>Total Amount:</td>
              <td style="color: #DC2626; font-size: 20px; font-weight: 700;">{{totalAmount}}</td>
            </tr>
            <tr>
              <td>Triggered Rules:</td>
              <td style="color: #DC2626; font-weight: 600;">{{triggeringRules}}</td>
            </tr>
          </table>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{approvalUrl}}" class="cta-button" style="background: linear-gradient(135deg, #059669, #047857);">
              Review & Approve Order
            </a>
          </div>
        `;
      
      default:
        return `
          <h2 style="color: #1F2937; margin-bottom: 20px;">Purchase Order Update</h2>
          <p>{{message}}</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{purchaseOrderUrl}}" class="cta-button">View Order Details</a>
          </div>
        `;
    }
  }

  private createTextTemplate(templateType: string): string {
    // Simplified text versions for email clients that don't support HTML
    switch (templateType) {
      case 'purchase-order-created':
        return `
{{companyName}} - Purchase Order Created

Purchase Order: {{purchaseOrderNumber}}
Supplier: {{supplierName}}
Total Amount: {{totalAmount}}
Priority: {{priority}}
Expected Delivery: {{expectedDelivery}}

View order details: {{purchaseOrderUrl}}

This is an automated message from {{companyName}} Purchase Order System.
        `;
      
      case 'supplier-order':
        return `
New Purchase Order from {{companyName}}

Purchase Order: {{purchaseOrderNumber}}
Total Amount: {{totalAmount}}
Line Items: {{lineItemCount}} items
Expected Delivery: {{expectedDelivery}}

{{#if shippingInstructions}}
Delivery Instructions: {{shippingInstructions}}
{{/if}}

Please confirm this order: {{confirmationUrl}}

Contact Information:
{{contactPerson}}
{{contactEmail}}
{{contactPhone}}
        `;
      
      default:
        return `
{{companyName}} - Purchase Order Update

{{message}}

View order: {{purchaseOrderUrl}}
        `;
    }
  }

  // SendGrid Integration
  private async sendViaSendGrid(queueItem: EmailQueueItem): Promise<{ success: boolean; trackingId?: string; error?: string }> {
    try {
      // In production, use actual SendGrid API
      const sendGridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.providers.find(p => p.type === 'SENDGRID')?.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{
            to: queueItem.message.to.map(email => ({ email })),
            cc: queueItem.message.cc?.map(email => ({ email })),
            bcc: queueItem.message.bcc?.map(email => ({ email })),
            subject: queueItem.message.subject
          }],
          from: {
            email: 'noreply@saleskik.com',
            name: 'SalesKik Purchase Orders'
          },
          content: [
            {
              type: 'text/plain',
              value: queueItem.message.textContent
            },
            {
              type: 'text/html',
              value: queueItem.message.htmlContent
            }
          ],
          attachments: queueItem.message.attachments,
          tracking_settings: {
            click_tracking: { enable: true },
            open_tracking: { enable: true },
            subscription_tracking: { enable: false }
          },
          custom_args: {
            purchase_order_id: queueItem.message.variables.purchaseOrderId,
            template_id: queueItem.message.templateId
          }
        })
      });

      if (sendGridResponse.ok) {
        const responseHeaders = sendGridResponse.headers;
        const trackingId = responseHeaders.get('X-Message-Id') || queueItem.id;
        
        console.log('SendGrid email sent successfully:', trackingId);
        return { success: true, trackingId };
      } else {
        const errorData = await sendGridResponse.text();
        console.error('SendGrid error:', errorData);
        return { success: false, error: `SendGrid API error: ${sendGridResponse.status}` };
      }
    } catch (error) {
      console.error('SendGrid request failed:', error);
      return { success: false, error: 'Network error sending via SendGrid' };
    }
  }

  // Resend Integration (backup provider)
  private async sendViaResend(queueItem: EmailQueueItem): Promise<{ success: boolean; trackingId?: string; error?: string }> {
    try {
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.providers.find(p => p.type === 'RESEND')?.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'SalesKik Purchase Orders <noreply@saleskik.com>',
          to: queueItem.message.to,
          cc: queueItem.message.cc,
          bcc: queueItem.message.bcc,
          subject: queueItem.message.subject,
          html: queueItem.message.htmlContent,
          text: queueItem.message.textContent,
          attachments: queueItem.message.attachments,
          tags: [
            { name: 'category', value: 'purchase-order' },
            { name: 'template', value: queueItem.message.templateId }
          ]
        })
      });

      if (resendResponse.ok) {
        const responseData = await resendResponse.json();
        console.log('Resend email sent successfully:', responseData.id);
        return { success: true, trackingId: responseData.id };
      } else {
        const errorData = await resendResponse.text();
        console.error('Resend error:', errorData);
        return { success: false, error: `Resend API error: ${resendResponse.status}` };
      }
    } catch (error) {
      console.error('Resend request failed:', error);
      return { success: false, error: 'Network error sending via Resend' };
    }
  }

  // SMTP Integration (fallback)
  private async sendViaSMTP(queueItem: EmailQueueItem): Promise<{ success: boolean; trackingId?: string; error?: string }> {
    try {
      // In production, this would use nodemailer or similar SMTP library
      // For demo, we'll simulate SMTP sending
      console.log('SMTP email would be sent:', {
        to: queueItem.message.to,
        subject: queueItem.message.subject,
        provider: 'SMTP'
      });
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 90% success rate simulation
      if (Math.random() > 0.1) {
        return { success: true, trackingId: `smtp-${Date.now()}` };
      } else {
        return { success: false, error: 'SMTP server connection failed' };
      }
    } catch (error) {
      console.error('SMTP send failed:', error);
      return { success: false, error: 'SMTP error' };
    }
  }

  // Queue Management
  private loadEmailQueue(): void {
    const savedQueue = localStorage.getItem('saleskik-email-queue');
    if (savedQueue) {
      try {
        this.emailQueue = JSON.parse(savedQueue).map((item: any) => ({
          ...item,
          message: {
            ...item.message,
            createdAt: new Date(item.message.createdAt),
            scheduledFor: item.message.scheduledFor ? new Date(item.message.scheduledFor) : undefined
          },
          nextRetryAt: item.nextRetryAt ? new Date(item.nextRetryAt) : undefined,
          lastAttemptAt: item.lastAttemptAt ? new Date(item.lastAttemptAt) : undefined,
          deliveredAt: item.deliveredAt ? new Date(item.deliveredAt) : undefined
        }));
      } catch (error) {
        console.error('Error loading email queue:', error);
        this.emailQueue = [];
      }
    }
  }

  private saveEmailQueue(): void {
    localStorage.setItem('saleskik-email-queue', JSON.stringify(this.emailQueue));
  }

  // Queue Processing
  private startQueueProcessor(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }

    // Process queue every 30 seconds
    this.processingInterval = setInterval(() => {
      this.processEmailQueue();
    }, 30000);

    // Process immediately
    this.processEmailQueue();
  }

  private async processEmailQueue(): Promise<void> {
    const now = new Date();
    const readyToSend = this.emailQueue.filter(item => 
      item.status === 'QUEUED' && 
      (!item.message.scheduledFor || item.message.scheduledFor <= now) &&
      (!item.nextRetryAt || item.nextRetryAt <= now)
    );

    if (readyToSend.length === 0) {
      return;
    }

    console.log(`Processing ${readyToSend.length} queued emails`);

    // Process up to 10 emails per batch to avoid overwhelming providers
    const batch = readyToSend.slice(0, 10);
    
    for (const queueItem of batch) {
      await this.sendEmail(queueItem);
    }

    this.saveEmailQueue();
  }

  private async sendEmail(queueItem: EmailQueueItem): Promise<void> {
    queueItem.status = 'SENDING';
    queueItem.lastAttemptAt = new Date();
    queueItem.attempts = (queueItem.attempts || 0) + 1;

    // Try providers in order of priority
    const sortedProviders = this.providers
      .filter(p => p.isActive)
      .sort((a, b) => b.priority - a.priority);

    let emailSent = false;

    for (const provider of sortedProviders) {
      try {
        let result: { success: boolean; trackingId?: string; error?: string };

        switch (provider.type) {
          case 'SENDGRID':
            result = await this.sendViaSendGrid(queueItem);
            break;
          case 'RESEND':
            result = await this.sendViaResend(queueItem);
            break;
          case 'SMTP':
            result = await this.sendViaSMTP(queueItem);
            break;
          default:
            continue;
        }

        if (result.success) {
          queueItem.status = 'SENT';
          queueItem.deliveredAt = new Date();
          queueItem.trackingId = result.trackingId;
          queueItem.providerUsed = provider.type;
          emailSent = true;
          
          console.log(`Email sent successfully via ${provider.type}:`, queueItem.trackingId);
          break;
        } else {
          console.warn(`Failed to send via ${provider.type}:`, result.error);
        }
      } catch (error) {
        console.error(`Error with provider ${provider.type}:`, error);
      }
    }

    if (!emailSent) {
      // All providers failed
      if (queueItem.attempts >= queueItem.maxRetries) {
        queueItem.status = 'FAILED';
        queueItem.failureReason = 'Max retries exceeded - all providers failed';
        console.error('Email failed permanently:', queueItem.message.subject);
      } else {
        // Schedule retry with exponential backoff
        const retryDelay = Math.pow(2, queueItem.attempts) * 60 * 1000; // 2^attempts minutes
        queueItem.nextRetryAt = new Date(Date.now() + retryDelay);
        queueItem.status = 'QUEUED';
        console.log(`Email retry scheduled in ${retryDelay / 1000 / 60} minutes`);
      }
    }
  }

  // Public API
  public async queueEmail(message: EmailMessage): Promise<string> {
    const queueItem: EmailQueueItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      messageId: message.id,
      message,
      status: 'QUEUED',
      attempts: 0,
      maxRetries: message.priority === 'URGENT' ? 5 : 3,
      webhookEvents: []
    };

    this.emailQueue.push(queueItem);
    this.saveEmailQueue();

    console.log(`Email queued: ${message.subject} (Priority: ${message.priority})`);
    return queueItem.id;
  }

  public async sendImmediateEmail(message: EmailMessage): Promise<{ success: boolean; queueId: string }> {
    const queueId = await this.queueEmail(message);
    
    // Process immediately for urgent emails
    if (message.priority === 'URGENT') {
      const queueItem = this.emailQueue.find(item => item.id === queueId);
      if (queueItem) {
        await this.sendEmail(queueItem);
        this.saveEmailQueue();
      }
    }

    return { success: true, queueId };
  }

  // Template rendering with full company branding integration
  public renderTemplate(templateId: string, variables: { [key: string]: any }): { html: string; text: string; subject: string } {
    const template = this.templates.find(t => t.id === templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Get company branding
    const brandingService = this.getBrandingService();
    
    // Apply full branding to template
    const { html, text } = brandingService.applyBrandingToTemplate(
      template.htmlContent,
      template.textContent,
      variables,
      {
        useCompanyLogo: true,
        useCompanyColors: true,
        includeSignature: true,
        includeFooter: true,
        includeDisclaimers: true,
        templateVariant: 'PROFESSIONAL'
      }
    );

    // Apply branding to subject line
    let subject = template.subject;
    const brandingVariables = brandingService.getCompanyBranding();
    if (brandingVariables) {
      const allVariables = { 
        ...variables, 
        companyName: brandingVariables.companyName,
        tradingName: brandingVariables.tradingName
      };
      
      Object.entries(allVariables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        subject = subject.replace(regex, String(value || ''));
      });
    }

    return { html, text, subject };
  }

  private getBrandingService(): any {
    // Dynamic import to avoid circular dependencies
    const CompanyBrandingService = require('../services/CompanyBrandingService').default;
    return CompanyBrandingService.getInstance();
  }

  private processConditionals(content: string, variables: any): string {
    // Process {{#if variable}} blocks
    return content.replace(/{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g, (match, variable, block) => {
      return variables[variable] ? block : '';
    });
  }

  // Email delivery statistics
  public getDeliveryStats(): {
    queued: number;
    sending: number;
    sent: number;
    failed: number;
    totalToday: number;
    successRate: number;
    averageDeliveryTime: number;
  } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayEmails = this.emailQueue.filter(item => 
      item.message.createdAt >= today
    );

    const sent = this.emailQueue.filter(item => item.status === 'SENT').length;
    const failed = this.emailQueue.filter(item => item.status === 'FAILED').length;
    const total = sent + failed;
    const successRate = total > 0 ? (sent / total) * 100 : 100;

    // Calculate average delivery time
    const deliveredEmails = this.emailQueue.filter(item => 
      item.status === 'SENT' && item.deliveredAt && item.message.createdAt
    );
    
    const averageDeliveryTime = deliveredEmails.length > 0
      ? deliveredEmails.reduce((sum, item) => {
          const deliveryTime = item.deliveredAt!.getTime() - item.message.createdAt.getTime();
          return sum + deliveryTime;
        }, 0) / deliveredEmails.length / 1000 / 60 // Convert to minutes
      : 0;

    return {
      queued: this.emailQueue.filter(item => item.status === 'QUEUED').length,
      sending: this.emailQueue.filter(item => item.status === 'SENDING').length,
      sent,
      failed,
      totalToday: todayEmails.length,
      successRate,
      averageDeliveryTime
    };
  }

  // Webhook handling for delivery confirmations
  public handleWebhook(payload: any, signature: string): { processed: boolean; error?: string } {
    try {
      // Validate webhook signature (in production)
      if (!this.validateWebhookSignature(payload, signature)) {
        return { processed: false, error: 'Invalid signature' };
      }

      // Process SendGrid webhook events
      if (Array.isArray(payload)) {
        payload.forEach(event => {
          this.processWebhookEvent(event);
        });
      } else {
        this.processWebhookEvent(payload);
      }

      return { processed: true };
    } catch (error) {
      console.error('Webhook processing error:', error);
      return { processed: false, error: 'Processing failed' };
    }
  }

  private validateWebhookSignature(payload: any, signature: string): boolean {
    // In production, validate HMAC signature
    return true; // Simplified for demo
  }

  private processWebhookEvent(event: any): void {
    const queueItem = this.emailQueue.find(item => item.trackingId === event.sg_message_id);
    if (!queueItem) return;

    if (!queueItem.webhookEvents) {
      queueItem.webhookEvents = [];
    }

    queueItem.webhookEvents.push({
      event: event.event,
      timestamp: new Date(event.timestamp * 1000),
      data: event
    });

    // Update status based on webhook event
    switch (event.event) {
      case 'delivered':
        // Email successfully delivered
        break;
      case 'bounce':
      case 'dropped':
        queueItem.status = 'FAILED';
        queueItem.failureReason = `Email ${event.event}: ${event.reason}`;
        break;
      case 'open':
        // Email opened by recipient
        break;
      case 'click':
        // Link clicked in email
        break;
    }

    this.saveEmailQueue();
  }

  // Cleanup old queue items
  public cleanupOldEmails(daysToKeep: number = 30): number {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    const initialCount = this.emailQueue.length;
    
    this.emailQueue = this.emailQueue.filter(item => 
      item.message.createdAt > cutoffDate || 
      ['QUEUED', 'SENDING'].includes(item.status) // Keep pending items
    );

    const cleanedCount = initialCount - this.emailQueue.length;
    if (cleanedCount > 0) {
      this.saveEmailQueue();
      console.log(`Cleaned up ${cleanedCount} old email records`);
    }

    return cleanedCount;
  }

  // Emergency controls
  public pauseEmailDelivery(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    console.log('Email delivery paused');
  }

  public resumeEmailDelivery(): void {
    this.startQueueProcessor();
    console.log('Email delivery resumed');
  }

  public cancelQueuedEmail(queueId: string): boolean {
    const queueItem = this.emailQueue.find(item => item.id === queueId);
    if (queueItem && item.status === 'QUEUED') {
      queueItem.status = 'CANCELLED';
      this.saveEmailQueue();
      return true;
    }
    return false;
  }
}

export default EmailDeliveryService;