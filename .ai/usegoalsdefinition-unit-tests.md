# Testy jednostkowe dla hooka `useGoalsDefinition`

Poniżej znajduje się zestaw testów jednostkowych dla hooka `useGoalsDefinition`, który jest odpowiedzialny za zarządzanie celami w procesie oceny. Testy zostały napisane zgodnie z wytycznymi Vitest i React Testing Library, skupiając się na kluczowych regułach biznesowych oraz warunkach brzegowych.

## Struktura pliku testowego

```typescript
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useGoalsDefinition } from '@/components/goals-definition/hooks/useGoalsDefinition';
import type { 
  GoalDTO, 
  GoalCategoryDTO, 
  CreateGoalCommand, 
  UpdateGoalCommand, 
  EmployeeDTO,
  AssessmentProcessStatus 
} from '@/types';

// Mock API client
vi.mock('@/components/goals-definition/hooks/useGoalsDefinition', async () => {
  const actual = await vi.importActual('@/components/goals-definition/hooks/useGoalsDefinition');
  
  // Zwracamy tylko samego hooka - API zostanie zmockowane osobno
  return {
    ...actual,
    // Nie mockujemy bezpośrednio hooka, tylko API wewnątrz niego
  };
});

// Mockowanie goalsDefinitionApi
const mockGoalsDefinitionApi = {
  fetchGoals: vi.fn(),
  fetchCategories: vi.fn(),
  fetchEmployee: vi.fn(),
  addGoal: vi.fn(),
  updateGoal: vi.fn(),
  deleteGoal: vi.fn(),
  updateProcessStatus: vi.fn(),
};

// Ustawienie mocka API przed importem hooka
vi.mock('@/api/goalsApi', () => ({
  default: mockGoalsDefinitionApi,
}));

describe('useGoalsDefinition', () => {
  const processId = 'process-123';
  const employeeId = 'employee-456';
  
  // Sample data for testing
  const mockEmployee: EmployeeDTO = {
    id: employeeId,
    name: 'Jan Kowalski',
    email: 'jan.kowalski@example.com'
  };
  
  const mockCategories: GoalCategoryDTO[] = [
    { id: 'cat-1', name: 'Techniczne' },
    { id: 'cat-2', name: 'Biznesowe' },
    { id: 'cat-3', name: 'Miękkie' }
  ];
  
  const mockGoals: GoalDTO[] = [
    { 
      id: 'goal-1', 
      title: 'Cel 1',
      description: 'Opis celu 1', 
      weight: 40, 
      category: mockCategories[0],
      employeeId: 'employee-456',
      processId: 'process-123'
    },
    { 
      id: 'goal-2', 
      title: 'Cel 2',
      description: 'Opis celu 2', 
      weight: 30, 
      category: mockCategories[1],
      employeeId: 'employee-456',
      processId: 'process-123'
    }
  ];
  
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    
    // Setup default mock responses
    mockGoalsDefinitionApi.fetchGoals.mockResolvedValue({
      goals: mockGoals,
      totalWeight: 70,
      processStatus: 'in_definition' as AssessmentProcessStatus
    });
    
    mockGoalsDefinitionApi.fetchCategories.mockResolvedValue(mockCategories);
    mockGoalsDefinitionApi.fetchEmployee.mockResolvedValue(mockEmployee);
    mockGoalsDefinitionApi.addGoal.mockImplementation((_, __, goal) => 
      Promise.resolve({
        ...goal,
        id: 'new-goal-id',
        category: mockCategories.find(c => c.id === goal.categoryId) || mockCategories[0]
      })
    );
    mockGoalsDefinitionApi.updateGoal.mockImplementation((goalId, goal) => 
      Promise.resolve({
        ...goal,
        id: goalId,
        category: mockCategories.find(c => c.id === goal.categoryId) || mockCategories[0]
      })
    );
    mockGoalsDefinitionApi.deleteGoal.mockResolvedValue(undefined);
    mockGoalsDefinitionApi.updateProcessStatus.mockResolvedValue(undefined);
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });

  // TESTS START HERE
  
  // Test 1: Inicjalizacja hooka
  it('powinien załadować cele, kategorie i dane pracownika przy inicjalizacji', async () => {
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
    expect(result.current.processStatus).toBe('in_definition');
  });
  
  // Test 2: Dodawanie celu - przypadek normalny
  it('powinien dodać nowy cel do listy i zaktualizować sumę wag', async () => {
    const { result } = renderHook(() => useGoalsDefinition({ processId, employeeId }));
    
    // Poczekaj na zakończenie ładowania
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    
    // Nowy cel do dodania
    const newGoal: CreateGoalCommand = {
      title: 'Nowy cel',
      description: 'Opis nowego celu',
      categoryId: 'cat-3',
      weight: 30
    };
    
    // Dodaj cel
    await act(async () => {
      await result.current.addGoal(newGoal);
    });
    
    // Sprawdź czy cel został dodany
    expect(mockGoalsDefinitionApi.addGoal).toHaveBeenCalledWith(processId, employeeId, newGoal);
    expect(result.current.goals.length).toBe(3);
    expect(result.current.totalWeight).toBe(100); // 70% + 30% = 100%
    expect(result.current.isComplete).toBe(true); // 100% = 100%
  });
  
  // Test 3: Dodawanie celu przekraczającego 100%
  it('powinien poprawnie dodać cel przekraczający 100% wagi (bez walidacji w hooku)', async () => {
    const { result } = renderHook(() => useGoalsDefinition({ processId, employeeId }));
    
    // Poczekaj na zakończenie ładowania
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    
    // Nowy cel do dodania przekraczający 100%
    const newGoal: CreateGoalCommand = {
      title: 'Cel przekraczający',
      description: 'Opis celu',
      categoryId: 'cat-2',
      weight: 40
    };
    
    // Dodaj cel
    await act(async () => {
      await result.current.addGoal(newGoal);
    });
    
    // Sprawdź czy cel został dodany
    expect(mockGoalsDefinitionApi.addGoal).toHaveBeenCalledWith(processId, employeeId, newGoal);
    expect(result.current.totalWeight).toBe(110); // 70% + 40% = 110%
    expect(result.current.isComplete).toBe(false); // 110% != 100%
  });
  
  // Test 4: Aktualizacja celu
  it('powinien zaktualizować istniejący cel i poprawnie przeliczyć sumy wag', async () => {
    const { result } = renderHook(() => useGoalsDefinition({ processId, employeeId }));
    
    // Poczekaj na zakończenie ładowania
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    
    // Zaktualizuj cel
    const goalToUpdate: UpdateGoalCommand = {
      title: 'Zaktualizowany cel',
      description: 'Nowy opis',
      categoryId: 'cat-2',
      weight: 50
    };
    
    await act(async () => {
      await result.current.updateGoal('goal-1', goalToUpdate);
    });
    
    // Sprawdź czy cel został zaktualizowany
    expect(mockGoalsDefinitionApi.updateGoal).toHaveBeenCalledWith('goal-1', goalToUpdate);
    
    // Oryginalna waga celu-1 wynosiła 40%, nowa to 50%, więc różnica +10%
    // Całkowita suma to 70% + 10% = 80%
    expect(result.current.totalWeight).toBe(80);
    expect(result.current.isComplete).toBe(false); // 80% != 100%
  });
  
  // Test 5: Usuwanie celu
  it('powinien usunąć cel i poprawnie zaktualizować sumę wag', async () => {
    const { result } = renderHook(() => useGoalsDefinition({ processId, employeeId }));
    
    // Poczekaj na zakończenie ładowania
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    
    // Usuń cel 1 (o wadze 40%)
    await act(async () => {
      await result.current.deleteGoal('goal-1');
    });
    
    // Sprawdź czy został wywołany endpoint usuwania
    expect(mockGoalsDefinitionApi.deleteGoal).toHaveBeenCalledWith('goal-1');
    
    // Powinien zostać 1 cel
    expect(result.current.goals.length).toBe(1);
    
    // Oryginalna suma to 70%, bez celu-1 (40%) zostaje 30%
    expect(result.current.totalWeight).toBe(30);
    expect(result.current.isComplete).toBe(false); // 30% != 100%
  });
  
  // Test 6: Obsługa błędów podczas dodawania celu
  it('powinien obsłużyć błąd podczas dodawania celu', async () => {
    // Ustaw mock na rzucenie błędu
    mockGoalsDefinitionApi.addGoal.mockRejectedValue(new Error('Błąd dodawania celu'));
    
    const { result } = renderHook(() => useGoalsDefinition({ processId, employeeId }));
    
    // Poczekaj na zakończenie ładowania
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    
    // Próba dodania celu
    let error: Error | null = null;
    await act(async () => {
      try {
        await result.current.addGoal({
          title: 'Cel z błędem',
          description: 'Opis',
          categoryId: 'cat-1',
          weight: 30
        });
      } catch (e) {
        error = e as Error;
      }
    });
    
    // Sprawdź błąd
    expect(error).not.toBeNull();
    expect(result.current.error).toBe('Błąd dodawania celu');
    
    // Stan nie powinien się zmienić
    expect(result.current.goals.length).toBe(2);
    expect(result.current.totalWeight).toBe(70);
  });
  
  // Test 7: Aktualizacja statusu procesu - walidacja sumy wag
  it('nie powinien pozwolić na zmianę statusu na in_self_assessment jeśli suma wag != 100%', async () => {
    const { result } = renderHook(() => useGoalsDefinition({ processId, employeeId }));
    
    // Poczekaj na zakończenie ładowania
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    
    // Próba zmiany statusu z sumą wag != 100%
    await act(async () => {
      await result.current.updateProcessStatus('in_self_assessment');
    });
    
    // API nie powinno być wywołane
    expect(mockGoalsDefinitionApi.updateProcessStatus).not.toHaveBeenCalled();
    
    // Powinien być error
    expect(result.current.error).toBe('Suma wag celów musi wynosić 100% przed przejściem do etapu samooceny.');
    
    // Status nie powinien się zmienić
    expect(result.current.processStatus).toBe('in_definition');
  });
  
  // Test 8: Aktualizacja statusu procesu - sukces
  it('powinien pozwolić na zmianę statusu gdy suma wag = 100%', async () => {
    // Ustaw sumę wag na 100%
    mockGoalsDefinitionApi.fetchGoals.mockResolvedValue({
      goals: mockGoals,
      totalWeight: 100,
      processStatus: 'in_definition' as AssessmentProcessStatus
    });
    
    const { result } = renderHook(() => useGoalsDefinition({ processId, employeeId }));
    
    // Poczekaj na zakończenie ładowania
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    
    // Sprawdź czy suma wynosi 100%
    expect(result.current.totalWeight).toBe(100);
    expect(result.current.isComplete).toBe(true);
    
    // Ustaw mock dla window.location.href
    const originalLocation = window.location;
    delete window.location;
    window.location = { href: '' } as Location;
    
    // Zmień status
    await act(async () => {
      await result.current.updateProcessStatus('in_self_assessment');
    });
    
    // API powinno być wywołane
    expect(mockGoalsDefinitionApi.updateProcessStatus).toHaveBeenCalledWith(
      processId, 
      'in_self_assessment'
    );
    
    // Powinien nastąpić redirect
    expect(window.location.href).toBe(`/process/${processId}/goals-view?employeeId=${employeeId}`);
    
    // Przywróć oryginalne window.location
    window.location = originalLocation;
  });
  
  // Test 9: Obsługa błędów przy ładowaniu danych
  it('powinien obsłużyć błąd podczas ładowania celów', async () => {
    // Ustaw mock na rzucenie błędu
    mockGoalsDefinitionApi.fetchGoals.mockRejectedValue(new Error('Błąd pobierania celów'));
    
    const { result } = renderHook(() => useGoalsDefinition({ processId, employeeId }));
    
    // Poczekaj na zakończenie ładowania
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    
    // Sprawdź błąd
    expect(result.current.error).toBe('Błąd pobierania celów');
    expect(result.current.goals.length).toBe(0);
  });
  
  // Test 10: Przeładowanie danych
  it('powinien przeładować dane po wywołaniu reload', async () => {
    const { result } = renderHook(() => useGoalsDefinition({ processId, employeeId }));
    
    // Poczekaj na zakończenie ładowania
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    
    // Zmień mock response
    mockGoalsDefinitionApi.fetchGoals.mockResolvedValue({
      goals: [...mockGoals, {
        id: 'goal-3',
        title: 'Cel 3',
        description: 'Opis celu 3',
        weight: 20,
        category: mockCategories[2],
        employeeId,
        processId
      }],
      totalWeight: 90,
      processStatus: 'in_definition'
    });
    
    // Reset licznika wywołań
    mockGoalsDefinitionApi.fetchGoals.mockClear();
    
    // Wywołaj reload
    await act(async () => {
      result.current.reload();
    });
    
    // Sprawdź czy API zostało ponownie wywołane
    expect(mockGoalsDefinitionApi.fetchGoals).toHaveBeenCalledWith(processId, employeeId);
    
    // Dane powinny być zaktualizowane
    expect(result.current.goals.length).toBe(3);
    expect(result.current.totalWeight).toBe(90);
  });
});
```

## Podsumowanie pokrycia testów

Powyższe testy jednostkowe dla hooka `useGoalsDefinition` pokrywają następujące kluczowe reguły biznesowe i warunki brzegowe:

1. **Inicjalizacja hooka** - weryfikacja poprawności ładowania danych początkowych.
2. **Dodawanie celów** - sprawdzenie poprawności dodawania celów i aktualizacji sumy wag.
3. **Walidacja sumy wag** - weryfikacja zachowania przy próbie przekroczenia 100% wagi.
4. **Aktualizacja celów** - sprawdzenie poprawności aktualizacji celów i przeliczania wag.
5. **Usuwanie celów** - weryfikacja usuwania celów i aktualizacji wag.
6. **Obsługa błędów API** - sprawdzenie prawidłowej obsługi błędów podczas interakcji z API.
7. **Walidacja statusu procesu** - weryfikacja blokady zmiany statusu gdy suma wag != 100%.
8. **Zmiana statusu procesu** - sprawdzenie poprawności zmiany statusu gdy suma = 100%.
9. **Obsługa błędów inicjalizacji** - weryfikacja zachowania przy błędach podczas ładowania danych.
10. **Przeładowanie danych** - sprawdzenie funkcji reload do odświeżania danych.

Testy zostały zorganizowane zgodnie z wytycznymi Vitest, z wykorzystaniem podejścia AAA (Arrange-Act-Assert) oraz z prawidłowym mockowaniem zewnętrznych zależności. 

------------------------------------
Now incorporate these test into codebase.
------------------------------------
@useGoalsDefinition.test.ts 
Skup się na pierwszym teście w pliku. Uruchom wyłącznie ten test i spróbuj doprowadzić do sytuacji, w której test skończy się prawidłowo.

-----------------------------------
Prawidłowy 1 unit test

------------------------------------
@unit-tests-recommendations.md @useGoalsDefinition.test.ts 
Znakomicie. Zaimplemetuj teraz test nr 2 w tym samym pliku useGoalsDEfinition.test.ts:
Test 2: Dodawanie celu - przypadek normalny