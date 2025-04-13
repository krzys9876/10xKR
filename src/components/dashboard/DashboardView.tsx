import React, { useEffect, useState } from "react";
import { UserProfileHeader } from "./UserProfileHeader";
import { ProcessStepper } from "./ProcessStepper";
import { STATUS_LABELS } from "../../types";
import type {
  AssessmentProcessDTO,
  AssessmentProcessFilterQueryParams,
  AssessmentProcessListResponse,
  AssessmentProcessViewModel,
  DashboardViewModel,
  UserDTO,
  UserViewModel,
  EmployeeDTO,
  AssessmentProcessStatus,
} from "../../types";
import { ProcessCard } from "./ProcessCard";
import { EmployeeList } from "./EmployeeList";

// Custom hook for managing dashboard state
interface UseDashboardResult {
  dashboardState: DashboardViewModel;
  fetchProcesses: (params?: AssessmentProcessFilterQueryParams) => Promise<void>;
  selectProcess: (process: AssessmentProcessViewModel) => void;
  selectEmployee: (employee: EmployeeDTO) => void;
  updateProcessStatus: (processId: string, newStatus: AssessmentProcessStatus) => Promise<void>;
  logout: () => void;
}

const useDashboard = (): UseDashboardResult => {
  const [dashboardState, setDashboardState] = useState<DashboardViewModel>({
    user: {
      id: "",
      email: "",
      name: "",
      managerId: null,
      isManager: false,
    },
    processes: [],
    employees: [],
    isManager: false,
    isLoading: true,
  });

  const fetchProcesses = async (params?: AssessmentProcessFilterQueryParams) => {
    try {
      setDashboardState((prev) => ({ ...prev, isLoading: true }));

      // Build query params
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.set("status", params.status);
      if (params?.active !== undefined) queryParams.set("active", params.active.toString());
      if (params?.page) queryParams.set("page", params.page.toString());
      if (params?.limit) queryParams.set("limit", params.limit.toString());

      // Fetch processes from API
      const response = await fetch(`/api/assessment-processes?/${queryParams}`);
      if (!response.ok) {
        throw new Error("Błąd pobierania procesów oceny");
      }

      const data: AssessmentProcessListResponse = await response.json();

      // Transform AssessmentProcessDTO to AssessmentProcessViewModel
      const processViewModels = data.processes.map((process: AssessmentProcessDTO) => {
        // Format dates
        const startDate = new Date(process.startDate);
        const endDate = new Date(process.endDate);

        const formattedStartDate = startDate.toLocaleDateString("pl-PL");
        const formattedEndDate = endDate.toLocaleDateString("pl-PL");

        return {
          ...process,
          statusLabel: STATUS_LABELS[process.status],
          formattedStartDate,
          formattedEndDate,
        };
      });

      setDashboardState((prev) => ({
        ...prev,
        processes: processViewModels,
        isLoading: false,
      }));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching processes:", error);
      setDashboardState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Nieoczekiwany błąd",
      }));
    }
  };

  // New function to update process status
  const updateProcessStatus = async (processId: string, newStatus: AssessmentProcessStatus) => {
    try {
      setDashboardState((prev) => ({ ...prev, isLoading: true }));

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

      // Fetch updated processes after status change
      await fetchProcesses();

      // Update selected process if it's the one that was modified
      setDashboardState((prev) => {
        if (prev.selectedProcess && prev.selectedProcess.id === processId) {
          const updatedProcess = prev.processes.find((p) => p.id === processId);
          return {
            ...prev,
            selectedProcess: updatedProcess,
            isLoading: false,
          };
        }
        return { ...prev, isLoading: false };
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error updating process status:", error);
      alert(error instanceof Error ? error.message : "Wystąpił nieznany błąd podczas aktualizacji statusu procesu");
      setDashboardState((prev) => ({
        ...prev,
        isLoading: false,
      }));
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get user ID from session or local storage
        const userData = JSON.parse(localStorage.getItem("user") || "{}");
        const userId = userData.id;

        if (!userId) {
          setDashboardState((prev) => ({
            ...prev,
            isLoading: false,
            error: "Brak danych użytkownika",
          }));
          return;
        }

        // Fetch user data from API
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) {
          throw new Error("Błąd pobierania danych użytkownika");
        }

        const userDto: UserDTO = await response.json();

        // Transform UserDTO to UserViewModel
        const userViewModel: UserViewModel = {
          ...userDto,
          isManager: Array.isArray(userDto.subordinates) && userDto.subordinates.length > 0,
        };

        // Extract employees (subordinates) for managers
        const employees: EmployeeDTO[] = Array.isArray(userDto.subordinates)
          ? userDto.subordinates.map((sub) => ({
              id: sub.id,
              name: sub.name,
              email: sub.email,
            }))
          : [];

        // Fetch manager data if managerId is available
        if (userDto.managerId) {
          try {
            const managerResponse = await fetch(`/api/users/${userDto.managerId}`);
            if (managerResponse.ok) {
              const managerData: UserDTO = await managerResponse.json();
              userViewModel.managerName = managerData.name;
            }
          } catch (managerError) {
            // eslint-disable-next-line no-console
            console.error("Error fetching manager data:", managerError);
            // Continue without manager name rather than failing the whole process
          }
        }

        setDashboardState((prev) => ({
          ...prev,
          user: userViewModel,
          employees,
          isManager: userViewModel.isManager,
          isLoading: false,
        }));

        // Fetch processes after user data is loaded
        await fetchProcesses();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error fetching user data:", error);
        setDashboardState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : "Nieoczekiwany błąd",
        }));
      }
    };

    fetchUserData();
  }, []);

  const selectProcess = (process: AssessmentProcessViewModel) => {
    setDashboardState((prev) => ({
      ...prev,
      selectedProcess: process,
    }));
  };

  const selectEmployee = (employee: EmployeeDTO) => {
    setDashboardState((prev) => ({
      ...prev,
      selectedEmployee: employee,
    }));
  };

  const logout = () => {
    // Clear user data from storage
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    // Redirect to login page
    window.location.href = "/login";
  };

  return {
    dashboardState,
    fetchProcesses,
    selectProcess,
    selectEmployee,
    updateProcessStatus,
    logout,
  };
};

export function DashboardView() {
  const { dashboardState, logout, selectProcess, selectEmployee, updateProcessStatus } = useDashboard();
  const { isLoading, error, processes, employees, selectedProcess, selectedEmployee, isManager } = dashboardState;

  const handleStatusChange = async (newStatus: AssessmentProcessStatus) => {
    if (!selectedProcess) return;
    await updateProcessStatus(selectedProcess.id, newStatus);
  };

  if (isLoading) {
    return <div className="p-4">Ładowanie danych...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <UserProfileHeader user={dashboardState.user} onLogout={logout} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* ProcessList component */}
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-semibold mb-4">Procesy oceny</h2>
          {isLoading ? (
            <div className="bg-gray-50 p-4 rounded-md">Ładowanie procesów...</div>
          ) : processes.length === 0 ? (
            <div className="bg-gray-50 p-4 rounded-md text-gray-500">Brak dostępnych procesów oceny</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {processes.map((process) => (
                <ProcessCard
                  key={process.id}
                  process={process}
                  onClick={selectProcess}
                  isSelected={selectedProcess?.id === process.id}
                />
              ))}
            </div>
          )}
        </div>

        {/* EmployeeList for managers */}
        {isManager && (
          <div className="lg:col-span-1">
            <EmployeeList
              employees={employees}
              totalCount={employees.length}
              page={1}
              limit={10}
              onPageChange={(newPage: number) => {
                // We're not implementing pagination in this step
                // eslint-disable-next-line no-console
                console.log("Page changed to:", newPage);
              }}
              onEmployeeSelect={selectEmployee}
              selectedEmployeeId={selectedEmployee?.id}
              isLoading={isLoading}
            />
          </div>
        )}
      </div>

      {/* Display Process Stepper when a process is selected */}
      {selectedProcess && (
        <div className="mt-8 border-t pt-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              Wybrany proces: {selectedProcess.name}
              {selectedEmployee && ` - Pracownik: ${selectedEmployee.name}`}
            </h2>
            <div className="flex gap-2">
              <a
                href={`/process/${selectedProcess.id}/goals-view${selectedEmployee ? `?employeeId=${selectedEmployee.id}` : ""}`}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors text-sm"
              >
                Przeglądaj cele
              </a>
            </div>
          </div>
          <ProcessStepper
            currentStatus={selectedProcess.status}
            isManager={isManager}
            onStatusChange={handleStatusChange}
            processId={selectedProcess.id}
          />
        </div>
      )}
    </div>
  );
}

export default DashboardView;
