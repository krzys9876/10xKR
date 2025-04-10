import type { APIRoute } from "astro";
import type { UserProfile } from "../../../types";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  try {
    const supabase = locals.supabase;

    // Get user data from Supabase session
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized: User not logged in or insufficient permissions",
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Add debug logging
    // eslint-disable-next-line no-console
    console.log("Attempting to find user with ID:", user?.id);

    // Get additional user information from the users table
    const { data: userData, error: profileError } = await supabase
      .from("users")
      .select("id, email, manager_id")
      .eq("id", user.id)
      .single();

    // eslint-disable-next-line no-console
    console.log("found:", userData);
    // eslint-disable-next-line no-console
    console.log("error:", profileError);

    if (profileError || !userData) {
      return new Response(
        JSON.stringify({
          error: "User profile not found",
        }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Prepare response in required format
    const response: UserProfile = {
      id: userData.id,
      email: userData.email,
      managerId: userData.manager_id,
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
    console.error("Error in /auth/login endpoint:", err);

    // Error logging should be handled by a proper logging mechanism
    return new Response(
      JSON.stringify({
        error: "An error occurred while processing the request",
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
