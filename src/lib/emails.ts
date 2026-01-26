/**
 * EWF-ID Email Templates with i18n Support
 * 
 * Provides localized email templates for all authentication-related emails.
 * Uses Paraglide messages for translations.
 */

import { m } from "@/paraglide/messages";
import { getLocale, type Locale, setLocale } from "@/paraglide/runtime";

interface EmailTemplateData {
  name: string;
  [key: string]: string;
}

interface EmailResult {
  subject: string;
  html: string;
  text: string;
}

// Base email wrapper with styling
function wrapEmail(content: string, locale: Locale): string {
  const footerText = m.email_footer();
  const orgText = m.email_footer_org();
  
  return `
<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EWF-ID</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background-color: #f4f4f5; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .card { background: white; border-radius: 8px; padding: 32px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .logo { text-align: center; margin-bottom: 24px; }
    .logo img { height: 48px; width: 48px; }
    h1 { color: #0f172a; font-size: 24px; margin: 0 0 16px; }
    p { margin: 0 0 16px; color: #4b5563; }
    .button { display: inline-block; background: #0f172a; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; margin: 16px 0; }
    .button:hover { background: #1e293b; }
    .footer { text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; }
    .warning { background: #fef3cd; border: 1px solid #ffc107; border-radius: 6px; padding: 12px; margin: 16px 0; }
    ul { color: #4b5563; padding-left: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">
        <img src="https://id.ewf-stade.de/logo.svg" alt="EWF-ID">
      </div>
      ${content}
    </div>
    <div class="footer">
      <p>${footerText}</p>
      <p>${orgText}</p>
    </div>
  </div>
</body>
</html>`;
}

// Plain text email wrapper
function wrapTextEmail(content: string): string {
  const footerText = m.email_footer();
  const orgText = m.email_footer_org();
  
  return `EWF-ID
================

${content}

---
${footerText}
${orgText}`;
}

/**
 * Email verification email
 */
export function getVerificationEmail(data: { name: string; verificationUrl: string }, locale: Locale = "de"): EmailResult {
  // Set locale for message generation
  const originalLocale = getLocale();
  setLocale(locale);
  
  const subject = m.email_verification_subject();
  const greeting = m.email_verification_greeting({ name: data.name });
  const text = m.email_verification_text();
  const buttonText = m.email_verification_button();
  const expires = m.email_verification_expires();
  const ignore = m.email_verification_ignore();
  
  const html = wrapEmail(`
    <h1>${greeting}</h1>
    <p>${text}</p>
    <a href="${data.verificationUrl}" class="button">${buttonText}</a>
    <p><small>${expires}</small></p>
    <p><small>${ignore}</small></p>
  `, locale);
  
  const plainText = wrapTextEmail(`
${greeting}

${text}

${buttonText}: ${data.verificationUrl}

${expires}

${ignore}
  `);
  
  // Restore original locale
  setLocale(originalLocale);
  
  return { subject, html, text: plainText };
}

/**
 * Password reset email
 */
export function getPasswordResetEmail(data: { name: string; resetUrl: string }, locale: Locale = "de"): EmailResult {
  const originalLocale = getLocale();
  setLocale(locale);
  
  const subject = m.email_reset_subject();
  const greeting = m.email_reset_greeting({ name: data.name });
  const text = m.email_reset_text();
  const buttonText = m.email_reset_button();
  const expires = m.email_reset_expires();
  const ignore = m.email_reset_ignore();
  
  const html = wrapEmail(`
    <h1>${greeting}</h1>
    <p>${text}</p>
    <a href="${data.resetUrl}" class="button">${buttonText}</a>
    <p><small>${expires}</small></p>
    <p><small>${ignore}</small></p>
  `, locale);
  
  const plainText = wrapTextEmail(`
${greeting}

${text}

${buttonText}: ${data.resetUrl}

${expires}

${ignore}
  `);
  
  setLocale(originalLocale);
  
  return { subject, html, text: plainText };
}

/**
 * Account deletion confirmation email
 */
export function getDeletionEmail(data: { name: string; deletionDate: string; cancelUrl: string }, locale: Locale = "de"): EmailResult {
  const originalLocale = getLocale();
  setLocale(locale);
  
  const subject = m.email_deletion_subject();
  const greeting = m.email_deletion_greeting({ name: data.name });
  const text = m.email_deletion_text({ date: data.deletionDate });
  const cancel = m.email_deletion_cancel();
  const buttonText = m.email_deletion_button();
  const warning = m.email_deletion_warning();
  
  const html = wrapEmail(`
    <h1>${greeting}</h1>
    <p>${text}</p>
    <p>${cancel}</p>
    <a href="${data.cancelUrl}" class="button">${buttonText}</a>
    <div class="warning">
      <p><strong>⚠️</strong> ${warning}</p>
    </div>
  `, locale);
  
  const plainText = wrapTextEmail(`
${greeting}

${text}

${cancel}

${buttonText}: ${data.cancelUrl}

⚠️ ${warning}
  `);
  
  setLocale(originalLocale);
  
  return { subject, html, text: plainText };
}

/**
 * Welcome email for new users
 */
export function getWelcomeEmail(data: { name: string; dashboardUrl: string }, locale: Locale = "de"): EmailResult {
  const originalLocale = getLocale();
  setLocale(locale);
  
  const subject = m.email_welcome_subject();
  const greeting = m.email_welcome_greeting({ name: data.name });
  const text = m.email_welcome_text();
  const features = m.email_welcome_features();
  const feature1 = m.email_welcome_feature_1();
  const feature2 = m.email_welcome_feature_2();
  const feature3 = m.email_welcome_feature_3();
  const buttonText = m.email_welcome_button();
  
  const html = wrapEmail(`
    <h1>${greeting}</h1>
    <p>${text}</p>
    <p>${features}</p>
    <ul>
      <li>${feature1}</li>
      <li>${feature2}</li>
      <li>${feature3}</li>
    </ul>
    <a href="${data.dashboardUrl}" class="button">${buttonText}</a>
  `, locale);
  
  const plainText = wrapTextEmail(`
${greeting}

${text}

${features}
- ${feature1}
- ${feature2}
- ${feature3}

${buttonText}: ${data.dashboardUrl}
  `);
  
  setLocale(originalLocale);
  
  return { subject, html, text: plainText };
}

/**
 * Security alert email for new logins
 */
export function getSecurityAlertEmail(data: { name: string; device: string; location: string; time: string; changePasswordUrl: string }, locale: Locale = "de"): EmailResult {
  const originalLocale = getLocale();
  setLocale(locale);
  
  const subject = m.email_security_alert_subject();
  const greeting = m.email_security_greeting({ name: data.name });
  const text = m.email_security_text();
  const deviceText = m.email_security_device({ device: data.device });
  const locationText = m.email_security_location({ location: data.location });
  const timeText = m.email_security_time({ time: data.time });
  const warning = m.email_security_warning();
  const buttonText = m.email_security_button();
  
  const html = wrapEmail(`
    <h1>${greeting}</h1>
    <p>${text}</p>
    <ul>
      <li>${deviceText}</li>
      <li>${locationText}</li>
      <li>${timeText}</li>
    </ul>
    <div class="warning">
      <p><strong>⚠️</strong> ${warning}</p>
    </div>
    <a href="${data.changePasswordUrl}" class="button">${buttonText}</a>
  `, locale);
  
  const plainText = wrapTextEmail(`
${greeting}

${text}

${deviceText}
${locationText}
${timeText}

⚠️ ${warning}

${buttonText}: ${data.changePasswordUrl}
  `);
  
  setLocale(originalLocale);
  
  return { subject, html, text: plainText };
}

export type { EmailResult, EmailTemplateData };
