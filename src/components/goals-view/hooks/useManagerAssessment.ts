import { useState, useEffect, useCallback } from "react";
import type { ManagerAssessmentDTO } from "@/components/goals-view/types";
import type { AssessmentProcessStatus } from "@/types";

interface UseManagerAssessmentProps {
  processId: string;
  employeeId: string;
}

export function useManagerAssessment({ processId, employeeId }: UseManagerAssessmentProps) {
  const [assessments, setAssessments] = useState<Record<string, ManagerAssessmentDTO>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});
  const [canEditManagerAssessment, setCanEditManagerAssessment] = useState(false);
  const [processStatus, setProcessStatus] = useState<AssessmentProcessStatus | undefined>();

  const fetchManagerAssessments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Najpierw pobieramy status procesu, aby określić, czy kierownik może edytować oceny
      const processResponse = await fetch(`/api/assessment-processes/${processId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!processResponse.ok) {
        throw new Error("Nie udało się pobrać informacji o procesie oceny");
      }

      const processData = await processResponse.json();
      setProcessStatus(processData.status);

      // Kierownik może edytować oceny tylko gdy status procesu to "awaiting_manager_assessment"
      const canEdit = processData.status === "awaiting_manager_assessment";
      setCanEditManagerAssessment(canEdit);

      // Pobieramy wszystkie cele pracownika
      const goalsResponse = await fetch(`/api/assessment-processes/${processId}/employees/${employeeId}/goals`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!goalsResponse.ok) {
        throw new Error("Nie udało się pobrać celów pracownika");
      }

      const goalsData = await goalsResponse.json();

      // Dla każdego celu pobieramy ocenę kierownika (jeśli istnieje)
      const assessmentsMap: Record<string, ManagerAssessmentDTO> = {};

      for (const goal of goalsData.goals) {
        try {
          const assessmentResponse = await fetch(`/api/goals/${goal.id}/manager-assessment`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });

          if (assessmentResponse.ok) {
            const assessmentData = await assessmentResponse.json();
            assessmentsMap[goal.id] = {
              rating: assessmentData.rating,
              comment: assessmentData.comments || "",
            };
          }
          // Jeśli ocena nie istnieje (404), po prostu nie dodajemy jej do mapy
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error(`Błąd pobierania oceny kierownika dla celu ${goal.id}:`, error);
          // Kontynuujemy przetwarzanie pozostałych celów
        }
      }

      setAssessments(assessmentsMap);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Błąd pobierania ocen kierownika:", error);
      setError(error instanceof Error ? error.message : "Nieznany błąd");
    } finally {
      setIsLoading(false);
    }
  }, [processId, employeeId]);

  useEffect(() => {
    if (processId && employeeId) {
      fetchManagerAssessments();
    }
  }, [processId, employeeId, fetchManagerAssessments]);

  const saveManagerAssessment = async (goalId: string, rating: number, comment: string) => {
    try {
      // Ustaw stan zapisywania dla tego celu
      setIsSaving((prev) => ({ ...prev, [goalId]: true }));

      const response = await fetch(`/api/goals/${goalId}/manager-assessment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          rating,
          comments: comment || null,
        }),
      });

      if (!response.ok) {
        throw new Error(`Błąd zapisywania oceny: ${response.statusText}`);
      }

      const data = await response.json();

      // Aktualizuj stan z nową oceną
      setAssessments((prev) => ({
        ...prev,
        [goalId]: {
          rating: data.rating,
          comment: data.comments || "",
        },
      }));

      return data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Błąd zapisywania oceny kierownika:", error);
      throw error;
    } finally {
      // Zresetuj stan zapisywania dla tego celu
      setIsSaving((prev) => ({ ...prev, [goalId]: false }));
    }
  };

  return {
    assessments,
    isLoading,
    error,
    saveManagerAssessment,
    isSaving,
    canEditManagerAssessment,
    processStatus,
    reload: fetchManagerAssessments,
  };
}
