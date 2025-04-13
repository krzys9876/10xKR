import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { GoalCardProps } from "./types";

export function GoalCard({ goal }: GoalCardProps) {
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
      </CardContent>
    </Card>
  );
}
