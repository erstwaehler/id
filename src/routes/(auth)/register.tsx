/**
 * EWF-ID Registration Page
 * SPEC.md Phase 6 - Task 6.3: Public Pages
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  Lock,
  Mail,
  School,
  User,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { m } from "@/paraglide/messages";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { authClient } from "~/lib/auth-client";

const registerSchema = z
  .object({
    name: z.string().min(2, m.register_name_min()),
    email: z.string().email(m.auth_invalid_email()),
    password: z
      .string()
      .min(12, m.register_password_min())
      .max(128, m.register_password_max())
      .regex(/[a-z]/, m.register_password_lowercase())
      .regex(/[A-Z]/, m.register_password_uppercase())
      .regex(/[0-9]/, m.register_password_number()),
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: m.register_terms_required(),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: m.register_password_match(),
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export const Route = createFileRoute("/(auth)/register")({
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      acceptTerms: false,
    },
  });

  const password = watch("password", "");

  const passwordStrength = {
    length: password.length >= 12,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
  };

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await authClient.signUp.email({
        email: data.email,
        password: data.password,
        name: data.name,
      });

      if (result.error) {
        setError(result.error.message || m.register_failed());
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError(m.auth_unexpected_error());
    } finally {
      setIsLoading(false);
    }
  };

  const handleSchoolLogin = (schoolId: string) => {
    window.location.href = `/api/auth/oauth/${schoolId}`;
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-500/10 p-4">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center">
              {m.register_success_title()}
            </CardTitle>
            <CardDescription className="text-center">
              {m.register_success_message()}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Link to="/login">
              <Button variant="link">{m.register_back_login()}</Button>
            </Link>
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
          <CardTitle className="text-2xl font-bold text-center">
            {m.register_title()}
          </CardTitle>
          <CardDescription className="text-center">
            {m.register_subtitle()}
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
              <Label htmlFor="name">{m.register_name_label()}</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder={m.register_name_placeholder()}
                  className="pl-10"
                  {...register("name")}
                />
              </div>
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{m.register_email_label()}</Label>
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
              <Label htmlFor="password">{m.register_password_label()}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••••••"
                  className="pl-10"
                  {...register("password")}
                />
              </div>
              {errors.password && (
                <p className="text-sm text-red-500">
                  {errors.password.message}
                </p>
              )}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div
                  className={`flex items-center gap-1 ${passwordStrength.length ? "text-green-500" : "text-muted-foreground"}`}>
                  {passwordStrength.length ? "✓" : "○"}{" "}
                  {m.register_password_12chars()}
                </div>
                <div
                  className={`flex items-center gap-1 ${passwordStrength.lowercase ? "text-green-500" : "text-muted-foreground"}`}>
                  {passwordStrength.lowercase ? "✓" : "○"}{" "}
                  {m.register_password_lowercase_check()}
                </div>
                <div
                  className={`flex items-center gap-1 ${passwordStrength.uppercase ? "text-green-500" : "text-muted-foreground"}`}>
                  {passwordStrength.uppercase ? "✓" : "○"}{" "}
                  {m.register_password_uppercase_check()}
                </div>
                <div
                  className={`flex items-center gap-1 ${passwordStrength.number ? "text-green-500" : "text-muted-foreground"}`}>
                  {passwordStrength.number ? "✓" : "○"}{" "}
                  {m.register_password_number_check()}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                {m.register_confirm_password_label()}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••••••"
                  className="pl-10"
                  {...register("confirmPassword")}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                id="acceptTerms"
                className="mt-1"
                {...register("acceptTerms")}
              />
              <Label htmlFor="acceptTerms" className="text-sm font-normal">
                {m.register_terms_agree()}{" "}
                <Link to="/terms" className="text-primary hover:underline">
                  {m.register_terms_link()}
                </Link>{" "}
                {m.common_and()}{" "}
                <Link
                  to="/privacy-policy"
                  className="text-primary hover:underline">
                  {m.register_privacy_link()}
                </Link>
              </Label>
            </div>
            {errors.acceptTerms && (
              <p className="text-sm text-red-500">
                {errors.acceptTerms.message}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {m.register_button()}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                {m.register_or_school()}
              </span>
            </div>
          </div>

          <div className="grid gap-2">
            <Button
              variant="outline"
              onClick={() => handleSchoolLogin("athenaeum")}
              disabled={isLoading}>
              <School className="mr-2 h-4 w-4" />
              Athenaeum Stade
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSchoolLogin("vlg")}
              disabled={isLoading}>
              <School className="mr-2 h-4 w-4" />
              Vincent-Lübeck-Gymnasium
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSchoolLogin("igs")}
              disabled={isLoading}>
              <School className="mr-2 h-4 w-4" />
              IGS Stade
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center text-muted-foreground">
            {m.register_has_account()}{" "}
            <Link to="/login" className="text-primary hover:underline">
              {m.register_signin_link()}
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
