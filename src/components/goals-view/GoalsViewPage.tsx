import { ProcessStepper } from "../dashboard/ProcessStepper";
import { GoalsList } from "./GoalsList";
import { useGoals } from "./hooks/useGoals";
import { useManagerAssessment } from "./hooks/useManagerAssessment";
import type { AssessmentProcessStatus, AssessmentProcessViewModel } from "@/types";
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
  const [isManager, setIsManager] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Jeśli employeeId jest pusty, spróbuj pobrać ID zalogowanego użytkownika
  useEffect(() => {
    if (!employeeId) {
      setIsLoadingUser(true);
      try {
        const userData = JSON.parse(localStorage.getItem("user") || "{}");
        if (userData.id) {
          setLocalEmployeeId(userData.id);
          // Sprawdź, czy użytkownik jest managerem
          setIsManager(userData.isManager || false);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Błąd podczas pobierania danych użytkownika:", err);
      } finally {
        setIsLoadingUser(false);
      }
    } else {
      // Jeśli mamy employeeId, sprawdź czy zalogowany użytkownik jest managerem
      try {
        const userData = JSON.parse(localStorage.getItem("user") || "{}");
        setIsManager(userData.isManager || false);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Błąd podczas sprawdzania statusu managera:", err);
      }
      setIsLoadingUser(false);
    }
  }, [employeeId]);

  // Hook do zarządzania celami i samoocenami
  const {
    goals,
    totalWeight,
    isLoading: isLoadingGoals,
    error: goalsError,
    reload: reloadGoals,
    canEditSelfAssessment,
    saveSelfAssessment,
    isSaving: isSavingSelfAssessment,
    employee,
    processStatus,
  } = useGoals({
    processId,
    employeeId: localEmployeeId,
    process,
  });

  // Hook do zarządzania ocenami kierownika
  const {
    assessments: managerAssessments,
    isLoading: isLoadingManagerAssessments,
    error: managerAssessmentsError,
    saveManagerAssessment,
    isSaving: isSavingManagerAssessment,
    canEditManagerAssessment,
    reload: reloadManagerAssessments,
  } = useManagerAssessment({
    processId,
    employeeId: localEmployeeId,
  });

  // Funkcja do przeładowania wszystkich danych
  const reload = () => {
    reloadGoals();
    reloadManagerAssessments();
  };

  // Handler dla zmiany statusu procesu
  const handleStatusChange = async (newStatus: AssessmentProcessStatus) => {
    if (!process || isUpdatingStatus) return;

    try {
      setIsUpdatingStatus(true);

      const response = await fetch(`/api/assessment-processes/${processId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          status: newStatus,
          processId: processId,
        }),
      });

      if (!response.ok) {
        // Try to extract detailed error message from response
        let errorMessage = "Błąd aktualizacji statusu procesu";
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = `${errorMessage}: ${errorData.message}`;
          } else if (errorData.error) {
            errorMessage = `${errorMessage}: ${errorData.error}`;
          }
          // eslint-disable-next-line no-console
          console.error("Status update error details:", errorData);
        } catch {
          // If we can't parse the response as JSON, use status text
          errorMessage = `${errorMessage} (${response.status}: ${response.statusText})`;
        }

        throw new Error(errorMessage);
      }

      const result = await response.json();
      // eslint-disable-next-line no-console
      console.log("Status updated successfully:", result);

      // Prosta aktualizacja UI bez pełnego odświeżenia
      window.location.reload();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error updating process status:", error);
      alert(error instanceof Error ? error.message : "Wystąpił nieznany błąd podczas aktualizacji statusu procesu");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Dla debugowania - wyświetl w konsoli informacje o stanie ocen
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log("canEditSelfAssessment:", canEditSelfAssessment);
    // eslint-disable-next-line no-console
    console.log("saveSelfAssessment available:", !!saveSelfAssessment);
    // eslint-disable-next-line no-console
    console.log("canEditManagerAssessment:", canEditManagerAssessment);
    // eslint-disable-next-line no-console
    console.log("saveManagerAssessment available:", !!saveManagerAssessment);
    // eslint-disable-next-line no-console
    console.log("employee:", employee);
    // eslint-disable-next-line no-console
    console.log("managerAssessments:", managerAssessments);
  }, [
    canEditSelfAssessment,
    saveSelfAssessment,
    canEditManagerAssessment,
    saveManagerAssessment,
    employee,
    managerAssessments,
  ]);

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
          Powrót do strony głównej
        </a>
      </div>
    );
  }

  // Połącz błędy z obu hooków
  const error = goalsError || managerAssessmentsError;

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

  // Łączymy stany ładowania
  const fullIsLoading = isLoadingGoals || isLoadingUser || isUpdatingStatus || isLoadingManagerAssessments;

  // Mapuj oceny kierownika na modele widoków celów
  const goalsWithManagerAssessments = goals.map((goal) => {
    const managerAssessment = managerAssessments[goal.id];
    if (managerAssessment) {
      return {
        ...goal,
        managerAssessment: {
          rating: managerAssessment.rating,
          comment: managerAssessment.comment || "",
        },
      };
    }
    return goal;
  });

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center mb-4">
        <Button variant="ghost" size="sm" className="flex items-center gap-1" asChild>
          <a href="/dashboard">
            <ArrowLeft className="h-4 w-4" /> Powrót do strony głównej
          </a>
        </Button>
      </div>

      {process && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-4">{process.name}</h1>
          <ProcessStepper
            currentStatus={process.status}
            isManager={isManager}
            onStatusChange={handleStatusChange}
            processId={process.id}
          />
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
          goals={goalsWithManagerAssessments}
          totalWeight={totalWeight}
          isLoading={fullIsLoading}
          processStatus={processStatus}
          canEditSelfAssessment={canEditSelfAssessment}
          saveSelfAssessment={saveSelfAssessment}
          isSaving={isSavingSelfAssessment}
          canEditManagerAssessment={canEditManagerAssessment}
          saveManagerAssessment={saveManagerAssessment}
          isSavingManagerAssessment={isSavingManagerAssessment}
        />
      </div>
    </div>
  );
}
