import { Data } from "effect";

class DatabaseError extends Data.TaggedError("DatabaseError")<{
  message: string;
}> {}

/**
 * Encrypted value wrapper
 * Use this to wrap encrypted strings and distinguish them from plain strings at runtime
 */
class Encrypted<T = unknown> extends Data.Class<{
  /** The encrypted string value */
  readonly value: string;
  /** Type tag for what this encrypted value contains (runtime info) */
  readonly _tag: string;
}> {
  /**
   * Create a new Encrypted instance from an encrypted string
   * @param value The encrypted string
   * @param tag Optional type tag for debugging (e.g., "ssn", "creditCard")
   */
  static fromString<T = unknown>(value: string, tag = "unknown"): Encrypted<T> {
    return new Encrypted({ value, _tag: tag });
  }

  /**
   * Read the encrypted string value
   */
  toString(): string {
    return this.value;
  }

  /**
   * Check if a value is an Encrypted instance
   */
  static isEncrypted(value: unknown): value is Encrypted<unknown> {
    return value instanceof Encrypted;
  }

  /**
   * Get the type tag
   */
  get tag(): string {
    return this._tag;
  }
}

export { DatabaseError, Encrypted };
