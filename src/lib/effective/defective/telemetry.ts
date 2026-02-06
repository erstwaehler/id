import { Data } from "effect";

export class TelemetryError extends Data.TaggedError("TelemetryError")<{
  message: string;
  code: number;
}> {}

export class TelemetryPayload extends Data.TaggedClass("TelemetryPayload")<{
  resourceSpans: Array<{
    resource?: {
      attributes?: Array<{ key: string; value: unknown }>;
    };
    scopeSpans?: Array<{
      spans?: Array<{
        traceId?: string;
        spanId?: string;
        name?: string;
        kind?: number;
        startTimeUnixNano?: string;
        endTimeUnixNano?: string;
        attributes?: Array<{ key: string; value: unknown }>;
        events?: Array<unknown>;
        status?: { code?: number; message?: string };
      }>;
    }>;
  }>;
}> {
  get json() {
    return Effect.succeed({
      resourceSpans: this.resourceSpans,
    });
  }
  public new() {
    return Effect.succeed(new TelemetryPayload({ resourceSpans: [] }));
  }
  set appendResourceSpan(span: {
    resource?: {
      attributes?: Array<{ key: string; value: unknown }>;
    };
    scopeSpans?: Array<{
      spans?: Array<{
        traceId?: string;
        spanId?: string;
        name?: string;
        kind?: number;
        startTimeUnixNano?: string;
        endTimeUnixNano?: string;
        attributes?: Array<{ key: string; value: unknown }>;
        events?: Array<unknown>;
        status?: { code?: number; message?: string };
      }>;
    }>;
  }) {
    this.resourceSpans.push(span);
  }
}
