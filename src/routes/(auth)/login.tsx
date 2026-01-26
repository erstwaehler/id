/**
 * EWF-ID Login Page
 * SPEC.md Phase 6 - Task 6.3: Public Pages
 */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authClient } from "~/lib/auth-client";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { AlertCircle, Loader2, Mail, Lock, School, Key } from "lucide-react";
import { m } from "@/paraglide/messages";

const loginSchema = z.object({
  email: z.string().email(m.auth_invalid_email()),
  password: z.string().min(1, m.auth_password_required()),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const Route = createFileRoute("/(auth)/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requires2FA, setRequires2FA] = useState(false);
  const [totpCode, setTotpCode] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await authClient.signIn.email({
        email: data.email,
        password: data.password,
      });

      if (result.error) {
        if (result.error.message?.includes("2FA")) {
          setRequires2FA(true);
        } else {
          setError(result.error.message || m.auth_login_failed());
        }
      } else {
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      setError(m.auth_unexpected_error());
    } finally {
      setIsLoading(false);
    }
  };

  const handleTOTPSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const values = getValues();
      const result = await authClient.twoFactor.verifyTOTP({
        code: totpCode,
      });

      if (result.error) {
        setError(result.error.message || m.auth_invalid_2fa());
      } else {
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      setError(m.auth_unexpected_error());
    } finally {
      setIsLoading(false);
    }
  };

  const handleSchoolLogin = (schoolId: string) => {
    // Redirect to school OIDC
    window.location.href = `/api/auth/oauth/${schoolId}`;
  };

  const handlePasskeyLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await authClient.passkey.signIn();

      if (result?.error) {
        setError(result.error.message || m.auth_passkey_failed());
      } else {
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      setError(m.auth_passkey_failed());
    } finally {
      setIsLoading(false);
    }
  };

  if (requires2FA) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">{m.auth_2fa_title()}</CardTitle>
            <CardDescription className="text-center">
              {m.auth_2fa_subtitle()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-500 bg-red-500/10 rounded-md">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="totp">{m.auth_2fa_code_label()}</Label>
              <Input
                id="totp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder={m.auth_2fa_code_placeholder()}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                className="text-center text-2xl tracking-widest"
              />
            </div>
            <Button onClick={handleTOTPSubmit} className="w-full" disabled={isLoading || totpCode.length !== 6}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {m.auth_2fa_verify()}
            </Button>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button variant="link" onClick={() => setRequires2FA(false)}>
              {m.auth_2fa_back()}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <img src="/logo.svg" alt="EWF-ID" className="h-12 w-12" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">{m.auth_welcome_back()}</CardTitle>
          <CardDescription className="text-center">
            {m.auth_signin_subtitle()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-500 bg-red-500/10 rounded-md">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{m.common_email()}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder={m.auth_email_placeholder()}
                  className="pl-10"
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{m.common_password()}</Label>
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                  {m.auth_forgot_password()}
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder={m.auth_password_placeholder()}
                  className="pl-10"
                  {...register("password")}
                />
              </div>
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {m.auth_signin_button()}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">{m.auth_or_continue()}</span>
            </div>
          </div>

          <div className="grid gap-2">
            <Button variant="outline" onClick={handlePasskeyLogin} disabled={isLoading}>
              <Key className="mr-2 h-4 w-4" />
              {m.auth_passkey()}
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">{m.auth_school_login()}</span>
            </div>
          </div>

          <div className="grid gap-2">
            <Button variant="outline" onClick={() => handleSchoolLogin("athenaeum")} disabled={isLoading}>
              <School className="mr-2 h-4 w-4" />
              Athenaeum Stade
            </Button>
            <Button variant="outline" onClick={() => handleSchoolLogin("vlg")} disabled={isLoading}>
              <School className="mr-2 h-4 w-4" />
              Vincent-Lübeck-Gymnasium
            </Button>
            <Button variant="outline" onClick={() => handleSchoolLogin("igs")} disabled={isLoading}>
              <School className="mr-2 h-4 w-4" />
              IGS Stade
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center text-muted-foreground">
            {m.auth_no_account()}{" "}
            <Link to="/register" className="text-primary hover:underline">
              {m.auth_signup()}
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
