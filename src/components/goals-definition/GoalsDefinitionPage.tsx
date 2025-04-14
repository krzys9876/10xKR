import React from "react";
import type { GoalsDefinitionPageProps } from "./types";
import { useGoalsDefinition } from "./hooks/useGoalsDefinition";
import { EmployeeInfo } from "./EmployeeInfo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";

export function GoalsDefinitionPage({ processId, process, employee }: GoalsDefinitionPageProps) {
  const { goals, totalWeight, isLoading, error } = useGoalsDefinition({
    processId,
  });

  // Wyświetlanie stanu ładowania
  if (isLoading) {
    return (
      <div className="w-full flex justify-center my-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Wyświetlanie błędów
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Błąd</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>{process?.name || "Proces oceny"}</CardTitle>
          <CardDescription>
            Status: {process?.statusLabel || "W definiowaniu"} | Suma wag: {totalWeight}%
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm mb-4">
            W tym widoku możesz zdefiniować cele dla pracownika. Suma wag wszystkich celów powinna wynosić 100%.
            Aktualnie suma wynosi: <strong>{totalWeight}%</strong>
          </div>
        </CardContent>
      </Card>

      {employee && <EmployeeInfo employee={employee} />}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Lista celów pracownika</CardTitle>
          <CardDescription>Cele zostaną wyświetlone po implementacji listy celów</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {goals.length === 0
              ? "Brak zdefiniowanych celów. Dodaj pierwszy cel poniżej."
              : `Liczba zdefiniowanych celów: ${goals.length}`}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
