/**
 * School OIDC Provider Configuration
 * Implements OIDC authentication for 3 school providers
 */

import env from "#env";

/**
 * School OIDC configuration for custom OIDC routes
 */
export const schoolOIDCConfig = {
  athenaeum: {
    id: "athenaeum",
    name: "Gymnasium Athenaeum Stade",
    clientId: env.OIDC_ATHENAEUM_CLIENT_ID,
    clientSecret: env.OIDC_ATHENAEUM_CLIENT_SECRET,
    issuer: env.OIDC_ATHENAEUM_ISSUER,
    scopes: ["openid", "email", "profile"],
    provider: "iserv" as const,
  },
  vlg: {
    id: "vlg",
    name: "Vincent Lübeck Gymnasium",
    clientId: env.OIDC_VLG_CLIENT_ID,
    clientSecret: env.OIDC_VLG_CLIENT_SECRET,
    issuer: env.OIDC_VLG_ISSUER,
    scopes: ["openid", "email", "profile"],
    provider: "moodle" as const,
  },
  igs: {
    id: "igs",
    name: "Integrierte Gesamtschule Stade",
    clientId: env.OIDC_IGS_CLIENT_ID,
    clientSecret: env.OIDC_IGS_CLIENT_SECRET,
    issuer: env.OIDC_IGS_ISSUER,
    scopes: ["openid", "email", "profile"],
    provider: "iserv" as const,
  },
} as const;

/**
 * Get school OIDC configuration by ID
 */
export function getSchoolOIDCConfig(schoolId: keyof typeof schoolOIDCConfig) {
  return schoolOIDCConfig[schoolId];
}

/**
 * Get all school OIDC configurations
 */
export function getAllSchoolOIDCConfigs() {
  return Object.values(schoolOIDCConfig);
}

/**
 * Build OIDC authorization URL for a school
 */
export function buildOIDCAuthorizationUrl(schoolId: keyof typeof schoolOIDCConfig, state: string): string {
  const config = getSchoolOIDCConfig(schoolId);
  const redirectUri = `${env.HOST_URL}/api/auth/oidc/callback`;
  
  const authUrl = new URL(`${config.issuer}/authorize`);
  authUrl.searchParams.set("client_id", config.clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", config.scopes.join(" "));
  authUrl.searchParams.set("state", state);
  
  return authUrl.toString();
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeOIDCCode(
  schoolId: keyof typeof schoolOIDCConfig,
  code: string
): Promise<{ access_token: string; id_token?: string; refresh_token?: string }> {
  const config = getSchoolOIDCConfig(schoolId);
  const redirectUri = `${env.HOST_URL}/api/auth/oidc/callback`;
  
  const tokenResponse = await fetch(`${config.issuer}/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }),
  });
  
  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    throw new Error(`Failed to exchange code for token: ${error}`);
  }
  
  return tokenResponse.json();
}

/**
 * Get user info from OIDC provider
 */
export async function getOIDCUserInfo(
  schoolId: keyof typeof schoolOIDCConfig,
  accessToken: string
): Promise<{
  sub: string;
  email: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email_verified?: boolean;
}> {
  const config = getSchoolOIDCConfig(schoolId);
  
  const userInfoResponse = await fetch(`${config.issuer}/userinfo`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  
  if (!userInfoResponse.ok) {
    const error = await userInfoResponse.text();
    throw new Error(`Failed to fetch user info: ${error}`);
  }
  
  return userInfoResponse.json();
}
