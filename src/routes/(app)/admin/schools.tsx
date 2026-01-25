/**
 * EWF-ID Admin Schools Page
 * SPEC.md Phase 6 - Task 6.5: Admin Pages
 */
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authClient } from "~/lib/auth-client";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import { 
  ArrowLeft,
  Plus,
  School,
  Settings,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
  Edit,
  ExternalLink
} from "lucide-react";

const schoolSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().min(2, "Slug must be at least 2 characters").regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  oidcIssuer: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  oidcClientId: z.string().optional(),
  oidcClientSecret: z.string().optional(),
  enabled: z.boolean().default(true),
});

type SchoolFormData = z.infer<typeof schoolSchema>;

export const Route = createFileRoute("/(app)/admin/schools")({
  component: AdminSchoolsPage,
});

function AdminSchoolsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSchool, setEditingSchool] = useState<any>(null);

  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const result = await authClient.getSession();
      if (!result.data?.user) {
        navigate({ to: "/login" });
        return null;
      }
      if (result.data.user.role !== "admin") {
        navigate({ to: "/dashboard" });
        return null;
      }
      return result.data;
    },
  });

  const { data: schools, isLoading: schoolsLoading } = useQuery({
    queryKey: ["admin-schools"],
    queryFn: async () => {
      const response = await fetch("/api/admin/schools", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch schools");
      return response.json();
    },
    enabled: !!session,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<SchoolFormData>({
    resolver: zodResolver(schoolSchema),
    defaultValues: {
      enabled: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: SchoolFormData) => {
      const response = await fetch("/api/admin/schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create school");
      }
      return response.json();
    },
    onSuccess: () => {
      setSuccess("School created");
      setShowAddForm(false);
      reset();
      queryClient.invalidateQueries({ queryKey: ["admin-schools"] });
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SchoolFormData> }) => {
      const response = await fetch(`/api/admin/schools/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update school");
      }
      return response.json();
    },
    onSuccess: () => {
      setSuccess("School updated");
      setEditingSchool(null);
      reset();
      queryClient.invalidateQueries({ queryKey: ["admin-schools"] });
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/schools/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete school");
      }
      return response.json();
    },
    onSuccess: () => {
      setSuccess("School deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-schools"] });
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const onSubmit = (data: SchoolFormData) => {
    if (editingSchool) {
      updateMutation.mutate({ id: editingSchool.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const startEditing = (school: any) => {
    setEditingSchool(school);
    setValue("name", school.name);
    setValue("slug", school.slug);
    setValue("oidcIssuer", school.oidcIssuer || "");
    setValue("oidcClientId", school.oidcClientId || "");
    setValue("oidcClientSecret", "");
    setValue("enabled", school.enabled);
    setShowAddForm(true);
  };

  const cancelForm = () => {
    setShowAddForm(false);
    setEditingSchool(null);
    reset();
  };

  if (sessionLoading) {
    return <AdminSchoolsSkeleton />;
  }

  if (!session?.user) {
    return null;
  }

  const schoolList = schools?.schools || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">School Management</h1>
            <p className="text-muted-foreground">
              Configure school SSO and affiliations
            </p>
          </div>
          {!showAddForm && (
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add School
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

        {/* Add/Edit Form */}
        {showAddForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{editingSchool ? "Edit School" : "Add New School"}</CardTitle>
              <CardDescription>
                Configure school details and OIDC settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">School Name</Label>
                    <Input
                      id="name"
                      placeholder="Athenaeum Stade"
                      {...register("name")}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500">{errors.name.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      placeholder="athenaeum"
                      {...register("slug")}
                    />
                    {errors.slug && (
                      <p className="text-sm text-red-500">{errors.slug.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="oidcIssuer">OIDC Issuer URL (optional)</Label>
                  <Input
                    id="oidcIssuer"
                    placeholder="https://login.schulportal.de"
                    {...register("oidcIssuer")}
                  />
                  {errors.oidcIssuer && (
                    <p className="text-sm text-red-500">{errors.oidcIssuer.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="oidcClientId">OIDC Client ID</Label>
                    <Input
                      id="oidcClientId"
                      placeholder="client-id"
                      {...register("oidcClientId")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="oidcClientSecret">OIDC Client Secret</Label>
                    <Input
                      id="oidcClientSecret"
                      type="password"
                      placeholder={editingSchool ? "Leave empty to keep current" : "secret"}
                      {...register("oidcClientSecret")}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="enabled"
                    {...register("enabled")}
                  />
                  <Label htmlFor="enabled">School is enabled for login</Label>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {(createMutation.isPending || updateMutation.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {editingSchool ? "Update School" : "Create School"}
                  </Button>
                  <Button type="button" variant="outline" onClick={cancelForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Schools List */}
        <Card>
          <CardHeader>
            <CardTitle>Configured Schools</CardTitle>
            <CardDescription>
              {schoolList.length} school{schoolList.length !== 1 ? "s" : ""} configured
            </CardDescription>
          </CardHeader>
          <CardContent>
            {schoolsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            ) : schoolList.length > 0 ? (
              <div className="space-y-4">
                {schoolList.map((school: any) => (
                  <div
                    key={school.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="rounded-full bg-primary/10 p-3">
                        <School className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{school.name}</p>
                          <Badge variant={school.enabled ? "success" : "secondary"}>
                            {school.enabled ? "Active" : "Disabled"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Slug: {school.slug}
                          {school.oidcIssuer && (
                            <span className="ml-2">• OIDC Configured</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {school.userCount || 0} users affiliated
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => startEditing(school)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm(`Delete ${school.name}?`)) {
                            deleteMutation.mutate(school.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No schools configured. Add one to enable school SSO.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AdminSchoolsSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    </div>
  );
}
