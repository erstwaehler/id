/**
 * EWF-ID Email Verification Page
 * SPEC.md Phase 6 - Task 6.3: Public Pages
 */
import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { authClient } from "~/lib/auth-client";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { AlertCircle, Loader2, CheckCircle, Mail } from "lucide-react";

export const Route = createFileRoute("/(auth)/verify-email")({
  component: VerifyEmailPage,
  validateSearch: z.object({
    token: z.string().optional(),
  }),
});

function VerifyEmailPage() {
  const { token } = useSearch({ from: "/(auth)/verify-email" });
  const [status, setStatus] = useState<"loading" | "success" | "error" | "no-token">(
    token ? "loading" : "no-token"
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    }
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      const result = await authClient.verifyEmail({
        token: verificationToken,
      });

      if (result.error) {
        setError(result.error.message || "Verification failed");
        setStatus("error");
      } else {
        setStatus("success");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      setStatus("error");
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">Verifying your email...</CardTitle>
            <CardDescription className="text-center">
              Please wait while we verify your email address
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-500/10 p-4">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center">Email verified!</CardTitle>
            <CardDescription className="text-center">
              Your email has been successfully verified. You can now access all features of your account.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Link to="/login">
              <Button>Sign in</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-red-500/10 p-4">
                <AlertCircle className="h-12 w-12 text-red-500" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center">Verification failed</CardTitle>
            <CardDescription className="text-center">
              {error || "This verification link is invalid or has expired."}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col gap-2 items-center">
            <Link to="/login">
              <Button>Sign in</Button>
            </Link>
            <p className="text-sm text-muted-foreground">
              Need a new verification email? Sign in and request one from your account settings.
            </p>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // No token provided
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-blue-500/10 p-4">
              <Mail className="h-12 w-12 text-blue-500" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Check your email</CardTitle>
          <CardDescription className="text-center">
            We've sent you a verification link. Please check your inbox and click the link to verify your email address.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>Didn't receive the email?</p>
            <ul className="mt-2 space-y-1">
              <li>• Check your spam folder</li>
              <li>• Make sure you entered the correct email</li>
              <li>• Wait a few minutes and try again</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link to="/login">
            <Button variant="outline">Back to login</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
