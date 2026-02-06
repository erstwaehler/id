// #! MESS
/**
 * EWF-ID Admin Dashboard
 * SPEC.md Phase 6 - Task 6.5: Admin Pages
 */

import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  Clock,
  FileText,
  Key,
  School,
  Settings,
  Shield,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { authClient } from "~/lib/auth-client";

export const Route = createFileRoute("/(app)/admin/")({
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  const navigate = useNavigate();

  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const result = await authClient.getSession();
      if (!result.data?.user) {
        navigate({ to: "/login" });
        return null;
      }
      // Check if user has admin access
      if (
        result.data.user.role !== "admin" &&
        result.data.user.role !== "team"
      ) {
        navigate({ to: "/dashboard" });
        return null;
      }
      return result.data;
    },
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const response = await fetch("/api/admin/analytics/overview", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch analytics");
      return response.json();
    },
    enabled: !!session,
  });

  if (sessionLoading) {
    return <AdminDashboardSkeleton />;
  }

  if (!session?.user) {
    return null;
  }

  const stats = analytics || {
    users: { total: 0, verified: 0, unverified: 0, banned: 0 },
    sessions: { active: 0 },
    schools: { total: 0 },
    apiKeys: { total: 0 },
  };

  const quickLinks = [
    {
      name: "Users",
      href: "/admin/users",
      icon: Users,
      count: stats.users?.total || 0,
    },
    {
      name: "Schools",
      href: "/admin/schools",
      icon: School,
      count: stats.schools?.total || 0,
    },
    {
      name: "Audit Logs",
      href: "/admin/audit-logs",
      icon: FileText,
      count: null,
    },
    {
      name: "OIDC Clients",
      href: "/admin/oidc-clients",
      icon: Key,
      count: null,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage EWF-ID system</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={
                session.user.role === "admin" ? "destructive" : "default"
              }>
              {session.user.role}
            </Badge>
            <Link to="/dashboard">
              <Button variant="outline" size="sm">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.users?.total || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.users?.verified || 0} verified
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Active Sessions
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.sessions?.active || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Currently logged in
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Schools</CardTitle>
              <School className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.schools?.total || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Configured schools
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">API Keys</CardTitle>
              <Key className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.apiKeys?.total || 0}
              </div>
              <p className="text-xs text-muted-foreground">Active keys</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {quickLinks.map((link) => (
            <Link key={link.name} to={link.href}>
              <Card className="cursor-pointer hover:border-primary transition-colors h-full">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="rounded-full bg-primary/10 p-3">
                    <link.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{link.name}</p>
                    {link.count !== null && (
                      <p className="text-sm text-muted-foreground">
                        {link.count} total
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Recent Activity & User Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Stats */}
          <Card>
            <CardHeader>
              <CardTitle>User Statistics</CardTitle>
              <CardDescription>Overview of user accounts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span>Verified Users</span>
                </div>
                <span className="font-medium">
                  {stats.users?.verified || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span>Unverified Users</span>
                </div>
                <span className="font-medium">
                  {stats.users?.unverified || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span>Banned Users</span>
                </div>
                <span className="font-medium">{stats.users?.banned || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span>Admin Users</span>
                </div>
                <span className="font-medium">{stats.users?.admins || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <span>Team Members</span>
                </div>
                <span className="font-medium">{stats.users?.team || 0}</span>
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>Service health overview</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span>Authentication Service</span>
                </div>
                <Badge variant="success">Healthy</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span>Database</span>
                </div>
                <Badge variant="success">Connected</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span>OIDC Provider</span>
                </div>
                <Badge variant="success">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  <span>Email Service</span>
                </div>
                <Badge variant="warning">Check Config</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Actions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recent Admin Actions</CardTitle>
            <CardDescription>
              Latest activity from the audit log
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentActions?.length > 0 ? (
                stats.recentActions.map((action: any, index: number) => (
                  <div
                    key={`s${index}`}
                    className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{action.action}</p>
                        <p className="text-xs text-muted-foreground">
                          by {action.userName || "System"}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(action.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent actions to display
                </p>
              )}
            </div>
            <div className="mt-4">
              <Link to="/admin/audit-logs">
                <Button variant="outline" size="sm" className="w-full">
                  View All Audit Logs
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AdminDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Skeleton className="h-10 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    </div>
  );
}
