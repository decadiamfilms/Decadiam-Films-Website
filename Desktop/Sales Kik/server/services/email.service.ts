import sgMail from '@sendgrid/mail';

interface EmailTemplate {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

class EmailService {
  private isConfigured: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const apiKey = process.env.SENDGRID_API_KEY;
    
    if (apiKey && apiKey !== 'your-sendgrid-api-key') {
      sgMail.setApiKey(apiKey);
      this.isConfigured = true;
      console.log('✅ SendGrid email service configured');
    } else {
      console.log('⚠️  SendGrid not configured - emails will be logged to console');
      this.isConfigured = false;
    }
  }

  async sendVerificationEmail(email: string, firstName: string, verificationCode: string): Promise<boolean> {
    const emailData: EmailTemplate = {
      to: email,
      subject: 'SalesKik - Verify Your Email Address',
      text: `
Hi ${firstName || 'there'},

Welcome to SalesKik! Please verify your email address with the code below:

Verification Code: ${verificationCode}

This code will expire in 2 minutes for security.

If you didn't create a SalesKik account, please ignore this email.

Best regards,
The SalesKik Team
      `,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SalesKik - Verify Your Email</title>
  <style>
    /* Reset and base styles */
    body, table, td, p, a, li, blockquote { 
      -webkit-text-size-adjust: 100%; 
      -ms-text-size-adjust: 100%; 
    }
    table, td { 
      mso-table-lspace: 0pt; 
      mso-table-rspace: 0pt; 
    }
    img { 
      -ms-interpolation-mode: bicubic; 
      max-width: 100%; 
      height: auto; 
      border: 0;
    }
    
    /* SalesKik Brand Colors */
    body {
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%);
      line-height: 1.6;
    }
    
    .email-wrapper {
      padding: 40px 20px;
      background: linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%);
      min-height: 100vh;
    }
    
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
      border: 1px solid rgba(59, 130, 246, 0.1);
    }
    
    /* Beautiful Header with SalesKik Branding */
    .header {
      background: linear-gradient(135deg, #D4A574 0%, #B8935F 50%, #A67C52 100%);
      padding: 50px 40px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    
    .header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: 
        radial-gradient(circle at 20% 20%, rgba(212, 165, 116, 0.2) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
        url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
    }
    
    .logo-container {
      position: relative;
      z-index: 3;
      margin-bottom: 30px;
    }
    
    .logo {
      width: 140px;
      height: auto;
      filter: brightness(0) invert(1) drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
    }
    
    .header-title {
      color: #ffffff;
      font-size: 32px;
      font-weight: 800;
      margin: 0 0 10px 0;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      position: relative;
      z-index: 3;
    }
    
    .header-subtitle {
      color: rgba(255, 255, 255, 0.95);
      font-size: 16px;
      margin: 0;
      font-weight: 400;
      position: relative;
      z-index: 3;
    }
    
    /* Content Styling */
    .content {
      padding: 50px 40px;
    }
    
    .greeting {
      font-size: 20px;
      color: #1F2937;
      margin-bottom: 25px;
      font-weight: 600;
    }
    
    .welcome-message {
      font-size: 16px;
      color: #4B5563;
      margin-bottom: 35px;
      line-height: 1.7;
    }
    
    /* Stunning Verification Code Section */
    .verification-section {
      background: linear-gradient(135deg, #EBF4FF 0%, #DBEAFE 100%);
      border: 3px solid #93C5FD;
      border-radius: 20px;
      padding: 40px 30px;
      text-align: center;
      margin: 35px 0;
      position: relative;
      box-shadow: 0 8px 25px rgba(59, 130, 246, 0.15);
    }
    
    .verification-section::before {
      content: '✉️';
      position: absolute;
      top: -20px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #3B82F6, #1D4ED8);
      padding: 15px;
      border-radius: 50%;
      font-size: 24px;
      box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
      border: 4px solid #ffffff;
    }
    
    .code-title {
      font-size: 20px;
      font-weight: 700;
      color: #1E40AF;
      margin-bottom: 20px;
      margin-top: 10px;
    }
    
    .verification-code {
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
      border: 4px solid #3B82F6;
      border-radius: 16px;
      padding: 25px 30px;
      font-size: 42px;
      font-weight: 900;
      color: #1E40AF;
      letter-spacing: 12px;
      font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
      text-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
      margin: 20px 0;
      display: inline-block;
      min-width: 280px;
      box-shadow: 
        inset 0 2px 4px rgba(59, 130, 246, 0.1),
        0 4px 12px rgba(59, 130, 246, 0.2);
    }
    
    .code-instruction {
      color: #1E40AF;
      font-size: 14px;
      font-weight: 500;
      margin-top: 15px;
    }
    
    .expiry-warning {
      background: linear-gradient(135deg, #FEF3C7 0%, #FEF08A 100%);
      border: 2px solid #F59E0B;
      border-radius: 12px;
      padding: 15px 20px;
      margin: 25px 0;
      text-align: center;
    }
    
    .expiry-text {
      color: #92400E;
      font-size: 14px;
      font-weight: 600;
      margin: 0;
    }
    
    .security-note {
      background: linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%);
      border: 2px solid #86EFAC;
      border-radius: 16px;
      padding: 25px;
      margin: 30px 0;
    }
    
    .security-title {
      color: #15803D;
      font-weight: 700;
      margin-bottom: 12px;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    
    .security-text {
      color: #166534;
      font-size: 14px;
      margin: 0;
      line-height: 1.6;
    }
    
    /* Beautiful Footer */
    .footer {
      background: linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%);
      padding: 40px 30px;
      text-align: center;
      border-top: 1px solid #E5E7EB;
    }
    
    .footer-logo {
      width: 100px;
      height: auto;
      margin-bottom: 20px;
      opacity: 0.8;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
    }
    
    .footer-brand {
      color: #1F2937;
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    
    .footer-tagline {
      color: #6B7280;
      font-size: 14px;
      margin-bottom: 20px;
      font-style: italic;
    }
    
    .footer-text {
      color: #9CA3AF;
      font-size: 12px;
      margin: 5px 0;
    }
    
    .footer-links {
      margin-top: 20px;
      border-top: 1px solid #E5E7EB;
      padding-top: 20px;
    }
    
    .footer-link {
      color: #3B82F6;
      text-decoration: none;
      margin: 0 15px;
      font-size: 13px;
      font-weight: 500;
      transition: color 0.3s ease;
    }
    
    .footer-link:hover {
      color: #1D4ED8;
      text-decoration: underline;
    }
    
    .brand-stripe {
      width: 100%;
      height: 6px;
      background: linear-gradient(90deg, 
        #3B82F6 0%, 
        #D4A574 25%, 
        #10B981 50%, 
        #F59E0B 75%, 
        #3B82F6 100%
      );
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <!-- Branded Header -->
      <div class="header">
        <div class="logo-container">
          <img src="${process.env.CLIENT_URL || 'http://localhost:3001'}/saleskik-logo.png" alt="SalesKik Logo" class="logo" />
        </div>
        <h1 class="header-title">Email Verification</h1>
        <p class="header-subtitle">Secure your SalesKik account</p>
      </div>
      
      <!-- Main Content -->
      <div class="content">
        <div class="greeting">Hi ${firstName || 'there'}! 👋</div>
        
        <div class="welcome-message">
          Welcome to <strong>SalesKik</strong>! We're thrilled to have you join thousands of businesses 
          who trust SalesKik to manage their sales, inventory, and customer relationships.
        </div>
        
        <div class="welcome-message">
          To complete your account setup and ensure the highest level of security, 
          please verify your email address using the verification code below:
        </div>
        
        <!-- Beautiful Verification Code -->
        <div class="verification-section">
          <div class="code-title">Your Verification Code</div>
          <div class="verification-code">${verificationCode}</div>
          <div class="code-instruction">Enter this code in SalesKik to continue</div>
        </div>
        
        <!-- Expiry Warning -->
        <div class="expiry-warning">
          <div class="expiry-text">⏰ This code expires in 2 minutes for your security</div>
        </div>
        
        <!-- Security Information -->
        <div class="security-note">
          <div class="security-title">🛡️ Security & Privacy</div>
          <p class="security-text">
            This verification ensures only you can access your SalesKik account. 
            If you didn't create this account, please ignore this email - no account will be created.
          </p>
        </div>
        
        <div class="welcome-message">
          <strong>What's next?</strong> After verification, you'll set up your business profile, 
          choose your plan, and start exploring SalesKik's powerful features!
        </div>
      </div>
      
      <!-- Professional Footer -->
      <div class="footer">
        <img src="${process.env.CLIENT_URL || 'http://localhost:3001'}/saleskik-logo.png" alt="SalesKik" class="footer-logo" />
        <div class="footer-brand">SalesKik</div>
        <div class="footer-tagline">Professional Business Management Made Simple</div>
        
        <div class="footer-text">© 2025 SalesKik. All rights reserved.</div>
        <div class="footer-text">Empowering businesses with intelligent automation</div>
        
        <div class="footer-links">
          <a href="${process.env.CLIENT_URL}/support" class="footer-link">Support Center</a>
          <a href="${process.env.CLIENT_URL}/privacy" class="footer-link">Privacy Policy</a>
          <a href="${process.env.CLIENT_URL}/terms" class="footer-link">Terms of Service</a>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Brand Accent Stripe -->
  <div class="brand-stripe"></div>
</body>
</html>
      `
    };

    return await this.sendEmail(emailData);
  }

  async sendWelcomeEmail(email: string, firstName: string, companyName: string): Promise<boolean> {
    const emailData: EmailTemplate = {
      to: email,
      subject: 'Welcome to SalesKik - Your Account is Ready!',
      text: `
Hi ${firstName},

Welcome to SalesKik! Your account for ${companyName} has been successfully created.

You can now access your dashboard and start managing your business with SalesKik's powerful tools.

What you can do next:
• Create your first quote
• Add your products to inventory
• Invite team members
• Customize your settings

If you need any help getting started, our support team is here to assist you.

Best regards,
The SalesKik Team
      `,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; background: linear-gradient(135deg, #3B82F6, #1D4ED8); color: white; padding: 30px; border-radius: 8px; }
    .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
    .welcome-box { background: #F0F9FF; border: 2px solid #0EA5E9; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .action-list { background: #F9FAFB; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .action-item { margin: 10px 0; }
    .button { display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; }
    .footer { margin-top: 30px; font-size: 12px; color: #6B7280; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">SALESKIK</div>
      <h1>Welcome to SalesKik!</h1>
      <p>Your business management platform is ready</p>
    </div>
    
    <p>Hi ${firstName},</p>
    
    <div class="welcome-box">
      <p><strong>Congratulations!</strong> Your SalesKik account for <strong>${companyName}</strong> has been successfully created and verified.</p>
    </div>
    
    <p>You can now access your dashboard and start managing your business with SalesKik's powerful tools.</p>
    
    <div class="action-list">
      <h3>What you can do next:</h3>
      <div class="action-item">📋 Create your first quote</div>
      <div class="action-item">📦 Add your products to inventory</div>
      <div class="action-item">👥 Invite team members</div>
      <div class="action-item">⚙️ Customize your settings</div>
    </div>
    
    <p style="text-align: center;">
      <a href="${process.env.CLIENT_URL}/dashboard" class="button">Access Your Dashboard</a>
    </p>
    
    <p>If you need any help getting started, our support team is here to assist you at support@saleskik.com</p>
    
    <p>Best regards,<br>The SalesKik Team</p>
    
    <div class="footer">
      <p>This email was sent by SalesKik. If you have questions, contact us at support@saleskik.com</p>
    </div>
  </div>
</body>
</html>
      `
    };

    return await this.sendEmail(emailData);
  }

  private async sendEmail(emailData: EmailTemplate): Promise<boolean> {
    try {
      if (this.isConfigured) {
        // Send actual email via SendGrid
        const msg = {
          to: emailData.to,
          from: process.env.SENDGRID_FROM_EMAIL || 'noreply@saleskik.com',
          subject: emailData.subject,
          text: emailData.text,
          html: emailData.html
        };

        await sgMail.send(msg);
        console.log(`✅ Email sent successfully to ${emailData.to}`);
        return true;
      } else {
        // Fallback: Log to console for development
        console.log('📧 EMAIL (Development Mode):');
        console.log(`To: ${emailData.to}`);
        console.log(`Subject: ${emailData.subject}`);
        console.log(`Text:\n${emailData.text}`);
        console.log('─'.repeat(50));
        return true;
      }
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      
      // Fallback: Always log to console if sending fails
      console.log('📧 EMAIL (Fallback Mode):');
      console.log(`To: ${emailData.to}`);
      console.log(`Subject: ${emailData.subject}`);
      console.log(`Text:\n${emailData.text}`);
      console.log('─'.repeat(50));
      
      return false;
    }
  }

  // Health check method
  async isHealthy(): Promise<boolean> {
    if (!this.isConfigured) {
      return true; // Console logging always works
    }

    try {
      // Test SendGrid connection
      return true; // In production, you could test with SendGrid API
    } catch (error) {
      console.error('Email service health check failed:', error);
      return false;
    }
  }
}

export default new EmailService();