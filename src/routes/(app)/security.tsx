// #! MESS
/**
 * EWF-ID Security Page
 * SPEC.md Phase 6 - Task 6.4: Authenticated User Pages
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Key,
  Loader2,
  Lock,
  Plus,
  Shield,
  Smartphone,
  Trash2,
  XCircle,
} from "lucide-react";
import { useState } from "react";
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

export const Route = createFileRoute("/(app)/security")({
  component: SecurityPage,
});

function SecurityPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [totpUri, setTotpUri] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState("");

  // Password change form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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

  // Check if 2FA is enabled
  const { data: twoFactorStatus } = useQuery({
    queryKey: ["2fa-status"],
    queryFn: async () => {
      // This would need a proper endpoint
      return { enabled: false };
    },
    enabled: !!session,
  });

  // Get passkeys
  const { data: passkeys, isLoading: passkeysLoading } = useQuery({
    queryKey: ["passkeys"],
    queryFn: async () => {
      try {
        const result = await authClient.passkey.listUserPasskeys();
        return result.data || [];
      } catch {
        return [];
      }
    },
    enabled: !!session,
  });

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      if (newPassword !== confirmPassword) {
        throw new Error("Passwords don't match");
      }
      if (newPassword.length < 12) {
        throw new Error("Password must be at least 12 characters");
      }
      const result = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });
      if (result.error) {
        throw new Error(result.error.message || "Failed to change password");
      }
      return result;
    },
    onSuccess: () => {
      setSuccess("Password changed successfully");
      setShowPasswordForm(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const enable2FAMutation = useMutation({
    mutationFn: async () => {
      const result = await authClient.twoFactor.enable();
      if (result.error) {
        throw new Error(result.error.message || "Failed to enable 2FA");
      }
      return result.data;
    },
    onSuccess: (data) => {
      setTotpUri(data?.totpURI || null);
      setShow2FASetup(true);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const verify2FAMutation = useMutation({
    mutationFn: async () => {
      const result = await authClient.twoFactor.verifyTotp({
        code: verifyCode,
      });
      if (result.error) {
        throw new Error(result.error.message || "Invalid verification code");
      }
      return result;
    },
    onSuccess: () => {
      setSuccess("Two-factor authentication enabled");
      setShow2FASetup(false);
      setTotpUri(null);
      setVerifyCode("");
      queryClient.invalidateQueries({ queryKey: ["2fa-status"] });
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const disable2FAMutation = useMutation({
    mutationFn: async () => {
      const result = await authClient.twoFactor.disable({
        password: currentPassword,
      });
      if (result.error) {
        throw new Error(result.error.message || "Failed to disable 2FA");
      }
      return result;
    },
    onSuccess: () => {
      setSuccess("Two-factor authentication disabled");
      setCurrentPassword("");
      queryClient.invalidateQueries({ queryKey: ["2fa-status"] });
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const addPasskeyMutation = useMutation({
    mutationFn: async () => {
      const result = await authClient.passkey.addPasskey();
      if (result?.error) {
        throw new Error(result.error.message || "Failed to add passkey");
      }
      return result;
    },
    onSuccess: () => {
      setSuccess("Passkey added successfully");
      queryClient.invalidateQueries({ queryKey: ["passkeys"] });
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const deletePasskeyMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await authClient.passkey.deletePasskey({ id });
      if (result?.error) {
        throw new Error(result.error.message || "Failed to delete passkey");
      }
      return result;
    },
    onSuccess: () => {
      setSuccess("Passkey removed");
      queryClient.invalidateQueries({ queryKey: ["passkeys"] });
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  if (sessionLoading) {
    return <SecuritySkeleton />;
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
            <h1 className="text-2xl font-bold text-white">Security</h1>
            <p className="text-muted-foreground">
              Manage your security settings
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 text-sm text-red-500 bg-red-500/10 rounded-md">
            <AlertCircle className="h-4 w-4" />
            {error}
            <button
              type="button"
              onClick={() => setError(null)}
              className="ml-auto">
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

        {/* Password Section */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>Password</CardTitle>
                <CardDescription>Change your account password</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!showPasswordForm ? (
              <Button onClick={() => setShowPasswordForm(true)}>
                Change Password
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum 12 characters
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => changePasswordMutation.mutate()}
                    disabled={changePasswordMutation.isPending}>
                    {changePasswordMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Update Password
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowPasswordForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Two-Factor Authentication */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <CardTitle>Two-Factor Authentication</CardTitle>
                  <CardDescription>
                    Add an extra layer of security
                  </CardDescription>
                </div>
              </div>
              <Badge
                variant={twoFactorStatus?.enabled ? "success" : "secondary"}>
                {twoFactorStatus?.enabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {show2FASetup ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Scan this QR code with your authenticator app:
                </p>
                {totpUri && (
                  <div className="flex justify-center p-4 bg-white rounded-lg">
                    {/* QR Code would be rendered here */}
                    <div className="text-center">
                      <p className="text-xs text-black break-all">{totpUri}</p>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="verifyCode">Verification Code</Label>
                  <Input
                    id="verifyCode"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    value={verifyCode}
                    onChange={(e) =>
                      setVerifyCode(e.target.value.replace(/\D/g, ""))
                    }
                    className="text-center text-2xl tracking-widest"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => verify2FAMutation.mutate()}
                    disabled={
                      verify2FAMutation.isPending || verifyCode.length !== 6
                    }>
                    {verify2FAMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Verify & Enable
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShow2FASetup(false);
                      setTotpUri(null);
                      setVerifyCode("");
                    }}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : twoFactorStatus?.enabled ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Two-factor authentication is currently enabled.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="disablePassword">
                    Enter password to disable
                  </Label>
                  <Input
                    id="disablePassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={() => disable2FAMutation.mutate()}
                  disabled={disable2FAMutation.isPending || !currentPassword}>
                  {disable2FAMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Disable 2FA
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => enable2FAMutation.mutate()}
                disabled={enable2FAMutation.isPending}>
                {enable2FAMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Enable 2FA
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Passkeys */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Key className="h-5 w-5 text-muted-foreground" />
                <div>
                  <CardTitle>Passkeys</CardTitle>
                  <CardDescription>
                    Passwordless authentication with biometrics
                  </CardDescription>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => addPasskeyMutation.mutate()}
                disabled={addPasskeyMutation.isPending}>
                {addPasskeyMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                <span className="ml-2">Add Passkey</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {passkeysLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </div>
            ) : passkeys && passkeys.length > 0 ? (
              <div className="space-y-2">
                {passkeys.map((passkey: any) => (
                  <div
                    key={passkey.id}
                    className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Key className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {passkey.name || "Passkey"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Added{" "}
                          {new Date(passkey.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deletePasskeyMutation.mutate(passkey.id)}
                      disabled={deletePasskeyMutation.isPending}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No passkeys registered. Add one for passwordless authentication.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SecuritySkeleton() {
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
        <Skeleton className="h-48 mb-6" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}
