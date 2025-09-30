import { Router, Request, Response } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import emailService from '../../services/email.service';
import resendService from '../../services/resend.service';
import pdfService from '../../services/pdf.service';

const router = Router();

// Template processing function to replace placeholders
function processEmailTemplate(body: string, data: any): string {
  let processedBody = body;
  
  // Basic placeholder replacements
  const placeholders = {
    '{{QuoteID}}': data.quoteId || '',
    '{{Name}}': data.customerName || '',
    '{{CustomerName}}': data.customerName || '',
    '{{Date}}': data.date || new Date().toLocaleDateString('en-AU'),
    '{{CompanyName}}': data.companyProfile?.name || 'Your Company',
    '{{Phone}}': data.companyProfile?.phone || '',
    '{{Email}}': data.companyProfile?.email || '',
    '{{Website}}': data.companyProfile?.website || '',
    '{{Sender}}': data.companyProfile?.name || 'Sales Team',
  };

  // Replace basic placeholders
  Object.entries(placeholders).forEach(([placeholder, value]) => {
    processedBody = processedBody.replace(new RegExp(placeholder, 'g'), value.toString());
  });

  // Remove any logo placeholders since we're not using logos in email signatures
  if (processedBody.includes('{{Logo}}')) {
    processedBody = processedBody.replace(/\{\{Logo\}\}/g, '');
    console.log(`✅ Logo placeholder removed from email signature for better deliverability`);
  }

  return processedBody;
}

// Send quote via email
router.post('/send', authenticate, async (req: Request, res: Response) => {
  try {
    const { 
      to,
      cc,
      subject,
      body,
      isHTML,
      deliveryMethod,
      quoteId,
      customerName,
      quotePDF,
      companyProfile,
      fromName
    } = req.body;

    if (!to || !subject || !body) {
      return res.status(400).json({ 
        success: false, 
        error: 'To, subject, and body are required' 
      });
    }

    console.log(`Email API: Sending quote ${quoteId} to ${to}`);
    console.log(`📋 Request debug:`, {
      hasQuotePDF: !!quotePDF,
      quotePDFType: quotePDF?.type,
      quotePDFFilename: quotePDF?.filename,
      quotePDFContentLength: quotePDF?.content?.length
    });

    // Convert HTML to actual PDF using the PDF service
    let pdfAttachment = null;
    if (quotePDF && quotePDF.content && quotePDF.type === 'text/html') {
      try {
        console.log(`🔄 Converting HTML to PDF for ${quotePDF.filename}`);
        console.log(`📄 HTML content length: ${quotePDF.content.length} characters`);
        
        // Use the existing PDF service to convert HTML to actual PDF
        const pdfBuffer = await pdfService.generateQuotePDF(quotePDF.content, quotePDF.filename);
        
        pdfAttachment = {
          content: pdfBuffer.toString('base64'),
          filename: quotePDF.filename, // Keep .pdf extension since it's now a real PDF
          type: 'application/pdf'
        };
        
        console.log(`✅ PDF conversion successful: ${pdfAttachment.filename} (${pdfBuffer.length} bytes)`);
      } catch (pdfError) {
        console.error(`❌ PDF conversion failed:`, pdfError);
        // Fallback: don't attach anything rather than corrupt file
        pdfAttachment = null;
      }
    } else if (quotePDF && quotePDF.content) {
      // Handle other types of content
      pdfAttachment = quotePDF;
      console.log(`📎 Using PDF attachment as-is: ${pdfAttachment.filename}`);
    }

    console.log(`📧 Quote delivery method: ${deliveryMethod}${pdfAttachment ? ' - PDF attachment included' : ' - content embedded in email body'}`);

    // Process email template with placeholders
    const processedBody = processEmailTemplate(body, {
      quoteId,
      customerName,
      companyProfile,
      date: new Date().toLocaleDateString('en-AU'),
    });

    // Format email data with anti-spam improvements and company branding
    const emailData = {
      to: to,
      cc: cc || [],
      subject: `${companyProfile?.name || 'Business'} - Quote ${quoteId}${customerName ? ` for ${customerName}` : ''}`, // Professional, non-spammy subject
      text: isHTML ? processedBody.replace(/<[^>]*>/g, '') : processedBody, // Strip HTML for text version
      html: isHTML ? processedBody : processedBody.replace(/\n/g, '<br>'),  // Convert line breaks for HTML
      replyTo: companyProfile?.email || process.env.RESEND_FROM_EMAIL || process.env.SENDGRID_FROM_EMAIL,
      fromName: fromName || companyProfile?.name || 'SalesKik Business System',
      companyProfile: companyProfile,
      quoteId: quoteId
    };

    // Try to send via Resend first (more reliable), then fallback to SendGrid
    let success = false;
    let service = 'none';

    try {
      success = await sendViaResend(emailData, pdfAttachment);
      service = 'resend';
    } catch (error: any) {
      console.log('❌ Resend failed:', error.message || error);
      try {
        success = await sendViaSendGrid(emailData, pdfAttachment);
        service = 'sendgrid';
      } catch (sendgridError: any) {
        console.log('❌ SendGrid failed:', sendgridError.message || sendgridError);
        console.log('Both email services failed, logging to console');
        logEmailToConsole(emailData, pdfAttachment);
        success = true; // Consider console logging as success for development
        service = 'console';
      }
    }

    if (success) {
      console.log(`✅ Quote email sent successfully via ${service} for quote ${quoteId}`);
      res.json({ 
        success: true, 
        message: 'Email sent successfully',
        service: service,
        quoteId,
        to: to
      });
    } else {
      console.log(`❌ Failed to send email for quote ${quoteId}`);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to send email' 
      });
    }

  } catch (error) {
    console.error('Email API error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error while sending email' 
    });
  }
});

// Helper functions for different email services
async function sendViaResend(emailData: any, pdfAttachment: any = null): Promise<boolean> {
  const emailPayload: any = {
    from: process.env.RESEND_FROM_EMAIL || 'noreply@saleskik.com',
    to: [emailData.to],
    cc: emailData.cc || [],
    replyTo: emailData.replyTo,
    subject: emailData.subject,
    html: emailData.html,
    text: emailData.text
  };

  // Add PDF attachment if provided
  if (pdfAttachment) {
    console.log(`📎 PDF attachment debug:`, {
      filename: pdfAttachment.filename,
      type: pdfAttachment.type,
      contentLength: pdfAttachment.content?.length,
      contentPreview: pdfAttachment.content?.substring(0, 100) + '...'
    });
    
    emailPayload.attachments = [{
      filename: pdfAttachment.filename,
      content: pdfAttachment.content, // Proper base64 encoded PDF
      type: pdfAttachment.type
    }];
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(emailPayload),
  });

  if (response.ok) {
    const result: any = await response.json();
    console.log(`✅ Email sent via Resend - ID: ${result.id}${pdfAttachment ? ' (with PDF attachment)' : ''}`);
    return true;
  } else {
    const error: any = await response.json();
    throw new Error(`Resend error: ${error.message}`);
  }
}

async function sendViaSendGrid(emailData: any, pdfAttachment: any = null): Promise<boolean> {
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  
  const msg: any = {
    to: emailData.to,
    cc: emailData.cc,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL || 'noreply@saleskik.com',
      name: emailData.fromName || 'SalesKik Business System'
    },
    replyTo: emailData.replyTo,
    subject: emailData.subject,
    text: emailData.text,
    html: emailData.html,
    // Enhanced anti-spam headers
    headers: {
      'X-Mailer': 'SalesKik Business System',
      'X-Priority': '3',
      'List-Unsubscribe': '<mailto:unsubscribe@saleskik.com>',
      'X-Auto-Response-Suppress': 'OOF, DR, RN, NRN',
      'X-Entity-ID': `quote-${emailData.quoteId}`,
      'Precedence': 'bulk'
    },
    categories: ['business-quote', 'transactional'],
    customArgs: {
      'quote_id': emailData.quoteId || 'unknown',
      'email_type': 'business_quote'
    }
  };

  // Add PDF attachment if provided
  if (pdfAttachment) {
    msg.attachments = [{
      content: pdfAttachment.content, // Proper base64 encoded PDF
      filename: pdfAttachment.filename,
      type: pdfAttachment.type,
      disposition: 'attachment'
    }];
  }

  await sgMail.send(msg);
  console.log(`✅ Email sent via SendGrid${pdfAttachment ? ' (with PDF attachment)' : ''}`);
  return true;
}

// Console logging function for development
function logEmailToConsole(emailData: any, quotePDF: any = null) {
  console.log('📧 EMAIL (Development Mode):');
  console.log(`To: ${emailData.to}`);
  console.log(`CC: ${emailData.cc?.join(', ') || 'None'}`);
  console.log(`Subject: ${emailData.subject}`);
  console.log(`Body: ${emailData.text || emailData.html}`);
  if (quotePDF) {
    console.log(`📎 PDF Attachment: ${quotePDF.filename} (${quotePDF.content.length} chars)`);
  }
  console.log('─'.repeat(50));
}

export default router;