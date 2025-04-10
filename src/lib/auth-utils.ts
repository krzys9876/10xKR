import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "../db/database.types";

export interface AuthResult {
  user: User | null;
  error?: {
    status: number;
    message: string;
  };
}

/**
 * Checks if a user is authenticated by verifying the current session
 * @param supabase Supabase client instance
 * @returns AuthResult with user data or error information
 */
export async function requireAuth(supabase: SupabaseClient<Database>): Promise<AuthResult> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      user: null,
      error: {
        status: 401,
        message: "Unauthorized: User not logged in or insufficient permissions",
      },
    };
  }

  return {
    user,
  };
}
