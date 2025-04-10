import type { APIRoute } from "astro";
import { z } from "zod";
import type { UserDTO } from "../../../types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../db/database.types";
import { requireAuth } from "../../../lib/auth-utils";

export const prerender = false;

// Schema for userId validation
const userIdSchema = z.string().uuid({ message: "Nieprawidłowy format identyfikatora użytkownika" });

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const supabase = locals.supabase;

    // Check authentication using the common utility
    const { user, error } = await requireAuth(supabase);

    if (error || !user) {
      return new Response(
        JSON.stringify({
          error: error?.message || "Użytkownik niezalogowany",
        }),
        {
          status: error?.status || 401,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Validate the userId path parameter
    const userId = params.userId;
    if (!userId) {
      return new Response(
        JSON.stringify({
          error: "Brak identyfikatora użytkownika",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const validationResult = userIdSchema.safeParse(userId);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowy format identyfikatora użytkownika",
          details: validationResult.error.format(),
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Check permissions - user must be admin or requesting their own data
    const isAdmin = await checkIfUserIsAdmin(supabase, user.id);
    const isSelf = userId === user.id;

    if (!isAdmin && !isSelf) {
      return new Response(
        JSON.stringify({
          error: "Brak uprawnień do wykonania tej operacji",
        }),
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Get user data
    const { data: userData, error: userDataError } = await supabase
      .from("users")
      .select("id, email, first_name, last_name, manager_id")
      .eq("id", userId)
      .single();

    if (userDataError) {
      if (userDataError.code === "PGRST116") {
        // User not found (PGRST116 is the error code for "not found")
        return new Response(
          JSON.stringify({
            error: "Nie znaleziono użytkownika o podanym identyfikatorze",
          }),
          {
            status: 404,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }

      return new Response(
        JSON.stringify({
          error: "Błąd podczas pobierania danych użytkownika",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!userData) {
      return new Response(
        JSON.stringify({
          error: "Nie znaleziono użytkownika o podanym identyfikatorze",
        }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Fetch subordinate users for the requested user
    const { data: subordinateData, error: subordinateError } = await supabase
      .from("users")
      .select("id, email, first_name, last_name, manager_id")
      .eq("manager_id", userData.id);
    if (subordinateError) {
      return new Response(
        JSON.stringify({
          error: "Błąd podczas pobierania danych podwładnych",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Prepare response in required format including subordinate users
    const response: UserDTO = {
      id: userData.id,
      email: userData.email,
      name: `${userData.first_name} ${userData.last_name}`,
      managerId: userData.manager_id,
      subordinates: (subordinateData || []).map((sub) => ({
        id: sub.id,
        email: sub.email,
        name: `${sub.first_name} ${sub.last_name}`,
        managerId: sub.manager_id,
      })),
    };

    // Return user data
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error in /users/{userId} endpoint:", err);
    return new Response(
      JSON.stringify({
        error: "Wystąpił błąd podczas przetwarzania żądania",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};

// Helper function to check if user is an admin
async function checkIfUserIsAdmin(supabase: SupabaseClient<Database>, userId: string): Promise<boolean> {
  // In a real application, there would be logic to check if the user has admin privileges
  // For simplicity, we check if the user exists in the admins table
  const { data, error } = await supabase.from("admins").select("user_id").eq("user_id", userId).single();

  return !error && !!data;
}
