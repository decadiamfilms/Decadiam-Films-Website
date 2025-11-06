// Vercel Serverless Function for Resend Email
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, project, message } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: 'Decadiam Films Website <noreply@decadiamfilms.com>',
      to: ['liambudai04@gmail.com'],
      subject: `New Contact Form Submission from ${name}`,
      html: `
        <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #007AFF, #40A9FF); padding: 30px; border-radius: 15px 15px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 800;">DECADIAM FILMS</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">New Contact Form Submission</p>
          </div>
          
          <div style="background: #fafafa; padding: 30px; border-radius: 0 0 15px 15px;">
            <div style="background: white; padding: 25px; border-radius: 10px; margin-bottom: 20px; border-left: 4px solid #007AFF;">
              <h3 style="margin-top: 0; color: #333; font-size: 18px;">Contact Information</h3>
              <p style="margin: 10px 0; color: #666;"><strong style="color: #333;">Name:</strong> ${name}</p>
              <p style="margin: 10px 0; color: #666;"><strong style="color: #333;">Email:</strong> <a href="mailto:${email}" style="color: #007AFF; text-decoration: none;">${email}</a></p>
              ${project ? `<p style="margin: 10px 0; color: #666;"><strong style="color: #333;">Project Type:</strong> ${project}</p>` : ''}
            </div>
            
            <div style="background: white; padding: 25px; border-radius: 10px; border-left: 4px solid #007AFF;">
              <h3 style="margin-top: 0; color: #333; font-size: 18px;">Project Details</h3>
              <p style="white-space: pre-line; line-height: 1.8; color: #555; margin: 15px 0;">${message}</p>
            </div>
            
            <div style="margin-top: 25px; padding: 20px; background: #e3f2fd; border-radius: 10px; border: 1px solid #bbdefb;">
              <p style="margin: 0; font-size: 14px; color: #666; text-align: center;">
                📧 Reply directly to this email to respond to ${name}
              </p>
            </div>
          </div>
        </div>
      `,
      reply_to: email
    });

    if (error) {
      throw new Error(error.message || 'Failed to send email');
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Email sent successfully',
      id: data.id 
    });

  } catch (error) {
    console.error('Error sending email:', error);
    
    return res.status(500).json({ 
      error: 'Failed to send email',
      details: error.message 
    });
  }
}