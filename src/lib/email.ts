/**
 * Email service using Resend
 * Sends transactional emails for authentication flows
 */

import env from "#env";
import type { School } from "#data/schools";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email via Resend API
 */
async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: env.RESEND_FROM_EMAIL,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to send email: ${error}`);
    }
  } catch (error) {
    console.error("Email sending failed:", error);
    // Don't throw - we don't want email failures to break auth flows
    // Log to PostHog for monitoring
    if (typeof window !== "undefined" && window.posthog) {
      window.posthog.captureException(error);
    }
  }
}

/**
 * Send email verification email
 */
export async function sendVerificationEmail(params: {
  to: string;
  token: string;
  userName: string;
}): Promise<void> {
  const verifyUrl = `${env.HOST_URL}/verify-email?token=${params.token}`;
  
  await sendEmail({
    to: params.to,
    subject: "Verify your EWF-ID email address",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Verify your email address</h1>
            <p>Hi ${params.userName},</p>
            <p>Thanks for signing up for EWF-ID! Please verify your email address by clicking the button below:</p>
            <p><a href="${verifyUrl}" class="button">Verify Email Address</a></p>
            <p>Or copy and paste this link into your browser:</p>
            <p><code>${verifyUrl}</code></p>
            <p>This link will expire in 24 hours.</p>
            <div class="footer">
              <p>If you didn't create an account, you can safely ignore this email.</p>
              <p>— The EWF-ID Team</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Hi ${params.userName},

Thanks for signing up for EWF-ID! Please verify your email address by visiting:

${verifyUrl}

This link will expire in 24 hours.

If you didn't create an account, you can safely ignore this email.

— The EWF-ID Team
    `.trim(),
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(params: {
  to: string;
  token: string;
  userName: string;
}): Promise<void> {
  const resetUrl = `${env.HOST_URL}/reset-password?token=${params.token}`;
  
  await sendEmail({
    to: params.to,
    subject: "Reset your EWF-ID password",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { display: inline-block; padding: 12px 24px; background: #dc2626; color: white; text-decoration: none; border-radius: 6px; }
            .warning { background: #fef2f2; border: 1px solid #fecaca; padding: 12px; border-radius: 6px; margin: 20px 0; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Reset your password</h1>
            <p>Hi ${params.userName},</p>
            <p>We received a request to reset your EWF-ID password. Click the button below to choose a new password:</p>
            <p><a href="${resetUrl}" class="button">Reset Password</a></p>
            <p>Or copy and paste this link into your browser:</p>
            <p><code>${resetUrl}</code></p>
            <div class="warning">
              <strong>⚠️ Security Notice:</strong> This link will expire in 1 hour. If you didn't request a password reset, please ignore this email and consider changing your password as a precaution.
            </div>
            <div class="footer">
              <p>If you have any concerns, please contact us at compliance@ewf-stade.de</p>
              <p>— The EWF-ID Team</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Hi ${params.userName},

We received a request to reset your EWF-ID password. Visit this link to choose a new password:

${resetUrl}

This link will expire in 1 hour.

If you didn't request a password reset, please ignore this email and consider changing your password as a precaution.

— The EWF-ID Team
    `.trim(),
  });
}

/**
 * Send welcome email after successful registration
 */
export async function sendWelcomeEmail(params: {
  to: string;
  userName: string;
  school?: School | null;
}): Promise<void> {
  const dashboardUrl = `${env.HOST_URL}/dashboard`;
  
  await sendEmail({
    to: params.to,
    subject: "Welcome to EWF-ID!",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0; }
            .feature-list { background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Welcome to EWF-ID! 🎉</h1>
            <p>Hi ${params.userName},</p>
            <p>Your account has been successfully created${params.school ? ` for ${params.school.name}` : ""}. You now have access to all Erstwähler Forum applications!</p>
            
            <div class="feature-list">
              <h2>What you can do:</h2>
              <ul>
                <li><strong>Schedule:</strong> View and RSVP to events</li>
                <li><strong>Vote:</strong> Participate in polls and elections</li>
                <li><strong>Live:</strong> Engage during live events with Q&A and reactions</li>
                <li><strong>Profile:</strong> Customize your profile and manage security settings</li>
              </ul>
            </div>
            
            <p><a href="${dashboardUrl}" class="button">Go to Dashboard</a></p>
            
            <h3>Next steps:</h3>
            <ul>
              <li>Complete your profile information</li>
              <li>Enable two-factor authentication for extra security</li>
              <li>Set up a passkey for passwordless login</li>
            </ul>
            
            <div class="footer">
              <p>Need help? Check out our <a href="${env.HOST_URL}/privacy">Privacy Policy</a> or contact us at compliance@ewf-stade.de</p>
              <p>— The EWF-ID Team</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Hi ${params.userName},

Welcome to EWF-ID! 🎉

Your account has been successfully created${params.school ? ` for ${params.school.name}` : ""}. You now have access to all Erstwähler Forum applications!

Visit your dashboard: ${dashboardUrl}

What you can do:
- Schedule: View and RSVP to events
- Vote: Participate in polls and elections
- Live: Engage during live events with Q&A and reactions
- Profile: Customize your profile and manage security settings

Next steps:
1. Complete your profile information
2. Enable two-factor authentication for extra security
3. Set up a passkey for passwordless login

Need help? Visit ${env.HOST_URL}/privacy or contact us at compliance@ewf-stade.de

— The EWF-ID Team
    `.trim(),
  });
}

/**
 * Send 2FA setup confirmation email
 */
export async function send2FAEnabledEmail(params: {
  to: string;
  userName: string;
}): Promise<void> {
  await sendEmail({
    to: params.to,
    subject: "Two-factor authentication enabled",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .success { background: #f0fdf4; border: 1px solid #86efac; padding: 12px; border-radius: 6px; margin: 20px 0; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Two-factor authentication enabled</h1>
            <p>Hi ${params.userName},</p>
            <div class="success">
              <strong>✓ Success:</strong> Two-factor authentication has been enabled on your EWF-ID account.
            </div>
            <p>Your account is now more secure. You'll need to provide a code from your authenticator app when signing in.</p>
            <p><strong>Make sure you've saved your backup codes</strong> in a safe place. You'll need them if you lose access to your authenticator app.</p>
            <div class="footer">
              <p>If you didn't enable 2FA, please contact us immediately at compliance@ewf-stade.de</p>
              <p>— The EWF-ID Team</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Hi ${params.userName},

Two-factor authentication has been enabled on your EWF-ID account.

Your account is now more secure. You'll need to provide a code from your authenticator app when signing in.

Make sure you've saved your backup codes in a safe place. You'll need them if you lose access to your authenticator app.

If you didn't enable 2FA, please contact us immediately at compliance@ewf-stade.de

— The EWF-ID Team
    `.trim(),
  });
}
