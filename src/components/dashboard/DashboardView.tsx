import React, { useEffect, useState } from "react";
import { UserProfileHeader } from "./UserProfileHeader";
import type { DashboardViewModel, UserDTO, UserViewModel } from "../../types";

// Custom hook for managing dashboard state
interface UseDashboardResult {
  dashboardState: DashboardViewModel;
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

  const logout = () => {
    // Clear user data from storage
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    // Redirect to login page
    window.location.href = "/login";
  };

  return {
    dashboardState,
    logout,
  };
};

export function DashboardView() {
  const { dashboardState, logout } = useDashboard();
  const { isLoading, error } = dashboardState;

  if (isLoading) {
    return <div className="p-4">Ładowanie danych...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <UserProfileHeader user={dashboardState.user} onLogout={logout} />
      {/* Other dashboard components will be added here in future implementation */}
    </div>
  );
}

export default DashboardView;
