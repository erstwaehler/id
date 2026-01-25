/**
 * EWF-ID OIDC Discovery Endpoint
 * SPEC.md Phase 5 - Task 5.1
 *
 * GET /.well-known/openid-configuration
 */
import { createFileRoute } from "@tanstack/react-router";
import env from "#env";

export const Route = createFileRoute("/.well-known/openid-configuration")({
  server: {
    handlers: {
      GET: async () => {
        const issuer = env.HOST_URL;

        const configuration = {
          issuer,
          authorization_endpoint: `${issuer}/oauth/authorize`,
          token_endpoint: `${issuer}/oauth/token`,
          userinfo_endpoint: `${issuer}/oauth/userinfo`,
          jwks_uri: `${issuer}/.well-known/jwks.json`,
          revocation_endpoint: `${issuer}/oauth/revoke`,
          introspection_endpoint: `${issuer}/oauth/introspect`,
          end_session_endpoint: `${issuer}/oauth/logout`,

          // Response types supported
          response_types_supported: ["code", "token", "id_token", "code token", "code id_token", "token id_token", "code token id_token"],

          // Grant types supported
          grant_types_supported: ["authorization_code", "refresh_token", "client_credentials"],

          // Subject types supported
          subject_types_supported: ["public"],

          // ID token signing algorithms
          id_token_signing_alg_values_supported: ["RS256"],

          // Token endpoint auth methods
          token_endpoint_auth_methods_supported: ["client_secret_basic", "client_secret_post"],

          // Scopes supported
          scopes_supported: [
            "openid",
            "profile",
            "email",
            "offline_access",
            "ewf:team",
            "permissions",
            "schedule:read",
            "schedule:write",
            "vote:read",
            "vote:write",
            "live:read",
            "live:write",
            "screens:manage",
          ],

          // Claims supported
          claims_supported: [
            "sub",
            "iss",
            "aud",
            "exp",
            "iat",
            "auth_time",
            "nonce",
            "acr",
            "amr",
            "azp",
            "email",
            "email_verified",
            "name",
            "given_name",
            "family_name",
            "preferred_username",
            "picture",
            "locale",
            "updated_at",
            // EWF Custom Claims
            "roles",
            "school",
            "permissions",
            "team_member",
            "account_created",
          ],

          // PKCE support
          code_challenge_methods_supported: ["S256", "plain"],

          // Response modes
          response_modes_supported: ["query", "fragment", "form_post"],

          // Display values
          display_values_supported: ["page", "popup"],

          // Claim types
          claim_types_supported: ["normal"],

          // Service documentation
          service_documentation: `${issuer}/docs`,
          op_policy_uri: `${issuer}/privacy-policy`,
          op_tos_uri: `${issuer}/terms`,

          // UI locales
          ui_locales_supported: ["de", "en", "uk"],
          claims_locales_supported: ["de", "en", "uk"],

          // Features
          claims_parameter_supported: true,
          request_parameter_supported: true,
          request_uri_parameter_supported: false,
          require_request_uri_registration: false,

          // Logout
          frontchannel_logout_supported: true,
          frontchannel_logout_session_supported: true,
          backchannel_logout_supported: false,
        };

        return new Response(JSON.stringify(configuration), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=3600",
            "Access-Control-Allow-Origin": "*",
          },
        });
      },
    },
  },
});
