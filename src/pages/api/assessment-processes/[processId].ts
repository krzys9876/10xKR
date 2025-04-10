import type { APIRoute } from "astro";
import { z } from "zod";
import type { AssessmentProcessDTO } from "../../../types";
import { requireAuth } from "../../../lib/auth-utils";

export const prerender = false;

// Validation schema for process ID
const processIdSchema = z.string().uuid({ message: "Nieprawidłowy format identyfikatora procesu" });

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const supabase = locals.supabase;

    // Check if user is authenticated using the common utility
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

    // Validate process ID
    const processId = params.processId;
    if (!processId) {
      return new Response(
        JSON.stringify({
          error: "Brak identyfikatora procesu",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const validationResult = processIdSchema.safeParse(processId);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowy format identyfikatora procesu",
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

    // Fetch process data
    const { data: processData, error: processError } = await supabase
      .from("assessment_processes")
      .select("id, title, status, is_active, start_date, end_date")
      .eq("id", processId)
      .single();

    if (processError) {
      if (processError.code === "PGRST116") {
        // Process not found (PGRST116 is the error code for "not found")
        return new Response(
          JSON.stringify({
            error: "Nie znaleziono procesu oceny o podanym identyfikatorze",
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
          error: "Błąd podczas pobierania danych procesu oceny",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!processData) {
      return new Response(
        JSON.stringify({
          error: "Nie znaleziono procesu oceny o podanym identyfikatorze",
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
    const response: AssessmentProcessDTO = {
      id: processData.id,
      name: processData.title,
      status: processData.status,
      active: processData.is_active,
      startDate: processData.start_date,
      endDate: processData.end_date,
    };

    // Return process data
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error in /assessment-processes/{processId} endpoint:", err);
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
