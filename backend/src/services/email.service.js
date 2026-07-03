const nodemailer = require('nodemailer');
const { NotificationLog } = require('../models');

let transporter;
function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
  return transporter;
}

async function sendEmail({ to, subject, html, userId, type }) {
  let status = 'sent';
  let errorMsg = null;

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    status = 'skipped_no_smtp_config';
    console.log(`[EMAIL SKIPPED - no SMTP config] To: ${to} | Subject: ${subject}`);
  } else {
    try {
      await getTransporter().sendMail({
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to,
        subject,
        html
      });
    } catch (err) {
      status = 'failed';
      errorMsg = err.message;
      console.error('Email send failed:', err.message);
    }
  }

  try {
    await NotificationLog.create({
      userId: userId || null,
      type: type || 'email',
      channel: 'email',
      payload: JSON.stringify({ to, subject }),
      status: errorMsg ? `failed: ${errorMsg}` : status
    });
  } catch (e) {
    console.error('Failed to write notification log:', e.message);
  }

  return { status, error: errorMsg };
}

module.exports = { sendEmail };