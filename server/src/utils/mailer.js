import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter = null;

export function getTransporter() {
  if (!transporter) {
    if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
      transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });
    } else {
      // Fallback for development if SMTP is not provided
      transporter = {
        sendMail: async (opts) => {
          console.log('[DEV MAILER] Email simulated:', opts);
          return { messageId: 'simulated-' + Date.now() };
        },
      };
    }
  }
  return transporter;
}

export async function sendPasswordResetEmail({ to, resetUrl, displayName }) {
  const mailer = getTransporter();
  const subject = 'Reset Your Jeevan Password';
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #f8fafc; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #6366f1; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">JEEVAN</h1>
        <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Life RPG & Productivity System</p>
      </div>
      
      <div style="background-color: #ffffff; padding: 32px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        <h2 style="font-size: 20px; font-weight: 700; margin-top: 0; color: #0f172a;">Password Reset Request</h2>
        <p style="font-size: 15px; line-height: 1.6; color: #334155;">Hello ${displayName || 'Warrior'},</p>
        <p style="font-size: 15px; line-height: 1.6; color: #334155;">We received a request to reset your password for your Jeevan account. Click the button below to choose a new password:</p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="background-color: #6366f1; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);">Reset Password</a>
        </div>
        
        <p style="font-size: 13px; line-height: 1.6; color: #64748b; margin-bottom: 8px;">This link will expire in <strong>1 hour</strong>. If you did not request a password reset, you can safely ignore this email.</p>
        <p style="font-size: 12px; line-height: 1.5; color: #94a3b8; word-break: break-all;">Or copy and paste this URL into your browser:<br/><a href="${resetUrl}" style="color: #6366f1;">${resetUrl}</a></p>
      </div>

      <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #94a3b8;">
        &copy; ${new Date().getFullYear()} Jeevan. Master your discipline, conquer your quests.
      </div>
    </div>
  `;

  return mailer.sendMail({
    from: env.SMTP_FROM,
    to,
    subject,
    html,
  });
}
