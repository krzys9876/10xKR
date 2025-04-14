import { useCallback, useEffect, useState } from "react";
import type { UseGoalsProps, UseGoalsResult, GoalViewModel } from "../types";
import type { AssessmentProcessStatus, EmployeeDTO, GoalDTO } from "@/types";
import { mockGoalsResponse } from "@/api/goals/mock";

// Extended type for GoalDTO with selfAssessment
interface GoalWithSelfAssessmentDTO extends GoalDTO {
  selfAssessment?: {
    rating: number;
    comment: string;
  };
}

export function useGoals({ processId, employeeId, process }: UseGoalsProps): UseGoalsResult {
  const [goals, setGoals] = useState<GoalViewModel[]>([]);
  const [totalWeight, setTotalWeight] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [processStatus, setProcessStatus] = useState<AssessmentProcessStatus>(
    (process?.status as AssessmentProcessStatus) || "in_definition"
  );
  const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});
  const [employee, setEmployee] = useState<EmployeeDTO | null>(null);
  const [, setCurrentUser] = useState<EmployeeDTO | null>(null);
  const [isViewingOwnGoals, setIsViewingOwnGoals] = useState<boolean>(true);

  // Aktualizuj status procesu, gdy zmienia się props
  useEffect(() => {
    if (process?.status) {
      setProcessStatus(process.status as AssessmentProcessStatus);
    }
  }, [process?.status]);

  // Czy można edytować samoocenę (tylko dla statusu "in_self_assessment" i tylko gdy użytkownik przegląda własne cele)
  const canEditSelfAssessment = processStatus === "in_self_assessment" && isViewingOwnGoals;

  // Pomocnicza funkcja do pobierania danych o zalogowanym użytkowniku
  const fetchCurrentUser = async () => {
    try {
      const response = await fetch(`/api/auth/me`);
      if (!response.ok) {
        // eslint-disable-next-line no-console
        console.warn(`Nie udało się pobrać danych zalogowanego użytkownika`);
        return null;
      }

      const userData = await response.json();
      // eslint-disable-next-line no-console
      console.log(`Pobrano dane zalogowanego użytkownika:`, userData);

      return {
        id: userData.id,
        name: userData.name || userData.email,
        email: userData.email,
      };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`Błąd podczas pobierania danych zalogowanego użytkownika:`, err);
      return null;
    }
  };

  // Pomocnicza funkcja do pobierania danych pracownika
  const fetchEmployeeData = async (empId: string) => {
    try {
      const response = await fetch(`/api/users/${empId}`);
      if (!response.ok) {
        // eslint-disable-next-line no-console
        console.warn(`Nie udało się pobrać danych pracownika ${empId}`);
        return null;
      }

      const userData = await response.json();
      // eslint-disable-next-line no-console
      console.log(`Pobrano dane pracownika ${empId}:`, userData);

      // Zwracamy tylko podstawowe dane pracownika
      return {
        id: userData.id,
        name: userData.name,
        email: userData.email,
      };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`Błąd podczas pobierania danych pracownika ${empId}:`, err);
      return null;
    }
  };

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

    // Pobierz dane zalogowanego użytkownika
    const loggedInUser = await fetchCurrentUser();
    if (loggedInUser) {
      setCurrentUser(loggedInUser);
      // Sprawdź, czy użytkownik przegląda własne cele czy cele innego pracownika
      setIsViewingOwnGoals(loggedInUser.id === employeeId);
      // eslint-disable-next-line no-console
      console.log(`Czy użytkownik przegląda własne cele: ${loggedInUser.id === employeeId}`);
    }

    // Pobierz dane pracownika
    const employeeData = await fetchEmployeeData(employeeId);
    if (employeeData) {
      setEmployee(employeeData);
    } else {
      // Ustawiamy podstawowe dane pracownika, jeśli nie udało się ich pobrać
      setEmployee({
        id: employeeId,
        name: "Nieznany pracownik",
        email: "",
      });
    }

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

      // Transformacja DTO na ViewModel (bez samoocen)
      const goalsViewModel = data.goals.map((goal: GoalDTO) => ({
        ...goal,
        formattedWeight: `${goal.weight}%`,
        isReadOnly: processStatus !== "in_self_assessment", // Edycja tylko dla statusu in_self_assessment
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

      // Log dla debugowania
      // eslint-disable-next-line no-console
      console.log("Mock status:", mockStatus, "canEdit:", mockStatus === "in_self_assessment");
      // eslint-disable-next-line no-console
      console.log("Mock goals:", goalsViewModel);
    } finally {
      setIsLoading(false);
    }
  }, [processId, employeeId, processStatus]);

  useEffect(() => {
    if (processId && employeeId) {
      reload();
    }
  }, [processId, employeeId, reload]);

  return {
    goals,
    totalWeight,
    isLoading,
    error,
    reload,
    canEditSelfAssessment,
    saveSelfAssessment: async (goalId: string, rating: number, comment: string) => {
      try {
        setIsSaving((prev) => ({ ...prev, [goalId]: true }));

        const response = await fetch(`/api/goals/${goalId}/self-assessment`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            rating,
            comments: comment || null,
          }),
        });

        if (!response.ok) {
          throw new Error(`Błąd zapisywania samooceny: ${response.statusText}`);
        }

        const data = await response.json();

        // Aktualizuj stan z nową samooceną
        setGoals((prev) =>
          prev.map((goal) =>
            goal.id === goalId
              ? {
                  ...goal,
                  selfAssessment: {
                    rating: data.rating,
                    comment: data.comments || "",
                  },
                }
              : goal
          )
        );

        return data;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Błąd zapisywania samooceny:", error);
        throw error;
      } finally {
        setIsSaving((prev) => ({ ...prev, [goalId]: false }));
      }
    },
    isSaving,
    employee,
    processStatus,
  };
}
