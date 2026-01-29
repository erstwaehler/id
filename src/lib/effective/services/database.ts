import { Context } from "effect";
import type { Effect, Schema } from "effect";
import type { SERVER_ENV } from "./env";
import type { DatabaseError, Encrypted } from "../defective/database";
import type { db } from "~/lib/auth-db";

// Type for the db instance (from auth-db.ts with withReplicas)
type DbInstance = typeof db;

// Helper type: Marks which fields in a type are encrypted
type MarkEncrypted<T, EncryptedFields extends keyof T> = {
  [K in keyof T]: K extends EncryptedFields ? Encrypted<T[K]> : T[K];
};

// Helper type: Creates an Effect Schema that validates and decrypts
type EffectSchema<T> = Schema.Schema<T, unknown, never>;

// Helper type: Creates a decrypted Effect Schema from a Drizzle type with encrypted fields
type DecryptedSchema<
  T,
  EncryptedFields extends keyof T = never,
> = Schema.Schema<T, MarkEncrypted<T, EncryptedFields>, Database | SERVER_ENV>;

class Database extends Context.Tag("Database Service")<
  Database,
  {
    // Raw query execution
    readonly runQuery: <T>(
      query: Promise<T>,
    ) => Effect.Effect<T, DatabaseError, never>;

    // Access to the underlying db instance
    readonly db: DbInstance;

    // Transaction support
    readonly transaction: <T>(
      callback: (
        tx: Parameters<typeof db.transaction>[0] extends (
          tx: infer TX,
        ) => unknown
          ? TX
          : never,
      ) => Promise<T>,
    ) => Effect.Effect<T, DatabaseError, never>;

    // Encryption/Decryption primitives
    readonly encrypt: (
      data: string,
    ) => Effect.Effect<string, never, SERVER_ENV>;
    readonly decrypt: (
      data: string,
    ) => Effect.Effect<string, never, SERVER_ENV>;

    // Schema helpers for encrypted fields
    readonly createDecryptedSchema: <
      T extends Record<string, unknown>,
      EncryptedFields extends keyof T = never,
    >(
      baseSchema: Schema.Schema<T, unknown, never>,
      encryptedFields: readonly EncryptedFields[],
    ) => Schema.Schema<T, unknown, Database | SERVER_ENV>;

    // Helper to decrypt a single field from an Encrypted instance
    readonly decryptField: <T>(
      value: Encrypted<T>,
    ) => Effect.Effect<T, DatabaseError, SERVER_ENV>;

    // Helper to encrypt a single field and wrap in Encrypted
    readonly encryptField: <T>(
      value: T,
      tag?: string,
    ) => Effect.Effect<Encrypted<T>, DatabaseError, SERVER_ENV>;
  }
>() {}

export { Database };
export type { DbInstance, MarkEncrypted, DecryptedSchema, EffectSchema };
