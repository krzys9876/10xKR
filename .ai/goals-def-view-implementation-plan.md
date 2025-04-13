# Plan implementacji widoku definiowania celów

## 1. Przegląd
Widok definiowania celów umożliwia kierownikowi tworzenie i zarządzanie celami dla podległych pracowników. Widok jest dostępny tylko w statusie "W definiowaniu" i pozwala na:
- Dodawanie nowych celów poprzez ręczne wpisywanie
- Przypisywanie kategorii i wagi (w procentach) do każdego celu
- Edytowanie istniejących celów
- Usuwanie celów
- Walidację, że suma wag wszystkich celów wynosi 100%
- Zmianę statusu procesu na "W samoocenie" po poprawnym zdefiniowaniu celów

Widok będzie zintegrowany z istniejącym dashboardem i będzie wykorzystywał wspólne komponenty dla zachowania spójności z istniejącym widokiem przeglądania celów.

## 2. Routing widoku
- Ścieżka: `/process/{processId}/employee/{employeeId}/goals-definition`
- Dostępność: Tylko dla zalogowanych kierowników, tylko w statusie "W definiowaniu"
- Uwaga: Struktura routingu będzie spójna z istniejącą implementacją widoku przeglądania celów

## 3. Struktura komponentów
```
GoalsDefinitionPage
├── DashboardLayout (z istniejącej implementacji)
├── ProcessStepper (współdzielony z dashboardem)
├── LoadingSpinner (z Shadcn/ui lub komponentów współdzielonych)
├── ErrorDisplay (z komponentów współdzielonych)
├── EmployeeInfo (informacje o pracowniku, dla którego definiowane są cele)
├── GoalsList
│   ├── GoalCard (dla każdego celu)
│   └── TotalWeightDisplay (suma wag celów)
└── GoalForm
    ├── TextInput (opis celu)
    ├── CategorySelect (wybór kategorii)
    ├── WeightInput (waga celu)
    └── FormButtons (zapisz/anuluj)
```

## 4. Szczegóły komponentów

### GoalsDefinitionPage
- Opis komponentu: Główny komponent strony do definiowania celów pracownika przez kierownika, zarządza stanem, pobiera dane i renderuje pozostałe komponenty
- Główne elementy: 
  - Wykorzystuje istniejący DashboardLayout (wspólny layout z nagłówkiem i nawigacją)
  - ProcessStepper pokazujący etapy procesu
  - Informacje o pracowniku, dla którego definiowane są cele (EmployeeInfo)
  - Sekcja z listą celów (GoalsList)
  - Formularz dodawania/edycji celu (GoalForm)
  - Przycisk zmiany statusu procesu (aktywny tylko gdy suma wag = 100%)
  - Stany ładowania i błędów
- Obsługiwane interakcje: 
  - Załadowanie danych przy montowaniu komponentu
  - Dodawanie/edycja/usuwanie celów
  - Zmiana statusu procesu
- Obsługiwana walidacja: 
  - Sprawdzenie czy użytkownik ma uprawnienia kierownika
  - Sprawdzenie czy proces istnieje
  - Sprawdzenie czy proces jest w statusie "W definiowaniu"
  - Walidacja sumy wag celów (100%)
- Typy: GoalViewModel[], AssessmentProcessViewModel, EmployeeDTO
- Propsy: 
  ```typescript
  {
    processId: string;
    employeeId: string;
    process?: AssessmentProcessViewModel;
  }
  ```

### ProcessStepper
- Opis komponentu: Wykorzystanie istniejącego komponentu ProcessStepper z dashboardu
- Główne elementy: Jednowierszowy pasek z nazwami etapów i ich statusami (kolorystyka)
- Obsługiwane interakcje: Zmiana statusu procesu (tylko dla kierownika)
- Obsługiwana walidacja: Zgodnie z istniejącą implementacją
- Typy: Zgodnie z istniejącą implementacją
- Propsy: Dostosowanie do istniejącego interfejsu komponentu:
  ```typescript
  {
    currentStatus: AssessmentProcessStatus;
    isManager: boolean;
    onStatusChange: (status: AssessmentProcessStatus) => Promise<void>;
    processId: string;
  }
  ```

### EmployeeInfo
- Opis komponentu: Wyświetlanie informacji o pracowniku, dla którego definiowane są cele
- Główne elementy: 
  - Ikona użytkownika
  - Imię i nazwisko pracownika
  - Adres email pracownika
- Obsługiwane interakcje: Brak
- Obsługiwana walidacja: Brak
- Typy: EmployeeDTO
- Propsy: 
  ```typescript
  {
    employee: {
      id: string;
      name: string;
      email: string;
    };
  }
  ```

### GoalsList
- Opis komponentu: Lista celów pracownika z możliwością edycji i usuwania
- Główne elementy: 
  - Nagłówek z informacją o sumie wag
  - Lista kart celów
  - Informacja o braku celów, jeśli lista jest pusta
  - Wizualizacja sumy wag (pasek postępu lub inny wskaźnik)
- Obsługiwane interakcje: 
  - Edycja celu (przekazanie danych do formularza)
  - Usunięcie celu
- Obsługiwana walidacja: 
  - Wyświetlenie sumy wag i informacji, czy suma = 100%
- Typy: GoalViewModel[], number (totalWeight)
- Propsy: 
  ```typescript
  {
    goals: GoalViewModel[];
    totalWeight: number;
    isLoading: boolean;
    onEditGoal: (goal: GoalViewModel) => void;
    onDeleteGoal: (goalId: string) => Promise<void>;
    isDeletingGoal: Record<string, boolean>;
  }
  ```

### GoalCard
- Opis komponentu: Pojedynczy element listy celów z możliwością edycji i usunięcia
- Główne elementy: 
  - Opis celu
  - Kategoria celu
  - Waga celu (%)
  - Przyciski edycji i usunięcia
- Obsługiwane interakcje: 
  - Kliknięcie przycisku edycji
  - Kliknięcie przycisku usunięcia (z potwierdzeniem)
- Obsługiwana walidacja: Brak
- Typy: GoalViewModel
- Propsy: 
  ```typescript
  {
    goal: GoalViewModel;
    onEdit: (goal: GoalViewModel) => void;
    onDelete: (goalId: string) => Promise<void>;
    isDeleting: boolean;
  }
  ```

### GoalForm
- Opis komponentu: Formularz dodawania/edycji celu
- Główne elementy:
  - Pole tekstowe na opis celu
  - Lista rozwijana kategorii
  - Pole numeryczne na wagę (%)
  - Przyciski zapisania i anulowania
- Obsługiwane interakcje:
  - Wprowadzanie/edycja danych
  - Zapisanie formularza
  - Anulowanie zmian
- Obsługiwana walidacja:
  - Opis celu nie może być pusty
  - Kategoria musi być wybrana
  - Waga musi być większa od 0
  - Walidacja sumy wag (czy dodanie/edycja celu nie spowoduje przekroczenia 100%)
- Typy: CreateGoalCommand/UpdateGoalCommand, GoalCategoryDTO[]
- Propsy:
  ```typescript
  {
    initialValues?: {
      id?: string;
      description: string;
      categoryId: string;
      weight: number;
    };
    categories: { id: string; name: string }[];
    totalWeight: number;
    currentGoalWeight: number; // W przypadku edycji, obecna waga celu
    onSave: (goal: { description: string; categoryId: string; weight: number; id?: string }) => Promise<void>;
    onCancel: () => void;
    isSaving: boolean;
  }
  ```

## 5. Typy

### Typy zaczerpnięte z istniejącej implementacji:
```typescript
// Z src/components/goals-view/types.ts
interface GoalViewModel {
  id: string;
  title: string;
  description: string;
  weight: number;
  category: {
    id: string;
    name: string;
  };
  formattedWeight: string; // "XX%" - dla prezentacji
  isReadOnly: boolean; // w tym przypadku zawsze false, bo widok umożliwia edycję
}

// Z src/types.ts
type AssessmentProcessStatus = "in_definition" | "in_self_assessment" | "awaiting_manager_assessment" | "completed";

interface GoalDTO {
  id: string;
  title: string;
  description: string;
  weight: number;
  category: {
    id: string;
    name: string;
  };
}

interface GoalCategoryDTO {
  id: string;
  name: string;
}

interface GoalListResponse {
  goals: GoalDTO[];
  totalWeight: number;
}

interface EmployeeDTO {
  id: string;
  email: string;
  name: string;
}

interface AssessmentProcessViewModel {
  id: string;
  name: string;
  status: AssessmentProcessStatus;
  statusLabel: string;
  active: boolean;
  formattedStartDate: string;
  formattedEndDate: string;
}
```

### Nowe typy do implementacji:
```typescript
// Props dla komponentów
interface GoalsDefinitionPageProps {
  processId: string;
  employeeId: string;
  process?: AssessmentProcessViewModel;
}

interface EmployeeInfoProps {
  employee: {
    id: string;
    name: string;
    email: string;
  };
}

interface GoalsListProps {
  goals: GoalViewModel[];
  totalWeight: number;
  isLoading: boolean;
  onEditGoal: (goal: GoalViewModel) => void;
  onDeleteGoal: (goalId: string) => Promise<void>;
  isDeletingGoal: Record<string, boolean>;
}

interface GoalCardProps {
  goal: GoalViewModel;
  onEdit: (goal: GoalViewModel) => void;
  onDelete: (goalId: string) => Promise<void>;
  isDeleting: boolean;
}

interface GoalFormProps {
  initialValues?: {
    id?: string;
    description: string;
    categoryId: string;
    weight: number;
  };
  categories: { id: string; name: string }[];
  totalWeight: number;
  currentGoalWeight: number; // W przypadku edycji, obecna waga celu
  onSave: (goal: { description: string; categoryId: string; weight: number; id?: string }) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

// Hook props i rezultaty
interface UseGoalsDefinitionProps {
  processId: string;
  employeeId: string;
}

interface UseGoalsDefinitionResult {
  goals: GoalViewModel[];
  totalWeight: number;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
  isComplete: boolean; // czy suma wag = 100%
  processStatus: AssessmentProcessStatus;
  isManager: boolean;
  addGoal: (goal: { description: string; categoryId: string; weight: number }) => Promise<void>;
  updateGoal: (goalId: string, goal: { description: string; categoryId: string; weight: number }) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  updateProcessStatus: (status: AssessmentProcessStatus) => Promise<void>;
  isSaving: boolean;
  isDeletingGoal: Record<string, boolean>;
  isUpdatingStatus: boolean;
  categories: GoalCategoryDTO[];
  employee: EmployeeDTO | null;
}

// Komenda dodania/aktualizacji celu
interface CreateGoalCommand {
  description: string;
  weight: number;
  categoryId: string;
}

interface UpdateGoalCommand {
  description: string;
  weight: number;
  categoryId: string;
}

// Interfejs dla API celów
interface GoalsDefinitionApi {
  fetchGoals: (processId: string, employeeId: string) => Promise<{
    goals: GoalDTO[];
    totalWeight: number;
    processStatus: AssessmentProcessStatus;
  }>;
  fetchCategories: () => Promise<GoalCategoryDTO[]>;
  fetchEmployee: (employeeId: string) => Promise<EmployeeDTO>;
  addGoal: (processId: string, employeeId: string, goal: CreateGoalCommand) => Promise<GoalDTO>;
  updateGoal: (goalId: string, goal: UpdateGoalCommand) => Promise<GoalDTO>;
  deleteGoal: (goalId: string) => Promise<void>;
  updateProcessStatus: (processId: string, status: AssessmentProcessStatus) => Promise<void>;
}
```

## 6. Zarządzanie stanem

Zarządzanie stanem w widoku definiowania celów będzie realizowane za pomocą hooków React, podobnie jak w istniejącej implementacji widoku przeglądania celów:

### Niestandardowy hook `useGoalsDefinition`
```typescript
function useGoalsDefinition({ processId, employeeId }: UseGoalsDefinitionProps): UseGoalsDefinitionResult {
  const [goals, setGoals] = useState<GoalViewModel[]>([]);
  const [totalWeight, setTotalWeight] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [processStatus, setProcessStatus] = useState<AssessmentProcessStatus>('in_definition');
  const [isManager, setIsManager] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeletingGoal, setIsDeletingGoal] = useState<Record<string, boolean>>({});
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [categories, setCategories] = useState<GoalCategoryDTO[]>([]);
  const [employee, setEmployee] = useState<EmployeeDTO | null>(null);
  
  // Flaga wskazująca, czy suma wag celów wynosi 100%
  const isComplete = totalWeight === 100;
  
  // Pobranie danych przy montowaniu komponentu
  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Sprawdzenie czy użytkownik jest kierownikiem
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      setIsManager(userData.isManager || false);
      
      // Pobranie kategorii celów
      const categoriesData = await goalsDefinitionApi.fetchCategories();
      setCategories(categoriesData);
      
      // Pobranie informacji o pracowniku
      const employeeData = await goalsDefinitionApi.fetchEmployee(employeeId);
      setEmployee(employeeData);
      
      // Pobranie celów
      const response = await goalsDefinitionApi.fetchGoals(processId, employeeId);
      
      // Ustawienie statusu procesu
      setProcessStatus(response.processStatus);
      
      // Transformacja DTO na ViewModel
      const goalsViewModel = response.goals.map(goal => ({
        ...goal,
        formattedWeight: `${goal.weight}%`,
        isReadOnly: false
      }));
      
      setGoals(goalsViewModel);
      setTotalWeight(response.totalWeight);
    } catch (err) {
      setError('Nie udało się pobrać danych. Spróbuj ponownie.');
    } finally {
      setIsLoading(false);
    }
  }, [processId, employeeId]);
  
  // Wywołanie funkcji pobierania danych przy montowaniu komponentu
  useEffect(() => {
    reload();
  }, [reload]);
  
  // Dodanie nowego celu
  const addGoal = useCallback(async (goal: CreateGoalCommand) => {
    setIsSaving(true);
    
    try {
      const newGoal = await goalsDefinitionApi.addGoal(processId, employeeId, goal);
      
      // Aktualizacja lokalnego stanu
      setGoals(prevGoals => [
        ...prevGoals,
        {
          ...newGoal,
          formattedWeight: `${newGoal.weight}%`,
          isReadOnly: false
        }
      ]);
      
      // Aktualizacja sumy wag
      setTotalWeight(prevWeight => prevWeight + goal.weight);
    } catch (err) {
      setError('Nie udało się dodać celu. Spróbuj ponownie.');
    } finally {
      setIsSaving(false);
    }
  }, [processId, employeeId]);
  
  // Aktualizacja istniejącego celu
  const updateGoal = useCallback(async (goalId: string, goal: UpdateGoalCommand) => {
    setIsSaving(true);
    
    try {
      const updatedGoal = await goalsDefinitionApi.updateGoal(goalId, goal);
      
      // Obliczenie różnicy wag przed i po aktualizacji
      const oldGoal = goals.find(g => g.id === goalId);
      const weightDifference = oldGoal ? goal.weight - oldGoal.weight : 0;
      
      // Aktualizacja lokalnego stanu
      setGoals(prevGoals => 
        prevGoals.map(g => 
          g.id === goalId 
            ? {
                ...updatedGoal,
                formattedWeight: `${updatedGoal.weight}%`,
                isReadOnly: false
              }
            : g
        )
      );
      
      // Aktualizacja sumy wag
      setTotalWeight(prevWeight => prevWeight + weightDifference);
    } catch (err) {
      setError('Nie udało się zaktualizować celu. Spróbuj ponownie.');
    } finally {
      setIsSaving(false);
    }
  }, [goals]);
  
  // Usunięcie celu
  const deleteGoal = useCallback(async (goalId: string) => {
    setIsDeletingGoal(prev => ({ ...prev, [goalId]: true }));
    
    try {
      await goalsDefinitionApi.deleteGoal(goalId);
      
      // Obliczenie wagi usuniętego celu
      const deletedGoal = goals.find(g => g.id === goalId);
      const deletedWeight = deletedGoal ? deletedGoal.weight : 0;
      
      // Aktualizacja lokalnego stanu
      setGoals(prevGoals => prevGoals.filter(g => g.id !== goalId));
      
      // Aktualizacja sumy wag
      setTotalWeight(prevWeight => prevWeight - deletedWeight);
    } catch (err) {
      setError('Nie udało się usunąć celu. Spróbuj ponownie.');
    } finally {
      setIsDeletingGoal(prev => ({ ...prev, [goalId]: false }));
    }
  }, [goals]);
  
  // Zmiana statusu procesu
  const updateProcessStatus = useCallback(async (status: AssessmentProcessStatus) => {
    // Walidacja sumy wag przed zmianą statusu
    if (status === 'in_self_assessment' && totalWeight !== 100) {
      setError('Suma wag celów musi wynosić 100% przed przejściem do etapu samooceny.');
      return;
    }
    
    setIsUpdatingStatus(true);
    
    try {
      await goalsDefinitionApi.updateProcessStatus(processId, status);
      
      // Aktualizacja lokalnego stanu
      setProcessStatus(status);
    } catch (err) {
      setError('Nie udało się zmienić statusu procesu. Spróbuj ponownie.');
    } finally {
      setIsUpdatingStatus(false);
    }
  }, [processId, totalWeight]);
  
  return {
    goals,
    totalWeight,
    isLoading,
    error,
    reload,
    isComplete,
    processStatus,
    isManager,
    addGoal,
    updateGoal,
    deleteGoal,
    updateProcessStatus,
    isSaving,
    isDeletingGoal,
    isUpdatingStatus,
    categories,
    employee
  };
}
```

## 7. Integracja API

Integracja z API będzie bazować na istniejącym kodzie z widoku przeglądania celów, rozszerzając go o dodatkowe funkcje:

```typescript
const goalsDefinitionApi: GoalsDefinitionApi = {
  // Pobieranie celów dla pracownika
  fetchGoals: async (processId: string, employeeId: string) => {
    const response = await fetch(`/api/assessment-processes/${processId}/employees/${employeeId}/goals`);
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Brak autoryzacji');
      } else if (response.status === 403) {
        throw new Error('Brak dostępu');
      } else if (response.status === 404) {
        throw new Error('Nie znaleziono zasobu');
      } else {
        throw new Error('Wystąpił błąd podczas pobierania celów');
      }
    }
    
    const data = await response.json();
    
    // Pobierz status procesu z odpowiedzi lub pobierz go osobno, jeśli API nie zwraca statusu
    let processStatus: AssessmentProcessStatus = "in_definition";
    
    try {
      const processResponse = await fetch(`/api/assessment-processes/${processId}`);
      if (processResponse.ok) {
        const processData = await processResponse.json();
        processStatus = processData.status;
      }
    } catch (e) {
      // Ignoruj błąd, używamy domyślnego statusu
    }
    
    return {
      goals: data.goals,
      totalWeight: data.totalWeight,
      processStatus
    };
  },
  
  // Pobieranie kategorii celów
  fetchCategories: async () => {
    const response = await fetch('/api/goal-categories');
    
    if (!response.ok) {
      throw new Error('Nie udało się pobrać kategorii celów');
    }
    
    const data = await response.json();
    return data.categories;
  },
  
  // Pobieranie informacji o pracowniku
  fetchEmployee: async (employeeId: string) => {
    const response = await fetch(`/api/users/${employeeId}`);
    
    if (!response.ok) {
      throw new Error('Nie udało się pobrać danych pracownika');
    }
    
    return await response.json();
  },
  
  // Dodawanie nowego celu
  addGoal: async (processId: string, employeeId: string, goal: CreateGoalCommand) => {
    const response = await fetch(`/api/assessment-processes/${processId}/employees/${employeeId}/goals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(goal)
    });
    
    if (!response.ok) {
      if (response.status === 400) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Nieprawidłowe dane celu');
      } else {
        throw new Error('Nie udało się dodać celu');
      }
    }
    
    return await response.json();
  },
  
  // Aktualizacja istniejącego celu
  updateGoal: async (goalId: string, goal: UpdateGoalCommand) => {
    const response = await fetch(`/api/goals/${goalId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(goal)
    });
    
    if (!response.ok) {
      if (response.status === 400) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Nieprawidłowe dane celu');
      } else {
        throw new Error('Nie udało się zaktualizować celu');
      }
    }
    
    return await response.json();
  },
  
  // Usunięcie celu
  deleteGoal: async (goalId: string) => {
    const response = await fetch(`/api/goals/${goalId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error('Nie udało się usunąć celu');
    }
  },
  
  // Zmiana statusu procesu
  updateProcessStatus: async (processId: string, status: AssessmentProcessStatus) => {
    const response = await fetch(`/api/assessment-processes/${processId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });
    
    if (!response.ok) {
      throw new Error('Nie udało się zmienić statusu procesu');
    }
  }
};
```

## 8. Interakcje użytkownika

W widoku definiowania celów użytkownik (kierownik) może wykonywać następujące interakcje:

1. **Wejście na stronę**:
   - System automatycznie ładuje dane pracownika i jego cele
   - Wyświetla stepper z aktualnym statusem procesu (wyróżniony "W definiowaniu")
   - Wyświetla informacje o pracowniku, dla którego definiowane są cele
   - Wyświetla formularz dodawania nowego celu

2. **Dodawanie nowego celu**:
   - Wprowadzenie opisu celu
   - Wybór kategorii z listy rozwijanej
   - Wprowadzenie wagi celu (%)
   - Kliknięcie przycisku "Zapisz"
   - System zapisuje cel i aktualizuje listę oraz sumę wag

3. **Edycja istniejącego celu**:
   - Kliknięcie przycisku edycji przy celu
   - Modyfikacja opisu, kategorii lub wagi
   - Kliknięcie przycisku "Zapisz"
   - System aktualizuje cel i sumę wag

4. **Usunięcie celu**:
   - Kliknięcie przycisku usunięcia przy celu
   - Potwierdzenie usunięcia
   - System usuwa cel i aktualizuje sumę wag

5. **Zmiana statusu procesu**:
   - Kliknięcie przycisku zmiany statusu (dostępny tylko gdy suma wag = 100%)
   - System zmienia status procesu na "W samoocenie"
   - Przekierowanie do dashboardu lub widoku przeglądania celów

6. **Obsługa błędów**:
   - Wyświetlenie komunikatu o błędzie
   - Możliwość ponowienia akcji

7. **Nawigacja**:
   - Możliwość powrotu do dashboardu

## 9. Warunki i walidacja

Warunki i walidacja dla widoku definiowania celów:

1. **Warunki dostępu**:
   - Użytkownik musi być zalogowany
   - Użytkownik musi mieć uprawnienia kierownika
   - Proces musi istnieć i być w statusie "W definiowaniu"

2. **Walidacja formularza dodawania/edycji celu**:
   - Opis celu: pole wymagane, nie może być puste
   - Kategoria: pole wymagane, musi być wybrana z listy
   - Waga: pole wymagane, musi być liczbą dodatnią (> 0)
   - Suma wag po dodaniu/edycji celu nie może przekroczyć 100%

3. **Walidacja zmiany statusu procesu**:
   - Suma wag celów musi wynosić dokładnie 100%
   - Musi istnieć przynajmniej jeden cel

4. **Walidacje komponentów**:
   - GoalsList: Wyświetlenie informacji o sumie wag i czy suma = 100%
   - GoalForm: Walidacja pól formularza
   - ProcessStepper: Walidacja możliwości zmiany statusu

## 10. Obsługa błędów

W widoku definiowania celów należy obsłużyć następujące rodzaje błędów:

1. **Błędy autoryzacji (401)**:
   - Przekierowanie do strony logowania
   - Komunikat o konieczności zalogowania się

2. **Błędy uprawnień (403)**:
   - Komunikat o braku uprawnień kierownika
   - Przycisk powrotu do dashboardu

3. **Błędy "Nie znaleziono" (404)**:
   - Komunikat o nieistniejącym procesie lub pracowniku
   - Przycisk powrotu do dashboardu

4. **Błędy walidacji formularza**:
   - Wyświetlenie komunikatów przy odpowiednich polach
   - Blokada przycisku zapisania

5. **Błędy walidacji sumy wag**:
   - Informacja o nieprawidłowej sumie wag
   - Blokada przycisku zmiany statusu procesu

6. **Błędy sieciowe**:
   - Ponowienie próby
   - Komunikat o problemach z połączeniem

7. **Błędy serwera**:
   - Komunikat o problemie po stronie serwera
   - Przycisk powrotu do dashboardu

## 11. Kroki implementacji

1. **Analiza istniejącego kodu**:
   - Szczegółowe zapoznanie się z istniejącą implementacją widoku przeglądania celów
   - Identyfikacja komponentów do ponownego użycia (ProcessStepper, struktura GoalsList)
   - Analiza istniejących typów i interfejsów

2. **Przygotowanie struktury plików**:
   - Utworzenie pliku `src/pages/process/[processId]/employee/[employeeId]/goals-definition.astro`
   - Utworzenie komponentów React w `src/components/goals-definition/`:
     - `GoalsDefinitionPage.tsx`
     - `GoalsList.tsx`
     - `GoalCard.tsx`
     - `GoalForm.tsx`
     - `EmployeeInfo.tsx`
     - `hooks/useGoalsDefinition.ts`
     - `types.ts`

3. **Implementacja typów**:
   - Dodanie nowych interfejsów i typów w `src/components/goals-definition/types.ts`
   - Wykorzystanie istniejących typów z `src/types.ts` i `src/components/goals-view/types.ts`

4. **Implementacja hooka `useGoalsDefinition`**:
   - Bazowanie na wzorcu z istniejącego hooka `useGoals`
   - Dodanie funkcji do zarządzania celami (dodawanie, edycja, usuwanie)
   - Dodanie funkcji do zmiany statusu procesu

5. **Implementacja API**:
   - Wykorzystanie istniejących endpointów API
   - Dodanie nowych funkcji dla operacji specyficznych dla definiowania celów

6. **Implementacja komponentów UI**:
   - Implementacja `GoalsDefinitionPage` z obsługą stanu i renderowaniem podkomponentów
   - Implementacja `GoalsList` wyświetlającego listę celów i ich sumę wag
   - Implementacja `GoalCard` dla pojedynczego celu z możliwością edycji i usunięcia
   - Implementacja `GoalForm` do dodawania i edycji celów
   - Implementacja `EmployeeInfo` wyświetlającego informacje o pracowniku

7. **Implementacja widoku Astro**:
   - Konfiguracja strony z komponentem React
   - Pobieranie początkowych danych po stronie serwera

8. **Implementacja walidacji**:
   - Walidacja formularza dodawania/edycji celu
   - Walidacja sumy wag celów
   - Blokowanie przycisku zmiany statusu procesu, gdy suma wag != 100%

9. **Obsługa błędów**:
   - Implementacja obsługi błędów na poziomie komponentów
   - Wyświetlanie odpowiednich komunikatów

10. **Testowanie**:
    - Testowanie dodawania, edycji i usuwania celów
    - Testowanie walidacji formularza
    - Testowanie walidacji sumy wag
    - Testowanie zmiany statusu procesu
    - Testowanie obsługi błędów

11. **Integracja z istniejącym dashboardem**:
    - Dodanie linków do nowego widoku w odpowiednich miejscach
    - Zapewnienie spójności wizualnej z istniejącymi widokami 