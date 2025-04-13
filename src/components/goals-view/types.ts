// Model widoku dla pojedynczego celu
export interface GoalViewModel {
  id: string;
  title: string;
  description: string;
  weight: number;
  category: {
    id: string;
    name: string;
  };
  formattedWeight: string; // "XX%" - dla prezentacji
  isReadOnly: boolean; // zawsze true dla tego widoku
}

// Model widoku dla listy celów
export interface GoalsListViewModel {
  goals: GoalViewModel[];
  totalWeight: number;
  formattedTotalWeight: string; // "XX%" - dla prezentacji
  isComplete: boolean; // czy suma wag = 100%
}

// Hook props
export interface UseGoalsProps {
  processId: string;
  employeeId: string;
}

// Hook returns
export interface UseGoalsResult {
  goals: GoalViewModel[];
  totalWeight: number;
  isLoading: boolean;
  error: string | null;
  reload: () => void; // Nazwa zgodna z konwencją istniejących hooków
  isComplete: boolean;
}

// Props dla komponentów
export interface GoalsListProps {
  goals: GoalViewModel[];
  totalWeight: number;
  isLoading: boolean;
}

export interface GoalCardProps {
  goal: GoalViewModel;
}
