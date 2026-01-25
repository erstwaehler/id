/**
 * Digital Independence Day Page
 * SPEC.md Phase 6 - Task 6.6: Legal & Compliance Pages
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import {
  Globe,
  Lock,
  Shield,
  Users,
  Server,
  Key,
  Heart,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/(legal)/digital-independence")({
  component: DigitalIndependencePage,
});

function DigitalIndependencePage() {
  const principles = [
    {
      icon: Lock,
      title: "Data Sovereignty",
      description:
        "Your data stays under your control. No selling to advertisers, no profiling, no hidden data collection.",
    },
    {
      icon: Server,
      title: "European Infrastructure",
      description:
        "All data is stored on European servers, subject to GDPR and strong privacy regulations.",
    },
    {
      icon: Shield,
      title: "Security First",
      description:
        "Industry-standard security practices including encryption, 2FA, and regular security audits.",
    },
    {
      icon: Users,
      title: "Community Owned",
      description:
        "Built by and for the community. Open development process with transparent decision making.",
    },
    {
      icon: Key,
      title: "Open Standards",
      description:
        "Using OpenID Connect and other open standards ensures interoperability and prevents lock-in.",
    },
    {
      icon: Heart,
      title: "Non-Profit",
      description:
        "As a non-profit initiative, our only goal is serving the students and teachers of Stade.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="mx-auto mb-6 rounded-full bg-cyan-500/10 p-6 w-fit">
            <Globe className="h-12 w-12 text-cyan-500" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Digital Independence
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Why digital sovereignty matters for education and how EWF-ID supports 
            the independence of students and schools in the digital age.
          </p>
        </div>

        {/* Mission */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Our Mission</CardTitle>
            <CardDescription>
              Empowering students through digital independence
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              The Erstwähler Forum (EWF) initiative was born from a simple idea: 
              students should have access to tools that respect their privacy, 
              support their education, and don't treat them as products.
            </p>
            <p>
              Too often, educational institutions are forced to rely on services 
              from big tech companies that harvest student data, create filter bubbles, 
              and compromise privacy. We believe there's a better way.
            </p>
            <p>
              EWF-ID is our answer to the authentication challenge. By providing a 
              secure, privacy-respecting identity provider, we enable schools and 
              students to use digital tools without sacrificing their digital sovereignty.
            </p>
          </CardContent>
        </Card>

        {/* Why It Matters */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Why Digital Independence Matters
          </h2>
          
          <div className="space-y-6 text-gray-300">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-2">For Students</h3>
                <p>
                  Young people are forming their digital identities during their school years. 
                  Using tools that respect privacy teaches important lessons about data rights 
                  and helps develop healthy digital habits.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-2">For Schools</h3>
                <p>
                  Educational institutions have a responsibility to protect student data. 
                  Using privacy-respecting alternatives reduces liability, builds trust with 
                  parents, and aligns with educational values.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-2">For Society</h3>
                <p>
                  When we train the next generation on tools that respect privacy and 
                  support digital independence, we're investing in a future where digital 
                  rights are valued and protected.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Principles */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Our Principles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {principles.map((principle) => (
              <Card key={principle.title}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-cyan-500/10 p-2">
                      <principle.icon className="h-5 w-5 text-cyan-500" />
                    </div>
                    <CardTitle className="text-lg">{principle.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{principle.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* How EWF-ID Helps */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>How EWF-ID Supports Independence</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <ArrowRight className="h-5 w-5 text-cyan-500 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Single Sign-On</strong> - One account for all EWF applications, 
                  reducing password fatigue and security risks
                </span>
              </li>
              <li className="flex items-start gap-3">
                <ArrowRight className="h-5 w-5 text-cyan-500 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>School Integration</strong> - Seamless login with existing school 
                  accounts while maintaining data separation
                </span>
              </li>
              <li className="flex items-start gap-3">
                <ArrowRight className="h-5 w-5 text-cyan-500 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Data Portability</strong> - Export all your data anytime, 
                  in standard formats
                </span>
              </li>
              <li className="flex items-start gap-3">
                <ArrowRight className="h-5 w-5 text-cyan-500 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Right to Deletion</strong> - Delete your account completely, 
                  no hidden data retention
                </span>
              </li>
              <li className="flex items-start gap-3">
                <ArrowRight className="h-5 w-5 text-cyan-500 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Transparency</strong> - See exactly what data we collect and why
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Join the Movement
          </h2>
          <p className="text-gray-300 mb-6">
            Ready to embrace digital independence? Create your EWF-ID account today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg">
                Create Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/">
              <Button variant="outline" size="lg">
                Learn More
              </Button>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-slate-700">
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
            <Link to="/privacy-policy" className="hover:text-white hover:underline">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white hover:underline">Terms of Service</Link>
            <Link to="/impressum" className="hover:text-white hover:underline">Impressum</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
