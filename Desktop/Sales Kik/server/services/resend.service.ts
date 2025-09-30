// Resend Email Service - Modern, reliable, generous free tier

interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
}

class ResendEmailService {
  private apiKey: string | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    this.apiKey = process.env.RESEND_API_KEY || null;
    
    if (this.apiKey && this.apiKey !== 'your-resend-api-key') {
      this.isConfigured = true;
      console.log('✅ Resend email service configured');
    } else {
      console.log('⚠️  Resend not configured - emails will be logged to console');
      this.isConfigured = false;
    }
  }

  async sendVerificationEmail(email: string, firstName: string, verificationCode: string): Promise<boolean> {
    const emailData: EmailTemplate = {
      to: email,
      subject: 'SalesKik - Verify Your Email Address',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SalesKik - Verify Your Email</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      line-height: 1.6;
    }
    
    .email-container {
      max-width: 600px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(59, 130, 246, 0.1);
    }
    
    .header {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      padding: 40px 30px;
      text-align: center;
      color: white;
    }
    
    .logo {
      font-size: 28px;
      font-weight: 800;
      margin-bottom: 10px;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
    
    .header-title {
      font-size: 24px;
      font-weight: 600;
      margin: 0;
    }
    
    .content {
      padding: 40px 30px;
    }
    
    .greeting {
      font-size: 18px;
      color: #1f2937;
      margin-bottom: 20px;
      font-weight: 600;
    }
    
    .message {
      color: #4b5563;
      margin-bottom: 30px;
      line-height: 1.6;
    }
    
    .code-section {
      background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
      border: 2px solid #93c5fd;
      border-radius: 12px;
      padding: 30px;
      text-align: center;
      margin: 30px 0;
    }
    
    .code-title {
      font-size: 16px;
      font-weight: 600;
      color: #1e40af;
      margin-bottom: 15px;
    }
    
    .verification-code {
      background: #ffffff;
      border: 3px solid #3b82f6;
      border-radius: 8px;
      padding: 20px;
      font-size: 32px;
      font-weight: 900;
      color: #1e40af;
      letter-spacing: 8px;
      font-family: monospace;
      margin: 15px 0;
      display: inline-block;
      min-width: 200px;
    }
    
    .expiry {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border: 1px solid #f59e0b;
      border-radius: 8px;
      padding: 15px;
      margin: 20px 0;
      text-align: center;
      color: #92400e;
      font-weight: 600;
    }
    
    .footer {
      background: #f8fafc;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 14px;
    }
    
    .brand-line {
      height: 4px;
      background: linear-gradient(90deg, #3b82f6 0%, #fb923c 50%, #3b82f6 100%);
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="logo">SALESKIK</div>
      <h1 class="header-title">Email Verification</h1>
    </div>
    
    <div class="content">
      <div class="greeting">Hi ${firstName}!</div>
      
      <div class="message">
        Welcome to <strong>SalesKik</strong>! Please verify your email address by entering the verification code below:
      </div>
      
      <div class="code-section">
        <div class="code-title">Your Verification Code</div>
        <div class="verification-code">${verificationCode}</div>
        <div style="color: #1e40af; font-size: 14px; margin-top: 10px;">
          Enter this code in SalesKik to continue
        </div>
      </div>
      
      <div class="expiry">
        This code expires in 2 minutes for your security
      </div>
      
      <div class="message">
        If you didn't create a SalesKik account, please ignore this email.
      </div>
    </div>
    
    <div class="footer">
      <div style="font-weight: 600; color: #374151; margin-bottom: 5px;">SalesKik</div>
      <div>Professional Business Management Made Simple</div>
      <div style="margin-top: 15px; font-size: 12px;">
        © 2025 SalesKik. All rights reserved.
      </div>
    </div>
  </div>
  
  <div class="brand-line"></div>
</body>
</html>
      `
    };

    return await this.sendEmail(emailData);
  }

  private async sendEmail(emailData: EmailTemplate): Promise<boolean> {
    try {
      if (this.isConfigured && this.apiKey) {
        // Send actual email via Resend
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL || 'adambudai2806@gmail.com',
            to: [emailData.to],
            subject: emailData.subject,
            html: emailData.html,
          }),
        });

        if (response.ok) {
          const result: any = await response.json();
          console.log(`✅ Email sent successfully to ${emailData.to} via Resend`);
          console.log(`Email ID: ${result.id}`);
          return true;
        } else {
          const error: any = await response.json();
          console.error('❌ Resend API error:', error);
          throw new Error(`Resend API error: ${error.message}`);
        }
      } else {
        // Fallback: Log to console for development
        console.log('📧 EMAIL (Development Mode - Resend):');
        console.log(`To: ${emailData.to}`);
        console.log(`Subject: ${emailData.subject}`);
        console.log('HTML email would be sent with beautiful SalesKik branding');
        console.log('─'.repeat(50));
        return true;
      }
    } catch (error) {
      console.error('❌ Failed to send email via Resend:', error);
      
      // Fallback: Always log to console if sending fails
      console.log('📧 EMAIL (Fallback Mode):');
      console.log(`To: ${emailData.to}`);
      console.log(`Subject: ${emailData.subject}`);
      console.log('Beautiful verification email with SalesKik branding');
      console.log('─'.repeat(50));
      
      return false;
    }
  }
}

export default new ResendEmailService();