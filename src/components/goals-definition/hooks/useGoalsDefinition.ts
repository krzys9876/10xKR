import { useState, useEffect, useCallback } from "react";
import type { UseGoalsDefinitionProps, UseGoalsDefinitionResult, GoalsDefinitionApi, GoalViewModel } from "../types";
import type { AssessmentProcessStatus, GoalCategoryDTO } from "@/types";

// Tymczasowa implementacja API - do zastąpienia faktyczną integracją
const goalsDefinitionApi: GoalsDefinitionApi = {
  fetchGoals: async () => {
    // Symulacja opóźnienia sieci
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      goals: [],
      totalWeight: 0,
      processStatus: "in_definition" as AssessmentProcessStatus,
    };
  },

  fetchCategories: async () => {
    // Symulacja opóźnienia sieci
    await new Promise((resolve) => setTimeout(resolve, 300));

    return [] as GoalCategoryDTO[];
  },

  fetchEmployee: async () => {
    // Ta metoda nie jest już używana, ponieważ pracownik jest przekazywany przez propsy
    throw new Error("Metoda nie jest używana");
  },

  addGoal: async () => ({ id: "", title: "", description: "", weight: 0, category: { id: "", name: "" } }),
  updateGoal: async () => ({ id: "", title: "", description: "", weight: 0, category: { id: "", name: "" } }),
  deleteGoal: async () => {
    /* Implementacja będzie dodana później */
  },
  updateProcessStatus: async () => {
    /* Implementacja będzie dodana później */
  },
};

export function useGoalsDefinition({ processId }: UseGoalsDefinitionProps): UseGoalsDefinitionResult {
  const [goals, setGoals] = useState<GoalViewModel[]>([]);
  const [totalWeight, setTotalWeight] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [processStatus, setProcessStatus] = useState<AssessmentProcessStatus>("in_definition");
  const [isManager] = useState<boolean>(true); // Dla uproszczenia, zawsze true
  const [isSaving] = useState<boolean>(false);
  const [isDeletingGoal] = useState<Record<string, boolean>>({});
  const [isUpdatingStatus] = useState<boolean>(false);
  const [categories, setCategories] = useState<GoalCategoryDTO[]>([]);

  // Flaga wskazująca, czy suma wag celów wynosi 100%
  const isComplete = totalWeight === 100;

  // Pobranie danych przy montowaniu komponentu
  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Pobranie kategorii celów
      const categoriesData = await goalsDefinitionApi.fetchCategories();
      setCategories(categoriesData);

      // Pobranie celów
      const response = await goalsDefinitionApi.fetchGoals();

      // Ustawienie statusu procesu
      setProcessStatus(response.processStatus);

      // Transformacja DTO na ViewModel
      const goalsViewModel = response.goals.map((goal) => ({
        ...goal,
        formattedWeight: `${goal.weight}%`,
        isReadOnly: false,
      }));

      setGoals(goalsViewModel);
      setTotalWeight(response.totalWeight);
    } catch {
      setError("Nie udało się pobrać danych. Spróbuj ponownie.");
    } finally {
      setIsLoading(false);
    }
  }, [processId]);

  // Wywołanie funkcji pobierania danych przy montowaniu komponentu
  useEffect(() => {
    reload();
  }, [reload]);

  // Sztuby dla metod zarządzania celami, do implementacji później
  const addGoal = async () => {
    /* Implementacja będzie dodana później */
  };
  const updateGoal = async () => {
    /* Implementacja będzie dodana później */
  };
  const deleteGoal = async () => {
    /* Implementacja będzie dodana później */
  };
  const updateProcessStatus = async () => {
    /* Implementacja będzie dodana później */
  };

  return {
    goals,
    totalWeight,
    isLoading,
    error,
    reload,
    isComplete,
    processStatus,
    isManager,
    addGoal,
    updateGoal,
    deleteGoal,
    updateProcessStatus,
    isSaving,
    isDeletingGoal,
    isUpdatingStatus,
    categories,
    employee: null, // Ta wartość nie będzie już używana, ponieważ pracownik jest przekazywany przez propsy
  };
}
