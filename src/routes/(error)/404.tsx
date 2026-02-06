/**
 * 404 Not Found Page
 * SPEC.md Phase 6 - Task 6.3: Error Pages
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, HelpCircle, Home, Search } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

export const Route = createFileRoute("/(error)/404")({
  component: NotFoundPage,
});

function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 rounded-full bg-yellow-500/10 p-6">
            <Search className="h-16 w-16 text-yellow-500" />
          </div>
          <CardTitle className="text-4xl font-bold">404</CardTitle>
          <CardDescription className="text-xl">Page Not Found</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center text-muted-foreground">
            The page you're looking for doesn't exist or has been moved. Please
            check the URL or navigate back to a known location.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/">
              <Button className="w-full sm:w-auto">
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="w-full sm:w-auto">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground text-center flex items-center justify-center gap-2">
              <HelpCircle className="h-4 w-4" />
              Need help? Contact support@ewf-stade.de
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
