import { supabase } from "@/integrations/supabase/client";

interface LogErrorParams {
  error: Error | unknown;
  action?: string;
  componentStack?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Persist a client-side error to the backend `client_error_logs` table.
 * Captures user_id, route, action, stack trace, and viewport context.
 * Never throws — failures are logged to console only.
 */
export async function logClientError({
  error,
  action,
  componentStack,
  metadata,
}: LogErrorParams): Promise<void> {
  try {
    const err =
      error instanceof Error
        ? error
        : new Error(typeof error === "string" ? error : JSON.stringify(error));

    // Get current user (best-effort, don't block on failure)
    let userId: string | null = null;
    let userEmail: string | null = null;
    try {
      const { data } = await supabase.auth.getUser();
      userId = data.user?.id ?? null;
      userEmail = data.user?.email ?? null;
    } catch {
      // ignore — anonymous crash is still worth logging
    }

    const payload = {
      user_id: userId,
      user_email: userEmail,
      route:
        typeof window !== "undefined"
          ? window.location.pathname + window.location.search
          : null,
      action: action ?? null,
      error_message: err.message?.slice(0, 2000) ?? "Unknown error",
      error_name: err.name ?? null,
      stack_trace: err.stack?.slice(0, 8000) ?? null,
      component_stack: componentStack?.slice(0, 8000) ?? null,
      user_agent:
        typeof navigator !== "undefined" ? navigator.userAgent : null,
      viewport:
        typeof window !== "undefined"
          ? `${window.innerWidth}x${window.innerHeight}`
          : null,
      metadata: metadata ?? null,
    };

    const { error: insertError } = await supabase
      .from("client_error_logs")
      .insert(payload as never);

    if (insertError) {
      // eslint-disable-next-line no-console
      console.warn("[errorLogger] Failed to persist error:", insertError);
    }
  } catch (loggerErr) {
    // eslint-disable-next-line no-console
    console.warn("[errorLogger] Logger crashed:", loggerErr);
  }
}

/**
 * Install global handlers for uncaught errors and unhandled promise rejections.
 * Safe to call multiple times — guarded by a module-level flag.
 */
let installed = false;
export function installGlobalErrorHandlers(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;

  window.addEventListener("error", (event) => {
    void logClientError({
      error: event.error ?? new Error(event.message),
      action: "window.onerror",
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    void logClientError({
      error: event.reason,
      action: "unhandledrejection",
    });
  });
}
