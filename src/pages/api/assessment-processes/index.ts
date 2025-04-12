import type { APIRoute } from "astro";
import { z } from "zod";
import type { AssessmentProcessDTO, AssessmentProcessListResponse, AssessmentProcessStatus } from "../../../types";
import { requireAuth } from "../../../lib/auth-utils";

export const prerender = false;

// Validation schema for filtering parameters
const assessmentProcessFilterSchema = z.object({
  status: z.enum(["in_definition", "in_self_assessment", "awaiting_manager_assessment", "completed"]).optional(),
  active: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
});

export const GET: APIRoute = async ({ request, locals }) => {
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

    // Parse and validate query parameters
    const url = new URL(request.url);
    const validatedParams = assessmentProcessFilterSchema.safeParse({
      status: url.searchParams.get("status"),
      active: url.searchParams.get("active"),
      page: url.searchParams.get("page"),
      limit: url.searchParams.get("limit"),
    });

    if (!validatedParams.success) {
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowe parametry zapytania",
          details: validatedParams.error.format(),
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { status, active, page, limit } = validatedParams.data;
    const offset = (page - 1) * limit;

    // Build query with optional filters
    let query = supabase
      .from("assessment_processes")
      .select("id, title, status, is_active, start_date, end_date", { count: "exact" });

    if (status) {
      query = query.eq("status", status);
    }

    if (active !== undefined) {
      query = query.eq("is_active", active);
    }

    // Fetch processes with pagination
    const {
      data,
      count,
      error: fetchError,
    } = await query.order("start_date", { ascending: false }).range(offset, offset + limit - 1);

    if (fetchError) {
      // eslint-disable-next-line no-console
      console.error("Error fetching assessment processes:", fetchError);
      return new Response(
        JSON.stringify({
          error: "Błąd podczas pobierania procesów ocen",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Prepare response in required format
    const processes: AssessmentProcessDTO[] = data.map((process) => ({
      id: process.id,
      name: process.title,
      status: process.status as AssessmentProcessStatus,
      active: process.is_active,
      startDate: process.start_date,
      endDate: process.end_date,
    }));

    const response: AssessmentProcessListResponse = {
      processes,
      total: count || 0,
      page,
      limit,
    };

    // Return the list of assessment processes
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error in GET /assessment-processes endpoint:", err);
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
