import React, { useState, useEffect } from 'react';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

// Email Template Interfaces
interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlTemplate: string;
  textTemplate: string;
  variables: string[];
}

interface EmailNotification {
  id: string;
  type: 'ORDER_CREATED' | 'APPROVAL_REQUEST' | 'ORDER_APPROVED' | 'ORDER_REJECTED' | 
        'SENT_TO_SUPPLIER' | 'SUPPLIER_CONFIRMATION' | 'DELIVERY_REMINDER' | 
        'INVOICE_REQUIRED' | 'ORDER_COMPLETED';
  recipients: string[];
  subject: string;
  htmlBody: string;
  textBody: string;
  attachments?: {
    filename: string;
    content: string;
    contentType: string;
  }[];
  scheduledFor?: Date;
  sentAt?: Date;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'SCHEDULED';
}

class PurchaseOrderEmailService {
  private static instance: PurchaseOrderEmailService;
  private emailTemplates: EmailTemplate[] = [];
  private emailQueue: EmailNotification[] = [];

  private constructor() {
    this.initializeEmailTemplates();
  }

  public static getInstance(): PurchaseOrderEmailService {
    if (!PurchaseOrderEmailService.instance) {
      PurchaseOrderEmailService.instance = new PurchaseOrderEmailService();
    }
    return PurchaseOrderEmailService.instance;
  }

  private initializeEmailTemplates() {
    this.emailTemplates = [
      {
        id: 'order-created',
        name: 'Purchase Order Created',
        subject: 'New Purchase Order Created - {{purchaseOrderNumber}}',
        htmlTemplate: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #3B82F6, #6366F1); padding: 20px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 24px;">{{companyName}}</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Purchase Order Created</p>
            </div>
            
            <div style="padding: 30px 20px;">
              <h2 style="color: #1F2937; margin-bottom: 20px;">Purchase Order {{purchaseOrderNumber}}</h2>
              
              <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6B7280;">Supplier:</td>
                    <td style="padding: 8px 0; font-weight: 600; color: #1F2937;">{{supplierName}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6B7280;">Total Amount:</td>
                    <td style="padding: 8px 0; font-weight: 600; color: #059669;">{{totalAmount}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6B7280;">Priority:</td>
                    <td style="padding: 8px 0; font-weight: 600; color: #1F2937;">{{priorityLevel}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6B7280;">Expected Delivery:</td>
                    <td style="padding: 8px 0; font-weight: 600; color: #1F2937;">{{expectedDeliveryDate}}</td>
                  </tr>
                </table>
              </div>
              
              <p style="color: #374151; margin-bottom: 20px;">
                A new purchase order has been created and is ready for processing.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{purchaseOrderUrl}}" style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                  View Purchase Order
                </a>
              </div>
            </div>
            
            <div style="background: #F9FAFB; padding: 20px; text-align: center; color: #6B7280; font-size: 14px;">
              <p style="margin: 0;">This is an automated notification from {{companyName}} Purchase Order System</p>
            </div>
          </div>
        `,
        textTemplate: `
Purchase Order Created - {{purchaseOrderNumber}}

{{companyName}} has created a new purchase order:

Purchase Order: {{purchaseOrderNumber}}
Supplier: {{supplierName}}
Total Amount: {{totalAmount}}
Priority: {{priorityLevel}}
Expected Delivery: {{expectedDeliveryDate}}

View the full purchase order: {{purchaseOrderUrl}}

This is an automated notification from {{companyName}} Purchase Order System.
        `,
        variables: ['companyName', 'purchaseOrderNumber', 'supplierName', 'totalAmount', 'priorityLevel', 'expectedDeliveryDate', 'purchaseOrderUrl']
      },
      {
        id: 'approval-request',
        name: 'Approval Request',
        subject: 'Purchase Order Approval Required - {{purchaseOrderNumber}}',
        htmlTemplate: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #F59E0B, #EF4444); padding: 20px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 24px;">{{companyName}}</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Approval Required</p>
            </div>
            
            <div style="padding: 30px 20px;">
              <div style="background: #FEF3C7; border: 1px solid #F59E0B; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="color: #92400E; margin: 0 0 10px 0;">⚠️ Manager Approval Required</h3>
                <p style="color: #B45309; margin: 0;">Purchase Order {{purchaseOrderNumber}} requires your approval before processing.</p>
              </div>
              
              <h2 style="color: #1F2937; margin-bottom: 20px;">Order Details</h2>
              
              <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6B7280;">Supplier:</td>
                    <td style="padding: 8px 0; font-weight: 600; color: #1F2937;">{{supplierName}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6B7280;">Total Amount:</td>
                    <td style="padding: 8px 0; font-weight: 600; color: #059669;">{{totalAmount}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6B7280;">Triggered Rules:</td>
                    <td style="padding: 8px 0; font-weight: 600; color: #DC2626;">{{triggeringRules}}</td>
                  </tr>
                </table>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{approvalUrl}}" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-right: 10px;">
                  Review & Approve
                </a>
                <a href="{{purchaseOrderUrl}}" style="background: #6B7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                  View Details
                </a>
              </div>
            </div>
          </div>
        `,
        textTemplate: `
Approval Required - {{purchaseOrderNumber}}

{{companyName}} Purchase Order {{purchaseOrderNumber}} requires your approval.

Supplier: {{supplierName}}
Total Amount: {{totalAmount}}
Triggered Rules: {{triggeringRules}}

Review and approve: {{approvalUrl}}
View details: {{purchaseOrderUrl}}
        `,
        variables: ['companyName', 'purchaseOrderNumber', 'supplierName', 'totalAmount', 'triggeringRules', 'approvalUrl', 'purchaseOrderUrl']
      },
      {
        id: 'supplier-order',
        name: 'Supplier Order Notification',
        subject: 'New Purchase Order from {{companyName}} - {{purchaseOrderNumber}}',
        htmlTemplate: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #059669, #10B981); padding: 20px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 24px;">{{companyName}}</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Purchase Order</p>
            </div>
            
            <div style="padding: 30px 20px;">
              <h2 style="color: #1F2937; margin-bottom: 20px;">Purchase Order {{purchaseOrderNumber}}</h2>
              
              <div style="background: #DBEAFE; border: 1px solid #3B82F6; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="color: #1E40AF; margin: 0 0 10px 0;">📋 Action Required</h3>
                <p style="color: #1E3A8A; margin: 0;">Please review and confirm this purchase order within 48 hours.</p>
              </div>
              
              <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="color: #1F2937; margin-bottom: 15px;">Order Summary</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6B7280;">Total Amount:</td>
                    <td style="padding: 8px 0; font-weight: 600; color: #059669; font-size: 18px;">{{totalAmount}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6B7280;">Line Items:</td>
                    <td style="padding: 8px 0; font-weight: 600; color: #1F2937;">{{lineItemsCount}} items</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6B7280;">Expected Delivery:</td>
                    <td style="padding: 8px 0; font-weight: 600; color: #1F2937;">{{expectedDeliveryDate}}</td>
                  </tr>
                  {{#if customerReference}}
                  <tr>
                    <td style="padding: 8px 0; color: #6B7280;">Customer Reference:</td>
                    <td style="padding: 8px 0; font-weight: 600; color: #1F2937;">{{customerReference}}</td>
                  </tr>
                  {{/if}}
                </table>
              </div>
              
              {{#if shippingInstructions}}
              <div style="background: #FEF3C7; border: 1px solid #F59E0B; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <h4 style="color: #92400E; margin: 0 0 10px 0;">🚚 Delivery Instructions</h4>
                <p style="color: #B45309; margin: 0;">{{shippingInstructions}}</p>
              </div>
              {{/if}}
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{confirmationUrl}}" style="background: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Confirm Order
                </a>
              </div>
              
              <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; margin-top: 20px;">
                <h4 style="color: #1F2937; margin: 0 0 10px 0;">Contact Information</h4>
                <p style="color: #6B7280; margin: 5px 0;">{{contactPerson}}</p>
                <p style="color: #6B7280; margin: 5px 0;">📧 {{contactEmail}}</p>
                <p style="color: #6B7280; margin: 5px 0;">📞 {{contactPhone}}</p>
              </div>
            </div>
          </div>
        `,
        textTemplate: `
New Purchase Order from {{companyName}}

Purchase Order: {{purchaseOrderNumber}}
Total Amount: {{totalAmount}}
Line Items: {{lineItemsCount}} items
Expected Delivery: {{expectedDeliveryDate}}
{{#if customerReference}}Customer Reference: {{customerReference}}{{/if}}

{{#if shippingInstructions}}
Delivery Instructions:
{{shippingInstructions}}
{{/if}}

Please confirm this order: {{confirmationUrl}}

Contact Information:
{{contactPerson}}
{{contactEmail}}
{{contactPhone}}
        `,
        variables: ['companyName', 'purchaseOrderNumber', 'totalAmount', 'lineItemsCount', 'expectedDeliveryDate', 'customerReference', 'shippingInstructions', 'confirmationUrl', 'contactPerson', 'contactEmail', 'contactPhone']
      },
      {
        id: 'supplier-confirmation',
        name: 'Supplier Confirmation Received',
        subject: 'Supplier Confirmed - {{purchaseOrderNumber}}',
        htmlTemplate: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #059669, #10B981); padding: 20px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 24px;">{{companyName}}</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Supplier Confirmation</p>
            </div>
            
            <div style="padding: 30px 20px;">
              <div style="background: #D1FAE5; border: 1px solid #10B981; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="color: #065F46; margin: 0 0 10px 0;">✅ Order Confirmed</h3>
                <p style="color: #047857; margin: 0;">{{supplierName}} has confirmed purchase order {{purchaseOrderNumber}}.</p>
              </div>
              
              <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6B7280;">Confirmed Delivery:</td>
                    <td style="padding: 8px 0; font-weight: 600; color: #1F2937;">{{confirmedDeliveryDate}}</td>
                  </tr>
                  {{#if supplierComments}}
                  <tr>
                    <td style="padding: 8px 0; color: #6B7280; vertical-align: top;">Supplier Notes:</td>
                    <td style="padding: 8px 0; color: #1F2937;">{{supplierComments}}</td>
                  </tr>
                  {{/if}}
                </table>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{purchaseOrderUrl}}" style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                  View Order Status
                </a>
              </div>
            </div>
          </div>
        `,
        textTemplate: `
Supplier Confirmation - {{purchaseOrderNumber}}

{{supplierName}} has confirmed purchase order {{purchaseOrderNumber}}.

Confirmed Delivery: {{confirmedDeliveryDate}}
{{#if supplierComments}}Supplier Notes: {{supplierComments}}{{/if}}

View order status: {{purchaseOrderUrl}}
        `,
        variables: ['companyName', 'purchaseOrderNumber', 'supplierName', 'confirmedDeliveryDate', 'supplierComments', 'purchaseOrderUrl']
      },
      {
        id: 'invoice-required',
        name: 'Invoice Required Notification',
        subject: 'Invoice Required - {{purchaseOrderNumber}}',
        htmlTemplate: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #DC2626, #EF4444); padding: 20px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 24px;">{{companyName}}</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Invoice Required</p>
            </div>
            
            <div style="padding: 30px 20px;">
              <div style="background: #FEE2E2; border: 1px solid #EF4444; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="color: #991B1B; margin: 0 0 10px 0;">🚫 Dispatch Blocked</h3>
                <p style="color: #B91C1C; margin: 0;">Purchase Order {{purchaseOrderNumber}} requires invoice creation before goods can be dispatched.</p>
              </div>
              
              <p style="color: #374151; margin-bottom: 20px;">
                The order has been fully received but cannot be dispatched to the customer until an invoice is created.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{createInvoiceUrl}}" style="background: #DC2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                  Create Invoice Now
                </a>
              </div>
            </div>
          </div>
        `,
        textTemplate: `
Invoice Required - {{purchaseOrderNumber}}

DISPATCH BLOCKED: Purchase Order {{purchaseOrderNumber}} requires invoice creation before goods can be dispatched.

The order has been fully received but cannot be dispatched until an invoice is created.

Create invoice: {{createInvoiceUrl}}
        `,
        variables: ['companyName', 'purchaseOrderNumber', 'createInvoiceUrl']
      }
    ];
  }

  // Template rendering with variable substitution
  private renderTemplate(template: string, variables: {[key: string]: any}): string {
    let rendered = template;
    
    // Replace simple variables
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, String(value || ''));
    });
    
    // Handle conditional blocks (simplified Handlebars-like syntax)
    rendered = rendered.replace(/{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g, (match, condition, content) => {
      return variables[condition] ? content : '';
    });
    
    return rendered;
  }

  // Send purchase order creation notification with full branding
  public async sendOrderCreatedNotification(purchaseOrder: any): Promise<boolean> {
    try {
      // Use new email delivery service with full branding
      const emailDeliveryService = (await import('./EmailDeliveryService')).default.getInstance();
      
      const variables = {
        companyName: 'Ecco Hardware',
        purchaseOrderNumber: purchaseOrder.purchaseOrderNumber,
        supplierName: purchaseOrder.supplier.supplierName,
        totalAmount: `$${purchaseOrder.totalAmount.toLocaleString('en-AU', { minimumFractionDigits: 2 })}`,
        priority: purchaseOrder.priorityLevel,
        priorityClass: purchaseOrder.priorityLevel.toLowerCase(),
        expectedDelivery: purchaseOrder.expectedDeliveryDate ? 
          new Date(purchaseOrder.expectedDeliveryDate).toLocaleDateString() : 'Not specified',
        purchaseOrderUrl: `${window.location.origin}/inventory/purchase-orders/${purchaseOrder.id}`,
        purchaseOrderId: purchaseOrder.id
      };

      // Render template with full branding
      const renderedTemplate = emailDeliveryService.renderTemplate('purchase-order-created', variables);

      const emailMessage = {
        id: Date.now().toString(),
        templateId: 'purchase-order-created',
        to: ['team@eccohardware.com.au'], // Internal team
        subject: renderedTemplate.subject,
        htmlContent: renderedTemplate.html,
        textContent: renderedTemplate.text,
        variables,
        priority: 'MEDIUM' as const,
        createdAt: new Date()
      };

      await emailDeliveryService.queueEmail(emailMessage);
      console.log('Branded order creation email queued:', purchaseOrder.purchaseOrderNumber);
      return true;
    } catch (error) {
      console.error('Error sending branded order notification:', error);
      return false;
    }
  }

  // Send approval request notification
  public async sendApprovalRequest(purchaseOrder: any, triggeringRules: string[]): Promise<boolean> {
    try {
      const template = this.emailTemplates.find(t => t.id === 'approval-request');
      if (!template) throw new Error('Template not found');

      const variables = {
        companyName: 'Ecco Hardware',
        purchaseOrderNumber: purchaseOrder.purchaseOrderNumber,
        supplierName: purchaseOrder.supplier.supplierName,
        totalAmount: `$${purchaseOrder.totalAmount.toLocaleString('en-AU', { minimumFractionDigits: 2 })}`,
        triggeringRules: triggeringRules.join(', '),
        approvalUrl: `${window.location.origin}/approvals`,
        purchaseOrderUrl: `${window.location.origin}/inventory/purchase-orders/${purchaseOrder.id}`
      };

      const notification: EmailNotification = {
        id: Date.now().toString(),
        type: 'APPROVAL_REQUEST',
        recipients: ['manager@company.com'], // Replace with actual manager emails
        subject: this.renderTemplate(template.subject, variables),
        htmlBody: this.renderTemplate(template.htmlTemplate, variables),
        textBody: this.renderTemplate(template.textTemplate, variables),
        status: 'PENDING'
      };

      await this.queueEmail(notification);
      return true;
    } catch (error) {
      console.error('Error sending approval request:', error);
      return false;
    }
  }

  // Send order to supplier with professional branding
  public async sendOrderToSupplier(purchaseOrder: any): Promise<boolean> {
    try {
      // Use new email delivery service with full branding
      const emailDeliveryService = (await import('./EmailDeliveryService')).default.getInstance();
      
      // Generate secure confirmation token
      const confirmationToken = this.generateConfirmationToken();
      
      const variables = {
        companyName: 'Ecco Hardware',
        purchaseOrderNumber: purchaseOrder.purchaseOrderNumber,
        totalAmount: `$${purchaseOrder.totalAmount.toLocaleString('en-AU', { minimumFractionDigits: 2 })}`,
        lineItemCount: purchaseOrder.lineItems.length,
        expectedDelivery: purchaseOrder.expectedDeliveryDate ? 
          new Date(purchaseOrder.expectedDeliveryDate).toLocaleDateString() : 'To be confirmed',
        customerReference: purchaseOrder.customerReference,
        shippingInstructions: purchaseOrder.shippingInstructions,
        confirmationUrl: `${window.location.origin}/supplier/confirm/${purchaseOrder.id}?token=${confirmationToken}`,
        contactPerson: 'Adam Smith',
        contactEmail: 'adam@eccohardware.com.au',
        contactPhone: '+61 2 9876 5432',
        purchaseOrderId: purchaseOrder.id
      };

      // Render template with full company branding
      const renderedTemplate = emailDeliveryService.renderTemplate('supplier-order-notification', variables);

      // Create attachment bundle for supplier
      const bundlingService = (await import('./AttachmentBundlingService')).default.getInstance();
      let emailAttachments: any[] = [];
      
      // Check if we should create a bundle
      const shouldBundle = await bundlingService.shouldCreateBundleForOrder(purchaseOrder.id);
      
      if (shouldBundle) {
        const bundleResult = await bundlingService.bundleAttachmentsForSupplierEmail(purchaseOrder.id);
        
        if (bundleResult.success && bundleResult.bundleId) {
          // Get ZIP file as email attachment
          const zipAttachment = await bundlingService.getEmailAttachmentForBundle(bundleResult.bundleId);
          if (zipAttachment) {
            emailAttachments = [zipAttachment];
            
            // Add bundle information to email variables
            (variables as any).attachmentBundle = {
              filename: zipAttachment.filename,
              size: bundleResult.bundleSize,
              count: bundleResult.attachmentCount,
              downloadUrl: bundleResult.downloadUrl
            };
          }
        }
      } else {
        // Use individual attachments for small orders
        emailAttachments = this.createOrderAttachments(purchaseOrder);
      }

      const emailMessage = {
        id: Date.now().toString(),
        templateId: 'supplier-order-notification',
        to: [purchaseOrder.supplier.emailAddress],
        subject: renderedTemplate.subject,
        htmlContent: renderedTemplate.html,
        textContent: renderedTemplate.text,
        attachments: emailAttachments,
        variables,
        priority: purchaseOrder.priorityLevel === 'URGENT' ? 'URGENT' as const : 'HIGH' as const,
        createdAt: new Date()
      };

      await emailDeliveryService.queueEmail(emailMessage);
      
      // Store confirmation token
      this.storeConfirmationToken(purchaseOrder.id, confirmationToken);
      
      console.log('Branded supplier order email queued:', purchaseOrder.purchaseOrderNumber);
      return true;
    } catch (error) {
      console.error('Error sending branded supplier order:', error);
      return false;
    }
  }

  // Send supplier confirmation notification
  public async sendSupplierConfirmationNotification(purchaseOrder: any, supplierComments: string, confirmedDeliveryDate: string): Promise<boolean> {
    try {
      const template = this.emailTemplates.find(t => t.id === 'supplier-confirmation');
      if (!template) throw new Error('Template not found');

      const variables = {
        companyName: 'Ecco Hardware',
        purchaseOrderNumber: purchaseOrder.purchaseOrderNumber,
        supplierName: purchaseOrder.supplier.supplierName,
        confirmedDeliveryDate: new Date(confirmedDeliveryDate).toLocaleDateString(),
        supplierComments,
        purchaseOrderUrl: `${window.location.origin}/inventory/purchase-orders/${purchaseOrder.id}`
      };

      const notification: EmailNotification = {
        id: Date.now().toString(),
        type: 'SUPPLIER_CONFIRMATION',
        recipients: [purchaseOrder.createdBy], // Notify order creator
        subject: this.renderTemplate(template.subject, variables),
        htmlBody: this.renderTemplate(template.htmlTemplate, variables),
        textBody: this.renderTemplate(template.textTemplate, variables),
        status: 'PENDING'
      };

      await this.queueEmail(notification);
      return true;
    } catch (error) {
      console.error('Error sending supplier confirmation notification:', error);
      return false;
    }
  }

  // Send invoice required notification
  public async sendInvoiceRequiredNotification(purchaseOrder: any): Promise<boolean> {
    try {
      const template = this.emailTemplates.find(t => t.id === 'invoice-required');
      if (!template) throw new Error('Template not found');

      const variables = {
        companyName: 'Ecco Hardware',
        purchaseOrderNumber: purchaseOrder.purchaseOrderNumber,
        createInvoiceUrl: `${window.location.origin}/invoices/new?po=${purchaseOrder.id}`
      };

      const notification: EmailNotification = {
        id: Date.now().toString(),
        type: 'INVOICE_REQUIRED',
        recipients: ['accounting@company.com'], // Replace with actual accounting team emails
        subject: this.renderTemplate(template.subject, variables),
        htmlBody: this.renderTemplate(template.htmlTemplate, variables),
        textBody: this.renderTemplate(template.textTemplate, variables),
        status: 'PENDING'
      };

      await this.queueEmail(notification);
      return true;
    } catch (error) {
      console.error('Error sending invoice required notification:', error);
      return false;
    }
  }

  // Queue email for sending using real email delivery service
  private async queueEmail(notification: EmailNotification): Promise<void> {
    this.emailQueue.push(notification);
    
    // Save to localStorage for persistence
    localStorage.setItem('saleskik-email-queue', JSON.stringify(this.emailQueue));
    
    // Use real email delivery service
    const emailDeliveryService = (await import('./EmailDeliveryService')).default.getInstance();
    
    const emailMessage = {
      id: notification.id,
      templateId: this.getTemplateIdFromType(notification.type),
      to: notification.recipients,
      subject: notification.subject,
      htmlContent: notification.htmlBody,
      textContent: notification.textBody,
      attachments: notification.attachments,
      variables: this.extractVariablesFromContent(notification),
      priority: this.getPriorityFromType(notification.type),
      createdAt: new Date()
    };

    try {
      const queueId = await emailDeliveryService.queueEmail(emailMessage);
      console.log('Email queued for real delivery:', {
        type: notification.type,
        recipients: notification.recipients,
        subject: notification.subject,
        queueId
      });
      
      // Update notification status
      notification.status = 'SENT'; // Will be updated by delivery service
      notification.sentAt = new Date();
    } catch (error) {
      console.error('Error queuing email for delivery:', error);
      notification.status = 'FAILED';
    }
  }

  private getTemplateIdFromType(type: string): string {
    const typeMap: { [key: string]: string } = {
      'ORDER_CREATED': 'purchase-order-created',
      'APPROVAL_REQUEST': 'approval-request',
      'SENT_TO_SUPPLIER': 'supplier-order-notification',
      'SUPPLIER_CONFIRMATION': 'supplier-confirmation-received',
      'INVOICE_REQUIRED': 'invoice-dispatch-unblocked'
    };
    return typeMap[type] || 'purchase-order-created';
  }

  private getPriorityFromType(type: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' {
    const priorityMap: { [key: string]: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' } = {
      'ORDER_CREATED': 'MEDIUM',
      'APPROVAL_REQUEST': 'HIGH',
      'SENT_TO_SUPPLIER': 'HIGH',
      'SUPPLIER_CONFIRMATION': 'MEDIUM',
      'INVOICE_REQUIRED': 'URGENT'
    };
    return priorityMap[type] || 'MEDIUM';
  }

  private extractVariablesFromContent(notification: EmailNotification): { [key: string]: any } {
    // Extract variables from the notification content for template rendering
    return {
      purchaseOrderId: notification.id,
      notificationType: notification.type
    };
  }

  // Generate secure confirmation token
  private generateConfirmationToken(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Store confirmation token securely
  private storeConfirmationToken(orderId: string, token: string): void {
    const tokens = JSON.parse(localStorage.getItem('saleskik-confirmation-tokens') || '{}');
    tokens[orderId] = {
      token,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    };
    localStorage.setItem('saleskik-confirmation-tokens', JSON.stringify(tokens));
  }

  // Create attachments for order email
  private createOrderAttachments(purchaseOrder: any): any[] {
    // In production, this would convert attachments to email-ready format
    return purchaseOrder.attachments?.filter((att: any) => att.isIncludedWithSupplierOrder)
      .map((att: any) => ({
        filename: att.originalFilename,
        content: 'base64-encoded-content', // Would be actual file content
        contentType: att.fileType
      })) || [];
  }

  // Get email queue status
  public getEmailQueueStatus(): { pending: number; sent: number; failed: number } {
    return {
      pending: this.emailQueue.filter(e => e.status === 'PENDING').length,
      sent: this.emailQueue.filter(e => e.status === 'SENT').length,
      failed: this.emailQueue.filter(e => e.status === 'FAILED').length
    };
  }

  // Get email templates
  public getEmailTemplates(): EmailTemplate[] {
    return this.emailTemplates;
  }

  // Update email template
  public updateEmailTemplate(templateId: string, updates: Partial<EmailTemplate>): boolean {
    try {
      const index = this.emailTemplates.findIndex(t => t.id === templateId);
      if (index !== -1) {
        this.emailTemplates[index] = { ...this.emailTemplates[index], ...updates };
        localStorage.setItem('saleskik-email-templates', JSON.stringify(this.emailTemplates));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating email template:', error);
      return false;
    }
  }
}

// React component for email status display
interface EmailNotificationStatusProps {
  purchaseOrderId: string;
}

export function EmailNotificationStatus({ purchaseOrderId }: EmailNotificationStatusProps) {
  const [emailStatus, setEmailStatus] = useState<any>(null);
  const [realTimeStats, setRealTimeStats] = useState<any>(null);

  useEffect(() => {
    loadEmailStatus();
    
    // Update stats every 30 seconds
    const interval = setInterval(loadEmailStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadEmailStatus = async () => {
    try {
      // Get stats from new email delivery service
      const emailDeliveryService = (await import('./EmailDeliveryService')).default.getInstance();
      const stats = emailDeliveryService.getDeliveryStats();
      setRealTimeStats(stats);

      // Legacy compatibility
      const legacyService = PurchaseOrderEmailService.getInstance();
      const legacyStatus = legacyService.getEmailQueueStatus();
      setEmailStatus(legacyStatus);
    } catch (error) {
      console.error('Error loading email status:', error);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-purple-100 rounded-lg">
          <InformationCircleIcon className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <div className="font-medium text-gray-900">Email Delivery System</div>
          <div className="text-sm text-gray-600">Professional automated communications</div>
        </div>
      </div>
      
      {realTimeStats ? (
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">{realTimeStats.queued}</div>
            <div className="text-xs text-gray-600">Queued</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">{realTimeStats.sent}</div>
            <div className="text-xs text-gray-600">Delivered</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">{realTimeStats.successRate.toFixed(1)}%</div>
            <div className="text-xs text-gray-600">Success Rate</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-orange-600">{realTimeStats.failed}</div>
            <div className="text-xs text-gray-600">Failed</div>
          </div>
        </div>
      ) : emailStatus ? (
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-lg font-bold text-yellow-600">{emailStatus.pending}</div>
            <div className="text-xs text-gray-600">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">{emailStatus.sent}</div>
            <div className="text-xs text-gray-600">Sent</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-red-600">{emailStatus.failed}</div>
            <div className="text-xs text-gray-600">Failed</div>
          </div>
        </div>
      ) : (
        <div className="text-center py-2">
          <div className="text-sm text-gray-500">Loading email status...</div>
        </div>
      )}
    </div>
  );
}

export default PurchaseOrderEmailService;