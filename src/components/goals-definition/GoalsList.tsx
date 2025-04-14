import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit } from "lucide-react";
import type { GoalsListProps } from "./types";

export function GoalsList({ goals, totalWeight, isLoading, onEditGoal, onDeleteGoal, isDeletingGoal }: GoalsListProps) {
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
        <p className="text-muted-foreground">Brak zdefiniowanych celów. Dodaj pierwszy cel powyżej.</p>
      </div>
    );
  }

  const handleDeleteGoal = async (goalId: string) => {
    if (confirm("Czy na pewno chcesz usunąć ten cel?")) {
      await onDeleteGoal(goalId);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center pb-2 border-b">
        <h2 className="text-xl font-semibold">Lista celów</h2>
        <div className="text-sm">
          Suma wag: <span className="font-medium">{totalWeight}%</span>
          {totalWeight !== 100 && (
            <span className={`ml-2 ${totalWeight < 100 ? "text-amber-500" : "text-destructive"}`}>
              {totalWeight < 100 ? "(niekompletna)" : "(przekroczono limit)"}
            </span>
          )}
          {totalWeight === 100 && <span className="ml-2 text-green-500">(kompletna)</span>}
        </div>
      </div>

      <div className="space-y-4">
        {goals.map((goal) => (
          <Card key={goal.id} className="relative shadow-sm hover:shadow transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <Badge variant="outline" className="text-xs">
                  {goal.category.name}
                </Badge>
                <span className="font-medium text-sm">{goal.formattedWeight}</span>
              </div>
            </CardHeader>
            <CardContent>
              <h3 className="text-lg font-medium mb-1">{goal.title || "Bez tytułu"}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{goal.description}</p>

              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditGoal(goal)}
                  className="flex items-center gap-1"
                >
                  <Edit className="h-4 w-4" />
                  Edytuj
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteGoal(goal.id)}
                  disabled={isDeletingGoal[goal.id]}
                  className="flex items-center gap-1"
                >
                  {isDeletingGoal[goal.id] ? (
                    "Usuwanie..."
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Usuń
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
