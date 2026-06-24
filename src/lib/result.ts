// Shared discriminated result used by the services + query layers so the UI
// can render error states without throwing. Platform-agnostic.

export type Result<T> =
  | { data: T; error: null }
  | { data: null; error: string };

export function ok<T>(data: T): Result<T> {
  return { data, error: null };
}

/**
 * Extract a human-readable message from any error type.
 * Handles: Error instances, Supabase/PostgreSQL errors, plain objects, strings.
 */
export function getErrorMessage(error: unknown): string {
  // Standard Error instance
  if (error instanceof Error) {
    return error.message;
  }

  // String error
  if (typeof error === "string") {
    return error;
  }

  // Supabase/PostgreSQL error objects (not instanceof Error)
  // These have: message, details, hint, code
  if (error && typeof error === "object") {
    const errorObj = error as Record<string, unknown>;

    // PostgreSQL/Supabase error with message
    if (typeof errorObj.message === "string" && errorObj.message) {
      // Include code for debugging if available
      const code = typeof errorObj.code === "string" ? ` [${errorObj.code}]` : "";
      const details = typeof errorObj.details === "string" ? `: ${errorObj.details}` : "";
      return `${errorObj.message}${details}${code}`;
    }

    // Error object with error property (e.g., { error: "message" })
    if (typeof errorObj.error === "string" && errorObj.error) {
      return errorObj.error;
    }

    // Try to stringify for debugging
    try {
      const str = JSON.stringify(error);
      if (str !== "{}") {
        console.error("[Result] Unknown error object:", str);
      }
    } catch {
      // Can't stringify, ignore
    }
  }

  return "Something went wrong.";
}

export function fail<T>(error: unknown): Result<T> {
  const message = getErrorMessage(error);
  return { data: null, error: message };
}
