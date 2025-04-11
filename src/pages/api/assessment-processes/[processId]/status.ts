import type { APIRoute } from "astro";
import { z } from "zod";
import type { UpdateAssessmentProcessStatusResponse, AssessmentProcessStatus } from "../../../../types";
import { requireAuth } from "../../../../lib/auth-utils";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../../db/database.types";

export const prerender = false;

// Schemat walidacji identyfikatora procesu
const processIdSchema = z.string().uuid({ message: "Nieprawidłowy format identyfikatora procesu" });

// Schemat walidacji danych do aktualizacji statusu
const statusUpdateSchema = z.object({
  status: z.enum([
    "in_definition",
    "awaiting_self_assessment",
    "in_self_assessment",
    "awaiting_manager_assessment",
    "completed",
  ]),
});

// Mapa dozwolonych przejść statusów
const allowedStatusTransitions: Record<AssessmentProcessStatus, AssessmentProcessStatus[]> = {
  in_definition: ["awaiting_self_assessment"],
  awaiting_self_assessment: ["in_self_assessment"],
  in_self_assessment: ["awaiting_manager_assessment"],
  awaiting_manager_assessment: ["completed"],
  completed: [],
};

// Typ dla tabeli status_history, który nie jest zdefiniowany w typach bazy danych
interface StatusHistoryInsert {
  assessment_process_id: string;
  status: AssessmentProcessStatus;
  changed_at: string;
  changed_by_id: string;
}

export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    const supabase = locals.supabase;

    // Sprawdź czy użytkownik jest zalogowany
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

    // Walidacja identyfikatora procesu
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

    // Sprawdź czy proces istnieje i pobierz jego aktualny status
    const { data: processData, error: processError } = await supabase
      .from("assessment_processes")
      .select("id, status")
      .eq("id", processId)
      .single();

    if (processError || !processData) {
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

    // Sprawdź czy użytkownik ma uprawnienia (administrator lub menedżer)
    const isAdmin = await checkIfUserIsAdmin(supabase, user.id);
    const isManager = await checkIfUserIsManager(supabase, user.id);

    if (!isAdmin && !isManager) {
      return new Response(
        JSON.stringify({
          error: "Brak uprawnień do wykonania tej operacji",
        }),
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Parsuj i waliduj dane wejściowe
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowy format danych JSON",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const statusValidationResult = statusUpdateSchema.safeParse(body);

    if (!statusValidationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowe dane wejściowe",
          details: statusValidationResult.error.format(),
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const newStatus = statusValidationResult.data.status as AssessmentProcessStatus;
    const currentStatus = processData.status as AssessmentProcessStatus;

    // Sprawdź czy przejście statusu jest dozwolone
    if (!allowedStatusTransitions[currentStatus].includes(newStatus)) {
      return new Response(
        JSON.stringify({
          error: `Niedozwolone przejście statusu z '${currentStatus}' do '${newStatus}'`,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Aktualizuj status procesu
    const now = new Date().toISOString();
    const { data: updatedProcess, error: updateError } = await supabase
      .from("assessment_processes")
      .update({ status: newStatus, updated_at: now })
      .eq("id", processId)
      .select("id, status")
      .single();

    if (updateError) {
      return new Response(
        JSON.stringify({
          error: "Błąd podczas aktualizacji statusu procesu",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Dodaj wpis do historii statusów
    const statusHistoryRecord: StatusHistoryInsert = {
      assessment_process_id: processId,
      status: newStatus,
      changed_at: now,
      changed_by_id: user.id,
    };

    // Używamy "any" jako obejścia braku definicji tabeli w typach
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: historyError } = await (supabase as any).from("status_history").insert(statusHistoryRecord);

    if (historyError) {
      // eslint-disable-next-line no-console
      console.error("Error adding status history:", historyError);
      // Kontynuujemy mimo błędu zapisu historii, ale logujemy błąd
    }

    // Przygotuj odpowiedź
    const response: UpdateAssessmentProcessStatusResponse = {
      id: updatedProcess.id,
      status: updatedProcess.status as AssessmentProcessStatus,
      previousStatus: currentStatus,
      changedAt: now,
    };

    // Zwróć zaktualizowany status
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error in PUT /assessment-processes/{processId}/status endpoint:", err);
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

// Funkcja pomocnicza do sprawdzania, czy użytkownik jest administratorem
async function checkIfUserIsAdmin(supabase: SupabaseClient<Database>, userId: string): Promise<boolean> {
  const { data, error } = await supabase.from("admins").select("user_id").eq("user_id", userId).single();

  return !error && !!data;
}

// Funkcja pomocnicza do sprawdzania, czy użytkownik jest menedżerem
async function checkIfUserIsManager(supabase: SupabaseClient<Database>, userId: string): Promise<boolean> {
  const { data, error } = await supabase.from("users").select("id").eq("manager_id", userId).limit(1);

  return !error && data.length > 0;
}
