/**
 * EWF-ID Admin Audit Logs Page
 * MIGRATED: Audit logs are now handled via OTEL/Axiom
 *
 * This page has been updated to reflect the migration of audit logging
 * from Postgres to Axiom via OpenTelemetry. Admins should now use
 * the Axiom dashboard to query and view audit logs.
 */

import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Database,
  ExternalLink,
} from "lucide-react";
import { z } from "zod";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { authClient } from "~/lib/auth-client";

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

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex items-center gap-4 mb-8">
            <div className="animate-pulse h-8 w-32 bg-slate-700 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

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
          <Badge variant="outline" className="gap-1">
            <Activity className="h-3 w-3" />
            OTEL/Axiom
          </Badge>
        </div>

        {/* Migration Notice */}
        <div className="mb-6 border border-amber-500/50 bg-amber-500/10 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
            <div>
              <h3 className="text-amber-500 font-medium mb-1">
                System Migration Notice
              </h3>
              <p className="text-slate-300 text-sm">
                Audit logging has been migrated from Postgres to
                OpenTelemetry/Axiom. All audit events are now streamed to Axiom
                for real-time monitoring and analysis.
              </p>
            </div>
          </div>
        </div>

        {/* Migration Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Migration Summary
            </CardTitle>
            <CardDescription>
              The audit system has been completely redesigned for better
              performance and scalability
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h3 className="font-medium text-red-400">Removed</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Postgres audit_log table</li>
                  <li>• Manual audit service implementation</li>
                  <li>• Database-backed audit queries</li>
                  <li>• Legacy audit API endpoints</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium text-green-400">Added</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• OTEL-based audit hooks</li>
                  <li>• Axiom integration for log storage</li>
                  <li>• Real-time audit streaming</li>
                  <li>• Comprehensive event coverage</li>
                  <li>• Security risk classification</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Axiom Integration */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Access Audit Logs in Axiom
            </CardTitle>
            <CardDescription>
              All audit events are now available in your Axiom dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              The new audit system captures all Better Auth events including:
              authentication, 2FA, passkeys, admin operations, OIDC flows, and
              more.
            </p>

            <div className="bg-slate-950 rounded-lg p-4 font-mono text-xs space-y-2 overflow-x-auto">
              <div className="text-green-400">{`-- Query all authentication events`}</div>
              <div className="text-slate-300">
                {"['logs'] | where ['audit.event_category'] == \"auth\""}
              </div>
              <div className="text-slate-500 mt-2">---</div>
              <div className="text-green-400">{`-- Query failed login attempts`}</div>
              <div className="text-slate-300">
                {
                  "['logs'] | where ['audit.event_type'] contains \"login\" and ['audit.result'] == \"failure\""
                }
              </div>
              <div className="text-slate-500 mt-2">---</div>
              <div className="text-green-400">{`-- Query critical security events`}</div>
              <div className="text-slate-300">
                {
                  "['logs'] | where ['audit.security_risk_level'] == \"CRITICAL\""
                }
              </div>
              <div className="text-slate-500 mt-2">---</div>
              <div className="text-green-400">{`-- Query admin operations`}</div>
              <div className="text-slate-300">
                {"['logs'] | where ['audit.event_category'] == \"admin\""}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documentation Link */}
        <Card>
          <CardHeader>
            <CardTitle>Documentation</CardTitle>
            <CardDescription>
              Refer to the audit system documentation for complete details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              The comprehensive audit logging documentation includes:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
              <li>Complete event type mappings for all Better Auth plugins</li>
              <li>Security risk level classifications</li>
              <li>OTEL attribute specifications</li>
              <li>Production-ready Axiom query examples</li>
              <li>Export capabilities and compliance features</li>
            </ul>
            <div className="flex gap-2 mt-4">
              <a
                href="https://github.com/ewf-id/ewf-id/blob/main/src/lib/audit/README.md"
                target="_blank"
                rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Documentation
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
