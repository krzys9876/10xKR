import type { APIRoute } from "astro";
import { z } from "zod";
import type { UpdateGoalCommand, GoalResponse, GoalDetailDTO } from "../../../types";
import { requireAuth } from "../../../lib/auth-utils";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../db/database.types";

export const prerender = false;

// Validation schemas
const pathParamsSchema = z.object({
  goalId: z.string().uuid({ message: "Nieprawidłowy format identyfikatora celu" }),
});

const updateGoalSchema = z.object({
  description: z
    .string()
    .min(5, { message: "Opis celu musi mieć minimum 5 znaków" })
    .max(500, { message: "Opis celu nie może przekraczać 500 znaków" }),
  weight: z
    .number()
    .min(0, { message: "Waga celu musi być większa lub równa 0%" })
    .max(100, { message: "Waga celu nie może przekraczać 100%" }),
  categoryId: z.string().uuid({ message: "Nieprawidłowy format identyfikatora kategorii" }),
});

// Helper function to create API responses
function createApiResponse<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

// Helper function to create error responses
function createErrorResponse(message: string, status = 400, details?: unknown): Response {
  const responseBody: Record<string, unknown> = { error: message };
  if (details) responseBody.details = details;
  return createApiResponse(responseBody, status);
}

// Helper function to authenticate user
async function authenticateUser(supabase: SupabaseClient<Database>) {
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

// Helper function to check if user has permission to access the goal
async function checkGoalAccessPermission(supabase: SupabaseClient<Database>, goalId: string, userId: string) {
  // 1. Fetch goal with related data
  const { data: goal, error: goalError } = await supabase
    .from("goals")
    .select(
      `
      id, 
      user_id,
      assessment_processes:assessment_process_id (
        status
      )
    `
    )
    .eq("id", goalId)
    .single();

  if (goalError || !goal) {
    return {
      hasAccess: false,
      error: createErrorResponse("Cel o podanym identyfikatorze nie istnieje", 404),
      goal: null,
    };
  }

  // 2. Check if user is the goal's owner
  const isOwner = goal.user_id === userId;

  // 3. If not owner, check if user is the manager
  let isManager = false;
  if (!isOwner) {
    const { data: employee, error: employeeError } = await supabase
      .from("users")
      .select("manager_id")
      .eq("id", goal.user_id)
      .single();

    if (!employeeError && employee) {
      isManager = employee.manager_id === userId;
    }
  }

  if (!isOwner && !isManager) {
    return {
      hasAccess: false,
      error: createErrorResponse("Nie masz uprawnień do tego celu", 403),
      goal,
    };
  }

  return {
    hasAccess: true,
    error: createErrorResponse("", 200), // Return a dummy response that will never be used
    goal,
  };
}

// GET /goals/{goalId} - Get specific goal details
export const GET: APIRoute = async ({ params, locals }): Promise<Response> => {
  try {
    const supabase = locals.supabase;

    // 1. Authenticate user
    const { isAuthenticated, error: authError, user } = await authenticateUser(supabase);
    if (!isAuthenticated || !user) {
      return authError || createErrorResponse("Nieautoryzowany dostęp", 401);
    }

    // 2. Validate path parameters
    const pathParamsResult = pathParamsSchema.safeParse(params);
    if (!pathParamsResult.success) {
      return createErrorResponse("Nieprawidłowy format identyfikatora celu", 400, pathParamsResult.error.format());
    }

    const { goalId } = pathParamsResult.data;

    // 3. Check access permission
    const { hasAccess, error: accessError } = await checkGoalAccessPermission(supabase, goalId, user.id);

    if (!hasAccess) return accessError;

    // 4. Fetch goal details with all related data
    const { data: goalDetails, error: goalDetailsError } = await supabase
      .from("goals")
      .select(
        `
        id, 
        title,
        description, 
        weight,
        goal_categories:category_id (
          id,
          name
        ),
        users:user_id (
          id,
          first_name,
          last_name
        ),
        assessment_processes:assessment_process_id (
          id,
          title
        )
      `
      )
      .eq("id", goalId)
      .single();

    if (goalDetailsError || !goalDetails) {
      return createErrorResponse("Nie udało się pobrać szczegółów celu", 500);
    }

    // 5. Format response
    const response: GoalDetailDTO = {
      id: goalDetails.id,
      description: goalDetails.description || "",
      weight: goalDetails.weight,
      category: {
        id: goalDetails.goal_categories?.id || "",
        name: goalDetails.goal_categories?.name || "Bez kategorii",
      },
      employee: {
        id: goalDetails.users.id,
        name: `${goalDetails.users.first_name} ${goalDetails.users.last_name}`,
      },
      process: {
        id: goalDetails.assessment_processes.id,
        name: goalDetails.assessment_processes.title,
      },
    };

    return createApiResponse(response);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Nieoczekiwany błąd podczas obsługi żądania GET:", error);
    return createErrorResponse("Wystąpił błąd serwera", 500);
  }
};

// PUT /goals/{goalId} - Update a goal
export const PUT: APIRoute = async ({ request, params, locals }): Promise<Response> => {
  try {
    const supabase = locals.supabase;

    // 1. Authenticate user
    const { isAuthenticated, error: authError, user } = await authenticateUser(supabase);
    if (!isAuthenticated || !user) {
      return authError || createErrorResponse("Nieautoryzowany dostęp", 401);
    }

    // 2. Validate path parameters
    const pathParamsResult = pathParamsSchema.safeParse(params);
    if (!pathParamsResult.success) {
      return createErrorResponse("Nieprawidłowy format identyfikatora celu", 400, pathParamsResult.error.format());
    }

    const { goalId } = pathParamsResult.data;

    // 3. Validate request body
    let requestBody: UpdateGoalCommand;
    try {
      requestBody = await request.json();
    } catch {
      return createErrorResponse("Nieprawidłowy format danych wejściowych - oczekiwano JSON", 400);
    }

    const validationResult = updateGoalSchema.safeParse(requestBody);
    if (!validationResult.success) {
      return createErrorResponse("Dane nie spełniają wymagań walidacji", 400, validationResult.error.format());
    }

    const { description, weight, categoryId } = validationResult.data;

    // 4. Check access permission and get goal with process status
    const { hasAccess, error: accessError, goal } = await checkGoalAccessPermission(supabase, goalId, user.id);

    if (!hasAccess) return accessError;

    // 5. Verify process is in 'in_definition' status
    if (goal?.assessment_processes?.status !== "in_definition") {
      return createErrorResponse("Cele można aktualizować tylko dla procesów w fazie definiowania", 400, {
        details: `Aktualny status procesu: ${goal?.assessment_processes?.status || "unknown"}`,
      });
    }

    // 6. Check if category exists
    const { data: category, error: categoryError } = await supabase
      .from("goal_categories")
      .select("id, name")
      .eq("id", categoryId)
      .single();

    if (categoryError || !category) {
      return createErrorResponse("Kategoria celu o podanym identyfikatorze nie istnieje", 404);
    }

    // 7. Update goal in database
    const { data: updatedGoal, error: updateError } = await supabase
      .from("goals")
      .update({
        title: description.substring(0, 100),
        description,
        weight,
        category_id: categoryId,
      })
      .eq("id", goalId)
      .select("id, description, weight")
      .single();

    if (updateError || !updatedGoal) {
      return createErrorResponse("Wystąpił błąd podczas aktualizacji celu", 500, { details: updateError?.message });
    }

    // 8. Format response
    const response: GoalResponse = {
      id: updatedGoal.id,
      description: updatedGoal.description || "",
      weight: updatedGoal.weight,
      category: {
        id: category.id,
        name: category.name,
      },
      validationErrors: [],
    };

    return createApiResponse(response);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Nieoczekiwany błąd podczas obsługi żądania PUT:", error);
    return createErrorResponse("Wystąpił błąd serwera", 500);
  }
};

// DELETE /goals/{goalId} - Delete a goal
export const DELETE: APIRoute = async ({ params, locals }): Promise<Response> => {
  try {
    const supabase = locals.supabase;

    // 1. Authenticate user
    const { isAuthenticated, error: authError, user } = await authenticateUser(supabase);
    if (!isAuthenticated || !user) {
      return authError || createErrorResponse("Nieautoryzowany dostęp", 401);
    }

    // 2. Validate path parameters
    const pathParamsResult = pathParamsSchema.safeParse(params);
    if (!pathParamsResult.success) {
      return createErrorResponse("Nieprawidłowy format identyfikatora celu", 400, pathParamsResult.error.format());
    }

    const { goalId } = pathParamsResult.data;

    // 3. Check access permission and get goal with process status
    const { hasAccess, error: accessError, goal } = await checkGoalAccessPermission(supabase, goalId, user.id);

    if (!hasAccess) return accessError;

    // 4. Verify process is in 'in_definition' status
    if (goal?.assessment_processes?.status !== "in_definition") {
      return createErrorResponse("Cele można usuwać tylko dla procesów w fazie definiowania", 400, {
        details: `Aktualny status procesu: ${goal?.assessment_processes?.status || "unknown"}`,
      });
    }

    // 5. Delete goal from database
    const { error: deleteError } = await supabase.from("goals").delete().eq("id", goalId);

    if (deleteError) {
      return createErrorResponse("Wystąpił błąd podczas usuwania celu", 500, { details: deleteError.message });
    }

    // 6. Return success response with no content
    return new Response(null, {
      status: 204,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Nieoczekiwany błąd podczas obsługi żądania DELETE:", error);
    return createErrorResponse("Wystąpił błąd serwera", 500);
  }
};
