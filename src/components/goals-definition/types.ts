import type {
  AssessmentProcessStatus,
  GoalCategoryDTO,
  GoalDTO,
  EmployeeDTO,
  CreateGoalCommand,
  UpdateGoalCommand,
  AssessmentProcessViewModel,
} from "@/types";

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
  isReadOnly: boolean; // w tym przypadku zawsze false, bo widok umożliwia edycję
}

// Props dla komponentów
export interface GoalsDefinitionPageProps {
  processId: string;
  employeeId: string;
  process?: AssessmentProcessViewModel;
  employee?: EmployeeDTO;
}

export interface EmployeeInfoProps {
  employee: {
    id: string;
    name: string;
    email: string;
  };
}

export interface GoalsListProps {
  goals: GoalViewModel[];
  totalWeight: number;
  isLoading: boolean;
  onEditGoal: (goal: GoalViewModel) => void;
  onDeleteGoal: (goalId: string) => Promise<void>;
  isDeletingGoal: Record<string, boolean>;
}

export interface GoalCardProps {
  goal: GoalViewModel;
  onEdit: (goal: GoalViewModel) => void;
  onDelete: (goalId: string) => Promise<void>;
  isDeleting: boolean;
}

export interface GoalFormProps {
  initialValues?: {
    id?: string;
    description: string;
    categoryId: string;
    weight: number;
  };
  categories: { id: string; name: string }[];
  totalWeight: number;
  currentGoalWeight: number; // W przypadku edycji, obecna waga celu
  onSave: (goal: { description: string; categoryId: string; weight: number; id?: string }) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

// Hook props i rezultaty
export interface UseGoalsDefinitionProps {
  processId: string;
}

export interface UseGoalsDefinitionResult {
  goals: GoalViewModel[];
  totalWeight: number;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
  isComplete: boolean; // czy suma wag = 100%
  processStatus: AssessmentProcessStatus;
  isManager: boolean;
  addGoal: (goal: { description: string; categoryId: string; weight: number }) => Promise<void>;
  updateGoal: (goalId: string, goal: { description: string; categoryId: string; weight: number }) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  updateProcessStatus: (status: AssessmentProcessStatus) => Promise<void>;
  isSaving: boolean;
  isDeletingGoal: Record<string, boolean>;
  isUpdatingStatus: boolean;
  categories: GoalCategoryDTO[];
  employee: EmployeeDTO | null;
}

// Interfejs dla API celów
export interface GoalsDefinitionApi {
  fetchGoals: (
    processId?: string,
    employeeId?: string
  ) => Promise<{
    goals: GoalDTO[];
    totalWeight: number;
    processStatus: AssessmentProcessStatus;
  }>;
  fetchCategories: () => Promise<GoalCategoryDTO[]>;
  fetchEmployee: (employeeId: string) => Promise<EmployeeDTO>;
  addGoal: (processId?: string, employeeId?: string, goal?: CreateGoalCommand) => Promise<GoalDTO>;
  updateGoal: (goalId?: string, goal?: UpdateGoalCommand) => Promise<GoalDTO>;
  deleteGoal: (goalId?: string) => Promise<void>;
  updateProcessStatus: (processId?: string, status?: AssessmentProcessStatus) => Promise<void>;
}
