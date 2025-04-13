import React from "react";
import type { EmployeeDTO } from "../../types";
import { EmployeeItem } from "./EmployeeItem";
import { Input } from "../ui/input";
import { Pagination } from "../ui/pagination";

interface EmployeeListProps {
  employees: EmployeeDTO[];
  totalCount: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onEmployeeSelect: (employee: EmployeeDTO) => void;
  selectedEmployeeId?: string;
  isLoading: boolean;
}

export function EmployeeList({
  employees,
  totalCount,
  page,
  limit,
  onPageChange,
  onEmployeeSelect,
  selectedEmployeeId,
  isLoading,
}: EmployeeListProps) {
  const [searchTerm, setSearchTerm] = React.useState("");

  // Filter employees based on search term
  const filteredEmployees = React.useMemo(() => {
    if (!searchTerm.trim()) return employees;

    const normalizedSearchTerm = searchTerm.toLowerCase();
    return employees.filter(
      (employee) =>
        employee.name.toLowerCase().includes(normalizedSearchTerm) ||
        employee.email.toLowerCase().includes(normalizedSearchTerm)
    );
  }, [employees, searchTerm]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  if (isLoading) {
    return <div className="p-4 bg-gray-50 rounded-md">Ładowanie pracowników...</div>;
  }

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Pracownicy</h2>
        <Input
          type="search"
          placeholder="Szukaj pracownika..."
          className="max-w-xs"
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </div>

      {filteredEmployees.length === 0 ? (
        <div className="p-4 bg-gray-50 rounded-md text-gray-500">
          {searchTerm ? "Brak wyników dla podanego wyszukiwania" : "Brak dostępnych pracowników"}
        </div>
      ) : (
        <div className="space-y-2 mb-4">
          {filteredEmployees.map((employee) => (
            <EmployeeItem
              key={employee.id}
              employee={employee}
              onClick={onEmployeeSelect}
              isSelected={employee.id === selectedEmployeeId}
            />
          ))}
        </div>
      )}

      {totalCount > limit && (
        <div className="flex justify-center mt-4">
          <Pagination currentPage={page} totalPages={Math.ceil(totalCount / limit)} onPageChange={onPageChange} />
        </div>
      )}
    </div>
  );
}
