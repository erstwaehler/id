/**
 * EWF-ID Settings Page
 * SPEC.md Phase 6 - Task 6.4: Authenticated User Pages
 */
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authClient } from "~/lib/auth-client";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import { Separator } from "~/components/ui/separator";
import { 
  ArrowLeft, 
  Globe, 
  Bell,
  Loader2,
  CheckCircle,
  AlertCircle,
  Moon,
  Sun,
  Download,
  Trash2,
  AlertTriangle
} from "lucide-react";

export const Route = createFileRoute("/(app)/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const result = await authClient.getSession();
      if (!result.data?.user) {
        navigate({ to: "/login" });
        return null;
      }
      return result.data;
    },
  });

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const response = await fetch("/api/users/me", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch profile");
      return response.json();
    },
    enabled: !!session,
  });

  const updateLocaleMutation = useMutation({
    mutationFn: async (locale: string) => {
      const response = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ locale }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update language");
      }
      return response.json();
    },
    onSuccess: () => {
      setSuccess("Language updated");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const exportDataMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/users/me/export", {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to request data export");
      }
      return response.json();
    },
    onSuccess: () => {
      setSuccess("Data export requested. You'll receive an email when it's ready.");
      setTimeout(() => setSuccess(null), 5000);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  if (sessionLoading || profileLoading) {
    return <SettingsSkeleton />;
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="text-muted-foreground">Manage your preferences</p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 text-sm text-red-500 bg-red-500/10 rounded-md">
            <AlertCircle className="h-4 w-4" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto">×</button>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 p-3 mb-4 text-sm text-green-500 bg-green-500/10 rounded-md">
            <CheckCircle className="h-4 w-4" />
            {success}
          </div>
        )}

        {/* Language Settings */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>Language</CardTitle>
                <CardDescription>Choose your preferred language</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {[
                { code: "de", name: "Deutsch", flag: "🇩🇪" },
                { code: "en", name: "English", flag: "🇬🇧" },
                { code: "uk", name: "Українська", flag: "🇺🇦" },
              ].map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => updateLocaleMutation.mutate(lang.code)}
                  disabled={updateLocaleMutation.isPending}
                  className={`flex items-center justify-center gap-2 p-4 border rounded-lg transition-colors ${
                    profile?.locale === lang.code
                      ? "border-primary bg-primary/10"
                      : "hover:border-primary/50"
                  }`}
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <span className="font-medium">{lang.name}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Manage email notifications</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Security Alerts</p>
                <p className="text-sm text-muted-foreground">Get notified about security events</p>
              </div>
              <Badge variant="success">Always On</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Login Notifications</p>
                <p className="text-sm text-muted-foreground">Get notified when you sign in from a new device</p>
              </div>
              <Badge variant="success">Always On</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Product Updates</p>
                <p className="text-sm text-muted-foreground">News about EWF products and features</p>
              </div>
              <Badge variant="secondary">Optional</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Data & Privacy */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Download className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>Data & Privacy</CardTitle>
                <CardDescription>Manage your data and privacy settings</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Export Your Data</p>
                <p className="text-sm text-muted-foreground">
                  Download a copy of your data (GDPR Art. 20)
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => exportDataMutation.mutate()}
                disabled={exportDataMutation.isPending}
              >
                {exportDataMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Export
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Cookie Preferences</p>
                <p className="text-sm text-muted-foreground">
                  Manage your cookie consent settings
                </p>
              </div>
              <Button variant="outline" size="sm">
                Manage
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-500/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <CardTitle className="text-red-500">Danger Zone</CardTitle>
                <CardDescription>Irreversible actions</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Delete Account</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all data
                </p>
              </div>
              <Link to="/privacy">
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Account
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Links */}
        <div className="mt-8 flex flex-wrap gap-4 justify-center text-sm text-muted-foreground">
          <Link to="/privacy-policy" className="hover:underline">Privacy Policy</Link>
          <span>•</span>
          <Link to="/terms" className="hover:underline">Terms of Service</Link>
          <span>•</span>
          <Link to="/cookies" className="hover:underline">Cookie Policy</Link>
          <span>•</span>
          <Link to="/impressum" className="hover:underline">Impressum</Link>
        </div>
      </div>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center gap-4 mb-8">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Skeleton className="h-48 mb-6" />
        <Skeleton className="h-64 mb-6" />
        <Skeleton className="h-48 mb-6" />
        <Skeleton className="h-32" />
      </div>
    </div>
  );
}
