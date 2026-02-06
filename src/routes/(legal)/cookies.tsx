/**
 * EWF-ID Cookie Policy Page
 * SPEC.md Phase 6 - Task 6.6: Legal & Compliance Pages
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";

export const Route = createFileRoute("/(legal)/cookies")({
  component: CookiesPage,
});

function CookiesPage() {
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
            <h1 className="text-3xl font-bold text-white">Cookie Policy</h1>
            <p className="text-muted-foreground">Last updated: January 2025</p>
          </div>
        </div>

        <Card className="prose prose-invert max-w-none">
          <CardContent className="p-8">
            <h2 className="text-xl font-semibold mt-0">What Are Cookies?</h2>
            <p>
              Cookies are small text files stored on your device when you visit
              a website. They help websites remember your preferences and
              improve your experience.
            </p>

            <h2 className="text-xl font-semibold">How We Use Cookies</h2>
            <p>EWF-ID uses cookies for the following purposes:</p>

            <h3 className="text-lg font-medium">
              Essential Cookies (Always Active)
            </h3>
            <p>
              These cookies are necessary for the website to function and cannot
              be disabled.
            </p>
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left">Cookie</th>
                  <th className="text-left">Purpose</th>
                  <th className="text-left">Duration</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <code>better_auth.session_token</code>
                  </td>
                  <td>Authentication session</td>
                  <td>7 days</td>
                </tr>
                <tr>
                  <td>
                    <code>__csrf</code>
                  </td>
                  <td>CSRF protection</td>
                  <td>Session</td>
                </tr>
                <tr>
                  <td>
                    <code>cf_clearance</code>
                  </td>
                  <td>Cloudflare security</td>
                  <td>30 minutes</td>
                </tr>
              </tbody>
            </table>

            <h3 className="text-lg font-medium">Preference Cookies</h3>
            <p>
              These cookies remember your preferences for a better experience.
            </p>
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left">Cookie</th>
                  <th className="text-left">Purpose</th>
                  <th className="text-left">Duration</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <code>locale</code>
                  </td>
                  <td>Language preference</td>
                  <td>1 year</td>
                </tr>
                <tr>
                  <td>
                    <code>theme</code>
                  </td>
                  <td>Theme preference (dark/light)</td>
                  <td>1 year</td>
                </tr>
                <tr>
                  <td>
                    <code>cookie_consent</code>
                  </td>
                  <td>Your cookie consent choice</td>
                  <td>1 year</td>
                </tr>
              </tbody>
            </table>

            <h3 className="text-lg font-medium">
              Analytics Cookies (Optional)
            </h3>
            <p>
              These cookies help us understand how visitors interact with the
              website. They are only set if you consent to analytics.
            </p>
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left">Cookie</th>
                  <th className="text-left">Purpose</th>
                  <th className="text-left">Duration</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <code>ph_*</code>
                  </td>
                  <td>PostHog analytics</td>
                  <td>1 year</td>
                </tr>
              </tbody>
            </table>

            <h2 className="text-xl font-semibold">Managing Cookies</h2>

            <h3 className="text-lg font-medium">Through Our Website</h3>
            <p>
              You can manage your cookie preferences at any time by clicking the
              "Cookie Settings" link in the footer of any page.
            </p>

            <h3 className="text-lg font-medium">Through Your Browser</h3>
            <p>
              Most browsers allow you to control cookies through their settings.
              Note that disabling essential cookies may affect the functionality
              of the website.
            </p>
            <ul>
              <li>
                <a
                  href="https://support.google.com/chrome/answer/95647"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline">
                  Chrome
                </a>
              </li>
              <li>
                <a
                  href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline">
                  Firefox
                </a>
              </li>
              <li>
                <a
                  href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline">
                  Safari
                </a>
              </li>
              <li>
                <a
                  href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline">
                  Edge
                </a>
              </li>
            </ul>

            <h2 className="text-xl font-semibold">Third-Party Cookies</h2>
            <p>We use services that may set their own cookies:</p>
            <ul>
              <li>
                <strong>PostHog:</strong> Analytics and session replay (opt-in
                only)
              </li>
              <li>
                <strong>Cloudflare:</strong> Security and CAPTCHA
              </li>
            </ul>
            <p>
              These services have their own privacy policies that govern their
              use of cookies.
            </p>

            <h2 className="text-xl font-semibold">Do Not Track</h2>
            <p>
              We respect the Do Not Track (DNT) browser setting. When DNT is
              enabled, we automatically disable non-essential analytics cookies.
            </p>

            <h2 className="text-xl font-semibold">Updates to This Policy</h2>
            <p>
              We may update this Cookie Policy from time to time. Changes will
              be posted on this page with an updated revision date.
            </p>

            <h2 className="text-xl font-semibold">Contact</h2>
            <p>
              For questions about our use of cookies, contact us at:{" "}
              <a
                href="mailto:privacy@ewf-stade.de"
                className="text-primary hover:underline">
                privacy@ewf-stade.de
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
