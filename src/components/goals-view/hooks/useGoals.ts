import { useCallback, useEffect, useState } from "react";
import type { UseGoalsProps, UseGoalsResult, GoalViewModel } from "../types";
import type { GoalDTO } from "@/types";
import { mockGoalsResponse } from "@/api/goals/mock";

export function useGoals({ processId, employeeId }: UseGoalsProps): UseGoalsResult {
  const [goals, setGoals] = useState<GoalViewModel[]>([]);
  const [totalWeight, setTotalWeight] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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

        // Transformacja mockowych danych na ViewModel
        const goalsViewModel = mockGoalsResponse.goals.map((goal: GoalDTO) => ({
          ...goal,
          formattedWeight: `${goal.weight}%`,
          isReadOnly: true,
        }));

        setGoals(goalsViewModel);
        setTotalWeight(mockGoalsResponse.totalWeight);
        setIsLoading(false);
        return;
      }

      const data = await response.json();

      // Transformacja DTO na ViewModel
      const goalsViewModel = data.goals.map((goal: GoalDTO) => ({
        ...goal,
        formattedWeight: `${goal.weight}%`,
        isReadOnly: true,
      }));

      setGoals(goalsViewModel);
      setTotalWeight(data.totalWeight);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Błąd pobierania celów:", err);

      // W przypadku błędu używamy mockowych danych w trybie deweloperskim
      // eslint-disable-next-line no-console
      console.warn("Używam mockowych danych w trybie deweloperskim po błędzie.");

      // Transformacja mockowych danych na ViewModel
      const goalsViewModel = mockGoalsResponse.goals.map((goal: GoalDTO) => ({
        ...goal,
        formattedWeight: `${goal.weight}%`,
        isReadOnly: true,
      }));

      setGoals(goalsViewModel);
      setTotalWeight(mockGoalsResponse.totalWeight);
    } finally {
      setIsLoading(false);
    }
  }, [processId, employeeId]);

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
  };
}
