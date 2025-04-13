import React from "react";
import type { AssessmentProcessViewModel } from "../../types";

interface ProcessCardProps {
  process: AssessmentProcessViewModel;
  onClick: (process: AssessmentProcessViewModel) => void;
  isSelected: boolean;
}

export function ProcessCard({ process, onClick, isSelected }: ProcessCardProps) {
  return (
    <div
      className={`border rounded-md p-4 transition-colors text-left w-full ${
        isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"
      }`}
    >
      <button className="w-full text-left" onClick={() => onClick(process)}>
        <h3 className="font-semibold text-lg">{process.name}</h3>
        <div className="mt-2 text-sm grid grid-cols-2 gap-2">
          <div className="text-gray-500">Status:</div>
          <div>{process.statusLabel}</div>

          <div className="text-gray-500">Data rozpoczęcia:</div>
          <div>{process.formattedStartDate}</div>

          <div className="text-gray-500">Data zakończenia:</div>
          <div>{process.formattedEndDate}</div>

          <div className="text-gray-500">Aktywny:</div>
          <div>{process.active ? "Tak" : "Nie"}</div>
        </div>
      </button>

      <div className="mt-4 pt-3 border-t flex justify-end">
        <a
          href={`/process/${process.id}/goals-view`}
          className="text-sm px-3 py-1.5 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
        >
          Przeglądaj cele
        </a>
      </div>
    </div>
  );
}

export default ProcessCard;
