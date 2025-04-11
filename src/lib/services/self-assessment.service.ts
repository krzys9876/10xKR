import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type { AssessmentDTO, AssessmentResponse, CreateAssessmentCommand } from "../../types";

/**
 * Validates if the assessment process is in the 'in_self_assessment' status
 */
export async function validateProcessStatus(
  supabase: SupabaseClient<Database>,
  goalId: string
): Promise<{ valid: boolean; error?: string; statusCode?: number }> {
  const { data, error } = await supabase
    .from("goals")
    .select(
      `
      assessment_process_id,
      assessment_processes:assessment_process_id (
        status
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
  if (status !== "in_self_assessment") {
    return {
      valid: false,
      error: "Samoocena jest dostępna tylko dla procesów w fazie samooceny",
      statusCode: 403,
    };
  }

  return { valid: true };
}

/**
 * Retrieves a self-assessment for a specific goal
 */
export async function getSelfAssessment(
  supabase: SupabaseClient<Database>,
  goalId: string
): Promise<{ data: AssessmentDTO | null; error?: string; statusCode?: number }> {
  const { data, error } = await supabase
    .from("self_assessments")
    .select("id, rating, comments, created_at, updated_at")
    .eq("goal_id", goalId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // Resource not found error from PostgREST
      return { data: null, error: "Samoocena dla tego celu nie istnieje", statusCode: 404 };
    }
    return { data: null, error: "Wystąpił błąd podczas pobierania samooceny", statusCode: 500 };
  }

  if (!data) {
    return { data: null, error: "Samoocena dla tego celu nie istnieje", statusCode: 404 };
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
 * Creates or updates a self-assessment for a specific goal
 */
export async function createOrUpdateSelfAssessment(
  supabase: SupabaseClient<Database>,
  goalId: string,
  userId: string,
  assessmentData: CreateAssessmentCommand
): Promise<{ data: AssessmentResponse | null; error?: string; statusCode?: number }> {
  // First check if self-assessment already exists
  const { data: existingAssessment, error: checkError } = await supabase
    .from("self_assessments")
    .select("id")
    .eq("goal_id", goalId)
    .single();

  if (checkError && checkError.code !== "PGRST116") {
    // If error is not "not found", return error
    return {
      data: null,
      error: "Wystąpił błąd podczas sprawdzania istniejącej samooceny",
      statusCode: 500,
    };
  }

  let result;

  if (existingAssessment) {
    // Update existing assessment
    result = await supabase
      .from("self_assessments")
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
      .from("self_assessments")
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
      error: "Wystąpił błąd podczas zapisywania samooceny",
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
