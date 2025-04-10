import type { Database } from "./db/database.types";

type Tables = Database["public"]["Tables"];

// Database entity types (derived from database schema)
export type User = Tables["users"]["Row"];
export type AssessmentProcess = Tables["assessment_processes"]["Row"];
export type Goal = Tables["goals"]["Row"];
export type GoalCategory = Tables["goal_categories"]["Row"];
export type SelfAssessment = Tables["self_assessments"]["Row"];
export type ManagerAssessment = Tables["manager_assessments"]["Row"];

// Enums
export type AssessmentProcessStatus = Database["public"]["Enums"]["assessment_process_status"];

// Authentication DTOs
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  managerId: string | null;
}

// User DTOs
export interface UserDTO {
  id: string;
  email: string;
  name: string;
  managerId: string | null;
}

export interface EmployeeDTO {
  id: string;
  email: string;
  name: string;
}

export interface UserListResponse {
  users: UserDTO[];
  total: number;
  page: number;
  limit: number;
}

export interface EmployeeListResponse {
  employees: EmployeeDTO[];
  total: number;
  page: number;
  limit: number;
}

// Assessment Process DTOs
export interface AssessmentProcessDTO {
  id: string;
  name: string;
  status: AssessmentProcessStatus;
  active: boolean;
  startDate: string;
  endDate: string;
}

export interface AssessmentProcessListResponse {
  processes: AssessmentProcessDTO[];
  total: number;
  page: number;
  limit: number;
}

export interface StatusHistoryEntry {
  status: AssessmentProcessStatus;
  changedAt: string;
  changedBy: {
    id: string;
    name: string;
  };
}

export interface StatusHistoryResponse {
  history: StatusHistoryEntry[];
}

// Assessment Process Command Models
export interface UpdateAssessmentProcessStatusCommand {
  status: AssessmentProcessStatus;
}

export interface UpdateAssessmentProcessStatusResponse {
  id: string;
  status: AssessmentProcessStatus;
  previousStatus: AssessmentProcessStatus;
  changedAt: string;
}

// Goal Category DTOs
export interface GoalCategoryDTO {
  id: string;
  name: string;
}

export interface GoalCategoryListResponse {
  categories: GoalCategoryDTO[];
}

// Goal DTOs
export interface GoalDTO {
  id: string;
  description: string;
  weight: number;
  category: {
    id: string;
    name: string;
  };
}

export interface GoalDetailDTO extends GoalDTO {
  employee: {
    id: string;
    name: string;
  };
  process: {
    id: string;
    name: string;
  };
}

export interface GoalListResponse {
  goals: GoalDTO[];
  totalWeight: number;
}

// Goal Command Models
export interface CreateGoalCommand {
  description: string;
  weight: number;
  categoryId: string;
}

export interface UpdateGoalCommand {
  description: string;
  weight: number;
  categoryId: string;
}

export interface GoalResponse extends GoalDTO {
  validationErrors: string[];
}

// Predefined Goal DTOs
export interface PredefinedGoalDTO {
  id: string;
  description: string;
  categoryId: string;
  categoryName: string;
}

export interface PredefinedGoalListResponse {
  goals: PredefinedGoalDTO[];
  total: number;
  page: number;
  limit: number;
}

// Assessment DTOs
export interface AssessmentDTO {
  id: string;
  rating: number;
  comments: string | null;
  createdAt: string;
  updatedAt?: string;
}

// Assessment Command Models
export interface CreateAssessmentCommand {
  rating: number;
  comments: string | null;
}

export interface AssessmentResponse {
  id: string;
  rating: number;
  comments: string | null;
  createdAt: string;
}

// Pagination Query Parameters
export interface PaginationQueryParams {
  page?: number;
  limit?: number;
}

// Filter Query Parameters
export type UserFilterQueryParams = PaginationQueryParams;

export interface AssessmentProcessFilterQueryParams extends PaginationQueryParams {
  status?: AssessmentProcessStatus;
  active?: boolean;
}

export interface PredefinedGoalFilterQueryParams extends PaginationQueryParams {
  category?: string;
}
