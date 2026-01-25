/**
 * EWF-ID Sessions Page
 * SPEC.md Phase 6 - Task 6.4: Authenticated User Pages
 */
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authClient } from "~/lib/auth-client";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import { 
  ArrowLeft, 
  Laptop, 
  Smartphone, 
  Tablet, 
  Monitor,
  Loader2,
  Trash2,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/(app)/sessions")({
  component: SessionsPage,
});

function SessionsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data: currentSession, isLoading: sessionLoading } = useQuery({
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

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ["sessions-list"],
    queryFn: async () => {
      const response = await fetch("/api/users/me/sessions", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch sessions");
      return response.json();
    },
    enabled: !!currentSession,
  });

  const revokeSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await fetch(`/api/users/me/sessions/${sessionId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to revoke session");
      }
      return response.json();
    },
    onSuccess: () => {
      setSuccess("Session revoked successfully");
      queryClient.invalidateQueries({ queryKey: ["sessions-list"] });
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const revokeAllMutation = useMutation({
    mutationFn: async () => {
      // Revoke all sessions except current
      const otherSessions = sessions?.sessions?.filter(
        (s: any) => s.id !== currentSession?.session?.id
      ) || [];
      
      for (const session of otherSessions) {
        await fetch(`/api/users/me/sessions/${session.id}`, {
          method: "DELETE",
          credentials: "include",
        });
      }
    },
    onSuccess: () => {
      setSuccess("All other sessions revoked");
      queryClient.invalidateQueries({ queryKey: ["sessions-list"] });
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const getDeviceIcon = (userAgent: string) => {
    const ua = userAgent.toLowerCase();
    if (ua.includes("mobile") || ua.includes("iphone") || ua.includes("android")) {
      return Smartphone;
    }
    if (ua.includes("tablet") || ua.includes("ipad")) {
      return Tablet;
    }
    if (ua.includes("windows") || ua.includes("mac") || ua.includes("linux")) {
      return Laptop;
    }
    return Monitor;
  };

  const getDeviceName = (userAgent: string) => {
    const ua = userAgent.toLowerCase();
    if (ua.includes("chrome")) return "Chrome";
    if (ua.includes("firefox")) return "Firefox";
    if (ua.includes("safari") && !ua.includes("chrome")) return "Safari";
    if (ua.includes("edge")) return "Edge";
    return "Unknown Browser";
  };

  const getOSName = (userAgent: string) => {
    const ua = userAgent.toLowerCase();
    if (ua.includes("windows")) return "Windows";
    if (ua.includes("mac")) return "macOS";
    if (ua.includes("linux")) return "Linux";
    if (ua.includes("android")) return "Android";
    if (ua.includes("iphone") || ua.includes("ipad")) return "iOS";
    return "Unknown OS";
  };

  if (sessionLoading) {
    return <SessionsSkeleton />;
  }

  if (!currentSession?.user) {
    return null;
  }

  const currentSessionId = currentSession.session?.id;
  const sessionList = sessions?.sessions || [];
  const otherSessionsCount = sessionList.filter((s: any) => s.id !== currentSessionId).length;

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
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">Active Sessions</h1>
            <p className="text-muted-foreground">Manage your login sessions</p>
          </div>
          {otherSessionsCount > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => revokeAllMutation.mutate()}
              disabled={revokeAllMutation.isPending}
            >
              {revokeAllMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Revoke All Others
            </Button>
          )}
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

        {/* Sessions List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Devices</CardTitle>
            <CardDescription>
              {sessionList.length} active session{sessionList.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sessionsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
              </div>
            ) : sessionList.length > 0 ? (
              <div className="space-y-4">
                {sessionList.map((session: any) => {
                  const isCurrent = session.id === currentSessionId;
                  const DeviceIcon = getDeviceIcon(session.userAgent || "");
                  const deviceName = getDeviceName(session.userAgent || "");
                  const osName = getOSName(session.userAgent || "");

                  return (
                    <div
                      key={session.id}
                      className={`flex items-start justify-between p-4 border rounded-lg ${
                        isCurrent ? "border-primary bg-primary/5" : ""
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="rounded-full bg-muted p-3">
                          <DeviceIcon className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">
                              {deviceName} on {osName}
                            </p>
                            {isCurrent && (
                              <Badge variant="success" className="text-xs">
                                Current
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            {session.ipAddress && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {session.ipAddress}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(session.createdAt).toLocaleDateString()} at{" "}
                              {new Date(session.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                          {session.lastActive && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Last active: {new Date(session.lastActive).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                      {!isCurrent && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => revokeSessionMutation.mutate(session.id)}
                          disabled={revokeSessionMutation.isPending}
                        >
                          {revokeSessionMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-red-500" />
                          )}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No active sessions found.</p>
            )}
          </CardContent>
        </Card>

        {/* Security Note */}
        <Card className="mt-6">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="font-medium">Security Tip</p>
                <p className="text-sm text-muted-foreground">
                  If you see a session you don't recognize, revoke it immediately and change your password.
                  Consider enabling two-factor authentication for added security.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SessionsSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center gap-4 mb-8">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-96" />
      </div>
    </div>
  );
}
