import type { APIRoute } from "astro";
import { z } from "zod";
import type { AssessmentProcessDTO } from "../../../types";
import { authenticateUser, createApiResponse, createErrorResponse } from "../../../lib/api-utils";

export const prerender = false;

// Validation schema for process ID
const processIdSchema = z.string().uuid({ message: "Nieprawidłowy format identyfikatora procesu" });

export const GET: APIRoute = async ({ params, locals }): Promise<Response> => {
  try {
    const supabase = locals.supabase;

    // 1. Authenticate user
    const { isAuthenticated, error: authError, user } = await authenticateUser(supabase);
    if (!isAuthenticated || !user) {
      return authError || createErrorResponse("Nieautoryzowany dostęp", 401);
    }

    // 2. Validate process ID
    const processId = params.processId;
    if (!processId) {
      return createErrorResponse("Brak identyfikatora procesu", 400);
    }

    const validationResult = processIdSchema.safeParse(processId);
    if (!validationResult.success) {
      return createErrorResponse("Nieprawidłowy format identyfikatora procesu", 400, validationResult.error.format());
    }

    // 3. Fetch process data
    const { data: processData, error: processError } = await supabase
      .from("assessment_processes")
      .select("id, title, status, is_active, start_date, end_date")
      .eq("id", processId)
      .single();

    if (processError) {
      if (processError.code === "PGRST116") {
        // Process not found (PGRST116 is the error code for "not found")
        return createErrorResponse("Nie znaleziono procesu oceny o podanym identyfikatorze", 404);
      }
      return createErrorResponse("Błąd podczas pobierania danych procesu oceny", 500);
    }

    if (!processData) {
      return createErrorResponse("Nie znaleziono procesu oceny o podanym identyfikatorze", 404);
    }

    // 4. Prepare response in required format
    const response: AssessmentProcessDTO = {
      id: processData.id,
      name: processData.title,
      status: processData.status,
      active: processData.is_active,
      startDate: processData.start_date,
      endDate: processData.end_date,
    };

    // 5. Return process data
    return createApiResponse(response);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error in /assessment-processes/{processId} endpoint:", error);
    return createErrorResponse("Wystąpił błąd podczas przetwarzania żądania", 500);
  }
};
