import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type { AssessmentDTO, AssessmentResponse, CreateAssessmentCommand } from "../../types";

/**
 * Validates if the assessment process is in the 'awaiting_manager_assessment' status
 * and if the logged-in user is the manager of the employee who owns the goal
 */
export async function validateProcessStatus(
  supabase: SupabaseClient<Database>,
  goalId: string,
  managerId: string
): Promise<{ valid: boolean; error?: string; statusCode?: number }> {
  const { data, error } = await supabase
    .from("goals")
    .select(
      `
      id,
      assessment_process_id,
      user_id,
      assessment_processes:assessment_process_id (
        status
      ),
      users:user_id (
        manager_id
      )
    `
    )
    .eq("id", goalId)
    .single();

  if (error || !data) {
    return {
      valid: false,
      error: "Cel o podanym identyfikatorze nie istnieje",
      statusCode: 404,
    };
  }

  const status = data.assessment_processes?.status;
  if (status !== "awaiting_manager_assessment") {
    return {
      valid: false,
      error: "Ocena menedżerska jest dostępna tylko dla procesów w fazie oceny przez menedżera",
      statusCode: 403,
    };
  }

  // Check if the logged-in user is the manager of the employee who owns the goal
  const employeeManagerId = data.users?.manager_id;
  if (employeeManagerId !== managerId) {
    return {
      valid: false,
      error: "Brak uprawnień do oceny tego celu",
      statusCode: 403,
    };
  }

  return { valid: true };
}

/**
 * Retrieves a manager assessment for a specific goal
 */
export async function getManagerAssessment(
  supabase: SupabaseClient<Database>,
  goalId: string
): Promise<{ data: AssessmentDTO | null; error?: string; statusCode?: number }> {
  const { data, error } = await supabase
    .from("manager_assessments")
    .select("id, rating, comments, created_at, updated_at")
    .eq("goal_id", goalId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // Resource not found error from PostgREST
      return { data: null, error: "Ocena menedżerska dla tego celu nie istnieje", statusCode: 404 };
    }
    return { data: null, error: "Wystąpił błąd podczas pobierania oceny menedżerskiej", statusCode: 500 };
  }

  if (!data) {
    return { data: null, error: "Ocena menedżerska dla tego celu nie istnieje", statusCode: 404 };
  }

  return {
    data: {
      id: data.id,
      rating: data.rating,
      comments: data.comments,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    },
  };
}

/**
 * Creates or updates a manager assessment for a specific goal
 */
export async function createOrUpdateManagerAssessment(
  supabase: SupabaseClient<Database>,
  goalId: string,
  managerId: string,
  assessmentData: CreateAssessmentCommand
): Promise<{ data: AssessmentResponse | null; error?: string; statusCode?: number }> {
  // Validate the assessment rating
  if (assessmentData.rating < 0 || assessmentData.rating > 150) {
    return {
      data: null,
      error: "Wartość oceny musi być w zakresie 0-150%",
      statusCode: 400,
    };
  }

  // First check if manager assessment already exists
  const { data: existingAssessment, error: checkError } = await supabase
    .from("manager_assessments")
    .select("id")
    .eq("goal_id", goalId)
    .single();

  if (checkError && checkError.code !== "PGRST116") {
    // If error is not "not found", return error
    return {
      data: null,
      error: "Wystąpił błąd podczas sprawdzania istniejącej oceny menedżerskiej",
      statusCode: 500,
    };
  }

  let result;

  if (existingAssessment) {
    // Update existing assessment
    result = await supabase
      .from("manager_assessments")
      .update({
        rating: assessmentData.rating,
        comments: assessmentData.comments,
      })
      .eq("id", existingAssessment.id)
      .select("id, rating, comments, created_at")
      .single();
  } else {
    // Create new assessment
    result = await supabase
      .from("manager_assessments")
      .insert({
        goal_id: goalId,
        rating: assessmentData.rating,
        comments: assessmentData.comments,
      })
      .select("id, rating, comments, created_at")
      .single();
  }

  if (result.error) {
    // eslint-disable-next-line no-console
    console.error("Nieoczekiwany błąd podczas obsługi żądania POST:", result.error);

    return {
      data: null,
      error: "Wystąpił błąd podczas zapisywania oceny menedżerskiej",
      statusCode: 500,
    };
  }

  return {
    data: {
      id: result.data.id,
      rating: result.data.rating,
      comments: result.data.comments,
      createdAt: result.data.created_at,
    },
  };
}
