/**
 * EWF-ID Structured Logging Utility
 * SPEC.md Phase 7 - Task 7.3: Axiom Logging
 *
 * Provides structured logging with OpenTelemetry trace context support.
 * This utility is designed to be replaced/augmented by OTel when fully implemented.
 * Console logging serves as a fallback when OTel is not available.
 */
import env from "#env";

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

export interface LogContext {
  userId?: string;
  traceId?: string;
  spanId?: string;
  operation?: string;
  requestId?: string;
  [key: string]: unknown;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  environment: string;
  service: string;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

// Minimum log level based on environment
const getMinLevel = (): LogLevel => {
  if (env.NODE_ENV === "production") {
    return "info";
  }
  return "debug";
};

/**
 * Get current trace context from OTel if available
 * This will be populated when OTel is configured
 */
function getTraceContext(): { traceId?: string; spanId?: string } {
  // TODO: When OTel is implemented, extract trace context:
  // import { trace } from '@opentelemetry/api'
  // const span = trace.getActiveSpan()
  // return {
  //   traceId: span?.spanContext().traceId,
  //   spanId: span?.spanContext().spanId,
  // }
  return {};
}

/**
 * Send log via OTel exporter (when configured)
 * Falls back to direct Axiom API when OTel is not available
 */
async function sendLog(entry: LogEntry): Promise<void> {
  // TODO: When OTel is implemented, use OTel logging API:
  // import { logs } from '@opentelemetry/api-logs'
  // const logger = logs.getLogger('ewf-id')
  // logger.emit({ body: entry.message, attributes: entry.context, severityNumber: ... })
  
  // Fallback: Send directly to Axiom
  if (!env.AXIOM_TOKEN || !env.AXIOM_DATASET) {
    return;
  }

  try {
    await fetch(`https://api.axiom.co/v1/datasets/${env.AXIOM_DATASET}/ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.AXIOM_TOKEN}`,
      },
      body: JSON.stringify([entry]),
    });
  } catch {
    // Silent fail - logging should not break the application
  }
}

/**
 * Create a log entry and output it
 * When OTel is fully implemented, this will emit to OTel instead of console
 */
function log(level: LogLevel, message: string, context?: LogContext): void {
  const minLevel = getMinLevel();
  if (LOG_LEVELS[level] < LOG_LEVELS[minLevel]) {
    return;
  }

  // Merge trace context from OTel
  const traceContext = getTraceContext();
  const mergedContext = { ...traceContext, ...context };

  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    context: Object.keys(mergedContext).length > 0 ? mergedContext : undefined,
    environment: env.NODE_ENV,
    service: "ewf-id",
  };

  // Console output (fallback when OTel not configured)
  // TODO: Remove console output when OTel is primary
  if (env.NODE_ENV !== "production" || !env.AXIOM_TOKEN) {
    const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : "";
    const formattedEntry = `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}${contextStr}`;
    
    switch (level) {
      case "debug":
        console.debug(formattedEntry);
        break;
      case "info":
        console.info(formattedEntry);
        break;
      case "warn":
        console.warn(formattedEntry);
        break;
      case "error":
      case "fatal":
        console.error(formattedEntry);
        break;
    }
  }

  // Send to logging backend asynchronously
  sendLog(entry).catch(() => {});
}

/**
 * Logger instance with methods for each log level
 */
export const logger = {
  debug: (message: string, context?: LogContext) => log("debug", message, context),
  info: (message: string, context?: LogContext) => log("info", message, context),
  warn: (message: string, context?: LogContext) => log("warn", message, context),
  error: (message: string, context?: LogContext) => log("error", message, context),
  fatal: (message: string, context?: LogContext) => log("fatal", message, context),

  /**
   * Create a child logger with preset context
   */
  child: (defaultContext: LogContext) => ({
    debug: (message: string, context?: LogContext) =>
      log("debug", message, { ...defaultContext, ...context }),
    info: (message: string, context?: LogContext) =>
      log("info", message, { ...defaultContext, ...context }),
    warn: (message: string, context?: LogContext) =>
      log("warn", message, { ...defaultContext, ...context }),
    error: (message: string, context?: LogContext) =>
      log("error", message, { ...defaultContext, ...context }),
    fatal: (message: string, context?: LogContext) =>
      log("fatal", message, { ...defaultContext, ...context }),
  }),
};

export default logger;
