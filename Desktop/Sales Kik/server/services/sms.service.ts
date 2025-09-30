// SMS Service using Twilio for sending text messages

interface SMSTemplate {
  to: string;
  body: string;
  from?: string;
}

class SMSService {
  private accountSid: string | null = null;
  private authToken: string | null = null;
  private fromNumber: string | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || null;
    this.authToken = process.env.TWILIO_AUTH_TOKEN || null;
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || null;
    
    if (this.accountSid && this.authToken && this.fromNumber && 
        this.accountSid !== 'your-twilio-account-sid' && 
        this.authToken !== 'your-twilio-auth-token' &&
        this.fromNumber !== 'your-twilio-phone-number') {
      this.isConfigured = true;
      console.log('✅ Twilio SMS service configured');
    } else {
      console.log('⚠️  Twilio SMS not configured - messages will be logged to console');
      this.isConfigured = false;
    }
  }

  async sendQuoteSMS(phoneNumber: string, quoteId: string, customerName: string, projectName: string, total: number, quoteLink: string): Promise<boolean> {
    const smsData: SMSTemplate = {
      to: this.formatPhoneNumber(phoneNumber),
      body: `Hi ${customerName}, your quote ${quoteId} for ${projectName} is ready! Total: $${total.toFixed(2)}. View & respond: ${quoteLink}`,
      from: this.fromNumber || undefined
    };

    return await this.sendSMS(smsData);
  }

  async sendCustomSMS(phoneNumber: string, message: string): Promise<boolean> {
    const smsData: SMSTemplate = {
      to: this.formatPhoneNumber(phoneNumber),
      body: message,
      from: this.fromNumber || undefined
    };

    return await this.sendSMS(smsData);
  }

  private async sendSMS(smsData: SMSTemplate): Promise<boolean> {
    try {
      if (this.isConfigured && this.accountSid && this.authToken) {
        // Send actual SMS via Twilio
        const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`, {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: smsData.to,
            From: smsData.from || this.fromNumber || '',
            Body: smsData.body
          }),
        });

        if (response.ok) {
          const result: any = await response.json();
          console.log(`✅ SMS sent successfully to ${smsData.to} via Twilio`);
          console.log(`SMS SID: ${result.sid}`);
          return true;
        } else {
          const error: any = await response.json();
          console.error('❌ Twilio API error:', error);
          throw new Error(`Twilio API error: ${error.message}`);
        }
      } else {
        // Fallback: Log to console for development
        console.log('📱 SMS (Development Mode - Twilio):');
        console.log(`To: ${smsData.to}`);
        console.log(`Message: ${smsData.body}`);
        console.log('─'.repeat(50));
        return true;
      }
    } catch (error) {
      console.error('❌ Failed to send SMS:', error);
      
      // Fallback: Always log to console if sending fails
      console.log('📱 SMS (Fallback Mode):');
      console.log(`To: ${smsData.to}`);
      console.log(`Message: ${smsData.body}`);
      console.log('─'.repeat(50));
      
      return false;
    }
  }

  // Format phone number for Australian numbers
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Handle Australian mobile numbers
    if (cleaned.startsWith('04')) {
      // Australian mobile format: 0412345678 -> +61412345678
      cleaned = '+61' + cleaned.substring(1);
    } else if (cleaned.startsWith('61')) {
      // Already has country code
      cleaned = '+' + cleaned;
    } else if (!cleaned.startsWith('+')) {
      // Assume Australian number if no country code
      if (cleaned.startsWith('0')) {
        cleaned = '+61' + cleaned.substring(1);
      } else {
        cleaned = '+61' + cleaned;
      }
    }
    
    return cleaned;
  }

  // Health check method
  async isHealthy(): Promise<boolean> {
    if (!this.isConfigured) {
      return true; // Console logging always works
    }

    try {
      // Test Twilio connection by checking account
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}.json`, {
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64'),
        },
      });
      
      return response.ok;
    } catch (error) {
      console.error('SMS service health check failed:', error);
      return false;
    }
  }

  // Get service status
  getStatus() {
    return {
      isConfigured: this.isConfigured,
      provider: 'Twilio',
      fromNumber: this.fromNumber ? this.fromNumber.replace(/\d(?=\d{4})/g, '*') : null // Mask most digits
    };
  }
}

export default new SMSService();