/**
 * Structured Logger
 * Implements SPEC.md §10.4 - Axiom Logging
 * Integrated with OTEL for trace correlation
 */
import { Effect, Context, Layer, pipe } from "effect";
import { getCurrentTraceId } from "./otel";

// =============================================================================
// Types
// =============================================================================

export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL";

export interface LogContext {
	traceId?: string;
	userId?: string;
	operation?: string;
	duration?: number;
	[key: string]: unknown;
}

export interface LogEntry {
	timestamp: string;
	level: LogLevel;
	message: string;
	context: LogContext;
}

export interface LoggerService {
	debug: (message: string, context?: LogContext) => void;
	info: (message: string, context?: LogContext) => void;
	warn: (message: string, context?: LogContext) => void;
	error: (message: string, context?: LogContext) => void;
	fatal: (message: string, context?: LogContext) => void;
}

// =============================================================================
// Service Tag
// =============================================================================

export class Logger extends Context.Tag("Logger")<Logger, LoggerService>() {}

// =============================================================================
// Implementation
// =============================================================================

/**
 * Format log entry for output
 */
function formatLogEntry(entry: LogEntry): string {
	const { timestamp, level, message, context } = entry;
	const contextStr = Object.keys(context).length > 0
		? ` ${JSON.stringify(context)}`
		: "";
	return `[${timestamp}] ${level}: ${message}${contextStr}`;
}

/**
 * Create a log entry
 */
function createLogEntry(level: LogLevel, message: string, context?: LogContext): LogEntry {
	const traceId = getCurrentTraceId();
	return {
		timestamp: new Date().toISOString(),
		level,
		message,
		context: {
			...(traceId && { traceId }),
			...context,
		},
	};
}

/**
 * Send log to appropriate destination
 */
function sendLog(entry: LogEntry): void {
	const formatted = formatLogEntry(entry);

	// In production, send to Axiom
	// For now, use console with appropriate level
	switch (entry.level) {
		case "DEBUG":
			if (process.env.NODE_ENV === "development") {
				console.debug(formatted);
			}
			break;
		case "INFO":
			console.info(formatted);
			break;
		case "WARN":
			console.warn(formatted);
			break;
		case "ERROR":
			console.error(formatted);
			break;
		case "FATAL":
			console.error(`FATAL: ${formatted}`);
			break;
	}

	// TODO: In production, send to Axiom
	// await sendToAxiom(entry);
}

/**
 * Live implementation of logger service
 */
const LoggerLive: LoggerService = {
	debug: (message: string, context?: LogContext) => {
		sendLog(createLogEntry("DEBUG", message, context));
	},

	info: (message: string, context?: LogContext) => {
		sendLog(createLogEntry("INFO", message, context));
	},

	warn: (message: string, context?: LogContext) => {
		sendLog(createLogEntry("WARN", message, context));
	},

	error: (message: string, context?: LogContext) => {
		sendLog(createLogEntry("ERROR", message, context));
	},

	fatal: (message: string, context?: LogContext) => {
		sendLog(createLogEntry("FATAL", message, context));
	},
};

// =============================================================================
// Layer
// =============================================================================

export const LoggerLiveLayer = Layer.succeed(Logger, LoggerLive);

// =============================================================================
// Effect-based helpers
// =============================================================================

/**
 * Log at debug level
 */
export function logDebug(message: string, context?: LogContext): Effect.Effect<void, never, Logger> {
	return pipe(
		Logger,
		Effect.flatMap((logger) => Effect.sync(() => logger.debug(message, context)))
	);
}

/**
 * Log at info level
 */
export function logInfo(message: string, context?: LogContext): Effect.Effect<void, never, Logger> {
	return pipe(
		Logger,
		Effect.flatMap((logger) => Effect.sync(() => logger.info(message, context)))
	);
}

/**
 * Log at warn level
 */
export function logWarn(message: string, context?: LogContext): Effect.Effect<void, never, Logger> {
	return pipe(
		Logger,
		Effect.flatMap((logger) => Effect.sync(() => logger.warn(message, context)))
	);
}

/**
 * Log at error level
 */
export function logError(message: string, context?: LogContext): Effect.Effect<void, never, Logger> {
	return pipe(
		Logger,
		Effect.flatMap((logger) => Effect.sync(() => logger.error(message, context)))
	);
}

// =============================================================================
// Direct usage helpers (for non-Effect code)
// =============================================================================

export const logger = LoggerLive;
