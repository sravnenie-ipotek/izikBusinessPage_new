// Vercel Serverless Function for Form Handling
// This handles all contact form submissions

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const { name, email, phone, message, subject, formType } = req.body;

    // Validate required fields
    if (!email || !message) {
      return res.status(400).json({
        error: 'Email and message are required'
      });
    }

    // Option 1: Send via email service (configure one below)
    const emailSent = await sendEmail({
      to: 'contact@normandpllc.com', // Change to your email
      from: email,
      subject: subject || `Contact Form: ${formType || 'General Inquiry'}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name || 'Not provided'}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
        <hr>
        <p><small>Sent from: ${req.headers.referer || 'normandpllc.com'}</small></p>
      `
    });

    // Option 2: Save to database (uncomment if using a database)
    // await saveToDatabase({ name, email, phone, message, subject });

    // Success response
    return res.status(200).json({
      success: true,
      message: 'Form submitted successfully!'
    });

  } catch (error) {
    console.error('Form submission error:', error);
    return res.status(500).json({
      error: 'Failed to submit form. Please try again.'
    });
  }
}

// Email sending function - Choose ONE of these options:

// Option A: Using Resend (recommended for Vercel)
async function sendEmail(data) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY; // Add to Vercel env vars

  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured');
    // For now, just log the submission
    console.log('Form submission:', data);
    return true;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'onboarding@resend.dev', // Change after domain verification
      to: data.to,
      subject: data.subject,
      html: data.html,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to send email');
  }

  return true;
}

// Option B: Using SendGrid (alternative)
/*
async function sendEmail(data) {
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(SENDGRID_API_KEY);

  const msg = {
    to: data.to,
    from: 'noreply@normandpllc.com', // Must be verified sender
    subject: data.subject,
    html: data.html,
  };

  await sgMail.send(msg);
  return true;
}
*/

// Option C: Using Nodemailer with Gmail
/*
async function sendEmail(data) {
  const nodemailer = require('nodemailer');

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: data.from,
    to: data.to,
    subject: data.subject,
    html: data.html,
  });

  return true;
}
*/