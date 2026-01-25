/**
 * EWF-ID JWT Utilities
 * SPEC.md Phase 5 - Task 5.1
 *
 * Provides JWT signing and verification for OIDC
 */
import { createPrivateKey, createPublicKey, generateKeyPairSync, randomUUID } from "node:crypto";
import { SignJWT, importPKCS8, importSPKI, jwtVerify, exportJWK } from "jose";

// Key pair for JWT signing (in production, load from secure storage)
let privateKey: CryptoKey | null = null;
let publicKey: CryptoKey | null = null;
let jwk: object | null = null;
const keyId = "ewf-id-key-1";

// Generate RSA key pair on first use
async function ensureKeys() {
  if (privateKey && publicKey) {
    return { privateKey, publicKey };
  }

  // Generate RSA key pair
  const { privateKey: privKey, publicKey: pubKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });

  privateKey = await importPKCS8(privKey as string, "RS256");
  publicKey = await importSPKI(pubKey as string, "RS256");

  // Export public key as JWK
  jwk = await exportJWK(publicKey);

  return { privateKey, publicKey };
}

/**
 * Get JWKS for public key verification
 */
export async function getJWKS() {
  await ensureKeys();

  return {
    keys: [
      {
        ...jwk,
        kid: keyId,
        use: "sig",
        alg: "RS256",
      },
    ],
  };
}

/**
 * Sign an ID token
 */
export async function signIdToken(payload: IdTokenPayload): Promise<string> {
  const { privateKey } = await ensureKeys();

  const token = await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "RS256", kid: keyId, typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(payload.exp ? new Date(payload.exp * 1000) : "1h")
    .sign(privateKey!);

  return token;
}

/**
 * Sign an access token
 */
export async function signAccessToken(payload: AccessTokenPayload): Promise<string> {
  const { privateKey } = await ensureKeys();

  const token = await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "RS256", kid: keyId, typ: "at+jwt" })
    .setIssuedAt()
    .setExpirationTime(payload.exp ? new Date(payload.exp * 1000) : "1h")
    .sign(privateKey!);

  return token;
}

/**
 * Verify a token
 */
export async function verifyToken(token: string): Promise<unknown> {
  const { publicKey } = await ensureKeys();

  const { payload } = await jwtVerify(token, publicKey!, {
    algorithms: ["RS256"],
  });

  return payload;
}

/**
 * ID Token payload interface
 */
export interface IdTokenPayload {
  // Standard OIDC claims
  iss: string;
  sub: string;
  aud: string | string[];
  exp: number;
  iat: number;
  auth_time?: number;
  nonce?: string;
  acr?: string;
  amr?: string[];
  azp?: string;

  // Standard profile claims
  name?: string;
  given_name?: string;
  family_name?: string;
  preferred_username?: string;
  picture?: string;
  email?: string;
  email_verified?: boolean;
  locale?: string;
  updated_at?: number;

  // EWF Custom claims
  roles?: string[];
  school?: {
    id: string;
    name: string;
    student_id: string;
  };
  permissions?: string[];
  team_member?: boolean;
  account_created?: string;
}

/**
 * Access Token payload interface
 */
export interface AccessTokenPayload {
  iss: string;
  sub: string;
  aud: string | string[];
  exp: number;
  iat: number;
  client_id: string;
  scope: string;
  jti?: string;

  // Custom claims
  roles?: string[];
  permissions?: string[];
}

/**
 * Generate a unique token identifier
 */
export function generateTokenId(): string {
  return randomUUID();
}
