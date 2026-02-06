import { Data } from "effect";

export type CryptoErrorReason =
  | "SystemError"
  | "InvalidFormat"
  | "AuthenticationFailed"
  | "Unknown";

export class CryptoError extends Data.TaggedError("CryptoError")<{
  readonly message: string;
  readonly reason: CryptoErrorReason;
  readonly cause?: unknown;
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
