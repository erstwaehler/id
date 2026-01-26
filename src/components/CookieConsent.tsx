/**
 * EWF-ID Cookie Consent Banner
 * SPEC.md Phase 6 - Task 6.7: Cookie Consent Banner
 */
import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Cookie, X, Settings } from "lucide-react";
import { m } from "@/paraglide/messages";

export type CookieConsent = {
  essential: boolean; // Always true
  preferences: boolean;
  analytics: boolean;
  timestamp: string;
};

const CONSENT_KEY = "ewf_cookie_consent";

export function getCookieConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(CONSENT_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function setCookieConsent(consent: Omit<CookieConsent, "essential" | "timestamp">): void {
  const fullConsent: CookieConsent = {
    essential: true,
    ...consent,
    timestamp: new Date().toISOString(),
  };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(fullConsent));

  // Dispatch event for other components to react
  window.dispatchEvent(new CustomEvent("cookieConsentChanged", { detail: fullConsent }));
}

export function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState(true);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    // Check if user has already consented
    const consent = getCookieConsent();
    if (!consent) {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    setCookieConsent({ preferences: true, analytics: true });
    setIsVisible(false);
  };

  const handleRejectAll = () => {
    setCookieConsent({ preferences: false, analytics: false });
    setIsVisible(false);
  };

  const handleSavePreferences = () => {
    setCookieConsent({ preferences, analytics });
    setIsVisible(false);
    setShowSettings(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-background to-transparent">
      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardContent className="p-4">
          {!showSettings ? (
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-primary/10 p-2">
                  <Cookie className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{m.cookie_banner_title()}</h3>
                  <p className="text-sm text-muted-foreground">
                    {m.cookie_banner_message()}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={handleAcceptAll}>
                  {m.cookie_banner_accept_all()}
                </Button>
                <Button variant="outline" onClick={handleRejectAll}>
                  {m.cookie_banner_reject_all()}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowSettings(true)}>
                  <Settings className="mr-2 h-4 w-4" />
                  {m.cookie_banner_customize()}
                </Button>
                <Link to="/cookies" className="text-sm text-muted-foreground hover:underline ml-auto">
                  {m.legal_cookies_title()}
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{m.cookie_banner_customize()}</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowSettings(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{m.cookie_essential()}</p>
                    <p className="text-sm text-muted-foreground">
                      {m.cookie_essential_desc()}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={true}
                    disabled
                    className="h-5 w-5"
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{m.cookie_preferences()}</p>
                    <p className="text-sm text-muted-foreground">
                      {m.cookie_preferences_desc()}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences}
                    onChange={(e) => setPreferences(e.target.checked)}
                    className="h-5 w-5"
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{m.cookie_analytics()}</p>
                    <p className="text-sm text-muted-foreground">
                      {m.cookie_analytics_desc()}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={analytics}
                    onChange={(e) => setAnalytics(e.target.checked)}
                    className="h-5 w-5"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSavePreferences}>
                  {m.cookie_save_preferences()}
                </Button>
                <Button variant="outline" onClick={() => setShowSettings(false)}>
                  {m.common_cancel()}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Hook to access cookie consent state
 */
export function useCookieConsent() {
  const [consent, setConsent] = useState<CookieConsent | null>(null);

  useEffect(() => {
    setConsent(getCookieConsent());

    const handleChange = (event: CustomEvent<CookieConsent>) => {
      setConsent(event.detail);
    };

    window.addEventListener("cookieConsentChanged", handleChange as EventListener);
    return () => {
      window.removeEventListener("cookieConsentChanged", handleChange as EventListener);
    };
  }, []);

  return consent;
}
