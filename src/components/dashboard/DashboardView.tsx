import React, { useEffect, useState } from "react";
import { UserProfileHeader } from "./UserProfileHeader";
// import { ProcessList } from "./ProcessList"; // Removing since file doesn't exist
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
} from "../../types";
import { ProcessCard } from "./ProcessCard";

// Custom hook for managing dashboard state
interface UseDashboardResult {
  dashboardState: DashboardViewModel;
  fetchProcesses: (params?: AssessmentProcessFilterQueryParams) => Promise<void>;
  selectProcess: (process: AssessmentProcessViewModel) => void;
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
      //const response = await fetch(`/api/assessment-processes?/${queryParams}`);
      const response = await fetch(`/api/assessment-processes?status=in_definition&page=1&limit=100&active=true`);
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
    logout,
  };
};

export function DashboardView() {
  const { dashboardState, logout, selectProcess } = useDashboard();
  const { isLoading, error, processes, selectedProcess } = dashboardState;

  if (isLoading) {
    return <div className="p-4">Ładowanie danych...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <UserProfileHeader user={dashboardState.user} onLogout={logout} />

      {/* ProcessList component */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Procesy oceny</h2>
        {isLoading ? (
          <div className="bg-gray-50 p-4 rounded-md">Ładowanie procesów...</div>
        ) : processes.length === 0 ? (
          <div className="bg-gray-50 p-4 rounded-md text-gray-500">Brak dostępnych procesów oceny</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

      {/* Display Process Stepper when a process is selected */}
      {selectedProcess && (
        <div className="mt-8 border-t pt-4">
          <h2 className="text-xl font-semibold mb-2">Wybrany proces: {selectedProcess.name}</h2>
          <ProcessStepper currentStatus={selectedProcess.status} />
        </div>
      )}
    </div>
  );
}

export default DashboardView;
