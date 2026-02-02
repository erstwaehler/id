import { Effect } from "effect";

/**
 * Annotates the current span with all enumerable properties of the error.
 * Prefixes attributes with "error.".
 *
 * Usage:
 * myEffect.pipe(annotateThis)
 */
export const annotateThis = <A, E, R>(
  effect: Effect.Effect<A, E, R>,
): Effect.Effect<A, E, R> => {
  return Effect.tapError(effect, (error) => {
    if (typeof error === "object" && error !== null) {
      const attributes: Record<string, string | number | boolean> = {};

      Object.entries(error).forEach(([key, value]) => {
        // Skip potential private keys or symbols if they show up in entries
        if (
          typeof value === "string" ||
          typeof value === "number" ||
          typeof value === "boolean"
        ) {
          attributes[`error.${key}`] = value;
        } else if (value === null) {
          attributes[`error.${key}`] = "null";
        } else {
          try {
            // Try to stringify objects/arrays
            attributes[`error.${key}`] = JSON.stringify(value);
          } catch {
            // Fallback to toString
            attributes[`error.${key}`] = String(value);
          }
        }
      });

      return Effect.annotateCurrentSpan(attributes);
    }

    // Fallback for primitive errors
    return Effect.annotateCurrentSpan("error.message", String(error));
  });
};
