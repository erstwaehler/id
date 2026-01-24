/**
 * OIDC Callback Route
 * Handles the callback from school OIDC providers
 */

import { createFileRoute } from "@tanstack/react-router";
import { exchangeOIDCCode, getOIDCUserInfo, schoolOIDCConfig } from "#lib/auth/providers";
import { getSchoolByEmail } from "#data/schools";
import { db } from "#lib/auth-db";
import { user } from "#lib/auth/schema";
import { eq } from "drizzle-orm";
import { sendWelcomeEmail } from "#lib/email";
import { randomUUID } from "crypto";

export const Route = createFileRoute("/api/auth/oidc/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const code = url.searchParams.get("code");
          const state = url.searchParams.get("state");
          const error = url.searchParams.get("error");
          
          // Handle error from OIDC provider
          if (error) {
            console.error("OIDC error:", error);
            return Response.redirect(
              `/login?error=${encodeURIComponent("Authentication failed")}`,
              302
            );
          }
          
          if (!code || !state) {
            return Response.redirect(
              `/login?error=${encodeURIComponent("Missing code or state")}`,
              302
            );
          }
          
          // TODO: SECURITY - Validate state against stored state in session
          // This is critical for CSRF protection
          // For now, we accept any state - MUST BE FIXED BEFORE PRODUCTION
          
          // TODO: IMPROVEMENT - Parse state to determine which school provider
          // State format: {schoolId}:{randomState}:{redirectUrl}
          // For now, try all schools (inefficient but works)
          let userInfo: any = null;
          let schoolId: keyof typeof schoolOIDCConfig | null = null;
          
          for (const [id] of Object.entries(schoolOIDCConfig)) {
            try {
              const tokens = await exchangeOIDCCode(id as keyof typeof schoolOIDCConfig, code);
              userInfo = await getOIDCUserInfo(id as keyof typeof schoolOIDCConfig, tokens.access_token);
              schoolId = id as keyof typeof schoolOIDCConfig;
              break;
            } catch (err) {
              // Try next school if this one fails
              continue;
            }
          }
          
          if (!userInfo || !schoolId) {
            return Response.redirect(
              `/login?error=${encodeURIComponent("Failed to authenticate")}`,
              302
            );
          }
          
          // Extract user data
          const email = userInfo.email;
          const name = userInfo.name || userInfo.given_name || email.split("@")[0];
          const picture = userInfo.picture;
          const school = getSchoolByEmail(email);
          
          // Find or create user
          const existingUsers = await db.select().from(user).where(eq(user.email, email)).limit(1);
          
          if (existingUsers.length > 0) {
            await db.update(user)
              .set({
                lastLoginAt: new Date(),
                lastLoginMethod: "oidc",
                school: school?.id,
                schoolName: school?.name,
              })
              .where(eq(user.id, existingUsers[0].id));
          } else {
            // Use consistent ID generation
            const userId = `user_${randomUUID()}`;
            
            await db.insert(user).values({
              id: userId,
              email,
              name,
              emailVerified: true,
              image: picture,
              school: school?.id,
              schoolName: school?.name,
              lastLoginAt: new Date(),
              lastLoginMethod: "oidc",
              locale: "de",
            });
            
            await sendWelcomeEmail({ to: email, userName: name, school });
          }
          
          // TODO: SECURITY - Validate redirect URL to prevent open redirects
          // Only allow internal redirects or whitelisted domains
          // For now, hard-coded to dashboard
          const redirectUrl = "/dashboard";
          
          return Response.redirect(redirectUrl, 302);
        } catch (error) {
          console.error("OIDC callback error:", error);
          return Response.redirect(
            `/login?error=${encodeURIComponent("Authentication failed")}`,
            302
          );
        }
      },
    },
  },
});
