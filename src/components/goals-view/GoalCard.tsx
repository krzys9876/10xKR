import React, { useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { GoalCardProps } from "./types";
import { SelfAssessmentForm } from "./SelfAssessmentForm";

export function GoalCard({ goal, canEditSelfAssessment, saveSelfAssessment, isSaving }: GoalCardProps) {
  // Log self-assessment data for debugging
  useEffect(() => {
    if (goal.selfAssessment) {
      console.log(`GoalCard ${goal.id} has self-assessment:`, goal.selfAssessment);
    } else {
      console.log(`GoalCard ${goal.id} has NO self-assessment data`);
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
      </CardContent>
    </Card>
  );
}
