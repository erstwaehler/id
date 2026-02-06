/**
 * EWF-ID Privacy Policy Page
 * SPEC.md Phase 6 - Task 6.6: Legal & Compliance Pages
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export const Route = createFileRoute("/(legal)/privacy-policy")({
  component: PrivacyPolicyPage,
});

function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: January 2025</p>
          </div>
        </div>

        <Card className="prose prose-invert max-w-none">
          <CardContent className="p-8">
            <h2 className="text-xl font-semibold mt-0">1. Data Controller</h2>
            <p>
              The data controller for EWF-ID is the Erstwähler Foundation
              (Erstwähler Forum e.V.), registered in Stade, Germany.
            </p>
            <p>
              <strong>Contact:</strong>
              <br />
              Erstwähler Forum e.V.
              <br />
              Email: privacy@ewf-stade.de
            </p>

            <h2 className="text-xl font-semibold">2. Data We Collect</h2>
            <p>We collect the following personal data:</p>
            <ul>
              <li>
                <strong>Account Information:</strong> Name, email address,
                password (hashed)
              </li>
              <li>
                <strong>Profile Data:</strong> Display name, bio, profile
                picture, language preference
              </li>
              <li>
                <strong>School Affiliation:</strong> School name, student ID (if
                linked via school SSO)
              </li>
              <li>
                <strong>Authentication Data:</strong> Passkeys, 2FA settings
              </li>
              <li>
                <strong>Session Data:</strong> IP addresses, user agent, login
                timestamps
              </li>
              <li>
                <strong>Usage Data:</strong> Actions performed, pages visited
                (analytics)
              </li>
            </ul>

            <h2 className="text-xl font-semibold">
              3. Purpose of Data Processing
            </h2>
            <p>We process your data for the following purposes:</p>
            <ul>
              <li>
                <strong>Authentication:</strong> To verify your identity and
                provide secure access
              </li>
              <li>
                <strong>Service Provision:</strong> To provide EWF services
                (Schedule, Vote, Live, Screens)
              </li>
              <li>
                <strong>Security:</strong> To detect and prevent fraud,
                unauthorized access, and abuse
              </li>
              <li>
                <strong>Communication:</strong> To send security alerts and
                important notifications
              </li>
              <li>
                <strong>Improvement:</strong> To analyze usage patterns and
                improve our services
              </li>
            </ul>

            <h2 className="text-xl font-semibold">
              4. Legal Basis (GDPR Art. 6)
            </h2>
            <ul>
              <li>
                <strong>Contract (Art. 6(1)(b)):</strong> Processing necessary
                to provide the service
              </li>
              <li>
                <strong>Legitimate Interest (Art. 6(1)(f)):</strong> Security,
                fraud prevention, service improvement
              </li>
              <li>
                <strong>Consent (Art. 6(1)(a)):</strong> Analytics cookies (when
                you opt-in)
              </li>
              <li>
                <strong>Legal Obligation (Art. 6(1)(c)):</strong> Compliance
                with legal requirements
              </li>
            </ul>

            <h2 className="text-xl font-semibold">5. Data Retention</h2>
            <ul>
              <li>
                <strong>Account Data:</strong> Retained until account deletion +
                30 days grace period
              </li>
              <li>
                <strong>Session Data:</strong> 90 days
              </li>
              <li>
                <strong>Audit Logs:</strong> 2 years (anonymized after account
                deletion)
              </li>
              <li>
                <strong>Analytics Data:</strong> Aggregated and anonymized
              </li>
            </ul>

            <h2 className="text-xl font-semibold">6. Your Rights (GDPR)</h2>
            <p>Under GDPR, you have the following rights:</p>
            <ul>
              <li>
                <strong>Right to Access (Art. 15):</strong> Request a copy of
                your data
              </li>
              <li>
                <strong>Right to Rectification (Art. 16):</strong> Correct
                inaccurate data
              </li>
              <li>
                <strong>Right to Erasure (Art. 17):</strong> Delete your account
                and data
              </li>
              <li>
                <strong>Right to Data Portability (Art. 20):</strong> Export
                your data in JSON format
              </li>
              <li>
                <strong>Right to Object (Art. 21):</strong> Opt-out of analytics
                processing
              </li>
              <li>
                <strong>Right to Restrict (Art. 18):</strong> Request processing
                restrictions
              </li>
            </ul>
            <p>
              You can exercise most of these rights directly in your{" "}
              <Link to="/privacy" className="text-primary hover:underline">
                account settings
              </Link>
              .
            </p>

            <h2 className="text-xl font-semibold">
              7. Data Processors (Subprocessors)
            </h2>
            <p>We use the following third-party services:</p>
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left">Service</th>
                  <th className="text-left">Purpose</th>
                  <th className="text-left">Location</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Vercel</td>
                  <td>Hosting & CDN</td>
                  <td>USA (Privacy Shield)</td>
                </tr>
                <tr>
                  <td>Neon</td>
                  <td>Database</td>
                  <td>USA (GDPR compliant)</td>
                </tr>
                <tr>
                  <td>Resend</td>
                  <td>Email delivery</td>
                  <td>USA (GDPR compliant)</td>
                </tr>
                <tr>
                  <td>PostHog</td>
                  <td>Analytics (opt-in)</td>
                  <td>EU (GDPR compliant)</td>
                </tr>
                <tr>
                  <td>Axiom</td>
                  <td>Logging & monitoring</td>
                  <td>EU/USA (GDPR compliant)</td>
                </tr>
                <tr>
                  <td>Cloudflare</td>
                  <td>Turnstile CAPTCHA</td>
                  <td>USA/EU (GDPR compliant)</td>
                </tr>
              </tbody>
            </table>

            <h2 className="text-xl font-semibold">8. Cookies</h2>
            <p>We use the following types of cookies:</p>
            <ul>
              <li>
                <strong>Essential:</strong> Session cookies for authentication
                (always enabled)
              </li>
              <li>
                <strong>Preferences:</strong> Language and theme preferences
              </li>
              <li>
                <strong>Analytics:</strong> PostHog (only with your consent)
              </li>
            </ul>
            <p>
              Manage your cookie preferences in our{" "}
              <Link to="/cookies" className="text-primary hover:underline">
                cookie settings
              </Link>
              .
            </p>

            <h2 className="text-xl font-semibold">
              9. International Data Transfers
            </h2>
            <p>
              Your data may be transferred to countries outside the EU/EEA. We
              ensure appropriate safeguards through Standard Contractual Clauses
              (SCCs) and only use processors that are GDPR compliant.
            </p>

            <h2 className="text-xl font-semibold">10. Security</h2>
            <p>
              We implement appropriate technical and organizational measures
              including:
            </p>
            <ul>
              <li>Encryption in transit (TLS 1.3) and at rest</li>
              <li>Password hashing with Argon2</li>
              <li>Two-factor authentication support</li>
              <li>Regular security audits</li>
              <li>Access controls and audit logging</li>
            </ul>

            <h2 className="text-xl font-semibold">11. Children's Privacy</h2>
            <p>
              EWF-ID is intended for users aged 13 and older. We do not
              knowingly collect data from children under 13. If you believe we
              have collected such data, please contact us.
            </p>

            <h2 className="text-xl font-semibold">
              12. Changes to This Policy
            </h2>
            <p>
              We may update this policy from time to time. We will notify you of
              significant changes via email or through the service. Continued
              use after changes constitutes acceptance.
            </p>

            <h2 className="text-xl font-semibold">13. Contact & Complaints</h2>
            <p>
              For privacy inquiries, contact our Data Protection Officer at:{" "}
              <a
                href="mailto:privacy@ewf-stade.de"
                className="text-primary hover:underline">
                privacy@ewf-stade.de
              </a>
            </p>
            <p>
              You have the right to lodge a complaint with your local data
              protection authority. In Germany, this is the Landesbeauftragte
              für Datenschutz Niedersachsen.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
