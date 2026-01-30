import { Data } from "effect";

export type EncryptionErrorReason = "SystemError";
export type DecryptionErrorReason = "InvalidFormat" | "AuthenticationFailed" | "Unknown";

export class EncryptionError extends Data.TaggedError("EncryptionError")<{
  readonly message: string;
  readonly reason: EncryptionErrorReason;
}> {}

export class DecryptionError extends Data.TaggedError("DecryptionError")<{
  readonly message: string;
  readonly reason: DecryptionErrorReason;
}> {}
