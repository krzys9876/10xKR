import React from "react";
import type { AssessmentProcessStatus } from "../../types";

interface ProcessStepperProps {
  currentStatus: AssessmentProcessStatus;
}

export function ProcessStepper({ currentStatus }: ProcessStepperProps) {
  return (
    <div className="bg-gray-50 p-4 rounded-md">
      <div className="flex justify-between items-center">
        <div
          className={`px-4 py-2 rounded-md ${
            currentStatus === "in_definition" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          W definiowaniu
        </div>
        <div className="h-0.5 flex-1 bg-gray-300 mx-2"></div>
        <div
          className={`px-4 py-2 rounded-md ${
            currentStatus === "in_self_assessment" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          W samoocenie
        </div>
        <div className="h-0.5 flex-1 bg-gray-300 mx-2"></div>
        <div
          className={`px-4 py-2 rounded-md ${
            currentStatus === "awaiting_manager_assessment" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          W ocenie kierownika
        </div>
        <div className="h-0.5 flex-1 bg-gray-300 mx-2"></div>
        <div
          className={`px-4 py-2 rounded-md ${currentStatus === "completed" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
        >
          Zakończony
        </div>
      </div>
    </div>
  );
}

export default ProcessStepper;
