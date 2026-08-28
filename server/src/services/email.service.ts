import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import { dbGet, dbRun } from '../database/db';

export interface SendOtpOptions {
  email: string;
  purpose: 'REGISTRATION' | 'LOGIN' | 'PASSWORD_RESET';
  collegeName?: string;
  userName?: string;
}

// Nodemailer Transporter Configuration (supports Gmail, Outlook, AWS SES, Custom College SMTP)
function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  // If using Gmail Service preset
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }

  return null;
}

/**
 * Generate a 6-digit OTP code and save it to the database with a 10-minute validity
 */
export function generateAndStoreOTP(email: string, purpose: string): string {
  const normalizedEmail = email.toLowerCase().trim();
  // 6-digit random code between 100000 and 999999
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const id = uuidv4();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes from now

  // Invalidate any existing unused OTPs for this email and purpose
  dbRun(
    `UPDATE email_otps SET is_used = 1 WHERE email = ? AND purpose = ? AND is_used = 0`,
    [normalizedEmail, purpose]
  );

  // Insert new OTP
  dbRun(
    `INSERT INTO email_otps (id, email, otp_code, purpose, expires_at, is_used)
     VALUES (?, ?, ?, ?, ?, 0)`,
    [id, normalizedEmail, otpCode, purpose, expiresAt]
  );

  return otpCode;
}

/**
 * Verify a 6-digit OTP code
 */
export function verifyOTP(email: string, otpCode: string, purpose: string, markAsUsed: boolean = true): boolean {
  const normalizedEmail = email.toLowerCase().trim();
  const cleanOtp = otpCode.trim();

  const record = dbGet<{ id: string; expires_at: string }>(
    `SELECT id, expires_at FROM email_otps 
     WHERE email = ? AND otp_code = ? AND purpose = ? AND is_used = 0
     ORDER BY created_at DESC LIMIT 1`,
    [normalizedEmail, cleanOtp, purpose]
  );

  if (!record) {
    return false;
  }

  // Check if expired
  const expiry = new Date(record.expires_at).getTime();
  if (Date.now() > expiry) {
    return false;
  }

  // Mark as used if requested
  if (markAsUsed) {
    dbRun(`UPDATE email_otps SET is_used = 1 WHERE id = ?`, [record.id]);
  }
  return true;
}

/**
 * Send an OTP Verification Email with responsive HTML formatting
 */
export async function sendOTPEmail(options: SendOtpOptions): Promise<{ success: boolean; otpCode: string; previewUrl?: string }> {
  const { email, purpose, collegeName = 'CampusNexus AI College', userName = 'Campus Member' } = options;
  const otpCode = generateAndStoreOTP(email, purpose);

  const purposeLabels: Record<string, { title: string; desc: string }> = {
    REGISTRATION: {
      title: 'College Account Email Verification',
      desc: 'Please enter this one-time code to verify your official academic email and submit your registration.',
    },
    LOGIN: {
      title: 'One-Time Login Passcode',
      desc: 'Use this one-time security code to log into your CampusNexus AI college workspace.',
    },
    PASSWORD_RESET: {
      title: 'Security Password Reset',
      desc: 'Use this code to verify your identity and reset your college portal password.',
    },
  };

  const info = purposeLabels[purpose] || {
    title: 'Verification Code',
    desc: 'Use this one-time verification code for your college account action.',
  };

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
      <div style="background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">${collegeName}</h1>
        <p style="margin: 6px 0 0; font-size: 13px; color: #c7d2fe; font-weight: 500;">CampusNexus AI Operating System</p>
      </div>

      <div style="padding: 32px 28px;">
        <h2 style="margin: 0 0 8px; font-size: 18px; color: #0f172a; font-weight: 700;">${info.title}</h2>
        <p style="margin: 0 0 20px; font-size: 14px; color: #475569; line-height: 1.5;">
          Hello <strong>${userName}</strong>,<br/>
          ${info.desc}
        </p>

        <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
          <span style="font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 1px; text-transform: uppercase;">Your 6-Digit Verification Code</span>
          <div style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #4f46e5; margin: 10px 0; font-family: monospace;">
            ${otpCode}
          </div>
          <span style="font-size: 12px; color: #94a3b8; font-weight: 500;">⏱️ Valid for 10 minutes</span>
        </div>

        <p style="margin: 20px 0 0; font-size: 12px; color: #64748b; line-height: 1.5;">
          <strong>Security Notice:</strong> If you did not request this verification code, please ignore this email or contact your college administrator immediately. Do not share this OTP with anyone.
        </p>
      </div>

      <div style="background-color: #f1f5f9; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
        © ${new Date().getFullYear()} ${collegeName} • Powered by CampusNexus AI
      </div>
    </div>
  `;

  const transporter = createTransporter();

  if (transporter) {
    try {
      const fromAddress = process.env.SMTP_FROM || `"CampusNexus AI" <${process.env.SMTP_USER || process.env.GMAIL_USER || 'no-reply@campusnexus.edu'}>`;
      await transporter.sendMail({
        from: fromAddress,
        to: email,
        subject: `[${otpCode}] ${info.title} - ${collegeName}`,
        html: htmlContent,
      });
      console.log(`📧 Live SMTP Email delivered to ${email} (Code: ${otpCode})`);
      return { success: true, otpCode };
    } catch (err: any) {
      console.error(`❌ SMTP delivery failed for ${email}:`, err.message);
      // Fallback log for development
    }
  }

  // Terminal Styled Log for immediate local verification
  console.log(`\n======================================================`);
  console.log(`🔐 CAMPUSNEXUS AI EMAIL OTP SIMULATOR`);
  console.log(`📬 Destination: ${email}`);
  console.log(`🎯 Purpose:     ${purpose}`);
  console.log(`🔑 6-DIGIT OTP: ${otpCode}`);
  console.log(`⏱️ Expiry:      10 Minutes`);
  console.log(`======================================================\n`);

  return { success: true, otpCode };
}
