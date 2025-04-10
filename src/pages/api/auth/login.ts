import type { APIRoute } from "astro";
import { z } from "zod";
import type { LoginResponse } from "../../../types";

export const prerender = false;

// Schema for validating login data
const loginRequestSchema = z.object({
  email: z.string().email({ message: "Nieprawidłowy format adresu email" }),
  password: z.string().min(6, { message: "Hasło musi mieć minimum 6 znaków" }),
});

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input data
    const validationResult = loginRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowe dane wejściowe",
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

    const { email, password } = validationResult.data;

    // Authentication logic with Supabase
    const supabase = locals.supabase;
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowe dane uwierzytelniające",
          message: error.message,
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Create response in the required API format
    const response: LoginResponse = {
      token: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email || "",
      },
    };

    // Return successful response
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error in /auth/login endpoint:", err);
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
