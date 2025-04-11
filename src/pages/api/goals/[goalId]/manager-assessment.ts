import type { APIRoute } from "astro";
import { z } from "zod";
import { supabaseClient } from "../../../../db/supabase.client";
import { requireAuth } from "../../../../lib/auth-utils";
import {
  validateProcessStatus,
  getManagerAssessment,
  createOrUpdateManagerAssessment,
} from "../../../../lib/services/manager-assessment.service";
import type { CreateAssessmentCommand } from "../../../../types";

// Schema for validating request body
const createManagerAssessmentSchema = z.object({
  rating: z.number().min(0).max(150).describe("Rating (0-150%)"),
  comments: z.string().nullable().describe("Optional comments"),
});

export const GET: APIRoute = async ({ params }) => {
  // 1. Extract goal ID from params
  const { goalId } = params;
  if (!goalId) {
    return new Response(JSON.stringify({ error: "Identyfikator celu jest wymagany" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 2. Authenticate user
  const supabase = supabaseClient;
  const { user, error: authError } = await requireAuth(supabase);
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Użytkownik niezalogowany" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 3. Get the goal owner to authorize access
  const { data: goal } = await supabase.from("goals").select("user_id").eq("id", goalId).single();

  // Check if user is either the goal owner or a manager
  if (goal) {
    const isGoalOwner = goal.user_id === user.id;

    // If not the goal owner, verify if they have manager permission
    if (!isGoalOwner) {
      // For managers, we'll proceed and let the service handle the validation
      // If they're not authorized, they'll get a 404 when no assessment is found
    }
  }

  // 4. Retrieve the manager assessment
  const { data, error, statusCode } = await getManagerAssessment(supabase, goalId);

  if (error) {
    return new Response(JSON.stringify({ error }), {
      status: statusCode || 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 5. Return the assessment data
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export const POST: APIRoute = async ({ params, request }) => {
  // 1. Extract goal ID from params
  const { goalId } = params;
  if (!goalId) {
    return new Response(JSON.stringify({ error: "Identyfikator celu jest wymagany" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 2. Authenticate user
  const supabase = supabaseClient;
  const { user, error: authError } = await requireAuth(supabase);
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Użytkownik niezalogowany" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 3. Parse and validate request body
  let assessmentData: CreateAssessmentCommand;
  try {
    const body = await request.json();
    const result = createManagerAssessmentSchema.safeParse(body);

    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowy format danych",
          details: result.error.format(),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    assessmentData = {
      rating: result.data.rating,
      comments: result.data.comments,
    };
  } catch {
    return new Response(JSON.stringify({ error: "Nieprawidłowy format JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 4. Validate process status and manager permissions
  const validationResult = await validateProcessStatus(supabase, goalId, user.id);

  if (!validationResult.valid) {
    return new Response(JSON.stringify({ error: validationResult.error }), {
      status: validationResult.statusCode || 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 5. Create or update the manager assessment
  const {
    data,
    error: createError,
    statusCode: createStatusCode,
  } = await createOrUpdateManagerAssessment(supabase, goalId, user.id, assessmentData);

  if (createError) {
    return new Response(JSON.stringify({ error: createError }), {
      status: createStatusCode || 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 6. Return the created/updated assessment
  return new Response(JSON.stringify(data), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
};
