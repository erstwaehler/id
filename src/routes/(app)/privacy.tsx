/**
 * EWF-ID Privacy Page (GDPR - Account Deletion)
 * SPEC.md Phase 6 - Task 6.4: Authenticated User Pages
 */
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authClient } from "~/lib/auth-client";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import { Separator } from "~/components/ui/separator";
import { 
  ArrowLeft, 
  Loader2,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Trash2,
  Download,
  XCircle,
  Clock
} from "lucide-react";

export const Route = createFileRoute("/(app)/privacy")({
  component: PrivacyPage,
});

function PrivacyPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");

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

  const { data: deletionStatus, isLoading: deletionLoading } = useQuery({
    queryKey: ["deletion-status"],
    queryFn: async () => {
      const response = await fetch("/api/users/me/delete", {
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error("Failed to fetch deletion status");
      }
      return response.json();
    },
    enabled: !!session,
  });

  const { data: exportRequests, isLoading: exportLoading } = useQuery({
    queryKey: ["export-status"],
    queryFn: async () => {
      // This would need a proper endpoint to list export requests
      return [];
    },
    enabled: !!session,
  });

  const requestExportMutation = useMutation({
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

  const requestDeletionMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/users/me/delete", {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to request account deletion");
      }
      return response.json();
    },
    onSuccess: () => {
      setSuccess("Account deletion requested. You have 30 days to cancel this request.");
      setShowDeleteConfirm(false);
      setConfirmText("");
      queryClient.invalidateQueries({ queryKey: ["deletion-status"] });
      setTimeout(() => setSuccess(null), 5000);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const cancelDeletionMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/users/me/delete", {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to cancel deletion request");
      }
      return response.json();
    },
    onSuccess: () => {
      setSuccess("Account deletion cancelled.");
      queryClient.invalidateQueries({ queryKey: ["deletion-status"] });
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  if (sessionLoading) {
    return <PrivacySkeleton />;
  }

  if (!session?.user) {
    return null;
  }

  const user = session.user;
  const hasPendingDeletion = deletionStatus?.status === "pending";
  const deletionDate = deletionStatus?.scheduledAt
    ? new Date(deletionStatus.scheduledAt)
    : null;

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
            <h1 className="text-2xl font-bold text-white">Privacy & Data</h1>
            <p className="text-muted-foreground">Manage your data and account</p>
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

        {/* Your Rights */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Your Data Rights (GDPR)</CardTitle>
            <CardDescription>
              Under GDPR, you have the following rights regarding your personal data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Right to Access (Art. 15)</p>
                  <p className="text-sm text-muted-foreground">
                    Request a copy of all your personal data
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Right to Rectification (Art. 16)</p>
                  <p className="text-sm text-muted-foreground">
                    Correct inaccurate data via your profile
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Right to Erasure (Art. 17)</p>
                  <p className="text-sm text-muted-foreground">
                    Request deletion of your account and data
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Right to Data Portability (Art. 20)</p>
                  <p className="text-sm text-muted-foreground">
                    Export your data in a machine-readable format
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Export */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Download className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>Export Your Data</CardTitle>
                <CardDescription>
                  Download a copy of all your personal data in JSON format
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Your export will include:
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>Profile information (name, email, etc.)</li>
                <li>Account settings and preferences</li>
                <li>Session history</li>
                <li>School affiliations</li>
                <li>API keys (without secrets)</li>
                <li>Audit log of your actions</li>
              </ul>
              <Button
                onClick={() => requestExportMutation.mutate()}
                disabled={requestExportMutation.isPending}
              >
                {requestExportMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Request Data Export
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account Deletion */}
        <Card className="border-red-500/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <CardTitle className="text-red-500">Delete Account</CardTitle>
                <CardDescription>
                  Permanently delete your account and all associated data
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {hasPendingDeletion ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/50 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="font-medium text-yellow-500">Deletion Scheduled</p>
                    <p className="text-sm text-muted-foreground">
                      Your account will be permanently deleted on{" "}
                      {deletionDate?.toLocaleDateString()} at{" "}
                      {deletionDate?.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => cancelDeletionMutation.mutate()}
                  disabled={cancelDeletionMutation.isPending}
                >
                  {cancelDeletionMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="mr-2 h-4 w-4" />
                  )}
                  Cancel Deletion
                </Button>
              </div>
            ) : showDeleteConfirm ? (
              <div className="space-y-4">
                <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
                  <p className="font-medium text-red-500 mb-2">⚠️ This action is irreversible</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    All your data will be permanently deleted after a 30-day grace period.
                    During this time, you can cancel the deletion request.
                  </p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mb-4">
                    <li>Your profile and account will be deleted</li>
                    <li>All sessions will be terminated</li>
                    <li>API keys will be revoked</li>
                    <li>School affiliations will be removed</li>
                    <li>You will lose access to all EWF services</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm">
                    Type <span className="font-mono font-bold">DELETE</span> to confirm
                  </Label>
                  <Input
                    id="confirm"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="DELETE"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    onClick={() => requestDeletionMutation.mutate()}
                    disabled={confirmText !== "DELETE" || requestDeletionMutation.isPending}
                  >
                    {requestDeletionMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    Delete My Account
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setShowDeleteConfirm(false);
                    setConfirmText("");
                  }}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  When you delete your account, you have a 30-day grace period to change your mind.
                  After this period, your account and all associated data will be permanently deleted.
                </p>
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Request Account Deletion
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="mt-6">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Have questions about your data? Contact our Data Protection Officer at{" "}
                <a href="mailto:privacy@ewf-stade.de" className="text-primary hover:underline">
                  privacy@ewf-stade.de
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PrivacySkeleton() {
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
        <Skeleton className="h-96 mb-6" />
        <Skeleton className="h-48 mb-6" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}
