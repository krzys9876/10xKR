import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../db/database.types";
import { requireAuth } from "./auth-utils";

/**
 * Creates a standardized API response
 */
export function createApiResponse<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(message: string, status = 400, details?: unknown): Response {
  const responseBody: Record<string, unknown> = { error: message };
  if (details) responseBody.details = details;
  return createApiResponse(responseBody, status);
}

/**
 * Authenticates a user and returns appropriate information
 */
export async function authenticateUser(supabase: SupabaseClient<Database>) {
  const { user, error } = await requireAuth(supabase);
  if (error || !user) {
    return {
      isAuthenticated: false,
      error: createErrorResponse(error?.message || "Użytkownik niezalogowany", error?.status || 401),
      user: null,
    };
  }
  return { isAuthenticated: true, error: null, user };
}
