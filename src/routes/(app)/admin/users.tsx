/**
 * EWF-ID Admin Users Page
 * SPEC.md Phase 6 - Task 6.5: Admin Pages
 */
import { createFileRoute, useNavigate, Link, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { authClient } from "~/lib/auth-client";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { 
  ArrowLeft,
  Search,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Ban,
  CheckCircle,
  Shield,
  Trash2,
  Eye,
  Loader2,
  AlertCircle,
  UserPlus
} from "lucide-react";

export const Route = createFileRoute("/(app)/admin/users")({
  component: AdminUsersPage,
  validateSearch: z.object({
    page: z.number().optional().default(1),
    search: z.string().optional(),
    role: z.string().optional(),
  }),
});

function AdminUsersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const searchParams = useSearch({ from: "/(app)/admin/users" });
  const [searchQuery, setSearchQuery] = useState(searchParams.search || "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const page = searchParams.page || 1;
  const perPage = 20;

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

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["admin-users", page, searchParams.search, searchParams.role],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(perPage),
      });
      if (searchParams.search) params.append("search", searchParams.search);
      if (searchParams.role) params.append("role", searchParams.role);

      const response = await fetch(`/api/admin/users?${params}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
    enabled: !!session,
  });

  const suspendMutation = useMutation({
    mutationFn: async ({ userId, suspend }: { userId: string; suspend: boolean }) => {
      const endpoint = suspend
        ? `/api/admin/users/${userId}/suspend`
        : `/api/admin/users/${userId}/unsuspend`;
      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update user");
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      setSuccess(variables.suspend ? "User suspended" : "User unsuspended");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({
      to: "/admin/users",
      search: { page: 1, search: searchQuery || undefined, role: searchParams.role },
    });
  };

  const handlePageChange = (newPage: number) => {
    navigate({
      to: "/admin/users",
      search: { ...searchParams, page: newPage },
    });
  };

  if (sessionLoading) {
    return <AdminUsersSkeleton />;
  }

  if (!session?.user) {
    return null;
  }

  const users = usersData?.users || [];
  const totalPages = Math.ceil((usersData?.total || 0) / perPage);

  const getRoleBadgeVariant = (role: string | null) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "team":
        return "default";
      case "teacher":
        return "secondary";
      case "student":
        return "outline";
      default:
        return "secondary";
    }
  };

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
            <h1 className="text-2xl font-bold text-white">User Management</h1>
            <p className="text-muted-foreground">
              {usersData?.total || 0} users total
            </p>
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

        {/* Search & Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select
                className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                value={searchParams.role || ""}
                onChange={(e) =>
                  navigate({
                    to: "/admin/users",
                    search: { page: 1, search: searchParams.search, role: e.target.value || undefined },
                  })
                }
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="team">Team</option>
                <option value="teacher">Teacher</option>
                <option value="student">Student</option>
                <option value="user">User</option>
              </select>
              <Button type="submit">Search</Button>
            </form>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card>
          <CardContent className="p-0">
            {usersLoading ? (
              <div className="p-4 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : users.length > 0 ? (
              <div className="divide-y">
                {users.map((user: any) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage src={user.image || undefined} alt={user.name} />
                        <AvatarFallback>
                          {user.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{user.name || "Unnamed User"}</p>
                          {user.banned && (
                            <Badge variant="destructive" className="text-xs">Suspended</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role || "user"}
                        </Badge>
                        {user.emailVerified ? (
                          <Badge variant="success" className="text-xs">Verified</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">Unverified</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Link to="/admin/users/$userId" params={{ userId: user.id }}>
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            suspendMutation.mutate({
                              userId: user.id,
                              suspend: !user.banned,
                            })
                          }
                          disabled={suspendMutation.isPending}
                        >
                          {user.banned ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <Ban className="h-4 w-4 text-red-500" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                No users found
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

function AdminUsersSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center gap-4 mb-8">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-16 mb-6" />
        <Skeleton className="h-96" />
      </div>
    </div>
  );
}
