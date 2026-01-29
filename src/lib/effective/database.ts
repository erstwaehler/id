import { Effect, Schema, Layer, ParseResult } from "effect";
import { Database } from "./services/database";
import { SERVER_ENV } from "./services/env";
import { DatabaseError, Encrypted } from "./defective/database";
import { db } from "~/lib/auth-db";
import crypto from "node:crypto";

// Helper to wrap Drizzle queries in Effect with error handling
const runQuery = <T>(
  query: Promise<T>,
): Effect.Effect<T, DatabaseError, never> =>
  Effect.tryPromise({
    try: () => query,
    catch: (error) =>
      new DatabaseError({
        message: `Database query failed: ${error instanceof Error ? error.message : String(error)}`,
      }),
  });

// Encryption implementation using AES-256-GCM
const encrypt = (data: string): Effect.Effect<string, never, SERVER_ENV> =>
  Effect.gen(function* () {
    const env = yield* SERVER_ENV;

    // Generate a random IV (Initialization Vector)
    const iv = crypto.randomBytes(16);

    // Create cipher using the encryption key from env
    const cipher = crypto.createCipheriv(
      "aes-256-gcm",
      Buffer.from(env.ENCRYPTION_KEY, "hex"),
      iv,
    );

    // Encrypt the data
    let encrypted = cipher.update(data, "utf8", "hex");
    encrypted += cipher.final("hex");

    // Get auth tag for integrity verification
    const authTag = cipher.getAuthTag();

    // Combine iv + authTag + encrypted data
    // Format: iv(32 hex chars) + authTag(32 hex chars) + encrypted data
    return iv.toString("hex") + authTag.toString("hex") + encrypted;
  });

// Decryption implementation
const decrypt = (
  encryptedData: string,
): Effect.Effect<string, never, SERVER_ENV> =>
  Effect.gen(function* () {
    const env = yield* SERVER_ENV;

    // Extract IV (first 32 hex chars = 16 bytes)
    const iv = Buffer.from(encryptedData.slice(0, 32), "hex");

    // Extract auth tag (next 32 hex chars = 16 bytes)
    const authTag = Buffer.from(encryptedData.slice(32, 64), "hex");

    // Extract encrypted data (rest)
    const encrypted = encryptedData.slice(64);

    // Create decipher
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      Buffer.from(env.ENCRYPTION_KEY, "hex"),
      iv,
    );

    // Set auth tag for verification
    decipher.setAuthTag(authTag);

    // Decrypt the data
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  });

// Transaction support
const transaction = <T>(
  callback: (
    tx: Parameters<typeof db.transaction>[0] extends (tx: infer TX) => unknown
      ? TX
      : never,
  ) => Promise<T>,
): Effect.Effect<T, DatabaseError, never> =>
  Effect.tryPromise({
    try: () => db.transaction(callback),
    catch: (error) =>
      new DatabaseError({
        message: `Transaction failed: ${error instanceof Error ? error.message : String(error)}`,
      }),
  });

// Decrypt a single field from an Encrypted instance
const decryptField = <T>(
  encrypted: Encrypted<T>,
): Effect.Effect<T, DatabaseError, SERVER_ENV> =>
  Effect.gen(function* () {
    // Read the encrypted string from the Encrypted instance
    const encryptedString = encrypted.toString();

    const decrypted = yield* decrypt(encryptedString);

    // Try to parse as JSON if possible, otherwise return as string
    try {
      return JSON.parse(decrypted) as T;
    } catch {
      return decrypted as T;
    }
  }).pipe(
    Effect.catchAll((error: unknown) =>
      Effect.fail(
        new DatabaseError({
          message: `Failed to decrypt field (tag: ${encrypted.tag}): ${error instanceof Error ? error.message : String(error)}`,
        }),
      ),
    ),
  );

// Encrypt a single field and wrap in Encrypted instance
const encryptField = <T>(
  value: T,
  tag = "unknown",
): Effect.Effect<Encrypted<T>, DatabaseError, SERVER_ENV> =>
  Effect.gen(function* () {
    // Serialize the value
    const serialized =
      typeof value === "string" ? value : JSON.stringify(value);

    // Encrypt
    const encryptedString = yield* encrypt(serialized);

    // Wrap in Encrypted instance
    return Encrypted.fromString<T>(encryptedString, tag);
  }).pipe(
    Effect.catchAll((error: unknown) =>
      Effect.fail(
        new DatabaseError({
          message: `Failed to encrypt field (tag: ${tag}): ${error instanceof Error ? error.message : String(error)}`,
        }),
      ),
    ),
  );

// Create a schema that automatically decrypts specified fields
const createDecryptedSchema = <
  T extends Record<string, unknown>,
  EncryptedFields extends keyof T = never,
>(
  baseSchema: Schema.Schema<T, unknown, never>,
  encryptedFields: readonly EncryptedFields[],
): Schema.Schema<T, unknown, Database | SERVER_ENV> => {
  // Create a transformation schema that decrypts the specified fields
  return Schema.transformOrFail(baseSchema, baseSchema, {
    strict: false,
    decode: (input, _, ast) =>
      Effect.gen(function* () {
        const db = yield* Database;
        const result = { ...input } as T;

        // Decrypt each encrypted field
        for (const field of encryptedFields) {
          const value = input[field];
          // Check if value is an Encrypted instance
          if (Encrypted.isEncrypted(value)) {
            result[field] = (yield* db.decryptField(value)) as T[typeof field];
          } else if (typeof value === "string" && value.length > 0) {
            // Support raw strings for backwards compatibility
            const encrypted = Encrypted.fromString(value, String(field));
            result[field] = (yield* db.decryptField(
              encrypted,
            )) as T[typeof field];
          }
        }

        return result;
      }).pipe(
        Effect.catchAll((error: unknown) =>
          Effect.fail(
            new ParseResult.Type(
              ast,
              input,
              `Failed to decrypt: ${error instanceof Error ? error.message : String(error)}`,
            ),
          ),
        ),
      ),
    encode: (output, _, ast) =>
      Effect.gen(function* () {
        const db = yield* Database;
        const result = { ...(output as T) };

        // Encrypt each field that should be encrypted
        for (const field of encryptedFields) {
          const value = (output as T)[field];
          if (value !== undefined && value !== null) {
            const encrypted = yield* db.encryptField(value, String(field));
            result[field] = encrypted as T[typeof field];
          }
        }

        return result;
      }).pipe(
        Effect.catchAll((error: unknown) =>
          Effect.fail(
            new ParseResult.Type(
              ast,
              output,
              `Failed to encrypt: ${error instanceof Error ? error.message : String(error)}`,
            ),
          ),
        ),
      ),
  });
};

// Implementation of the Database service
export const DatabaseLive = Layer.succeed(Database, {
  runQuery,
  db,
  transaction,
  encrypt,
  decrypt,
  createDecryptedSchema,
  decryptField,
  encryptField,
});

// Export the Database tag and Encrypted class for use in other modules
export { Database, Encrypted };
