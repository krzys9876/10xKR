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
  selfAssessment?: {
    rating: number;
    comment: string;
    isSaving?: boolean;
    error?: string;
  };
}

// Model widoku dla listy celów
export interface GoalsListViewModel {
  goals: GoalViewModel[];
  totalWeight: number;
  formattedTotalWeight: string; // "XX%" - dla prezentacji
  isComplete: boolean; // czy suma wag = 100%
  processStatus?: string;
  canEditSelfAssessment?: boolean;
  employee?: {
    id: string;
    name: string;
    email: string;
  };
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
  processStatus?: string;
  canEditSelfAssessment?: boolean;
  saveSelfAssessment?: (goalId: string, rating: number, comment: string) => Promise<void>;
  isSaving?: Record<string, boolean>; // Stan zapisywania dla każdego celu
  employee?: {
    id: string;
    name: string;
    email: string;
  }; // Informacje o pracowniku
}

// Props dla komponentów
export interface GoalsListProps {
  goals: GoalViewModel[];
  totalWeight: number;
  isLoading: boolean;
  processStatus?: string;
  canEditSelfAssessment?: boolean;
  saveSelfAssessment?: (goalId: string, rating: number, comment: string) => Promise<void>;
  isSaving?: Record<string, boolean>;
  employee?: {
    id: string;
    name: string;
    email: string;
  }; // Informacje o pracowniku
}

export interface GoalCardProps {
  goal: GoalViewModel;
  processStatus?: string;
  canEditSelfAssessment?: boolean;
  saveSelfAssessment?: (goalId: string, rating: number, comment: string) => Promise<void>;
  isSaving?: boolean;
}

// Props dla formularza samooceny
export interface SelfAssessmentFormProps {
  goalId: string;
  initialRating?: number;
  initialComment?: string;
  onSave: (goalId: string, rating: number, comment: string) => Promise<void>;
  isSaving: boolean;
}

export interface SelfAssessmentDTO {
  rating: number;
  comment: string;
}
