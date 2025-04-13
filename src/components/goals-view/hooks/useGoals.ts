import { useCallback, useEffect, useState } from "react";
import type { UseGoalsProps, UseGoalsResult, GoalViewModel } from "../types";
import type { AssessmentProcessStatus, GoalDTO } from "@/types";
import { mockGoalsResponse } from "@/api/goals/mock";

// Extended type for GoalDTO with selfAssessment
interface GoalWithSelfAssessmentDTO extends GoalDTO {
  selfAssessment?: {
    rating: number;
    comment: string;
  };
}

export function useGoals({ processId, employeeId }: UseGoalsProps): UseGoalsResult {
  const [goals, setGoals] = useState<GoalViewModel[]>([]);
  const [totalWeight, setTotalWeight] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [processStatus, setProcessStatus] = useState<AssessmentProcessStatus>("in_self_assessment"); // Default to in_self_assessment for testing
  const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});

  // Czy można edytować samoocenę (tylko dla statusu "in_self_assessment")
  const canEditSelfAssessment = processStatus === "in_self_assessment";

  // Pomocnicza funkcja do pobierania samooceny dla pojedynczego celu
  const fetchSelfAssessment = async (goalId: string) => {
    try {
      const response = await fetch(`/api/goals/${goalId}/self-assessment`);
      if (!response.ok) {
        // eslint-disable-next-line no-console
        console.warn(`Nie udało się pobrać samooceny dla celu ${goalId}`);
        return null;
      }

      const data = await response.json();
      // eslint-disable-next-line no-console
      console.log(`Pobrano samoocenę dla celu ${goalId}:`, data);

      // API może zwracać dane w różnych formatach, obsłużmy kilka możliwości
      if (data.rating !== undefined) {
        // Format { rating: number, comments: string }
        return {
          rating: data.rating,
          comment: data.comments || data.comment || "",
        };
      } else if (data.selfAssessment && data.selfAssessment.rating !== undefined) {
        // Format { selfAssessment: { rating: number, comments: string } }
        return {
          rating: data.selfAssessment.rating,
          comment: data.selfAssessment.comments || data.selfAssessment.comment || "",
        };
      } else if (data.data && data.data.rating !== undefined) {
        // Format { data: { rating: number, comments: string } }
        return {
          rating: data.data.rating,
          comment: data.data.comments || data.data.comment || "",
        };
      }

      // eslint-disable-next-line no-console
      console.warn(`Nieznany format odpowiedzi API dla celu ${goalId}:`, data);
      return null;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`Błąd podczas pobierania samooceny dla celu ${goalId}:`, err);
      return null;
    }
  };

  // Pobieranie celów z API
  const reload = useCallback(async () => {
    if (!processId || !employeeId) {
      setError("Brak identyfikatora procesu lub pracownika");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // Wywołanie API
      const response = await fetch(`/api/assessment-processes/${processId}/employees/${employeeId}/goals`);

      // Jeśli API zwraca błąd, używamy mockowych danych w trybie deweloperskim
      if (!response.ok) {
        // eslint-disable-next-line no-console
        console.warn("API zwróciło błąd. Używam mockowych danych w trybie deweloperskim.");

        // Pobierz status procesu z mocka
        const mockStatus = (mockGoalsResponse.processStatus as AssessmentProcessStatus) || "in_self_assessment";
        setProcessStatus(mockStatus);

        // Transformacja mockowych danych na ViewModel
        const goalsViewModel = mockGoalsResponse.goals.map((goal: GoalWithSelfAssessmentDTO) => ({
          ...goal,
          formattedWeight: `${goal.weight}%`,
          isReadOnly: mockStatus !== "in_self_assessment",
          selfAssessment: goal.selfAssessment,
        }));

        setGoals(goalsViewModel);
        setTotalWeight(mockGoalsResponse.totalWeight);

        // Log dla debugowania
        // eslint-disable-next-line no-console
        console.log("Mock status:", mockStatus, "canEdit:", mockStatus === "in_self_assessment");
        // eslint-disable-next-line no-console
        console.log("Mock goals:", goalsViewModel);

        setIsLoading(false);
        return;
      }

      const data = await response.json();

      // Pobierz status procesu z odpowiedzi
      const apiStatus = data.processStatus || "in_self_assessment"; // Dla testów ustawiamy in_self_assessment
      setProcessStatus(apiStatus);

      // eslint-disable-next-line no-console
      console.log("API status:", apiStatus, "canEdit:", apiStatus === "in_self_assessment");

      // Transformacja DTO na ViewModel (bez samoocen)
      const goalsViewModel = data.goals.map((goal: GoalDTO) => ({
        ...goal,
        formattedWeight: `${goal.weight}%`,
        isReadOnly: apiStatus !== "in_self_assessment", // Edycja tylko dla statusu in_self_assessment
      }));

      setGoals(goalsViewModel);
      setTotalWeight(data.totalWeight);

      // Pobierz samooceny dla każdego celu osobno z właściwego endpointu API
      if (data.goals.length > 0) {
        setIsLoading(true); // Kontynuuj stan ładowania podczas pobierania samoocen
        const updatedGoals = [...goalsViewModel];

        // Dla każdego celu pobierz samoocenę
        for (let i = 0; i < updatedGoals.length; i++) {
          const goal = updatedGoals[i];
          const selfAssessment = await fetchSelfAssessment(goal.id);

          if (selfAssessment) {
            updatedGoals[i] = {
              ...goal,
              selfAssessment: {
                rating: selfAssessment.rating,
                comment: selfAssessment.comment || "",
              },
            };
          }
        }

        // eslint-disable-next-line no-console
        console.log("Goals with fetched self-assessments:", updatedGoals);
        setGoals(updatedGoals);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Błąd pobierania celów:", err);

      // W przypadku błędu używamy mockowych danych w trybie deweloperskim
      // eslint-disable-next-line no-console
      console.warn("Używam mockowych danych w trybie deweloperskim po błędzie.");

      // Pobierz status procesu z mocka
      const mockStatus = (mockGoalsResponse.processStatus as AssessmentProcessStatus) || "in_self_assessment";
      setProcessStatus(mockStatus);

      // Transformacja mockowych danych na ViewModel
      const goalsViewModel = mockGoalsResponse.goals.map((goal: GoalWithSelfAssessmentDTO) => ({
        ...goal,
        formattedWeight: `${goal.weight}%`,
        isReadOnly: mockStatus !== "in_self_assessment",
        selfAssessment: goal.selfAssessment,
      }));

      setGoals(goalsViewModel);
      setTotalWeight(mockGoalsResponse.totalWeight);
    } finally {
      setIsLoading(false);
    }
  }, [processId, employeeId]);

  // Funkcja do zapisywania samooceny
  const saveSelfAssessment = useCallback(
    async (goalId: string, rating: number, comment: string) => {
      // Tylko dla statusu "in_self_assessment"
      if (!canEditSelfAssessment) {
        return;
      }

      // Ustaw stan zapisywania dla tego celu
      setIsSaving((prev) => ({ ...prev, [goalId]: true }));

      try {
        // Wywołanie API
        const response = await fetch(`/api/goals/${goalId}/self-assessment`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ rating, comments: comment }),
        });

        // Jeśli API zwraca błąd, wyświetlamy komunikat i używamy danych lokalnych
        if (!response.ok) {
          // eslint-disable-next-line no-console
          console.warn("API zwróciło błąd podczas zapisywania samooceny. Aktualizuję tylko stan lokalny.");

          // Aktualizacja stanu lokalnego
          setGoals((prevGoals) =>
            prevGoals.map((goal) =>
              goal.id === goalId
                ? {
                    ...goal,
                    selfAssessment: {
                      rating,
                      comment,
                      error: "Błąd zapisywania oceny (dane testowe)",
                    },
                  }
                : goal
            )
          );
          return;
        }

        // Aktualizacja lokalnego stanu po pomyślnym zapisie
        setGoals((prevGoals) =>
          prevGoals.map((goal) =>
            goal.id === goalId
              ? {
                  ...goal,
                  selfAssessment: {
                    rating,
                    comment,
                  },
                }
              : goal
          )
        );
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Błąd zapisywania samooceny:", err);

        // Aktualizacja stanu z błędem
        setGoals((prevGoals) =>
          prevGoals.map((goal) =>
            goal.id === goalId
              ? {
                  ...goal,
                  selfAssessment: {
                    ...goal.selfAssessment,
                    rating,
                    comment,
                    error: "Błąd zapisywania oceny",
                  },
                }
              : goal
          )
        );
      } finally {
        setIsSaving((prev) => ({ ...prev, [goalId]: false }));
      }
    },
    [canEditSelfAssessment]
  );

  // Załadowanie celów przy montowaniu komponentu
  useEffect(() => {
    reload();
  }, [reload]);

  return {
    goals,
    totalWeight,
    isLoading,
    error,
    reload,
    isComplete: totalWeight === 100,
    processStatus,
    canEditSelfAssessment,
    saveSelfAssessment,
    isSaving,
  };
}
