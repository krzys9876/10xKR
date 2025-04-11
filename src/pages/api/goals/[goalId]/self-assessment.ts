import type { APIRoute } from "astro";
import { z } from "zod";
import type { CreateAssessmentCommand } from "../../../../types";
import { requireAuth } from "../../../../lib/auth-utils";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../../db/database.types";
import {
  validateProcessStatus,
  getSelfAssessment,
  createOrUpdateSelfAssessment,
} from "../../../../lib/services/self-assessment.service";

export const prerender = false;

// Validation schemas
const pathParamsSchema = z.object({
  goalId: z.string().uuid({ message: "Nieprawidłowy format identyfikatora celu" }),
});

const createAssessmentSchema = z.object({
  rating: z
    .number()
    .min(0, { message: "Ocena nie może być mniejsza niż 0%" })
    .max(150, { message: "Ocena nie może być większa niż 150%" }),
  comments: z.string().max(500, { message: "Komentarz nie może przekraczać 500 znaków" }).nullable().optional(),
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
      user_id
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
    error: null,
    goal,
    isOwner,
    isManager,
  };
}

// GET /goals/{goalId}/self-assessment - Get self-assessment for the goal
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
    if (!hasAccess) return accessError as Response;

    // 4. Retrieve self-assessment
    const { data: assessment, error: assessmentError, statusCode } = await getSelfAssessment(supabase, goalId);

    if (assessmentError) {
      return createErrorResponse(assessmentError, statusCode || 500);
    }

    return createApiResponse(assessment);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Nieoczekiwany błąd podczas obsługi żądania GET:", error);
    return createErrorResponse("Wystąpił błąd serwera", 500);
  }
};

// POST /goals/{goalId}/self-assessment - Create or update self-assessment for the goal
export const POST: APIRoute = async ({ request, params, locals }): Promise<Response> => {
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

    // 3. Check if user is the goal owner (only owner can create/update self-assessment)
    const { hasAccess, error: accessError, isOwner } = await checkGoalAccessPermission(supabase, goalId, user.id);

    if (!hasAccess) return accessError as Response;

    // Only the goal owner can create/update self-assessment
    if (!isOwner) {
      return createErrorResponse("Tylko właściciel celu może tworzyć lub aktualizować samoocenę", 403);
    }

    // 4. Validate process status
    const { valid, error: statusError, statusCode: statusErrorCode } = await validateProcessStatus(supabase, goalId);

    if (!valid) {
      return createErrorResponse(statusError || "Nieprawidłowy status procesu", statusErrorCode || 400);
    }

    // 5. Validate request body
    let requestBody: CreateAssessmentCommand;
    try {
      requestBody = await request.json();
    } catch {
      return createErrorResponse("Nieprawidłowy format danych wejściowych - oczekiwano JSON", 400);
    }

    const validationResult = createAssessmentSchema.safeParse(requestBody);
    if (!validationResult.success) {
      return createErrorResponse("Dane nie spełniają wymagań walidacji", 400, validationResult.error.format());
    }

    const validatedData: CreateAssessmentCommand = {
      rating: validationResult.data.rating,
      comments: validationResult.data.comments === undefined ? null : validationResult.data.comments,
    };

    // 6. Create or update self-assessment
    const { data, error, statusCode } = await createOrUpdateSelfAssessment(supabase, goalId, user.id, validatedData);

    if (error || !data) {
      return createErrorResponse(error || "Nie udało się zapisać samooceny", statusCode || 500);
    }

    return createApiResponse(data, 201);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Nieoczekiwany błąd podczas obsługi żądania POST:", error);
    return createErrorResponse("Wystąpił błąd serwera", 500);
  }
};
