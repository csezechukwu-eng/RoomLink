// Client-safe action helpers: pure types + form parsing.
// No `server-only` / `next/cache` imports here, so client components
// (form modals) can import ActionState + initialActionState freely.

/** State shape consumed by `useActionState` in the form components. */
export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
};

export const initialActionState: ActionState = { status: "idle" };

export function successState(
  message?: string,
  data?: ActionState["data"]
): ActionState {
  return { status: "success", message, data };
}

export function errorState(
  message: string,
  fieldErrors?: Record<string, string>
): ActionState {
  return { status: "error", message, fieldErrors };
}

/** Trim a FormData string field; returns "" when missing. */
export function str(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/** Optional string -> null when blank. */
export function optionalStr(formData: FormData, key: string): string | null {
  const value = str(formData, key);
  return value.length > 0 ? value : null;
}

/** Parse a finite number; returns null when blank/invalid. */
export function num(formData: FormData, key: string): number | null {
  const raw = str(formData, key);
  if (raw === "") return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export function messageFrom(error: unknown): string {
  // Standard Error instance
  if (error instanceof Error) {
    return error.message;
  }

  // String error
  if (typeof error === "string") {
    return error;
  }

  // Supabase/PostgreSQL error objects (not instanceof Error)
  if (error && typeof error === "object") {
    const errorObj = error as Record<string, unknown>;

    // PostgreSQL/Supabase error with message
    if (typeof errorObj.message === "string" && errorObj.message) {
      const code = typeof errorObj.code === "string" ? ` [${errorObj.code}]` : "";
      return `${errorObj.message}${code}`;
    }

    // Error object with error property
    if (typeof errorObj.error === "string" && errorObj.error) {
      return errorObj.error;
    }
  }

  return "Something went wrong.";
}
