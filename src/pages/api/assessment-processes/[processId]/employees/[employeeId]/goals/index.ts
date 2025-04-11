import type { APIRoute } from "astro";
import { z } from "zod";
import type { CreateGoalCommand, GoalResponse, GoalDTO, GoalListResponse } from "../../../../../../../types";
import { authenticateUser, createApiResponse, createErrorResponse } from "../../../../../../../lib/api-utils";

export const prerender = false;

// Validation schemas
const createGoalSchema = z.object({
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

const pathParamsSchema = z.object({
  processId: z.string().uuid({ message: "Nieprawidłowy format identyfikatora procesu" }),
  employeeId: z.string().uuid({ message: "Nieprawidłowy format identyfikatora pracownika" }),
});

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
      return createErrorResponse("Nieprawidłowe parametry ścieżki", 400, pathParamsResult.error.format());
    }

    const { processId, employeeId } = pathParamsResult.data;

    // 3. Validate request body
    let requestBody: CreateGoalCommand;
    try {
      requestBody = await request.json();
    } catch {
      return createErrorResponse("Nieprawidłowy format danych wejściowych - oczekiwano JSON", 400);
    }

    const validationResult = createGoalSchema.safeParse(requestBody);
    if (!validationResult.success) {
      return createErrorResponse("Dane nie spełniają wymagań walidacji", 400, validationResult.error.format());
    }

    const { description, weight, categoryId } = validationResult.data;

    // 4. Business validations

    // 4.1 Check if assessment process exists and has correct status
    const { data: process, error: processError } = await supabase
      .from("assessment_processes")
      .select("id, status")
      .eq("id", processId)
      .single();

    if (processError || !process) {
      return createErrorResponse("Proces oceny o podanym identyfikatorze nie istnieje", 404);
    }

    if (process.status !== "in_definition") {
      return createErrorResponse("Cele można dodawać tylko dla procesów w fazie definiowania", 400, {
        details: `Aktualny status procesu: ${process.status}`,
      });
    }

    // 4.2 Check if employee exists
    const { data: employee, error: employeeError } = await supabase
      .from("users")
      .select("id, manager_id")
      .eq("id", employeeId)
      .single();

    if (employeeError || !employee) {
      return createErrorResponse("Pracownik o podanym identyfikatorze nie istnieje", 404);
    }

    // 4.3 Check if category exists
    const { data: category, error: categoryError } = await supabase
      .from("goal_categories")
      .select("id, name")
      .eq("id", categoryId)
      .single();

    if (categoryError || !category) {
      return createErrorResponse("Kategoria celu o podanym identyfikatorze nie istnieje", 404);
    }

    // 4.4 Check if user has permission (is manager or employee themselves)
    const isEmployee = user.id === employeeId;
    const isManager = employee.manager_id === user.id;

    if (!isEmployee && !isManager) {
      return createErrorResponse("Brak uprawnień do utworzenia celu dla tego pracownika", 403);
    }

    // 5. Create goal in database
    const { data: newGoal, error: createError } = await supabase
      .from("goals")
      .insert({
        title: description.substring(0, 100), // Using description as title, but truncating to reasonable length
        description,
        weight,
        category_id: categoryId,
        user_id: employeeId,
        assessment_process_id: processId,
      })
      .select("id, description, weight, category_id")
      .single();

    if (createError || !newGoal) {
      return createErrorResponse("Wystąpił błąd podczas tworzenia celu", 500, { details: createError?.message });
    }

    // 6. Format response
    const response: GoalResponse = {
      id: newGoal.id,
      description: newGoal.description || "",
      weight: newGoal.weight,
      category: {
        id: category.id,
        name: category.name,
      },
      validationErrors: [],
    };

    return createApiResponse(response, 201);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Nieoczekiwany błąd podczas obsługi żądania:", error);
    return createErrorResponse("Wystąpił błąd serwera", 500);
  }
};

// GET - fetch all goals for an employee in a process
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
      return createErrorResponse("Nieprawidłowe parametry ścieżki", 400, pathParamsResult.error.format());
    }

    const { processId, employeeId } = pathParamsResult.data;

    // 3. Verify that process exists
    const { data: process, error: processError } = await supabase
      .from("assessment_processes")
      .select("id")
      .eq("id", processId)
      .single();

    if (processError || !process) {
      return createErrorResponse("Proces oceny o podanym identyfikatorze nie istnieje", 404);
    }

    // 4. Verify that employee exists
    const { data: employee, error: employeeError } = await supabase
      .from("users")
      .select("id, manager_id")
      .eq("id", employeeId)
      .single();

    if (employeeError || !employee) {
      return createErrorResponse("Pracownik o podanym identyfikatorze nie istnieje", 404);
    }

    // 5. Check if user has permission (is manager or employee themselves)
    const isEmployee = user.id === employeeId;
    const isManager = employee.manager_id === user.id;

    if (!isEmployee && !isManager) {
      return createErrorResponse("Brak uprawnień do przeglądania celów tego pracownika", 403);
    }

    // 6. Fetch goals for the employee in the process
    const { data: goals, error: goalsError } = await supabase
      .from("goals")
      .select(
        `
        id, 
        description, 
        weight,
        goal_categories:category_id (
          id,
          name
        )
      `
      )
      .eq("user_id", employeeId)
      .eq("assessment_process_id", processId);

    if (goalsError) {
      return createErrorResponse("Wystąpił błąd podczas pobierania celów", 500, { details: goalsError.message });
    }

    // 7. Transform data to DTOs
    const goalDTOs: GoalDTO[] = goals.map((goal) => ({
      id: goal.id,
      description: goal.description || "",
      weight: goal.weight,
      category: {
        id: goal.goal_categories?.id || "",
        name: goal.goal_categories?.name || "Bez kategorii",
      },
    }));

    // 8. Calculate total weight
    const totalWeight = goalDTOs.reduce((sum, goal) => sum + goal.weight, 0);

    // 9. Format response
    const response: GoalListResponse = {
      goals: goalDTOs,
      totalWeight,
    };

    return createApiResponse(response);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Nieoczekiwany błąd podczas obsługi żądania GET:", error);
    return createErrorResponse("Wystąpił błąd serwera", 500);
  }
};
