import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useGoalsDefinition } from "@/components/goals-definition/hooks/useGoalsDefinition";
import type { GoalDTO, GoalCategoryDTO, EmployeeDTO, CreateGoalCommand } from "@/types";

// Mockujemy globalny fetch zamiast API, ponieważ hook definiuje swoje API wewnętrznie
const originalFetch = global.fetch;

// Mock API client - dla przechowania wyników i prostszej asercji
const mockGoalsDefinitionApi = {
  fetchGoals: vi.fn(),
  fetchCategories: vi.fn(),
  fetchEmployee: vi.fn(),
  addGoal: vi.fn(),
  updateGoal: vi.fn(),
  deleteGoal: vi.fn(),
  updateProcessStatus: vi.fn(),
};

describe("useGoalsDefinition", () => {
  const processId = "process-123";
  const employeeId = "employee-456";

  // Sample data for testing
  const mockEmployee: EmployeeDTO = {
    id: employeeId,
    name: "Jan Kowalski",
    email: "jan.kowalski@example.com",
  };

  const mockCategories: GoalCategoryDTO[] = [
    { id: "cat-1", name: "Techniczne" },
    { id: "cat-2", name: "Biznesowe" },
    { id: "cat-3", name: "Miękkie" },
  ];

  // Rozszerzamy typ GoalDTO dla potrzeb testów
  type MockGoalDTO = GoalDTO & {
    employeeId?: string;
    processId?: string;
  };

  const mockGoals: MockGoalDTO[] = [
    {
      id: "goal-1",
      title: "Cel 1",
      description: "Opis celu 1",
      weight: 40,
      category: mockCategories[0],
      employeeId: "employee-456",
      processId: "process-123",
    },
    {
      id: "goal-2",
      title: "Cel 2",
      description: "Opis celu 2",
      weight: 30,
      category: mockCategories[1],
      employeeId: "employee-456",
      processId: "process-123",
    },
  ];

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Symulujemy wywołania fetch zwracając odpowiednie dane
    global.fetch = vi.fn().mockImplementation((url: RequestInfo | URL, options?: RequestInit) => {
      if (typeof url !== "string") {
        return Promise.resolve(
          new Response(JSON.stringify({ error: "Unsupported URL type" }), {
            status: 400,
          })
        );
      }

      // Pobieranie celów
      if (url.includes(`/api/assessment-processes/${processId}/employees/${employeeId}/goals`)) {
        mockGoalsDefinitionApi.fetchGoals(processId, employeeId);

        // Jeśli jest to POST - dodawanie nowego celu
        if (options?.method === "POST") {
          const goal = JSON.parse(options.body as string);
          mockGoalsDefinitionApi.addGoal(processId, employeeId, goal);
          return Promise.resolve(
            new Response(
              JSON.stringify({
                ...goal,
                id: "new-goal-id",
                category: mockCategories.find((c) => c.id === goal.categoryId) || mockCategories[0],
              }),
              {
                status: 200,
                headers: { "Content-Type": "application/json" },
              }
            )
          );
        }

        // Jeśli GET - pobieranie listy celów
        return Promise.resolve(
          new Response(
            JSON.stringify({
              goals: mockGoals,
              totalWeight: 70,
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          )
        );
      }

      // Pobieranie statusu procesu
      if (url.includes(`/api/assessment-processes/${processId}`)) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              status: "in_definition",
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          )
        );
      }

      // Pobieranie kategorii celów
      if (url.includes("/api/goal-categories")) {
        mockGoalsDefinitionApi.fetchCategories();
        return Promise.resolve(
          new Response(
            JSON.stringify({
              categories: mockCategories,
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          )
        );
      }

      // Pobieranie danych pracownika
      if (url.includes(`/api/users/${employeeId}`)) {
        mockGoalsDefinitionApi.fetchEmployee(employeeId);
        return Promise.resolve(
          new Response(JSON.stringify(mockEmployee), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        );
      }

      // Domyślny przypadek
      return Promise.resolve(
        new Response(JSON.stringify({ error: "Not found" }), {
          status: 404,
        })
      );
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
    // Przywróć oryginalną implementację fetch
    global.fetch = originalFetch;
  });

  // TESTS START HERE

  // Test 1: Inicjalizacja hooka - to jest jedyny test, który chcemy uruchomić
  it("powinien załadować cele, kategorie i dane pracownika przy inicjalizacji", async () => {
    const { result } = renderHook(() => useGoalsDefinition({ processId, employeeId }));

    // Początkowo powinien pokazywać loading
    expect(result.current.isLoading).toBe(true);

    // Poczekaj na zakończenie ładowania
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Sprawdź czy dane zostały załadowane
    expect(mockGoalsDefinitionApi.fetchGoals).toHaveBeenCalledWith(processId, employeeId);
    expect(mockGoalsDefinitionApi.fetchCategories).toHaveBeenCalled();
    expect(mockGoalsDefinitionApi.fetchEmployee).toHaveBeenCalledWith(employeeId);

    // Sprawdź stan hooka
    expect(result.current.goals.length).toBe(2);
    expect(result.current.totalWeight).toBe(70);
    expect(result.current.categories).toEqual(mockCategories);
    expect(result.current.employee).toEqual(mockEmployee);
    expect(result.current.isComplete).toBe(false); // 70% != 100%
    expect(result.current.processStatus).toBe("in_definition");
  });

  // Test 2: Dodawanie celu - przypadek normalny
  it("powinien dodać nowy cel do listy i zaktualizować sumę wag", async () => {
    const { result } = renderHook(() => useGoalsDefinition({ processId, employeeId }));

    // Poczekaj na zakończenie ładowania
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Nowy cel do dodania
    const newGoal: CreateGoalCommand = {
      title: "Nowy cel",
      description: "Opis nowego celu",
      categoryId: "cat-3",
      weight: 30,
    };

    // Mock dla dodawania celu
    const mockNewGoalResult = {
      id: "new-goal-id",
      title: newGoal.title,
      description: newGoal.description,
      weight: newGoal.weight,
      category: mockCategories.find((c) => c.id === newGoal.categoryId) || mockCategories[0],
    };

    // Zmień implementację mocka tylko dla tego testu
    global.fetch = vi.fn().mockImplementation((url: RequestInfo | URL, options?: RequestInit) => {
      if (typeof url !== "string") {
        return Promise.resolve(new Response(JSON.stringify({ error: "Unsupported URL type" }), { status: 400 }));
      }

      if (url.includes(`/api/assessment-processes/${processId}/employees/${employeeId}/goals`)) {
        // Obsługa dodawania nowego celu
        if (options?.method === "POST") {
          const goal = JSON.parse(options.body as string);
          mockGoalsDefinitionApi.addGoal(processId, employeeId, goal);
          return Promise.resolve(
            new Response(JSON.stringify(mockNewGoalResult), {
              status: 201,
              headers: { "Content-Type": "application/json" },
            })
          );
        }

        // Pobieranie listy celów
        mockGoalsDefinitionApi.fetchGoals(processId, employeeId);
        return Promise.resolve(
          new Response(
            JSON.stringify({
              goals: mockGoals,
              totalWeight: 70,
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          )
        );
      }

      // Pozostałe endpointy jak w podstawowym mocku
      if (url.includes(`/api/assessment-processes/${processId}`)) {
        return Promise.resolve(
          new Response(JSON.stringify({ status: "in_definition" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        );
      } else if (url.includes("/api/goal-categories")) {
        mockGoalsDefinitionApi.fetchCategories();
        return Promise.resolve(
          new Response(JSON.stringify({ categories: mockCategories }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        );
      } else if (url.includes(`/api/users/${employeeId}`)) {
        mockGoalsDefinitionApi.fetchEmployee(employeeId);
        return Promise.resolve(
          new Response(JSON.stringify(mockEmployee), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        );
      }

      return Promise.resolve(new Response(JSON.stringify({ error: "Not found" }), { status: 404 }));
    });

    // Dodaj cel
    await act(async () => {
      await result.current.addGoal(newGoal);
    });

    // Sprawdź czy cel został dodany
    expect(mockGoalsDefinitionApi.addGoal).toHaveBeenCalledWith(processId, employeeId, newGoal);

    // Sprawdź aktualizację stanu wewnętrznego
    expect(result.current.goals.length).toBe(3); // 2 początkowe cele + 1 nowy

    // Sprawdź nowy cel
    const addedGoal = result.current.goals.find((g) => g.id === "new-goal-id");
    expect(addedGoal).toBeDefined();
    expect(addedGoal?.title).toBe(newGoal.title);
    expect(addedGoal?.weight).toBe(newGoal.weight);
    expect(addedGoal?.category).toEqual(mockCategories[2]); // kategoria "cat-3" (Miękkie)

    // Sprawdź aktualizację sumy wag
    expect(result.current.totalWeight).toBe(100); // 70% + 30% = 100%
    expect(result.current.isComplete).toBe(true); // 100% = 100%
  });

  // Test 3: Dodawanie celu przekraczającego 100%
  it("powinien poprawnie dodać cel przekraczający 100% wagi (bez walidacji w hooku)", async () => {
    const { result } = renderHook(() => useGoalsDefinition({ processId, employeeId }));

    // Poczekaj na zakończenie ładowania
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Nowy cel do dodania przekraczający 100%
    const newGoal: CreateGoalCommand = {
      title: "Cel przekraczający",
      description: "Opis celu przekraczającego limit wag",
      categoryId: "cat-2",
      weight: 40,
    };

    // Mock dla dodawania celu przekraczającego limit
    const mockNewGoalResult = {
      id: "excess-goal-id",
      title: newGoal.title,
      description: newGoal.description,
      weight: newGoal.weight,
      category: mockCategories.find((c) => c.id === newGoal.categoryId) || mockCategories[0],
    };

    // Zmień implementację mocka tylko dla tego testu
    global.fetch = vi.fn().mockImplementation((url: RequestInfo | URL, options?: RequestInit) => {
      if (typeof url !== "string") {
        return Promise.resolve(new Response(JSON.stringify({ error: "Unsupported URL type" }), { status: 400 }));
      }

      if (url.includes(`/api/assessment-processes/${processId}/employees/${employeeId}/goals`)) {
        // Obsługa dodawania nowego celu
        if (options?.method === "POST") {
          const goal = JSON.parse(options.body as string);
          mockGoalsDefinitionApi.addGoal(processId, employeeId, goal);
          return Promise.resolve(
            new Response(JSON.stringify(mockNewGoalResult), {
              status: 201,
              headers: { "Content-Type": "application/json" },
            })
          );
        }

        // Pobieranie listy celów
        mockGoalsDefinitionApi.fetchGoals(processId, employeeId);
        return Promise.resolve(
          new Response(
            JSON.stringify({
              goals: mockGoals,
              totalWeight: 70,
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          )
        );
      }

      // Pozostałe endpointy jak w podstawowym mocku
      if (url.includes(`/api/assessment-processes/${processId}`)) {
        return Promise.resolve(
          new Response(JSON.stringify({ status: "in_definition" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        );
      } else if (url.includes("/api/goal-categories")) {
        mockGoalsDefinitionApi.fetchCategories();
        return Promise.resolve(
          new Response(JSON.stringify({ categories: mockCategories }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        );
      } else if (url.includes(`/api/users/${employeeId}`)) {
        mockGoalsDefinitionApi.fetchEmployee(employeeId);
        return Promise.resolve(
          new Response(JSON.stringify(mockEmployee), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        );
      }

      return Promise.resolve(new Response(JSON.stringify({ error: "Not found" }), { status: 404 }));
    });

    // Dodaj cel przekraczający limit 100%
    await act(async () => {
      await result.current.addGoal(newGoal);
    });

    // Sprawdź czy cel został dodany
    expect(mockGoalsDefinitionApi.addGoal).toHaveBeenCalledWith(processId, employeeId, newGoal);

    // Sprawdź aktualizację stanu wewnętrznego
    expect(result.current.goals.length).toBe(3); // 2 początkowe cele + 1 nowy

    // Sprawdź nowy cel
    const addedGoal = result.current.goals.find((g) => g.id === "excess-goal-id");
    expect(addedGoal).toBeDefined();
    expect(addedGoal?.title).toBe(newGoal.title);
    expect(addedGoal?.weight).toBe(newGoal.weight);
    expect(addedGoal?.category).toEqual(mockCategories[1]); // kategoria "cat-2" (Biznesowe)

    // Sprawdź aktualizację sumy wag - powinna przekroczyć 100%
    expect(result.current.totalWeight).toBe(110); // 70% + 40% = 110%

    // Ważne: sprawdź, że isComplete jest false mimo dodania celu
    // Hook nie powinien blokować dodawania celów przekraczających 100%,
    // ale powinien informować, że suma nie jest kompletna (do walidacji w UI)
    expect(result.current.isComplete).toBe(false); // 110% != 100%

    // Sprawdź brak błędów - hook nie powinien rzucać błędów przy przekroczeniu 100%
    expect(result.current.error).toBeNull();
  });
});
