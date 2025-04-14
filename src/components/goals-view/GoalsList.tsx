import React from "react";
import type { GoalsListProps } from "./types";
import { GoalCard } from "./GoalCard";

export function GoalsList({
  goals,
  totalWeight,
  isLoading,
  processStatus,
  canEditSelfAssessment,
  saveSelfAssessment,
  isSaving,
  canEditManagerAssessment,
  saveManagerAssessment,
  isSavingManagerAssessment,
}: GoalsListProps) {
  if (isLoading) {
    return (
      <div className="py-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-md"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!goals.length) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">Brak celów do wyświetlenia.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center pb-2 border-b">
        <h2 className="text-xl font-semibold">Cele</h2>
        <div className="text-sm">
          Suma wag: <span className="font-medium">{totalWeight}%</span>
          {totalWeight !== 100 && <span className="ml-2 text-destructive">(powinna wynosić 100%)</span>}
        </div>
      </div>

      {canEditSelfAssessment && (
        <div className="p-4 bg-blue-50 text-blue-700 rounded-md mb-4">
          <p>Proces jest obecnie w etapie samooceny. Możesz wprowadzić samoocenę dla każdego celu.</p>
        </div>
      )}

      {canEditManagerAssessment && (
        <div className="p-4 bg-amber-50 text-amber-700 rounded-md mb-4">
          <p>Proces jest obecnie w etapie oceny kierownika. Możesz wprowadzić ocenę kierownika dla każdego celu.</p>
        </div>
      )}

      <div className="space-y-4">
        {goals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            processStatus={processStatus}
            canEditSelfAssessment={canEditSelfAssessment}
            saveSelfAssessment={saveSelfAssessment}
            isSaving={isSaving?.[goal.id]}
            canEditManagerAssessment={canEditManagerAssessment}
            saveManagerAssessment={saveManagerAssessment}
            isSavingManagerAssessment={isSavingManagerAssessment?.[goal.id]}
          />
        ))}
      </div>
    </div>
  );
}
