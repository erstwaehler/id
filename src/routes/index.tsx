/**
 * EWF-ID Landing Page
 * SPEC.md Phase 6 - Task 6.3: Public Pages
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { 
  Shield, 
  Key, 
  School, 
  Vote, 
  Calendar, 
  Radio, 
  Monitor,
  Globe,
  Lock,
  Users,
  ArrowRight
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  const features = [
    {
      icon: Shield,
      title: "Secure Authentication",
      description: "Industry-standard security with OIDC, 2FA, and passkeys",
    },
    {
      icon: School,
      title: "School Integration",
      description: "Sign in with your school account from Athenaeum, VLG, or IGS",
    },
    {
      icon: Key,
      title: "Single Sign-On",
      description: "One account for all EWF applications",
    },
    {
      icon: Lock,
      title: "Privacy First",
      description: "GDPR compliant with full data portability and deletion rights",
    },
    {
      icon: Globe,
      title: "Multilingual",
      description: "Available in German, English, and Ukrainian",
    },
    {
      icon: Users,
      title: "Role-Based Access",
      description: "Different permissions for students, teachers, and team members",
    },
  ];

  const apps = [
    {
      icon: Calendar,
      name: "Schedule",
      description: "Event planning and management",
      href: "https://schedule.ewf-stade.de",
    },
    {
      icon: Vote,
      name: "Vote",
      description: "Democratic decision making",
      href: "https://vote.ewf-stade.de",
    },
    {
      icon: Radio,
      name: "Live",
      description: "Interactive Q&A sessions",
      href: "https://live.ewf-stade.de",
    },
    {
      icon: Monitor,
      name: "Screens",
      description: "Digital signage management",
      href: "https://screens.ewf-stade.de",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            Erstwähler Foundation
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            EWF-ID
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Your single identity for all Erstwähler Forum applications. 
            Secure, private, and easy to use.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login">
              <Button size="lg" className="w-full sm:w-auto">
                Sign In
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Create Account
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            Why EWF-ID?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-cyan-500/10 p-2">
                      <feature.icon className="h-5 w-5 text-cyan-500" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Connected Apps */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            Connected Applications
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {apps.map((app) => (
              <a
                key={app.name}
                href={app.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Card className="hover:border-cyan-500 transition-colors h-full">
                  <CardContent className="flex flex-col items-center text-center p-6">
                    <div className="rounded-full bg-cyan-500/10 p-4 mb-4">
                      <app.icon className="h-8 w-8 text-cyan-500" />
                    </div>
                    <h3 className="font-semibold mb-2">{app.name}</h3>
                    <p className="text-sm text-gray-400">{app.description}</p>
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>
        </div>

        {/* School Partners */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            Participating Schools
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Athenaeum Stade", type: "Gymnasium" },
              { name: "Vincent-Lübeck-Gymnasium", type: "Gymnasium" },
              { name: "IGS Stade", type: "Integrierte Gesamtschule" },
            ].map((school) => (
              <Card key={school.name}>
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="rounded-full bg-blue-500/10 p-3">
                    <School className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-semibold">{school.name}</p>
                    <p className="text-sm text-gray-400">{school.type}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-slate-700 pt-8">
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400 mb-4">
            <Link to="/privacy-policy" className="hover:text-white hover:underline">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white hover:underline">Terms of Service</Link>
            <Link to="/cookies" className="hover:text-white hover:underline">Cookie Policy</Link>
            <Link to="/impressum" className="hover:text-white hover:underline">Impressum</Link>
          </div>
          <p className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} Erstwähler Forum e.V. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}
