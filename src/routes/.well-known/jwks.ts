/**
 * EWF-ID JWKS Endpoint
 * SPEC.md Phase 5 - Task 5.1
 *
 * GET /.well-known/jwks.json
 */
import { createFileRoute } from "@tanstack/react-router";
import { getJWKS } from "@/lib/jwt";

export const Route = createFileRoute("/.well-known/jwks")({
  server: {
    handlers: {
      GET: async () => {
        const jwks = await getJWKS();

        return new Response(JSON.stringify(jwks), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=86400",
            "Access-Control-Allow-Origin": "*",
          },
        });
      },
    },
  },
});
