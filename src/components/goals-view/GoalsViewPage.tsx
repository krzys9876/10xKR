import { ProcessStepper } from "../dashboard/ProcessStepper";
import { GoalsList } from "./GoalsList";
import { useGoals } from "./hooks/useGoals";
import type { AssessmentProcessViewModel } from "@/types";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { ArrowLeft, User } from "lucide-react";

interface GoalsViewPageProps {
  processId: string;
  employeeId: string;
  process?: AssessmentProcessViewModel;
}

export function GoalsViewPage({ processId, employeeId, process }: GoalsViewPageProps) {
  const [localEmployeeId, setLocalEmployeeId] = useState(employeeId);
  const [isLoadingUser, setIsLoadingUser] = useState(!employeeId);

  // Jeśli employeeId jest pusty, spróbuj pobrać ID zalogowanego użytkownika
  useEffect(() => {
    if (!employeeId) {
      setIsLoadingUser(true);
      try {
        const userData = JSON.parse(localStorage.getItem("user") || "{}");
        if (userData.id) {
          setLocalEmployeeId(userData.id);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Błąd podczas pobierania danych użytkownika:", err);
      } finally {
        setIsLoadingUser(false);
      }
    } else {
      setIsLoadingUser(false);
    }
  }, [employeeId]);

  const {
    goals,
    totalWeight,
    isLoading,
    error,
    reload,
    canEditSelfAssessment,
    saveSelfAssessment,
    isSaving,
    employee,
  } = useGoals({
    processId,
    employeeId: localEmployeeId,
  });

  // Dla debugowania - wyświetl w konsoli czy samoocena jest dostępna
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log("canEditSelfAssessment:", canEditSelfAssessment);
    // eslint-disable-next-line no-console
    console.log("saveSelfAssessment available:", !!saveSelfAssessment);
    // eslint-disable-next-line no-console
    console.log("employee:", employee);
  }, [canEditSelfAssessment, saveSelfAssessment, employee]);

  // Pokazuj komunikat tylko, gdy nie jesteśmy w trakcie ładowania i nie mamy ID pracownika
  if (!localEmployeeId && !isLoadingUser) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-4">
          Nie można określić identyfikatora pracownika. Spróbuj zalogować się ponownie.
        </div>
        <a
          href="/dashboard"
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
        >
          Powrót do dashboardu
        </a>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-4">{error}</div>
        <button
          onClick={reload}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
        >
          Spróbuj ponownie
        </button>
      </div>
    );
  }

  const fullIsLoading = isLoading || isLoadingUser;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center mb-4">
        <Button variant="ghost" size="sm" className="flex items-center gap-1" asChild>
          <a href="/dashboard">
            <ArrowLeft className="h-4 w-4" /> Powrót do dashboardu
          </a>
        </Button>
      </div>

      {process && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-4">{process.name}</h1>
          <ProcessStepper currentStatus={process.status} />
        </div>
      )}

      {/* Informacje o pracowniku */}
      {employee && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-medium">{employee.name}</h2>
              {employee.email && <p className="text-sm text-gray-500 dark:text-gray-400">{employee.email}</p>}
            </div>
          </div>
        </div>
      )}

      <div className="mt-4">
        <GoalsList
          goals={goals}
          totalWeight={totalWeight}
          isLoading={fullIsLoading}
          canEditSelfAssessment={canEditSelfAssessment}
          saveSelfAssessment={saveSelfAssessment}
          isSaving={isSaving}
          employee={employee || undefined}
        />
      </div>
    </div>
  );
}
