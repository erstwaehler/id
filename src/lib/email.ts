/**
 * Email Service using Resend
 * Implements SPEC.md email sending requirements
 */
import { Resend } from "resend";
import env from "#env";

// Initialize Resend client
const resend = new Resend(env.RESEND_API_KEY);

interface SendEmailOptions {
	to: string;
	subject: string;
	html: string;
	text?: string;
}

/**
 * Send an email using Resend
 */
export async function sendEmail(options: SendEmailOptions): Promise<void> {
	const { to, subject, html, text } = options;

	try {
		await resend.emails.send({
			from: env.RESEND_FROM_EMAIL,
			to,
			subject,
			html,
			text: text || htmlToText(html),
		});
		console.log(`[Email] Sent email to ${to}: ${subject}`);
	} catch (error) {
		console.error(`[Email] Failed to send email to ${to}:`, error);
		throw error;
	}
}

/**
 * Send verification email
 */
export async function sendVerificationEmail(
	email: string,
	name: string,
	verificationUrl: string,
): Promise<void> {
	const subject = "Bestätige deine E-Mail-Adresse | EWF-ID";

	const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 40px 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; overflow: hidden; border: 1px solid #334155;">
    <div style="background: linear-gradient(135deg, #0891b2 0%, #2563eb 100%); padding: 32px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">EWF-ID</h1>
    </div>
    <div style="padding: 40px 32px;">
      <h2 style="color: #f1f5f9; margin: 0 0 16px 0; font-size: 24px;">Hallo ${name}!</h2>
      <p style="color: #94a3b8; margin: 0 0 24px 0; line-height: 1.6;">
        Vielen Dank für deine Registrierung bei EWF-ID. Bitte bestätige deine E-Mail-Adresse, um dein Konto zu aktivieren.
      </p>
      <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #0891b2 0%, #2563eb 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
        E-Mail bestätigen
      </a>
      <p style="color: #64748b; margin: 32px 0 0 0; font-size: 14px; line-height: 1.6;">
        Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:<br>
        <a href="${verificationUrl}" style="color: #06b6d4; word-break: break-all;">${verificationUrl}</a>
      </p>
      <p style="color: #64748b; margin: 24px 0 0 0; font-size: 14px;">
        Dieser Link ist 24 Stunden gültig.
      </p>
    </div>
    <div style="background-color: #0f172a; padding: 24px 32px; text-align: center; border-top: 1px solid #334155;">
      <p style="color: #64748b; margin: 0; font-size: 12px;">
        © ${new Date().getFullYear()} Erstwähler Forum Stade<br>
        Du erhältst diese E-Mail, weil du dich bei EWF-ID registriert hast.
      </p>
    </div>
  </div>
</body>
</html>
`;

	await sendEmail({ to: email, subject, html });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
	email: string,
	name: string,
	resetUrl: string,
): Promise<void> {
	const subject = "Passwort zurücksetzen | EWF-ID";

	const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 40px 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; overflow: hidden; border: 1px solid #334155;">
    <div style="background: linear-gradient(135deg, #0891b2 0%, #2563eb 100%); padding: 32px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">EWF-ID</h1>
    </div>
    <div style="padding: 40px 32px;">
      <h2 style="color: #f1f5f9; margin: 0 0 16px 0; font-size: 24px;">Hallo ${name}!</h2>
      <p style="color: #94a3b8; margin: 0 0 24px 0; line-height: 1.6;">
        Du hast eine Anfrage zum Zurücksetzen deines Passworts gestellt. Klicke auf den Button unten, um ein neues Passwort festzulegen.
      </p>
      <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #0891b2 0%, #2563eb 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Passwort zurücksetzen
      </a>
      <p style="color: #64748b; margin: 32px 0 0 0; font-size: 14px; line-height: 1.6;">
        Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:<br>
        <a href="${resetUrl}" style="color: #06b6d4; word-break: break-all;">${resetUrl}</a>
      </p>
      <p style="color: #64748b; margin: 24px 0 0 0; font-size: 14px;">
        Dieser Link ist 1 Stunde gültig. Falls du diese Anfrage nicht gestellt hast, kannst du diese E-Mail ignorieren.
      </p>
    </div>
    <div style="background-color: #0f172a; padding: 24px 32px; text-align: center; border-top: 1px solid #334155;">
      <p style="color: #64748b; margin: 0; font-size: 12px;">
        © ${new Date().getFullYear()} Erstwähler Forum Stade<br>
        Du erhältst diese E-Mail, weil du ein Passwort-Reset angefordert hast.
      </p>
    </div>
  </div>
</body>
</html>
`;

	await sendEmail({ to: email, subject, html });
}

/**
 * Send account deletion confirmation email
 */
export async function sendDeletionConfirmationEmail(
	email: string,
	name: string,
	deletionDate: Date,
	cancelUrl: string,
): Promise<void> {
	const subject = "Kontolöschung bestätigt | EWF-ID";
	const formattedDate = deletionDate.toLocaleDateString("de-DE", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});

	const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 40px 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; overflow: hidden; border: 1px solid #334155;">
    <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 32px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">EWF-ID</h1>
    </div>
    <div style="padding: 40px 32px;">
      <h2 style="color: #f1f5f9; margin: 0 0 16px 0; font-size: 24px;">Hallo ${name},</h2>
      <p style="color: #94a3b8; margin: 0 0 24px 0; line-height: 1.6;">
        Du hast die Löschung deines EWF-ID Kontos beantragt. Dein Konto und alle zugehörigen Daten werden am <strong style="color: #ef4444;">${formattedDate}</strong> unwiderruflich gelöscht.
      </p>
      <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <p style="color: #991b1b; margin: 0; font-size: 14px;">
          ⚠️ Diese Aktion kann nach dem ${formattedDate} nicht rückgängig gemacht werden.
        </p>
      </div>
      <p style="color: #94a3b8; margin: 0 0 24px 0; line-height: 1.6;">
        Falls du deine Meinung änderst, kannst du die Löschung bis zu diesem Datum abbrechen:
      </p>
      <a href="${cancelUrl}" style="display: inline-block; background-color: #374151; color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Löschung abbrechen
      </a>
    </div>
    <div style="background-color: #0f172a; padding: 24px 32px; text-align: center; border-top: 1px solid #334155;">
      <p style="color: #64748b; margin: 0; font-size: 12px;">
        © ${new Date().getFullYear()} Erstwähler Forum Stade<br>
        Bei Fragen wende dich an support@ewf-stade.de
      </p>
    </div>
  </div>
</body>
</html>
`;

	await sendEmail({ to: email, subject, html });
}

/**
 * Simple HTML to text converter
 */
function htmlToText(html: string): string {
	return html
		.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
		.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
		.replace(/<[^>]+>/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}
