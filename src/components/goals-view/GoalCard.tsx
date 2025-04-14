import React, { useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { GoalCardProps } from "./types";
import { SelfAssessmentForm } from "./SelfAssessmentForm";
import { ManagerAssessmentForm } from "./ManagerAssessmentForm";

export function GoalCard({
  goal,
  canEditSelfAssessment,
  saveSelfAssessment,
  isSaving,
  canEditManagerAssessment,
  saveManagerAssessment,
  isSavingManagerAssessment,
}: GoalCardProps) {
  // Log self-assessment data for debugging
  useEffect(() => {
    if (goal.selfAssessment) {
      // eslint-disable-next-line no-console
      console.log(`GoalCard ${goal.id} has self-assessment:`, goal.selfAssessment);
    } else {
      // eslint-disable-next-line no-console
      console.log(`GoalCard ${goal.id} has NO self-assessment data`);
    }

    // Log manager-assessment data for debugging
    if (goal.managerAssessment) {
      // eslint-disable-next-line no-console
      console.log(`GoalCard ${goal.id} has manager-assessment:`, goal.managerAssessment);
    } else {
      // eslint-disable-next-line no-console
      console.log(`GoalCard ${goal.id} has NO manager-assessment data`);
    }
  }, [goal]);

  return (
    <Card className="mb-4 shadow-sm hover:shadow transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <Badge variant="outline" className="text-xs">
            {goal.category.name}
          </Badge>
          <span className="font-medium text-sm">{goal.formattedWeight}</span>
        </div>
      </CardHeader>
      <CardContent>
        <h3 className="text-lg font-medium mb-1">{goal.title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{goal.description}</p>

        {/* Wyświetlenie formularza samooceny tylko gdy canEditSelfAssessment jest true */}
        {canEditSelfAssessment && saveSelfAssessment && (
          <SelfAssessmentForm
            goalId={goal.id}
            initialRating={goal.selfAssessment?.rating}
            initialComment={goal.selfAssessment?.comment}
            onSave={saveSelfAssessment}
            isSaving={!!isSaving}
          />
        )}

        {/* Wyświetlenie wprowadzonej oceny (tylko do odczytu) gdy nie jesteśmy w trybie edycji */}
        {!canEditSelfAssessment && goal.selfAssessment && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Samoocena</h4>
                <p className="text-lg font-medium">{goal.selfAssessment.rating}/150</p>
              </div>

              {goal.selfAssessment.comment && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Komentarz</h4>
                  <p className="text-sm">{goal.selfAssessment.comment}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Formularz oceny kierownika - wyświetlany tylko gdy jest dostępna funkcja saveManagerAssessment */}
        {saveManagerAssessment && (
          <ManagerAssessmentForm
            goalId={goal.id}
            initialRating={goal.managerAssessment?.rating}
            initialComment={goal.managerAssessment?.comment}
            onSave={saveManagerAssessment}
            isSaving={!!isSavingManagerAssessment}
            canEdit={!!canEditManagerAssessment}
          />
        )}

        {/* Wyświetlenie oceny kierownika (tylko do odczytu) gdy nie jest dostępna funkcja saveManagerAssessment, ale jest dostępna ocena */}
        {!saveManagerAssessment && goal.managerAssessment && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Ocena kierownika</h4>
                <p className="text-lg font-medium">{goal.managerAssessment.rating}/150</p>
              </div>

              {goal.managerAssessment.comment && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Komentarz kierownika</h4>
                  <p className="text-sm">{goal.managerAssessment.comment}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
