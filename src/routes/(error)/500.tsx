/**
 * 500 Server Error Page
 * SPEC.md Phase 6 - Task 6.3: Error Pages
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Home, RefreshCw, AlertTriangle, HelpCircle } from "lucide-react";

export const Route = createFileRoute("/(error)/500")({
  component: ServerErrorPage,
});

function ServerErrorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 rounded-full bg-red-500/10 p-6">
            <AlertTriangle className="h-16 w-16 text-red-500" />
          </div>
          <CardTitle className="text-4xl font-bold">500</CardTitle>
          <CardDescription className="text-xl">
            Server Error
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center text-muted-foreground">
            Something went wrong on our end. Our team has been notified and 
            is working to fix the issue. Please try again later.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={() => window.location.reload()}
              className="w-full sm:w-auto"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Link to="/">
              <Button variant="outline" className="w-full sm:w-auto">
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            </Link>
          </div>
          
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground text-center flex items-center justify-center gap-2">
              <HelpCircle className="h-4 w-4" />
              If this persists, contact support@ewf-stade.de
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
