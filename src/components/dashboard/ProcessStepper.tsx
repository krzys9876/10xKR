import React from "react";
import type { AssessmentProcessStatus } from "../../types";
import { ArrowLeft, ArrowRight } from "lucide-react";

// The sequence of statuses and allowed transitions
const STATUS_ORDER: AssessmentProcessStatus[] = [
  "in_definition",
  "in_self_assessment",
  "awaiting_manager_assessment",
  "completed",
];

// Define the allowed transitions to avoid invalid API calls
const ALLOWED_TRANSITIONS: Record<AssessmentProcessStatus, AssessmentProcessStatus[]> = {
  in_definition: ["in_self_assessment"],
  in_self_assessment: ["in_definition", "awaiting_manager_assessment"],
  awaiting_manager_assessment: ["in_self_assessment", "completed"],
  completed: ["awaiting_manager_assessment"],
};

interface ProcessStepperProps {
  currentStatus: AssessmentProcessStatus;
  isManager?: boolean;
  onStatusChange?: (newStatus: AssessmentProcessStatus) => void;
  processId?: string;
}

export function ProcessStepper({ currentStatus, isManager = false, onStatusChange, processId }: ProcessStepperProps) {
  const handleStatusChange = (direction: "forward" | "backward") => {
    if (!onStatusChange || !processId) return;

    const currentIndex = STATUS_ORDER.indexOf(currentStatus);
    const newIndex =
      direction === "forward" ? Math.min(currentIndex + 1, STATUS_ORDER.length - 1) : Math.max(currentIndex - 1, 0);

    if (currentIndex === newIndex) return;

    const newStatus = STATUS_ORDER[newIndex];

    // Check if the transition is allowed
    if (!ALLOWED_TRANSITIONS[currentStatus].includes(newStatus)) {
      alert(`Przejście ze statusu "${currentStatus}" do "${newStatus}" nie jest dozwolone.`);
      return;
    }

    onStatusChange(newStatus);
  };

  const currentIndex = STATUS_ORDER.indexOf(currentStatus);
  const canMoveForward = isManager && currentIndex < STATUS_ORDER.length - 1;
  const canMoveBackward = isManager && currentIndex > 0;

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

      {isManager && (
        <div className="flex justify-center mt-4 gap-4">
          {canMoveBackward && ALLOWED_TRANSITIONS[currentStatus].includes(STATUS_ORDER[currentIndex - 1]) && (
            <button
              onClick={() => handleStatusChange("backward")}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              <ArrowLeft size={16} />
              <span>Wstecz</span>
            </button>
          )}

          {canMoveForward && (
            <button
              onClick={() => handleStatusChange("forward")}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              <span>Dalej</span>
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default ProcessStepper;
