// #! MESS
/**
 * EWF-ID User Dashboard Page
 * SPEC.md Phase 6 - Task 6.4: Authenticated User Pages
 */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { authClient } from "~/lib/auth-client";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import {
  User,
  Shield,
  Key,
  Settings,
  LogOut,
  Activity,
  Calendar,
  Vote,
  Radio,
  Monitor,
  ExternalLink,
} from "lucide-react";

export const Route = createFileRoute("/(app)/dashboard/")({
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();

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

  const handleLogout = async () => {
    await authClient.signOut();
    navigate({ to: "/login" });
  };

  if (sessionLoading) {
    return <DashboardSkeleton />;
  }

  if (!session?.user) {
    return null;
  }

  const user = session.user;
  const initials =
    user.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "U";

  const apps = [
    {
      name: "Schedule",
      description: "View and manage events",
      icon: Calendar,
      href: "https://schedule.ewf-stade.de",
      color: "text-blue-500",
    },
    {
      name: "Vote",
      description: "Participate in elections",
      icon: Vote,
      href: "https://vote.ewf-stade.de",
      color: "text-green-500",
    },
    {
      name: "Live",
      description: "Interactive Q&A sessions",
      icon: Radio,
      href: "https://live.ewf-stade.de",
      color: "text-red-500",
    },
    {
      name: "Screens",
      description: "Manage digital displays",
      icon: Monitor,
      href: "https://screens.ewf-stade.de",
      color: "text-purple-500",
      requiresRole: "team",
    },
  ];

  const filteredApps = apps.filter(
    (app) =>
      !app.requiresRole ||
      user.role === app.requiresRole ||
      user.role === "admin",
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.image || undefined} alt={user.name} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Welcome back, {user.name?.split(" ")[0] || "User"}!
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant={
                    user.role === "admin"
                      ? "destructive"
                      : user.role === "team"
                        ? "default"
                        : "secondary"
                  }
                >
                  {user.role || "user"}
                </Badge>
                {profile?.schoolVerified && (
                  <Badge variant="success">School Verified</Badge>
                )}
              </div>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link to="/profile">
            <Card className="cursor-pointer hover:border-primary transition-colors">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-full bg-blue-500/10 p-3">
                  <User className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium">Profile</p>
                  <p className="text-sm text-muted-foreground">View & edit</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/security">
            <Card className="cursor-pointer hover:border-primary transition-colors">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-full bg-green-500/10 p-3">
                  <Shield className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="font-medium">Security</p>
                  <p className="text-sm text-muted-foreground">
                    2FA & Passkeys
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/sessions">
            <Card className="cursor-pointer hover:border-primary transition-colors">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-full bg-yellow-500/10 p-3">
                  <Activity className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <p className="font-medium">Sessions</p>
                  <p className="text-sm text-muted-foreground">
                    {profile?.stats?.activeSessions || 0} active
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/settings">
            <Card className="cursor-pointer hover:border-primary transition-colors">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-full bg-purple-500/10 p-3">
                  <Settings className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <p className="font-medium">Settings</p>
                  <p className="text-sm text-muted-foreground">Preferences</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* EWF Apps */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Erstwähler Forum Apps</CardTitle>
            <CardDescription>
              Access connected applications with your EWF-ID
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredApps.map((app) => (
                <a
                  key={app.name}
                  href={app.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Card className="cursor-pointer hover:border-primary transition-colors h-full">
                    <CardContent className="flex items-center gap-4 p-4">
                      <div
                        className={`rounded-full bg-opacity-10 p-3 ${app.color.replace("text-", "bg-")}/10`}
                      >
                        <app.icon className={`h-6 w-6 ${app.color}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{app.name}</p>
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {app.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Account Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email Verified</span>
                <Badge variant={user.emailVerified ? "success" : "destructive"}>
                  {user.emailVerified ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Member Since</span>
                <span className="font-medium">
                  {profile?.createdAt
                    ? new Date(profile.createdAt).toLocaleDateString()
                    : "-"}
                </span>
              </div>
              {profile?.schools?.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">School</span>
                  <span className="font-medium">
                    {profile.schools[0].schoolName}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active Sessions</span>
                <span className="font-medium">
                  {profile?.stats?.activeSessions || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">API Keys</span>
                <span className="font-medium">
                  {profile?.stats?.activeApiKeys || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Login</span>
                <span className="font-medium">
                  {profile?.lastLoginAt
                    ? new Date(profile.lastLoginAt).toLocaleString()
                    : "Now"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Link */}
        {(user.role === "admin" || user.role === "team") && (
          <div className="mt-8">
            <Link to="/admin">
              <Button variant="outline" className="w-full">
                <Key className="mr-2 h-4 w-4" />
                Admin Panel
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center gap-4 mb-8">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    </div>
  );
}
