import { Data } from "effect";

export type EncryptionErrorReason = "SystemError";
export type DecryptionErrorReason =
  | "InvalidFormat"
  | "AuthenticationFailed"
  | "Unknown";

export class EncryptionError extends Data.TaggedError("EncryptionError")<{
  readonly message: string;
  readonly reason: EncryptionErrorReason;
}> {}

export class DecryptionError extends Data.TaggedError("DecryptionError")<{
  readonly message: string;
  readonly reason: DecryptionErrorReason;
}> {}

export class AuthenticationError extends Data.TaggedError(
  "AuthenticationError",
)<{
  readonly message: string;
  readonly code: number;
  readonly reason: "InvalidCredentials" | "NotProvided" | "ServerError";
}> {}

export class BetterAuthAPIError extends Data.TaggedError("BetterAuthAPIError")<{
  readonly message: string;
  readonly code: number;
  // Allways Append!
  readonly reason: "UnexpectedThrow" | "UserNotFound" | "DetachedDataState";
}> {}
