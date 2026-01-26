/**
 * EWF-ID Landing Page
 * SPEC.md Phase 6 - Task 6.3: Public Pages
 * 
 * This is a B2C page for students - they access apps directly via their URLs
 * and are redirected here for authentication.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { m } from "@/paraglide/messages";
import { 
  Shield, 
  Key, 
  School, 
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
      title: m.landing_feature_security_title(),
      description: m.landing_feature_security_desc(),
    },
    {
      icon: School,
      title: m.landing_feature_school_title(),
      description: m.landing_feature_school_desc(),
    },
    {
      icon: Key,
      title: m.landing_feature_sso_title(),
      description: m.landing_feature_sso_desc(),
    },
    {
      icon: Lock,
      title: m.landing_feature_privacy_title(),
      description: m.landing_feature_privacy_desc(),
    },
    {
      icon: Globe,
      title: m.landing_feature_multilingual_title(),
      description: m.landing_feature_multilingual_desc(),
    },
    {
      icon: Users,
      title: m.landing_feature_roles_title(),
      description: m.landing_feature_roles_desc(),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            {m.landing_badge()}
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            {m.landing_title()}
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
            {m.landing_subtitle()}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login">
              <Button size="lg" className="w-full sm:w-auto">
                {m.landing_signin()}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                {m.landing_create_account()}
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            {m.landing_why_ewf()}
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

        {/* School Cooperation */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            {m.landing_schools()}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Athenaeum Stade", type: m.landing_school_type_gymnasium() },
              { name: "Vincent-Lübeck-Gymnasium", type: m.landing_school_type_gymnasium() },
              { name: "IGS Stade", type: m.landing_school_type_igs() },
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
            <Link to="/privacy-policy" className="hover:text-white hover:underline">{m.legal_privacy_title()}</Link>
            <Link to="/terms" className="hover:text-white hover:underline">{m.legal_terms_title()}</Link>
            <Link to="/cookies" className="hover:text-white hover:underline">{m.legal_cookies_title()}</Link>
            <Link to="/impressum" className="hover:text-white hover:underline">{m.legal_impressum_title()}</Link>
          </div>
          <p className="text-center text-sm text-gray-500">
            {m.landing_footer_copyright({ year: new Date().getFullYear().toString() })}
          </p>
        </footer>
      </div>
    </div>
  );
}
