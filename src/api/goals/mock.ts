import type { GoalDTO } from "@/types";

// Rozszerzony typ GoalDTO dla obsługi samooceny
interface GoalWithSelfAssessmentDTO extends GoalDTO {
  selfAssessment?: {
    rating: number;
    comment: string;
  };
}

// Mockowe cele do testowania
export const mockGoals: GoalWithSelfAssessmentDTO[] = [
  {
    id: "1",
    title: "[Przykład] Zwiększenie efektywności zespołu",
    description: "Wdrożenie nowych procesów pozwalających na skrócenie czasu realizacji zadań o 15%",
    weight: 40,
    category: {
      id: "cat1",
      name: "Efektywność",
    },
    selfAssessment: {
      rating: 120,
      comment: "Przykładowy komentarz samooceny",
    },
  },
  {
    id: "2",
    title: "[Przykład] Poprawa jakości kodu",
    description: "Zmniejszenie liczby błędów w produkcji o 30% poprzez wprowadzenie testów jednostkowych i code review",
    weight: 30,
    category: {
      id: "cat2",
      name: "Jakość",
    },
  },
  {
    id: "3",
    title: "[Przykład] Rozwój umiejętności",
    description:
      "Opanowanie nowych technologii (React, TypeScript) na poziomie pozwalającym na samodzielne tworzenie komponentów",
    weight: 30,
    category: {
      id: "cat3",
      name: "Rozwój",
    },
  },
];

export const mockGoalsResponse = {
  goals: mockGoals,
  totalWeight: 100,
  processStatus: "in_self_assessment",
};
