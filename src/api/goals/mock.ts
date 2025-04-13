import type { GoalDTO } from "@/types";

// Mockowe cele do testowania
export const mockGoals: GoalDTO[] = [
  {
    id: "1",
    title: "Zwiększenie efektywności zespołu",
    description: "Wdrożenie nowych procesów pozwalających na skrócenie czasu realizacji zadań o 15%",
    weight: 40,
    category: {
      id: "cat1",
      name: "Efektywność",
    },
  },
  {
    id: "2",
    title: "Poprawa jakości kodu",
    description: "Zmniejszenie liczby błędów w produkcji o 30% poprzez wprowadzenie testów jednostkowych i code review",
    weight: 30,
    category: {
      id: "cat2",
      name: "Jakość",
    },
  },
  {
    id: "3",
    title: "Rozwój umiejętności",
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
};
