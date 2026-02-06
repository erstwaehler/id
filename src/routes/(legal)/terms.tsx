/**
 * EWF-ID Terms of Service Page
 * SPEC.md Phase 6 - Task 6.6: Legal & Compliance Pages
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/(legal)/terms")({
  component: TermsPage,
});

function TermsPage() {
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
            <h1 className="text-3xl font-bold text-white">Terms of Service</h1>
            <p className="text-muted-foreground">Last updated: January 2025</p>
          </div>
        </div>

        <Card className="prose prose-invert max-w-none">
          <CardContent className="p-8">
            <h2 className="text-xl font-semibold mt-0">1. Acceptance of Terms</h2>
            <p>
              By accessing or using EWF-ID ("the Service"), operated by Erstwähler Forum e.V. 
              ("we", "us", "our"), you agree to be bound by these Terms of Service. If you do 
              not agree, do not use the Service.
            </p>

            <h2 className="text-xl font-semibold">2. Description of Service</h2>
            <p>
              EWF-ID is a centralized identity and authentication service for the Erstwähler 
              Foundation ecosystem. It provides:
            </p>
            <ul>
              <li>Single Sign-On (SSO) authentication</li>
              <li>Account management</li>
              <li>Access to connected EWF applications (Schedule, Vote, Live, Screens)</li>
              <li>School SSO integration</li>
            </ul>

            <h2 className="text-xl font-semibold">3. Eligibility</h2>
            <p>
              You must be at least 13 years old to use the Service. If you are under 18, you 
              represent that you have parental consent to use the Service. By using the Service, 
              you represent and warrant that you meet these requirements.
            </p>

            <h2 className="text-xl font-semibold">4. User Accounts</h2>
            <h3 className="text-lg font-medium">4.1 Registration</h3>
            <p>
              To use the Service, you must create an account with accurate and complete information. 
              You are responsible for maintaining the accuracy of your account information.
            </p>
            
            <h3 className="text-lg font-medium">4.2 Account Security</h3>
            <p>
              You are responsible for maintaining the confidentiality of your password and account. 
              You must immediately notify us of any unauthorized use of your account. We recommend 
              enabling two-factor authentication.
            </p>
            
            <h3 className="text-lg font-medium">4.3 One Account Per Person</h3>
            <p>
              Each person may only maintain one account. Multiple accounts may be terminated without notice.
            </p>

            <h2 className="text-xl font-semibold">5. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Use the Service for any illegal purpose</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Impersonate another person or entity</li>
              <li>Share your account credentials with others</li>
              <li>Attempt to gain unauthorized access to other accounts or systems</li>
              <li>Interfere with or disrupt the Service</li>
              <li>Upload malicious code or content</li>
              <li>Use automated tools to access the Service without permission</li>
              <li>Harass, abuse, or harm other users</li>
            </ul>

            <h2 className="text-xl font-semibold">6. School Integration</h2>
            <p>
              If you link your account with a school identity provider, you acknowledge that:
            </p>
            <ul>
              <li>Your school may have policies governing your use of the Service</li>
              <li>We may share limited information with your school as required</li>
              <li>Your school affiliation may affect your access to certain features</li>
            </ul>

            <h2 className="text-xl font-semibold">7. Intellectual Property</h2>
            <p>
              The Service and its original content, features, and functionality are owned by 
              Erstwähler Forum e.V. and are protected by copyright, trademark, and other 
              intellectual property laws.
            </p>

            <h2 className="text-xl font-semibold">8. User Content</h2>
            <p>
              You retain ownership of content you submit through the Service. By submitting 
              content, you grant us a non-exclusive, worldwide, royalty-free license to use, 
              display, and store such content for the purpose of providing the Service.
            </p>

            <h2 className="text-xl font-semibold">9. Termination</h2>
            <h3 className="text-lg font-medium">9.1 By You</h3>
            <p>
              You may delete your account at any time through the Privacy settings. Account 
              deletion is subject to a 30-day grace period during which you may cancel the request.
            </p>
            
            <h3 className="text-lg font-medium">9.2 By Us</h3>
            <p>
              We may suspend or terminate your account at any time for violation of these Terms, 
              illegal activity, or at our discretion. We will provide notice when possible.
            </p>

            <h2 className="text-xl font-semibold">10. Disclaimer of Warranties</h2>
            <p>
              THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR 
              IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR 
              ERROR-FREE.
            </p>

            <h2 className="text-xl font-semibold">11. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, ERSTWÄHLER FORUM E.V. SHALL NOT BE LIABLE 
              FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING 
              FROM YOUR USE OF THE SERVICE.
            </p>

            <h2 className="text-xl font-semibold">12. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless Erstwähler Forum e.V. from any claims, 
              damages, or expenses arising from your use of the Service or violation of these Terms.
            </p>

            <h2 className="text-xl font-semibold">13. Modifications</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will notify you of 
              material changes via email or through the Service. Continued use after changes 
              constitutes acceptance of the new Terms.
            </p>

            <h2 className="text-xl font-semibold">14. Governing Law</h2>
            <p>
              These Terms are governed by the laws of Germany. Any disputes shall be resolved 
              in the courts of Stade, Germany, unless mandatory consumer protection laws 
              provide otherwise.
            </p>

            <h2 className="text-xl font-semibold">15. Severability</h2>
            <p>
              If any provision of these Terms is found invalid or unenforceable, the remaining 
              provisions shall continue in full force and effect.
            </p>

            <h2 className="text-xl font-semibold">16. Contact</h2>
            <p>
              For questions about these Terms, contact us at:{" "}
              <a href="mailto:legal@ewf-stade.de" className="text-primary hover:underline">
                legal@ewf-stade.de
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
