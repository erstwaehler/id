import { Data } from "effect";

export class AuditError extends Data.TaggedClass("AuditError")<{
  readonly message: string;
  readonly reason: "DatabaseError" | "HashingError";
  readonly cause?: unknown;
}> {}
