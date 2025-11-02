import { PrismaClient } from '@prisma/client';
import twilio from 'twilio';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

interface NotificationData {
  customerName: string;
  driverName: string;
  vehicleRegistration: string;
  estimatedArrival: Date;
  deliveryAddress: string;
  contactPhone?: string;
  specialInstructions?: string;
}

class DeliveryNotificationService {
  private twilioClient: any;
  private emailTransporter: any;

  constructor() {
    // Initialize Twilio (if configured)
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    } else {
      console.log('⚠️ Twilio SMS not configured - notifications will be logged to console');
    }

    // Initialize Email (using existing nodemailer setup)
    this.emailTransporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  /**
   * Send delivery notification to customer
   */
  async sendDeliveryNotification(
    deliveryId: string,
    type: 'SMS' | 'EMAIL' | 'BOTH',
    notificationType: 'SCHEDULED' | 'EN_ROUTE' | 'ARRIVED' | 'DELIVERED' | 'DELAYED',
    data: NotificationData
  ): Promise<{
    success: boolean;
    smsResult?: any;
    emailResult?: any;
    error?: string;
  }> {
    
    try {
      const results: any = { success: true };

      // Generate message content based on notification type
      const messageContent = this.generateMessageContent(notificationType, data);

      // Send SMS if requested
      if ((type === 'SMS' || type === 'BOTH') && data.contactPhone) {
        try {
          const smsResult = await this.sendSMS(data.contactPhone, messageContent.sms);
          results.smsResult = smsResult;
          
          // Log SMS notification
          await this.logNotification(deliveryId, 'SMS', data.contactPhone, messageContent.sms, smsResult.success ? 'SENT' : 'FAILED');
          
        } catch (smsError) {
          console.error('SMS sending failed:', smsError);
          results.smsResult = { success: false, error: smsError };
          await this.logNotification(deliveryId, 'SMS', data.contactPhone || '', messageContent.sms, 'FAILED', String(smsError));
        }
      }

      // Send Email if requested  
      if ((type === 'EMAIL' || type === 'BOTH')) {
        try {
          const emailResult = await this.sendEmail(
            data.contactPhone || 'customer@example.com', // Use phone as fallback identifier
            messageContent.email.subject,
            messageContent.email.content
          );
          results.emailResult = emailResult;
          
          // Log email notification
          await this.logNotification(deliveryId, 'EMAIL', data.contactPhone || 'customer@example.com', messageContent.email.content, emailResult.success ? 'SENT' : 'FAILED');
          
        } catch (emailError) {
          console.error('Email sending failed:', emailError);
          results.emailResult = { success: false, error: emailError };
          await this.logNotification(deliveryId, 'EMAIL', data.contactPhone || '', messageContent.email.content, 'FAILED', String(emailError));
        }
      }

      return results;

    } catch (error) {
      console.error('Notification service error:', error);
      return {
        success: false,
        error: String(error)
      };
    }
  }

  /**
   * Send SMS notification
   */
  private async sendSMS(phoneNumber: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.twilioClient) {
      // Log to console for development
      console.log('📱 SMS Notification (Development Mode):');
      console.log(`To: ${phoneNumber}`);
      console.log(`Message: ${message}`);
      console.log('---');
      
      return { success: true, messageId: 'dev-' + Date.now() };
    }

    try {
      const result = await this.twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });

      return {
        success: true,
        messageId: result.sid
      };

    } catch (error) {
      console.error('Twilio SMS error:', error);
      return {
        success: false,
        error: String(error)
      };
    }
  }

  /**
   * Send email notification
   */
  private async sendEmail(
    emailAddress: string, 
    subject: string, 
    content: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    
    // Log to console for development
    console.log('📧 Email Notification (Development Mode):');
    console.log(`To: ${emailAddress}`);
    console.log(`Subject: ${subject}`);
    console.log(`Content: ${content}`);
    console.log('---');
    
    return { success: true, messageId: 'dev-email-' + Date.now() };

    // Uncomment when email is properly configured
    /*
    try {
      const result = await this.emailTransporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@saleskik.com',
        to: emailAddress,
        subject,
        html: content
      });

      return {
        success: true,
        messageId: result.messageId
      };

    } catch (error) {
      console.error('Email sending error:', error);
      return {
        success: false,
        error: String(error)
      };
    }
    */
  }

  /**
   * Generate message content based on notification type
   */
  private generateMessageContent(
    type: 'SCHEDULED' | 'EN_ROUTE' | 'ARRIVED' | 'DELIVERED' | 'DELAYED',
    data: NotificationData
  ): {
    sms: string;
    email: { subject: string; content: string };
  } {
    
    const arrivalTime = data.estimatedArrival.toLocaleTimeString('en-AU', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const arrivalDate = data.estimatedArrival.toLocaleDateString('en-AU');

    switch (type) {
      case 'SCHEDULED':
        return {
          sms: `Hello ${data.customerName}, your delivery with SalesKik is scheduled for ${arrivalTime} on ${arrivalDate}. Driver: ${data.driverName} (${data.vehicleRegistration}). ${data.specialInstructions ? 'Note: ' + data.specialInstructions : ''}`,
          email: {
            subject: `Delivery Scheduled - ${arrivalDate} at ${arrivalTime}`,
            content: `
              <div style="font-family: Arial, sans-serif; max-width: 600px;">
                <h2 style="color: #3B82F6;">Delivery Scheduled</h2>
                <p>Hello ${data.customerName},</p>
                <p>Your delivery from SalesKik has been scheduled:</p>
                <div style="background: #F3F4F6; padding: 16px; border-radius: 8px; margin: 16px 0;">
                  <p><strong>Date & Time:</strong> ${arrivalDate} at ${arrivalTime}</p>
                  <p><strong>Address:</strong> ${data.deliveryAddress}</p>
                  <p><strong>Driver:</strong> ${data.driverName}</p>
                  <p><strong>Vehicle:</strong> ${data.vehicleRegistration}</p>
                  ${data.specialInstructions ? `<p><strong>Note:</strong> ${data.specialInstructions}</p>` : ''}
                </div>
                <p>We'll send you updates as your delivery progresses.</p>
                <p>Thanks,<br>SalesKik Delivery Team</p>
              </div>
            `
          }
        };

      case 'EN_ROUTE':
        return {
          sms: `${data.customerName}, your SalesKik delivery is on the way! Driver ${data.driverName} will arrive around ${arrivalTime}. ${data.contactPhone ? 'Contact: ' + data.contactPhone : ''}`,
          email: {
            subject: `Your Delivery is On The Way - ETA ${arrivalTime}`,
            content: `
              <div style="font-family: Arial, sans-serif; max-width: 600px;">
                <h2 style="color: #10B981;">Your Delivery is On The Way! 🚛</h2>
                <p>Hello ${data.customerName},</p>
                <p>Great news! Your delivery is currently en route and will arrive around <strong>${arrivalTime}</strong>.</p>
                <div style="background: #F3F4F6; padding: 16px; border-radius: 8px; margin: 16px 0;">
                  <p><strong>Estimated Arrival:</strong> ${arrivalTime}</p>
                  <p><strong>Driver:</strong> ${data.driverName}</p>
                  <p><strong>Vehicle:</strong> ${data.vehicleRegistration}</p>
                  ${data.contactPhone ? `<p><strong>Driver Contact:</strong> ${data.contactPhone}</p>` : ''}
                </div>
                <p>Please ensure someone is available to receive the delivery.</p>
                <p>Thanks,<br>SalesKik Delivery Team</p>
              </div>
            `
          }
        };

      case 'ARRIVED':
        return {
          sms: `${data.customerName}, your SalesKik delivery driver ${data.driverName} has arrived at ${data.deliveryAddress}. Please check your delivery location.`,
          email: {
            subject: `Driver Arrived - ${data.driverName} at Your Location`,
            content: `
              <div style="font-family: Arial, sans-serif; max-width: 600px;">
                <h2 style="color: #8B5CF6;">Driver Arrived! 📍</h2>
                <p>Hello ${data.customerName},</p>
                <p>Your delivery driver has arrived at your location.</p>
                <div style="background: #F3F4F6; padding: 16px; border-radius: 8px; margin: 16px 0;">
                  <p><strong>Driver:</strong> ${data.driverName}</p>
                  <p><strong>Vehicle:</strong> ${data.vehicleRegistration}</p>
                  <p><strong>Location:</strong> ${data.deliveryAddress}</p>
                  <p><strong>Arrival Time:</strong> ${new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <p>Please proceed to the delivery location to receive your items.</p>
                <p>Thanks,<br>SalesKik Delivery Team</p>
              </div>
            `
          }
        };

      case 'DELIVERED':
        return {
          sms: `Delivery complete! Your SalesKik order has been successfully delivered to ${data.deliveryAddress}. Thank you for your business!`,
          email: {
            subject: `Delivery Completed Successfully ✅`,
            content: `
              <div style="font-family: Arial, sans-serif; max-width: 600px;">
                <h2 style="color: #10B981;">Delivery Completed! ✅</h2>
                <p>Hello ${data.customerName},</p>
                <p>Your SalesKik delivery has been completed successfully.</p>
                <div style="background: #F0FDF4; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #10B981;">
                  <p><strong>Delivered To:</strong> ${data.deliveryAddress}</p>
                  <p><strong>Completed At:</strong> ${new Date().toLocaleString('en-AU')}</p>
                  <p><strong>Driver:</strong> ${data.driverName}</p>
                </div>
                <p>Thank you for choosing SalesKik. We appreciate your business!</p>
                <p>Best regards,<br>SalesKik Team</p>
              </div>
            `
          }
        };

      case 'DELAYED':
        return {
          sms: `${data.customerName}, your SalesKik delivery is running approximately 30 minutes late due to traffic. New ETA: ${arrivalTime}. Driver: ${data.driverName}`,
          email: {
            subject: `Delivery Update - Slight Delay`,
            content: `
              <div style="font-family: Arial, sans-serif; max-width: 600px;">
                <h2 style="color: #F59E0B;">Delivery Update - Slight Delay ⏰</h2>
                <p>Hello ${data.customerName},</p>
                <p>We wanted to keep you informed about a small delay with your delivery.</p>
                <div style="background: #FEF3C7; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #F59E0B;">
                  <p><strong>New Estimated Arrival:</strong> ${arrivalTime}</p>
                  <p><strong>Reason:</strong> Traffic conditions</p>
                  <p><strong>Driver:</strong> ${data.driverName}</p>
                  <p><strong>Vehicle:</strong> ${data.vehicleRegistration}</p>
                </div>
                <p>We apologize for any inconvenience and appreciate your patience.</p>
                <p>Best regards,<br>SalesKik Delivery Team</p>
              </div>
            `
          }
        };

      default:
        throw new Error(`Unknown notification type: ${type}`);
    }
  }

  /**
   * Log notification to database
   */
  private async logNotification(
    deliveryId: string,
    type: 'SMS' | 'EMAIL',
    recipient: string,
    message: string,
    status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED',
    errorMessage?: string
  ): Promise<void> {
    try {
      await prisma.deliveryNotification.create({
        data: {
          delivery_id: deliveryId,
          type,
          recipient,
          message,
          status,
          error_message: errorMessage,
          sent_at: status === 'SENT' ? new Date() : null
        }
      });
    } catch (error) {
      console.error('Failed to log notification:', error);
    }
  }

  /**
   * Send bulk notifications for a delivery run
   */
  async sendBulkNotifications(
    deliveryRunId: string,
    notificationType: 'SCHEDULED' | 'EN_ROUTE' | 'DELAYED'
  ): Promise<{
    success: boolean;
    results: Array<{
      deliveryId: string;
      customerName: string;
      smsResult?: any;
      emailResult?: any;
    }>;
  }> {
    
    try {
      // Get all deliveries in the run
      const deliveries = await prisma.delivery.findMany({
        where: {
          delivery_run_id: deliveryRunId,
          status: notificationType === 'SCHEDULED' ? 'PLANNED' : 'EN_ROUTE'
        },
        include: {
          customer: true,
          delivery_run: {
            include: {
              driver: true,
              vehicle: true
            }
          }
        }
      });

      const results = [];

      for (const delivery of deliveries) {
        if (delivery.notification_type === 'NONE') continue;

        const notificationData: NotificationData = {
          customerName: delivery.customer.name,
          driverName: `${delivery.delivery_run.driver.first_name} ${delivery.delivery_run.driver.last_name}`,
          vehicleRegistration: delivery.delivery_run.vehicle.registration,
          estimatedArrival: delivery.estimated_arrival || new Date(),
          deliveryAddress: typeof delivery.delivery_address === 'string' 
            ? delivery.delivery_address 
            : (delivery.delivery_address as any).street || 'Delivery Address',
          contactPhone: delivery.delivery_run.driver.phone || undefined,
          specialInstructions: delivery.special_instructions || undefined
        };

        const result = await this.sendDeliveryNotification(
          delivery.id,
          delivery.notification_type as any,
          notificationType,
          notificationData
        );

        results.push({
          deliveryId: delivery.id,
          customerName: delivery.customer.name,
          ...result
        });
      }

      return {
        success: true,
        results
      };

    } catch (error) {
      console.error('Bulk notification error:', error);
      return {
        success: false,
        results: []
      };
    }
  }

  /**
   * Send confirmation request to customer
   */
  async sendDeliveryConfirmationRequest(
    deliveryId: string,
    customerPhone?: string,
    customerEmail?: string
  ): Promise<{ success: boolean; confirmationCode: string }> {
    
    try {
      // Generate confirmation code
      const confirmationCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      // Get delivery details
      const delivery = await prisma.delivery.findUnique({
        where: { id: deliveryId },
        include: {
          customer: true,
          delivery_run: {
            include: {
              driver: true
            }
          }
        }
      });

      if (!delivery) {
        throw new Error('Delivery not found');
      }

      const message = `SalesKik Delivery Confirmation: Please confirm delivery by replying with code: ${confirmationCode}. Driver: ${delivery.delivery_run.driver.first_name}`;

      // Send SMS confirmation request
      if (customerPhone) {
        await this.sendSMS(customerPhone, message);
        await this.logNotification(deliveryId, 'SMS', customerPhone, message, 'SENT');
      }

      // Store confirmation code (you might want to add this to your schema)
      // await prisma.delivery.update({
      //   where: { id: deliveryId },
      //   data: { confirmation_code: confirmationCode }
      // });

      return {
        success: true,
        confirmationCode
      };

    } catch (error) {
      console.error('Confirmation request error:', error);
      return {
        success: false,
        confirmationCode: ''
      };
    }
  }

  /**
   * Get notification history for a delivery
   */
  async getNotificationHistory(deliveryId: string): Promise<any[]> {
    try {
      return await prisma.deliveryNotification.findMany({
        where: { delivery_id: deliveryId },
        orderBy: { created_at: 'desc' }
      });
    } catch (error) {
      console.error('Error fetching notification history:', error);
      return [];
    }
  }

  /**
   * Update delivery status and send automatic notifications
   */
  async updateDeliveryStatusWithNotification(
    deliveryId: string,
    newStatus: 'EN_ROUTE' | 'ARRIVED' | 'DELIVERED',
    driverLocation?: { lat: number; lng: number }
  ): Promise<{ success: boolean; notificationsSent: any }> {
    
    try {
      // Update delivery status
      const delivery = await prisma.delivery.update({
        where: { id: deliveryId },
        data: {
          status: newStatus,
          actual_arrival: newStatus === 'ARRIVED' ? new Date() : undefined,
          actual_departure: newStatus === 'DELIVERED' ? new Date() : undefined
        },
        include: {
          customer: true,
          delivery_run: {
            include: {
              driver: true,
              vehicle: true
            }
          }
        }
      });

      // Send automatic notification based on status
      let notificationResults = null;
      if (delivery.notification_type !== 'NONE') {
        const notificationData: NotificationData = {
          customerName: delivery.customer.name,
          driverName: `${delivery.delivery_run.driver.first_name} ${delivery.delivery_run.driver.last_name}`,
          vehicleRegistration: delivery.delivery_run.vehicle.registration,
          estimatedArrival: delivery.estimated_arrival || new Date(),
          deliveryAddress: typeof delivery.delivery_address === 'string' 
            ? delivery.delivery_address 
            : (delivery.delivery_address as any).street || 'Delivery Address',
          contactPhone: delivery.delivery_run.driver.phone || undefined,
          specialInstructions: delivery.special_instructions || undefined
        };

        notificationResults = await this.sendDeliveryNotification(
          deliveryId,
          delivery.notification_type as any,
          newStatus,
          notificationData
        );
      }

      return {
        success: true,
        notificationsSent: notificationResults
      };

    } catch (error) {
      console.error('Error updating delivery status:', error);
      return {
        success: false,
        notificationsSent: null
      };
    }
  }
}

export default new DeliveryNotificationService();