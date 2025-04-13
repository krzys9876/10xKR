import React from "react";
import type { EmployeeDTO } from "../../types";
import { cn } from "../../lib/utils";

interface EmployeeItemProps {
  employee: EmployeeDTO;
  onClick: (employee: EmployeeDTO) => void;
  isSelected: boolean;
}

export function EmployeeItem({ employee, onClick, isSelected }: EmployeeItemProps) {
  const handleClick = () => {
    onClick(employee);
  };

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <button
      className={cn(
        "flex items-center p-3 rounded-md cursor-pointer transition-colors w-full text-left",
        isSelected ? "bg-primary/10 border-l-4 border-primary" : "bg-card hover:bg-muted/50"
      )}
      onClick={handleClick}
    >
      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
        {getInitials(employee.name)}
      </div>
      <div className="ml-3">
        <div className="font-medium">{employee.name}</div>
        <div className="text-sm text-muted-foreground">{employee.email}</div>
      </div>
    </button>
  );
}

export default EmployeeItem;
