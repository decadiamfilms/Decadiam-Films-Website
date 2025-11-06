// Resend Email Handler
// This would typically run on a server like Vercel, Netlify Functions, or Node.js

const RESEND_API_KEY = 're_5HiKNY3e_9FeEpQbmX42zfBiDBQqVyiHN';

async function sendEmail(formData) {
    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            from: 'contact@decadiamfilms.com',
            to: 'liam@youremail.com', // Replace with your actual email
            subject: 'New Contact Form Submission - Decadiam Films',
            html: `
                <h2>New Contact Form Submission</h2>
                <p><strong>Name:</strong> ${formData.name}</p>
                <p><strong>Email:</strong> ${formData.email}</p>
                <p><strong>Project Type:</strong> ${formData.project}</p>
                <p><strong>Message:</strong></p>
                <p>${formData.message}</p>
            `
        })
    });
    
    return response.json();
}

// Export for serverless functions
module.exports = { sendEmail };