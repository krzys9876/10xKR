import React from "react";
import type { EmployeeInfoProps } from "./types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function EmployeeInfo({ employee }: EmployeeInfoProps) {
  if (!employee) {
    return null;
  }

  // Pobranie inicjałów z imienia i nazwiska
  const initials = employee.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Informacje o pracowniku</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-4">
          <Avatar>
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{employee.name}</p>
            <p className="text-sm text-muted-foreground">{employee.email}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
