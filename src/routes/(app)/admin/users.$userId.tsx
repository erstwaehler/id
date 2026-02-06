// #! MESS
/**
 * EWF-ID Admin User Detail Page
 * SPEC.md Phase 6 - Task 6.5: Admin Pages
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createFileRoute,
  Link,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Ban,
  Calendar,
  CheckCircle,
  Key,
  Loader2,
  Mail,
  Save,
  School,
  Shield,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { Skeleton } from "~/components/ui/skeleton";
import { authClient } from "~/lib/auth-client";

export const Route = createFileRoute("/(app)/admin/users/$userId")({
  component: AdminUserDetailPage,
});

function AdminUserDetailPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { userId } = useParams({ from: "/(app)/admin/users/$userId" });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");

  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const result = await authClient.getSession();
      if (!result.data?.user) {
        navigate({ to: "/login" });
        return null;
      }
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

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["admin-user", userId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch user");
      return response.json();
    },
    enabled: !!session,
  });

  const suspendMutation = useMutation({
    mutationFn: async (suspend: boolean) => {
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
    onSuccess: (_, suspend) => {
      setSuccess(suspend ? "User suspended" : "User unsuspended");
      queryClient.invalidateQueries({ queryKey: ["admin-user", userId] });
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async (role: string) => {
      const response = await fetch(`/api/admin/users/${userId}/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update role");
      }
      return response.json();
    },
    onSuccess: () => {
      setSuccess("Role updated");
      queryClient.invalidateQueries({ queryKey: ["admin-user", userId] });
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete user");
      }
      return response.json();
    },
    onSuccess: () => {
      navigate({ to: "/admin/users" });
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  if (sessionLoading || userLoading) {
    return <AdminUserDetailSkeleton />;
  }

  if (!session?.user || !user) {
    return null;
  }

  const initials =
    user.name
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase() || "U";

  const canEditRole = session.user.role === "admin";
  const canDelete =
    session.user.role === "admin" && user.id !== session.user.id;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/admin/users">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">User Details</h1>
            <p className="text-muted-foreground">Manage user account</p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 text-sm text-red-500 bg-red-500/10 rounded-md">
            <AlertCircle className="h-4 w-4" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto">
              ×
            </button>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 p-3 mb-4 text-sm text-green-500 bg-green-500/10 rounded-md">
            <CheckCircle className="h-4 w-4" />
            {success}
          </div>
        )}

        {/* User Profile Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.image || undefined} alt={user.name} />
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold">
                    {user.name || "Unnamed User"}
                  </h2>
                  {user.banned && (
                    <Badge variant="destructive">Suspended</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <Badge
                    variant={
                      user.role === "admin"
                        ? "destructive"
                        : user.role === "team"
                          ? "default"
                          : "secondary"
                    }>
                    {user.role || "user"}
                  </Badge>
                  {user.emailVerified ? (
                    <Badge variant="success">Email Verified</Badge>
                  ) : (
                    <Badge variant="outline">Email Unverified</Badge>
                  )}
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {user.email}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Joined {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  variant={user.banned ? "default" : "destructive"}
                  onClick={() => suspendMutation.mutate(!user.banned)}
                  disabled={suspendMutation.isPending}>
                  {suspendMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : user.banned ? (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  ) : (
                    <Ban className="mr-2 h-4 w-4" />
                  )}
                  {user.banned ? "Unsuspend" : "Suspend"}
                </Button>
                {canDelete && (
                  <Button
                    variant="outline"
                    className="text-red-500 hover:text-red-600"
                    onClick={() => {
                      if (
                        confirm("Are you sure you want to delete this user?")
                      ) {
                        deleteMutation.mutate();
                      }
                    }}
                    disabled={deleteMutation.isPending}>
                    {deleteMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    Delete User
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Role Management */}
        {canEditRole && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Role Management
              </CardTitle>
              <CardDescription>
                Change the user's role and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-4">
                <div className="flex-1 space-y-2">
                  <Label>Role</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    value={selectedRole || user.role || "user"}
                    onChange={(e) => setSelectedRole(e.target.value)}>
                    <option value="user">User</option>
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="team">Team</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <Button
                  onClick={() =>
                    updateRoleMutation.mutate(
                      selectedRole || user.role || "user",
                    )
                  }
                  disabled={
                    updateRoleMutation.isPending ||
                    !selectedRole ||
                    selectedRole === user.role
                  }>
                  {updateRoleMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Update Role
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Account Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Account Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sessions</span>
                <span className="font-medium">
                  {user.sessions?.length || 0} active
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">API Keys</span>
                <span className="font-medium">{user.apiKeys?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Login</span>
                <span className="font-medium">
                  {user.lastLoginAt
                    ? new Date(user.lastLoginAt).toLocaleString()
                    : "Never"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <School className="h-5 w-5" />
                School Affiliations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user.schools && user.schools.length > 0 ? (
                <div className="space-y-2">
                  {user.schools.map((school: any) => (
                    <div
                      key={school.schoolId}
                      className="flex items-center justify-between">
                      <span>{school.schoolName}</span>
                      <Badge variant={school.verified ? "success" : "outline"}>
                        {school.verified ? "Verified" : "Pending"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No school affiliations
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Raw Data (for debugging) */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>User ID</CardTitle>
          </CardHeader>
          <CardContent>
            <code className="text-sm bg-muted p-2 rounded block overflow-x-auto">
              {user.id}
            </code>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AdminUserDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Skeleton className="h-48 mb-6" />
        <Skeleton className="h-32 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    </div>
  );
}
