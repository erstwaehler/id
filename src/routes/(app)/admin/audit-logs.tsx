/**
 * EWF-ID Admin Audit Logs Page
 * SPEC.md Phase 6 - Task 6.5: Admin Pages
 */
import { createFileRoute, useNavigate, Link, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { authClient } from "~/lib/auth-client";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import { 
  ArrowLeft,
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
  Clock,
  User,
  Shield,
  Download,
  Filter
} from "lucide-react";

export const Route = createFileRoute("/(app)/admin/audit-logs")({
  component: AdminAuditLogsPage,
  validateSearch: z.object({
    page: z.number().optional().default(1),
    action: z.string().optional(),
    userId: z.string().optional(),
  }),
});

function AdminAuditLogsPage() {
  const navigate = useNavigate();
  const searchParams = useSearch({ from: "/(app)/admin/audit-logs" });
  const [actionFilter, setActionFilter] = useState(searchParams.action || "");

  const page = searchParams.page || 1;
  const perPage = 50;

  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const result = await authClient.getSession();
      if (!result.data?.user) {
        navigate({ to: "/login" });
        return null;
      }
      if (result.data.user.role !== "admin" && result.data.user.role !== "team") {
        navigate({ to: "/dashboard" });
        return null;
      }
      return result.data;
    },
  });

  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ["admin-audit-logs", page, searchParams.action, searchParams.userId],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(perPage),
      });
      if (searchParams.action) params.append("action", searchParams.action);
      if (searchParams.userId) params.append("userId", searchParams.userId);

      const response = await fetch(`/api/admin/audit-logs?${params}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch audit logs");
      return response.json();
    },
    enabled: !!session,
  });

  const handleFilter = () => {
    navigate({
      to: "/admin/audit-logs",
      search: { page: 1, action: actionFilter || undefined, userId: searchParams.userId },
    });
  };

  const handlePageChange = (newPage: number) => {
    navigate({
      to: "/admin/audit-logs",
      search: { ...searchParams, page: newPage },
    });
  };

  const getActionBadgeVariant = (action: string) => {
    if (action.includes("delete") || action.includes("suspend") || action.includes("ban")) {
      return "destructive";
    }
    if (action.includes("create") || action.includes("register")) {
      return "success";
    }
    if (action.includes("update") || action.includes("change")) {
      return "default";
    }
    return "secondary";
  };

  const getResultBadgeVariant = (result: string) => {
    return result === "success" ? "success" : "destructive";
  };

  if (sessionLoading) {
    return <AdminAuditLogsSkeleton />;
  }

  if (!session?.user) {
    return null;
  }

  const logs = logsData?.logs || [];
  const totalPages = Math.ceil((logsData?.total || 0) / perPage);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
            <p className="text-muted-foreground">
              System activity and security events
            </p>
          </div>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filter by action (e.g., user.login, session.create)..."
                  className="pl-10"
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                />
              </div>
              <Button onClick={handleFilter}>Apply Filter</Button>
              {(searchParams.action || searchParams.userId) && (
                <Button
                  variant="outline"
                  onClick={() => navigate({ to: "/admin/audit-logs", search: { page: 1 } })}
                >
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Log</CardTitle>
            <CardDescription>
              {logsData?.total || 0} events recorded
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {logsLoading ? (
              <div className="p-4 space-y-4">
                {[...Array(10)].map((_, i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : logs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4 font-medium">Timestamp</th>
                      <th className="text-left p-4 font-medium">Action</th>
                      <th className="text-left p-4 font-medium">User</th>
                      <th className="text-left p-4 font-medium">Resource</th>
                      <th className="text-left p-4 font-medium">IP Address</th>
                      <th className="text-left p-4 font-medium">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log: any) => (
                      <tr key={log.id} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{new Date(log.timestamp).toLocaleString()}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant={getActionBadgeVariant(log.action)}>
                            {log.action}
                          </Badge>
                        </td>
                        <td className="p-4">
                          {log.userId ? (
                            <Link
                              to="/admin/users/$userId"
                              params={{ userId: log.userId }}
                              className="flex items-center gap-2 text-sm hover:underline"
                            >
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span>{log.userName || log.userId.slice(0, 8)}...</span>
                            </Link>
                          ) : (
                            <span className="text-muted-foreground text-sm">System</span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className="text-sm">
                            {log.resource}
                            {log.resourceId && `:${log.resourceId.slice(0, 8)}...`}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm font-mono">{log.ipAddress || "-"}</span>
                        </td>
                        <td className="p-4">
                          <Badge variant={getResultBadgeVariant(log.result)}>
                            {log.result}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                No audit logs found
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AdminAuditLogsSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center gap-4 mb-8">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Skeleton className="h-16 mb-6" />
        <Skeleton className="h-[600px]" />
      </div>
    </div>
  );
}
