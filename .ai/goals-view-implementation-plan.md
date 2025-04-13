# Plan implementacji widoku przeglądania celów i samooceny

## 1. Przegląd
Widok przeglądania celów i samooceny umożliwia pracownikowi wyświetlenie przypisanych mu celów oraz, gdy proces jest w odpowiednim statusie, wprowadzenie samooceny dla tych celów. Funkcjonalność widoku dostosowuje się do statusu procesu oceny:
- W statusie "W definiowaniu" - widok działa w trybie tylko do odczytu, pokazując listę celów bez możliwości edycji
- W statusie "W samoocenie" - widok umożliwia wprowadzenie oceny (0-150) i komentarza dla każdego celu
- W pozostałych statusach - widok pokazuje cele i wprowadzone samooceny w trybie tylko do odczytu

Widok będzie zintegrowany z istniejącym dashboardem i będzie wykorzystywał wspólne komponenty dla zachowania spójności.

## 2. Routing widoku
- Ścieżka: `/process/{processId}/goals`
- Dostępność: Dla zalogowanych pracowników, z dynamicznym dostosowaniem funkcjonalności w zależności od statusu procesu
- Uwaga: Upewnij się, że struktura routingu jest zgodna z konwencjami stosowanymi w istniejącej aplikacji. Może być konieczne dostosowanie ścieżki, jeśli dashboard używa innego wzorca.

## 3. Struktura komponentów
```
GoalsPage
├── DashboardLayout (z istniejącej implementacji)
├── ProcessStepper (współdzielony z dashboardem)
├── LoadingSpinner (z Shadcn/ui lub komponentów współdzielonych)
├── ErrorDisplay (z komponentów współdzielonych)
└── GoalsList
    └── GoalCard (dla każdego celu)
        ├── GoalInfo (opis, kategoria, waga)
        └── SelfAssessmentForm (warunkowe wyświetlanie tylko w statusie "W samoocenie")
            ├── RatingInput (pole oceny 0-150)
            └── CommentInput (pole komentarza)
```

## 4. Szczegóły komponentów

### GoalsPage
- Opis komponentu: Główny komponent strony do przeglądania celów i wprowadzania samooceny, zarządza stanem, pobiera dane i renderuje pozostałe komponenty
- Główne elementy: 
  - Wykorzystuje istniejący DashboardLayout (wspólny layout z nagłówkiem i nawigacją)
  - ProcessStepper pokazujący etapy procesu
  - Sekcja z listą celów
  - Stany ładowania i błędów
- Obsługiwane interakcje: 
  - Załadowanie danych przy montowaniu komponentu
  - Zapisywanie samooceny (tylko w statusie "W samoocenie")
- Obsługiwana walidacja: 
  - Sprawdzenie czy użytkownik ma uprawnienia do przeglądania celów
  - Sprawdzenie czy proces istnieje
  - Dynamiczne dostosowanie funkcjonalności w zależności od statusu procesu
- Typy: GoalViewModel[], AssessmentProcessViewModel, UserViewModel
- Propsy: Brak (komponent na poziomie strony)

### ProcessStepper
- Opis komponentu: Wykorzystanie istniejącego komponentu ProcessStepper z dashboardu
- Główne elementy: Jednowierszowy pasek z nazwami etapów i ich statusami (kolorystyka)
- Obsługiwane interakcje: Dostosowanie do istniejącego interfejsu komponentu
- Obsługiwana walidacja: Zgodnie z istniejącą implementacją
- Typy: Zgodnie z istniejącą implementacją
- Propsy: Dostosuj do istniejącego interfejsu komponentu, prawdopodobnie:
  ```typescript
  {
    currentStatus: AssessmentProcessStatus;
    // inne propsy z istniejącej implementacji
  }
  ```

### LoadingSpinner
- Opis komponentu: Wykorzystanie istniejącego komponentu ładowania z biblioteki Shadcn/ui lub komponentów współdzielonych
- Główne elementy: Animowany wskaźnik ładowania, tekst informacyjny
- Propsy: Zgodnie z istniejącą implementacją (np. rozmiar, wariant)

### ErrorDisplay
- Opis komponentu: Wykorzystanie istniejącego komponentu obsługi błędów
- Główne elementy: Komunikat błędu, przycisk do ponownego załadowania
- Obsługiwane interakcje: Kliknięcie przycisku ponownego załadowania
- Propsy: Dostosuj do istniejącego interfejsu komponentu, przykładowo:
  ```typescript
  {
    error: string;
    retry: () => void;
    // inne propsy z istniejącej implementacji
  }
  ```

### GoalsList
- Opis komponentu: Lista celów pracownika z ich opisem, kategorią, wagą oraz (warunkowe) polami samooceny
- Główne elementy: 
  - Nagłówek z informacją o sumie wag
  - Lista kart celów
  - Informacja o braku celów, jeśli lista jest pusta
  - Informacja o statusie samooceny (dostępna/niedostępna)
- Obsługiwane interakcje: 
  - Brak w trybie tylko do odczytu
  - Zapisywanie samooceny w statusie "W samoocenie"
- Obsługiwana walidacja: 
  - Wyświetlenie sumy wag dla informacji (czy suma = 100%)
  - Walidacja pól samooceny (zakres 0-150)
- Typy: GoalViewModel[], GoalsListViewModel, ProcessStatus
- Propsy: 
  ```typescript
  {
    goals: GoalViewModel[];
    totalWeight: number;
    isLoading: boolean;
    processStatus: AssessmentProcessStatus;
    onSaveAssessment: (goalId: string, rating: number, comment: string) => Promise<void>;
    isSaving: boolean;
  }
  ```
- Style: Wykorzystanie klas Tailwind zgodnych z istniejącym dashboardem oraz komponentów Shadcn/ui dla zachowania spójności wizualnej

### GoalCard
- Opis komponentu: Pojedynczy element listy celów przedstawiający informacje o celu oraz (warunkowe) pola samooceny
- Główne elementy: 
  - Opis celu
  - Kategoria celu
  - Waga celu (%)
  - Warunkowe pole samooceny (tylko w statusie "W samoocenie")
  - Warunkowe wyświetlanie wprowadzonej samooceny (w innych statusach)
- Obsługiwane interakcje: 
  - Brak w trybie tylko do odczytu
  - Wprowadzanie oceny i komentarza w statusie "W samoocenie"
- Obsługiwana walidacja: Walidacja pól samooceny (zakres 0-150)
- Typy: GoalViewModel, AssessmentProcessStatus
- Propsy: 
  ```typescript
  {
    goal: GoalViewModel;
    processStatus: AssessmentProcessStatus;
    onSaveAssessment: (goalId: string, rating: number, comment: string) => Promise<void>;
    isSaving: boolean;
  }
  ```
- Style: Wykorzystanie klas Tailwind zgodnych z istniejącym dashboardem oraz komponentów Shadcn/ui (Card, Badge) dla zachowania spójności wizualnej

### SelfAssessmentForm
- Opis komponentu: Formularz do wprowadzania samooceny dla pojedynczego celu (widoczny tylko w statusie "W samoocenie")
- Główne elementy:
  - Pole wprowadzania oceny (0-150)
  - Pole wprowadzania komentarza
  - Przycisk zapisywania
  - Wskaźnik stanu zapisywania
- Obsługiwane interakcje:
  - Wprowadzanie oceny
  - Wprowadzanie komentarza
  - Zapisywanie samooceny
- Obsługiwana walidacja:
  - Walidacja zakresu oceny (0-150)
  - Walidacja wymaganych pól
- Typy: SelfAssessmentFormProps
- Propsy:
  ```typescript
  {
    goalId: string;
    initialRating?: number;
    initialComment?: string;
    onSave: (goalId: string, rating: number, comment: string) => Promise<void>;
    isSaving: boolean;
  }
  ```
- Style: Wykorzystanie komponentów Shadcn/ui (Input, Textarea, Button) dla zachowania spójności wizualnej

## 5. Typy

### Istniejące typy (z types.ts):
```typescript
// Wykorzystywane istniejące typy
type AssessmentProcessStatus = Database["public"]["Enums"]["assessment_process_status"];
interface GoalDTO {
  id: string;
  title: string;
  description: string;
  weight: number;
  category: {
    id: string;
    name: string;
  };
  selfAssessment?: {
    rating: number;
    comment: string;
  };
}
interface GoalListResponse {
  goals: GoalDTO[];
  totalWeight: number;
}
const STATUS_LABELS: Record<AssessmentProcessStatus, string> = {
  in_definition: "W definiowaniu",
  in_self_assessment: "W samoocenie",
  awaiting_manager_assessment: "W ocenie kierownika",
  completed: "Zakończony",
};
```

### Nowe typy do implementacji:
```typescript
// Model widoku dla pojedynczego celu
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
  isReadOnly: boolean; // zależne od statusu procesu
  selfAssessment?: {
    rating: number;
    comment: string;
    isSaving: boolean;
    error?: string;
  };
}

// Model widoku dla listy celów
interface GoalsListViewModel {
  goals: GoalViewModel[];
  totalWeight: number;
  formattedTotalWeight: string; // "XX%" - dla prezentacji
  isComplete: boolean; // czy suma wag = 100%
  processStatus: AssessmentProcessStatus;
  canEditSelfAssessment: boolean; // true tylko dla statusu "in_self_assessment"
}

// Interfejs dla API celów
interface GoalsApi {
  fetchGoals(processId: string): Promise<GoalListResponse & { processStatus: AssessmentProcessStatus }>;
  saveSelfAssessment(processId: string, goalId: string, rating: number, comment: string): Promise<void>;
}

// Hook props
interface UseGoalsProps {
  processId: string;
}

// Hook returns
interface UseGoalsResult {
  goals: GoalViewModel[];
  totalWeight: number;
  isLoading: boolean;
  error: string | null;
  reload: () => void; // Nazwa zgodna z konwencją istniejących hooków
  isComplete: boolean;
  processStatus: AssessmentProcessStatus;
  canEditSelfAssessment: boolean;
  saveSelfAssessment: (goalId: string, rating: number, comment: string) => Promise<void>;
  isSaving: Record<string, boolean>; // Stan zapisywania dla każdego celu
}

// Typy formularza samooceny
interface SelfAssessmentFormProps {
  goalId: string;
  initialRating?: number;
  initialComment?: string;
  onSave: (goalId: string, rating: number, comment: string) => Promise<void>;
  isSaving: boolean;
}

interface SelfAssessmentDTO {
  rating: number;
  comment: string;
}
```

## 6. Zarządzanie stanem

Zarządzanie stanem w widoku przeglądania celów i samooceny będzie realizowane za pomocą hooków React, zgodnie z konwencjami istniejącego dashboardu:

### Wykorzystanie istniejących hooków
- Sprawdź dostępność i wykorzystaj istniejące hooki do zarządzania stanem, np. `useAuth`, `useProcessStatus` itp.

### useState, useParams, useEffect
- Zastosowanie zgodnie z wzorcami używanymi w istniejącym dashboardzie

### Niestandardowy hook `useGoals`
```typescript
function useGoals({ processId }: UseGoalsProps): UseGoalsResult {
  const [goals, setGoals] = useState<GoalViewModel[]>([]);
  const [totalWeight, setTotalWeight] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [processStatus, setProcessStatus] = useState<AssessmentProcessStatus>('in_definition');
  const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});
  
  // Można wykorzystać istniejący hook do pobierania statusu procesu
  // const { processStatus } = useProcessStatus(processId);
  
  const canEditSelfAssessment = processStatus === 'in_self_assessment';
  
  // Sprawdź konwencje nazewnictwa funkcji w istniejących hookach
  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await goalsApi.fetchGoals(processId);
      
      // Pobierz status procesu (może być już dostępny z innego hooka)
      // Dla uproszczenia, załóżmy że status jest częścią odpowiedzi
      setProcessStatus(response.processStatus || 'in_definition');
      
      // Transformacja DTO na ViewModel
      const goalsViewModel = response.goals.map(goal => ({
        ...goal,
        formattedWeight: `${goal.weight}%`,
        isReadOnly: !canEditSelfAssessment,
        selfAssessment: goal.selfAssessment ? {
          ...goal.selfAssessment,
          isSaving: false,
        } : undefined,
      }));
      
      setGoals(goalsViewModel);
      setTotalWeight(response.totalWeight);
    } catch (err) {
      setError('Nie udało się pobrać celów. Spróbuj ponownie.');
    } finally {
      setIsLoading(false);
    }
  }, [processId, canEditSelfAssessment]);
  
  useEffect(() => {
    reload();
  }, [reload]);
  
  // Funkcja do zapisywania samooceny
  const saveSelfAssessment = useCallback(async (goalId: string, rating: number, comment: string) => {
    // Tylko dla statusu "in_self_assessment"
    if (!canEditSelfAssessment) {
      return;
    }
    
    // Aktualizacja stanu zapisywania
    setIsSaving(prev => ({ ...prev, [goalId]: true }));
    
    try {
      await goalsApi.saveSelfAssessment(processId, goalId, rating, comment);
      
      // Aktualizacja lokalnego stanu
      setGoals(prevGoals => 
        prevGoals.map(goal => 
          goal.id === goalId 
            ? { 
                ...goal, 
                selfAssessment: { 
                  rating, 
                  comment, 
                  isSaving: false 
                }
              }
            : goal
        )
      );
    } catch (err) {
      // Obsługa błędu - można dodać błąd do konkretnego celu
      setGoals(prevGoals => 
        prevGoals.map(goal => 
          goal.id === goalId && goal.selfAssessment
            ? { 
                ...goal, 
                selfAssessment: { 
                  ...goal.selfAssessment,
                  isSaving: false,
                  error: 'Błąd zapisywania oceny'
                }
              }
            : goal
        )
      );
    } finally {
      setIsSaving(prev => ({ ...prev, [goalId]: false }));
    }
  }, [processId, canEditSelfAssessment]);
  
  return {
    goals,
    totalWeight,
    isLoading,
    error,
    reload,
    isComplete: totalWeight === 100,
    processStatus,
    canEditSelfAssessment,
    saveSelfAssessment,
    isSaving,
  };
}
```

## 7. Integracja API

### Sprawdź istniejące serwisy API
Przed implementacją nowego serwisu API, sprawdź czy istnieją już podobne serwisy do pobierania danych, które można wykorzystać lub rozszerzyć.

### Pobieranie celów
```typescript
// API service - wykorzystaj istniejące wzorce struktur API z aplikacji
const goalsApi = {
  fetchGoals: async (processId: string): Promise<GoalListResponse & { processStatus: AssessmentProcessStatus }> => {
    // Sprawdź, czy istnieje już funkcja pomocnicza do wywołań API
    const response = await fetch(`/api/assessment-processes/${processId}/goals`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}` // Użyj istniejącej funkcji autoryzacyjnej
      }
    });
    
    if (!response.ok) {
      // Użyj istniejącego mechanizmu obsługi błędów API, jeśli jest dostępny
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
    
    return await response.json();
  },
  
  saveSelfAssessment: async (processId: string, goalId: string, rating: number, comment: string): Promise<void> => {
    // Sprawdź, czy istnieje już funkcja pomocnicza do wywołań API
    const response = await fetch(`/api/assessment-processes/${processId}/goals/${goalId}/self-assessment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}` // Użyj istniejącej funkcji autoryzacyjnej
      },
      body: JSON.stringify({ rating, comment })
    });
    
    if (!response.ok) {
      // Użyj istniejącego mechanizmu obsługi błędów API, jeśli jest dostępny
      if (response.status === 401) {
        throw new Error('Brak autoryzacji');
      } else if (response.status === 403) {
        throw new Error('Brak dostępu');
      } else if (response.status === 404) {
        throw new Error('Nie znaleziono zasobu');
      } else if (response.status === 422) {
        throw new Error('Nieprawidłowe dane oceny');
      } else {
        throw new Error('Wystąpił błąd podczas zapisywania oceny');
      }
    }
  }
};
```

### Mapowanie odpowiedzi API na modele widoku
```typescript
// Transformacja odpowiedzi API na modele widoku
function mapGoalDTOToViewModel(goalDTO: GoalDTO, canEditSelfAssessment: boolean): GoalViewModel {
  return {
    ...goalDTO,
    formattedWeight: `${goalDTO.weight}%`,
    isReadOnly: !canEditSelfAssessment,
    selfAssessment: goalDTO.selfAssessment ? {
      ...goalDTO.selfAssessment,
      isSaving: false,
    } : undefined,
  };
}

function mapGoalListResponseToViewModel(
  response: GoalListResponse & { processStatus: AssessmentProcessStatus }
): GoalsListViewModel {
  const canEditSelfAssessment = response.processStatus === 'in_self_assessment';
  
  return {
    goals: response.goals.map(goal => mapGoalDTOToViewModel(goal, canEditSelfAssessment)),
    totalWeight: response.totalWeight,
    formattedTotalWeight: `${response.totalWeight}%`,
    isComplete: response.totalWeight === 100,
    processStatus: response.processStatus,
    canEditSelfAssessment,
  };
}
```

## 8. Interakcje użytkownika

W widoku przeglądania celów i samooceny interakcje użytkownika są dostosowane do statusu procesu:

1. **Wejście na stronę**:
   - System automatycznie ładuje dane celów dla zalogowanego użytkownika
   - Wyświetla stepper z aktualnym statusem procesu
   - Dostosowuje widok do aktualnego statusu procesu

2. **Przeglądanie celów (wszystkie statusy)**:
   - Użytkownik może przeglądać listę celów
   - Każdy cel wyświetla opis, kategorię i wagę
   - Widoczna jest suma wag wszystkich celów

3. **Wprowadzanie samooceny (tylko status "in_self_assessment")**:
   - Użytkownik może wprowadzić ocenę (0-150) dla każdego celu
   - Użytkownik może wprowadzić komentarz dla każdego celu
   - System waliduje poprawność wprowadzonych danych
   - System automatycznie zapisuje wprowadzone zmiany

4. **Przeglądanie samooceny (statusy "awaiting_manager_assessment" i "completed")**:
   - Użytkownik może przeglądać wprowadzone wcześniej samooceny w trybie tylko do odczytu

5. **Obsługa błędów**:
   - W przypadku błędu, użytkownik może kliknąć przycisk ponownego załadowania
   - W przypadku błędów zapisywania samooceny, wyświetlany jest komunikat o błędzie

6. **Nawigacja**:
   - Użytkownik może wrócić do dashboardu za pomocą istniejącej nawigacji z DashboardLayout

## 9. Warunki i walidacja

Warunki i walidacja dla widoku przeglądania celów i samooceny:

1. **Warunki dostępu**:
   - Użytkownik musi być zalogowany
   - Użytkownik musi mieć uprawnienia do przeglądania celów i wprowadzania samooceny
   - Proces musi istnieć i mieć odpowiedni status

2. **Walidacja danych celów**:
   - Informacyjne wyświetlenie sumy wag celów (czy wynosi 100%)
   - Informacja o braku celów, jeśli lista jest pusta

3. **Walidacja samooceny (tylko w statusie "in_self_assessment")**:
   - Pole oceny musi zawierać wartość z zakresu 0-150
   - Pole komentarza jest opcjonalne
   - Wyświetlanie komunikatów o błędach walidacji

4. **Walidacje komponentów**:
   - GoalsList: Sprawdzenie czy suma wag wynosi dokładnie 100%
   - ProcessStepper: Sprawdzenie aktualnego statusu procesu
   - SelfAssessmentForm: Walidacja poprawności wprowadzonej oceny

## 10. Obsługa błędów

Strategia obsługi błędów w widoku przeglądania celów i samooceny - wykorzystaj istniejące mechanizmy z dashboardu:

1. **Błędy autoryzacji (401)**:
   - Wykorzystaj istniejący mechanizm przekierowania do strony logowania
   - Wykorzystaj istniejące komunikaty o wygaśnięciu sesji

2. **Błędy uprawnień (403)**:
   - Wykorzystaj istniejący komponent wyświetlania błędów uprawnień
   - Wykorzystaj istniejącą nawigację powrotu do dashboardu

3. **Błędy "Nie znaleziono" (404)**:
   - Wykorzystaj istniejący komponent wyświetlania błędów 404
   - Wykorzystaj istniejącą nawigację powrotu do dashboardu

4. **Błędy sieciowe i serwera**:
   - Wykorzystaj istniejący mechanizm obsługi błędów sieciowych
   - Wykorzystaj istniejący mechanizm ponownego załadowania danych

5. **Błędy walidacji samooceny (422)**:
   - Wyświetlanie komunikatów o błędach walidacji przy polach formularza
   - Wyróżnienie błędnych pól

6. **Stan pustych danych**:
   - Informacja o braku celów dla użytkownika w procesie

## 11. Kroki implementacji

1. **Analiza istniejącej struktury**:
   - Przegląd istniejących komponentów w dashboardzie
   - Identyfikacja komponentów do ponownego użycia (DashboardLayout, ProcessStepper, itp.)
   - Analiza istniejących hooków i serwisów API
   - Analiza konwencji nazewniczych i struktury plików

2. **Przygotowanie struktury plików**:
   - Utworzenie pliku `src/pages/process/[processId]/goals.astro` (weryfikacja struktury routingu)
   - Utworzenie komponentów React w `src/components/goals/` (lub w strukturze zgodnej z istniejącym dashboardem):
     - `GoalsPage.tsx`
     - `GoalsList.tsx`
     - `GoalCard.tsx`
     - `SelfAssessmentForm.tsx`

3. **Implementacja typów**:
   - Dodanie nowych interfejsów i typów do plików z komponentami lub do oddzielnego pliku typów

4. **Implementacja hooka useGoals**:
   - Wykorzystanie istniejących wzorców dla hooków
   - Implementacja hooka `useGoals.ts` w odpowiednim katalogu
   - Dodanie funkcjonalności zarządzania samoocenami

5. **Implementacja lub rozszerzenie API**:
   - Wykorzystanie istniejących serwisów API lub utworzenie nowych
   - Dostosowanie do konwencji stosowanych w projekcie
   - Dodanie endpointów do zarządzania samoocenami

6. **Implementacja komponentów UI**:
   - Wykorzystanie istniejących komponentów (DashboardLayout, ProcessStepper, itp.)
   - Implementacja GoalCard z wykorzystaniem komponentów Shadcn/ui
   - Implementacja GoalsList z zachowaniem spójności wizualnej
   - Implementacja SelfAssessmentForm z wykorzystaniem komponentów Shadcn/ui
   - Implementacja GoalsPage z integracją istniejących komponentów

7. **Integracja z routingiem Astro**:
   - Konfiguracja strony Astro z komponentem React
   - Integracja z istniejącą nawigacją

8. **Implementacja walidacji i obsługi błędów**:
   - Wykorzystanie istniejących mechanizmów obsługi błędów
   - Implementacja walidacji w komponentach
   - Dodanie walidacji dla pól samooceny

9. **Testowanie**:
   - Testowanie komponentów w różnych stanach (ładowanie, błąd, dane)
   - Testowanie komponentów w różnych statusach procesu
   - Testowanie funkcjonalności samooceny
   - Testowanie responsywności
   - Testowanie integracji z istniejącym dashboardem

10. **Optymalizacja wydajności**:
    - Zastosowanie React.memo dla komponentów wielokrotnego użytku
    - Optymalizacja renderowania listy celów

11. **Dokumentacja**:
    - Dodanie komentarzy JSDoc do kluczowych funkcji i komponentów
    - Aktualizacja dokumentacji projektu 