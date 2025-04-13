import React from "react";
import { Button } from "../ui/button";
import type { UserViewModel } from "../../types";

// Type for the component props as defined in the implementation plan
interface UserProfileHeaderProps {
  user: UserViewModel;
  onLogout: () => void;
}

export const UserProfileHeader: React.FC<UserProfileHeaderProps> = ({ user, onLogout }) => {
  // Generate initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0]?.toUpperCase() || "")
      .join("")
      .slice(0, 2);
  };

  return (
    <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-lg shadow p-4 mb-6">
      <div className="flex items-center gap-4">
        {/* User avatar with initials */}
        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-medium">
          {getInitials(user.name)}
        </div>

        {/* User information */}
        <div>
          <h2 className="font-semibold text-lg">{user.name}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
          {user.isManager && (
            <span className="inline-block mt-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
              Kierownik
            </span>
          )}
        </div>
      </div>

      {/* Logout button */}
      <Button variant="outline" onClick={onLogout} className="text-sm">
        Wyloguj
      </Button>
    </div>
  );
};
