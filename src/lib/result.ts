// Shared discriminated result used by the services + query layers so the UI
// can render error states without throwing. Platform-agnostic.

export type Result<T> =
  | { data: T; error: null }
  | { data: null; error: string };

export function ok<T>(data: T): Result<T> {
  return { data, error: null };
}

export function fail<T>(error: unknown): Result<T> {
  const message =
    error instanceof Error ? error.message : "Something went wrong.";
  return { data: null, error: message };
}
