import { useState, useCallback, useEffect } from "react";
import type {
  AssessmentProcessStatus,
  GoalDTO,
  GoalCategoryDTO,
  EmployeeDTO,
  CreateGoalCommand,
  UpdateGoalCommand,
} from "@/types";
import type { UseGoalsDefinitionProps, UseGoalsDefinitionResult, GoalViewModel } from "../types";

// API client for goal definition operations
const goalsDefinitionApi = {
  // Fetch goals for an employee
  fetchGoals: async (processId: string, employeeId: string) => {
    const response = await fetch(`/api/assessment-processes/${processId}/employees/${employeeId}/goals`);

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Brak autoryzacji");
      } else if (response.status === 403) {
        throw new Error("Brak dostępu");
      } else if (response.status === 404) {
        throw new Error("Nie znaleziono zasobu");
      } else {
        throw new Error("Wystąpił błąd podczas pobierania celów");
      }
    }

    const data = await response.json();

    // Get process status from response or fetch it separately
    let processStatus: AssessmentProcessStatus = "in_definition";

    try {
      const processResponse = await fetch(`/api/assessment-processes/${processId}`);
      if (processResponse.ok) {
        const processData = await processResponse.json();
        processStatus = processData.status;
      }
    } catch {
      // Ignore errors, use default status
    }

    return {
      goals: data.goals as GoalDTO[],
      totalWeight: data.totalWeight as number,
      processStatus,
    };
  },

  // Fetch goal categories
  fetchCategories: async () => {
    const response = await fetch("/api/goal-categories");

    if (!response.ok) {
      throw new Error("Nie udało się pobrać kategorii celów");
    }

    const data = await response.json();
    return data.categories as GoalCategoryDTO[];
  },

  // Fetch employee data
  fetchEmployee: async (employeeId: string) => {
    const response = await fetch(`/api/users/${employeeId}`);

    if (!response.ok) {
      throw new Error("Nie udało się pobrać danych pracownika");
    }

    return (await response.json()) as EmployeeDTO;
  },

  // Add a new goal
  addGoal: async (processId: string, employeeId: string, goal: CreateGoalCommand) => {
    const response = await fetch(`/api/assessment-processes/${processId}/employees/${employeeId}/goals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(goal),
    });

    if (!response.ok) {
      if (response.status === 400) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Nieprawidłowe dane celu");
      } else {
        throw new Error("Nie udało się dodać celu");
      }
    }

    return (await response.json()) as GoalDTO;
  },

  // Update an existing goal
  updateGoal: async (goalId: string, goal: UpdateGoalCommand) => {
    const response = await fetch(`/api/goals/${goalId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(goal),
    });

    if (!response.ok) {
      if (response.status === 400) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Nieprawidłowe dane celu");
      } else {
        throw new Error("Nie udało się zaktualizować celu");
      }
    }

    return (await response.json()) as GoalDTO;
  },

  // Delete a goal
  deleteGoal: async (goalId: string) => {
    const response = await fetch(`/api/goals/${goalId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Nie udało się usunąć celu");
    }
  },

  // Update process status
  updateProcessStatus: async (processId: string, status: AssessmentProcessStatus) => {
    const response = await fetch(`/api/assessment-processes/${processId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      throw new Error("Nie udało się zmienić statusu procesu");
    }
  },
};

export function useGoalsDefinition({ processId, employeeId }: UseGoalsDefinitionProps): UseGoalsDefinitionResult {
  const [goals, setGoals] = useState<GoalViewModel[]>([]);
  const [totalWeight, setTotalWeight] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [processStatus, setProcessStatus] = useState<AssessmentProcessStatus>("in_definition");
  const [isManager, setIsManager] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeletingGoal, setIsDeletingGoal] = useState<Record<string, boolean>>({});
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [categories, setCategories] = useState<GoalCategoryDTO[]>([]);
  const [employee, setEmployee] = useState<EmployeeDTO | null>(null);

  // Flag indicating if the total weight is 100%
  const isComplete = totalWeight === 100;

  // Fetch data on component mount
  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if user is a manager (could be retrieved from user context in a real app)
      // For now, we'll assume the user is a manager to enable all features
      setIsManager(true);

      // Fetch goal categories
      const categoriesData = await goalsDefinitionApi.fetchCategories();
      setCategories(categoriesData);

      // Fetch employee information
      const employeeData = await goalsDefinitionApi.fetchEmployee(employeeId);
      setEmployee(employeeData);

      // Fetch goals
      const response = await goalsDefinitionApi.fetchGoals(processId, employeeId);

      // Set process status
      setProcessStatus(response.processStatus);

      // Transform DTOs to ViewModels
      const goalsViewModel = response.goals.map((goal) => ({
        id: goal.id,
        title: goal.title,
        description: goal.description,
        weight: goal.weight,
        category: goal.category,
        formattedWeight: `${goal.weight}%`,
        isReadOnly: false,
      }));

      setGoals(goalsViewModel);
      setTotalWeight(response.totalWeight);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się pobrać danych. Spróbuj ponownie.");
    } finally {
      setIsLoading(false);
    }
  }, [processId, employeeId]);

  // Call reload on component mount
  useEffect(() => {
    reload();
  }, [reload]);

  // Add a new goal
  const addGoal = useCallback(
    async (goal: CreateGoalCommand) => {
      setIsSaving(true);
      setError(null);

      try {
        const newGoal = await goalsDefinitionApi.addGoal(processId, employeeId, goal);

        // Update local state
        setGoals((prevGoals) => [
          ...prevGoals,
          {
            id: newGoal.id,
            title: newGoal.title,
            description: newGoal.description,
            weight: newGoal.weight,
            category: newGoal.category,
            formattedWeight: `${newGoal.weight}%`,
            isReadOnly: false,
          },
        ]);

        // Update total weight
        setTotalWeight((prevWeight) => prevWeight + goal.weight);
        return newGoal;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Nie udało się dodać celu. Spróbuj ponownie.");
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [processId, employeeId]
  );

  // Update an existing goal
  const updateGoal = useCallback(
    async (goalId: string, goal: UpdateGoalCommand) => {
      setIsSaving(true);
      setError(null);

      try {
        const updatedGoal = await goalsDefinitionApi.updateGoal(goalId, goal);

        // Calculate weight difference before and after update
        const oldGoal = goals.find((g) => g.id === goalId);
        const weightDifference = oldGoal ? goal.weight - oldGoal.weight : 0;

        // Update local state
        setGoals((prevGoals) =>
          prevGoals.map((g) =>
            g.id === goalId
              ? {
                  id: updatedGoal.id,
                  title: updatedGoal.title,
                  description: updatedGoal.description,
                  weight: updatedGoal.weight,
                  category: updatedGoal.category,
                  formattedWeight: `${updatedGoal.weight}%`,
                  isReadOnly: false,
                }
              : g
          )
        );

        // Update total weight
        setTotalWeight((prevWeight) => prevWeight + weightDifference);
        return updatedGoal;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Nie udało się zaktualizować celu. Spróbuj ponownie.");
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [goals]
  );

  // Delete a goal
  const deleteGoal = useCallback(
    async (goalId: string) => {
      setIsDeletingGoal((prev) => ({ ...prev, [goalId]: true }));
      setError(null);

      try {
        await goalsDefinitionApi.deleteGoal(goalId);

        // Calculate weight of deleted goal
        const deletedGoal = goals.find((g) => g.id === goalId);
        const deletedWeight = deletedGoal ? deletedGoal.weight : 0;

        // Update local state
        setGoals((prevGoals) => prevGoals.filter((g) => g.id !== goalId));

        // Update total weight
        setTotalWeight((prevWeight) => prevWeight - deletedWeight);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Nie udało się usunąć celu. Spróbuj ponownie.");
        throw err;
      } finally {
        setIsDeletingGoal((prev) => ({ ...prev, [goalId]: false }));
      }
    },
    [goals]
  );

  // Update process status
  const updateProcessStatus = useCallback(
    async (status: AssessmentProcessStatus) => {
      // Validate total weight before changing status
      if (status === "in_self_assessment" && totalWeight !== 100) {
        setError("Suma wag celów musi wynosić 100% przed przejściem do etapu samooceny.");
        return;
      }

      setIsUpdatingStatus(true);
      setError(null);

      try {
        await goalsDefinitionApi.updateProcessStatus(processId, status);

        // Update local state
        setProcessStatus(status);

        // Redirect to goals view page after status change
        window.location.href = `/process/${processId}/goals-view?employeeId=${employeeId}`;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Nie udało się zmienić statusu procesu. Spróbuj ponownie.");
      } finally {
        setIsUpdatingStatus(false);
      }
    },
    [processId, employeeId, totalWeight]
  );

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
    employee,
  };
}
