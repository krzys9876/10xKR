import React from "react";
import { useGoalsDefinition } from "./hooks/useGoalsDefinition";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { GoalsDefinitionPageProps, GoalViewModel } from "./types";
import { GoalsList } from "@/components/goals-definition/GoalsList";
import { GoalForm } from "@/components/goals-definition/GoalForm";

export function GoalsDefinitionPage({ processId, employeeId, process, employee }: GoalsDefinitionPageProps) {
  // Process prop is used for passing to child components that may need it
  // or for displaying process-specific information if needed in the future
  console.log("Process data:", process?.name);

  const {
    goals,
    totalWeight,
    isLoading,
    error,
    categories,
    isComplete,
    isManager,
    addGoal,
    updateGoal,
    deleteGoal,
    updateProcessStatus,
    isSaving,
    isDeletingGoal,
    isUpdatingStatus,
  } = useGoalsDefinition({ processId, employeeId });

  const [editingGoal, setEditingGoal] = React.useState<{
    id?: string;
    title: string;
    description: string;
    categoryId: string;
    weight: number;
  } | null>(null);

  // Handler for editing a goal
  const handleEditGoal = (goal: GoalViewModel) => {
    setEditingGoal({
      id: goal.id,
      title: goal.title,
      description: goal.description,
      categoryId: goal.category.id,
      weight: goal.weight,
    });
  };

  // Handler for canceling goal edit
  const handleCancelEdit = () => {
    setEditingGoal(null);
  };

  // Handler for saving a goal (new or edited)
  const handleSaveGoal = async (goalData: {
    description: string;
    categoryId: string;
    weight: number;
    id?: string;
    title: string;
  }) => {
    try {
      if (goalData.id) {
        await updateGoal(goalData.id, {
          title: goalData.title,
          description: goalData.description,
          categoryId: goalData.categoryId,
          weight: goalData.weight,
        });
      } else {
        await addGoal({
          title: goalData.title,
          description: goalData.description,
          categoryId: goalData.categoryId,
          weight: goalData.weight,
        });
      }
      setEditingGoal(null);
    } catch (err) {
      console.error("Failed to save goal:", err);
    }
  };

  // Handler for changing process status to self-assessment
  const handleStartSelfAssessment = async () => {
    if (isComplete) {
      await updateProcessStatus("in_self_assessment");
    }
  };

  return (
    <div className="space-y-6">
      {/* Employee info section */}
      {employee && (
        <div className="p-4 border rounded-md bg-card">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-lg">{employee.name.charAt(0)}</span>
            </div>
            <div>
              <h2 className="text-lg font-medium">{employee.name}</h2>
              <p className="text-sm text-muted-foreground">{employee.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Goal form */}
      <div className="border p-4 rounded-md bg-card">
        <h2 className="text-lg font-medium mb-4">{editingGoal?.id ? "Edytuj cel" : "Dodaj nowy cel"}</h2>
        <GoalForm
          initialValues={
            editingGoal || {
              title: "",
              description: "",
              categoryId: categories?.[0]?.id || "",
              weight: 0,
            }
          }
          categories={categories || []}
          totalWeight={totalWeight}
          currentGoalWeight={editingGoal?.id ? editingGoal.weight : 0}
          onSave={handleSaveGoal}
          onCancel={handleCancelEdit}
          isSaving={isSaving}
        />
      </div>

      {/* Goals list */}
      <GoalsList
        goals={goals.map((goal) => ({
          ...goal,
          isReadOnly: false,
        }))}
        totalWeight={totalWeight}
        isLoading={isLoading}
        onEditGoal={handleEditGoal}
        onDeleteGoal={deleteGoal}
        isDeletingGoal={isDeletingGoal}
      />

      {/* Action button to move to next step */}
      {isManager && (
        <div className="mt-6 flex justify-end">
          <Button onClick={handleStartSelfAssessment} disabled={!isComplete || isUpdatingStatus} className="ml-auto">
            {isUpdatingStatus ? "Zmiana statusu..." : "Przejdź do samooceny"}
          </Button>
        </div>
      )}
    </div>
  );
}
