# Plan implementacji widoku przeglądania celów

## 1. Przegląd
Widok przeglądania celów umożliwia pracownikowi wyświetlenie przypisanych mu celów w trybie tylko do odczytu podczas gdy proces oceny jest w statusie "W definiowaniu". Pracownik może zobaczyć listę celów wraz z ich opisami, kategoriami i wagami, ale bez możliwości edycji. Widok będzie zintegrowany z istniejącym dashboardem i będzie wykorzystywał wspólne komponenty dla zachowania spójności.

## 2. Routing widoku
- Ścieżka: `/process/{processId}/goals-view`
- Dostępność: Tylko dla zalogowanych pracowników, gdy proces oceny jest w statusie "W definiowaniu"
- Uwaga: Upewnij się, że struktura routingu jest zgodna z konwencjami stosowanymi w istniejącej aplikacji. Może być konieczne dostosowanie ścieżki, jeśli dashboard używa innego wzorca.

## 3. Struktura komponentów
```
GoalsViewPage
├── DashboardLayout (z istniejącej implementacji)
├── ProcessStepper (współdzielony z dashboardem)
├── LoadingSpinner (z Shadcn/ui lub komponentów współdzielonych)
├── ErrorDisplay (z komponentów współdzielonych)
└── GoalsList
    └── GoalCard (dla każdego celu)
```

## 4. Szczegóły komponentów

### GoalsViewPage
- Opis komponentu: Główny komponent strony do przeglądania celów, zarządza stanem, pobiera dane i renderuje pozostałe komponenty
- Główne elementy: 
  - Wykorzystuje istniejący DashboardLayout (wspólny layout z nagłówkiem i nawigacją)
  - ProcessStepper pokazujący etapy procesu
  - Sekcja z listą celów
  - Stany ładowania i błędów
- Obsługiwane interakcje: Załadowanie danych przy montowaniu komponentu
- Obsługiwana walidacja: Sprawdzenie czy użytkownik ma uprawnienia do przeglądania celów, czy proces istnieje, czy jest we właściwym statusie
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
- Opis komponentu: Lista celów pracownika z ich opisem, kategorią i wagą
- Główne elementy: 
  - Nagłówek z informacją o sumie wag
  - Lista kart celów
  - Informacja o braku celów, jeśli lista jest pusta
- Obsługiwane interakcje: Brak (tylko odczyt)
- Obsługiwana walidacja: Wyświetlenie sumy wag dla informacji (czy suma = 100%)
- Typy: GoalViewModel[], GoalsListViewModel
- Propsy: 
  ```typescript
  {
    goals: GoalViewModel[];
    totalWeight: number;
    isLoading: boolean;
  }
  ```
- Style: Wykorzystanie klas Tailwind zgodnych z istniejącym dashboardem oraz komponentów Shadcn/ui dla zachowania spójności wizualnej

### GoalCard
- Opis komponentu: Pojedynczy element listy celów przedstawiający informacje o celu
- Główne elementy: 
  - Opis celu
  - Kategoria celu
  - Waga celu (%)
- Obsługiwane interakcje: Brak (tylko odczyt)
- Obsługiwana walidacja: Brak
- Typy: GoalViewModel
- Propsy: 
  ```typescript
  {
    goal: GoalViewModel;
  }
  ```
- Style: Wykorzystanie klas Tailwind zgodnych z istniejącym dashboardem oraz komponentów Shadcn/ui (Card, Badge) dla zachowania spójności wizualnej

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
  isReadOnly: boolean; // zawsze true dla tego widoku
}

// Model widoku dla listy celów
interface GoalsListViewModel {
  goals: GoalViewModel[];
  totalWeight: number;
  formattedTotalWeight: string; // "XX%" - dla prezentacji
  isComplete: boolean; // czy suma wag = 100%
}

// Interfejs dla API celów
interface GoalsApi {
  fetchGoals(processId: string, employeeId: string): Promise<GoalListResponse>;
}

// Hook props
interface UseGoalsProps {
  processId: string;
  employeeId: string;
}

// Hook returns
interface UseGoalsResult {
  goals: GoalViewModel[];
  totalWeight: number;
  isLoading: boolean;
  error: string | null;
  reload: () => void; // Nazwa zgodna z konwencją istniejących hooków
  isComplete: boolean;
}
```

## 6. Zarządzanie stanem

Zarządzanie stanem w widoku przeglądania celów będzie realizowane za pomocą hooków React, zgodnie z konwencjami istniejącego dashboardu:

### Wykorzystanie istniejących hooków
- Sprawdź dostępność i wykorzystaj istniejące hooki do zarządzania stanem, np. `useAuth`, `useProcessStatus` itp.

### useState, useParams, useEffect
- Zastosowanie zgodnie z wzorcami używanymi w istniejącym dashboardzie

### Niestandardowy hook `useGoals`
```typescript
function useGoals({ processId, employeeId }: UseGoalsProps): UseGoalsResult {
  const [goals, setGoals] = useState<GoalViewModel[]>([]);
  const [totalWeight, setTotalWeight] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Sprawdź konwencje nazewnictwa funkcji w istniejących hookach
  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await goalsApi.fetchGoals(processId, employeeId);
      
      // Transformacja DTO na ViewModel
      const goalsViewModel = response.goals.map(goal => ({
        ...goal,
        formattedWeight: `${goal.weight}%`,
        isReadOnly: true,
      }));
      
      setGoals(goalsViewModel);
      setTotalWeight(response.totalWeight);
    } catch (err) {
      setError('Nie udało się pobrać celów. Spróbuj ponownie.');
    } finally {
      setIsLoading(false);
    }
  }, [processId, employeeId]);
  
  useEffect(() => {
    reload();
  }, [reload]);
  
  return {
    goals,
    totalWeight,
    isLoading,
    error,
    reload, // Nazwa zgodna z konwencją istniejących hooków
    isComplete: totalWeight === 100,
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
  fetchGoals: async (processId: string, employeeId: string): Promise<GoalListResponse> => {
    // Sprawdź, czy istnieje już funkcja pomocnicza do wywołań API
    const response = await fetch(`/api/assessment-processes/${processId}/employees/${employeeId}/goals`, {
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
  }
};
```

### Mapowanie odpowiedzi API na modele widoku
```typescript
// Transformacja odpowiedzi API na modele widoku
function mapGoalDTOToViewModel(goalDTO: GoalDTO): GoalViewModel {
  return {
    ...goalDTO,
    formattedWeight: `${goalDTO.weight}%`,
    isReadOnly: true,
  };
}

function mapGoalListResponseToViewModel(response: GoalListResponse): GoalsListViewModel {
  return {
    goals: response.goals.map(mapGoalDTOToViewModel),
    totalWeight: response.totalWeight,
    formattedTotalWeight: `${response.totalWeight}%`,
    isComplete: response.totalWeight === 100,
  };
}
```

## 8. Interakcje użytkownika

W widoku przeglądania celów interakcje użytkownika są minimalne, ponieważ jest to widok tylko do odczytu:

1. **Wejście na stronę**:
   - System automatycznie ładuje dane celów dla zalogowanego użytkownika
   - Wyświetla stepper z aktualnym statusem procesu

2. **Przeglądanie celów**:
   - Użytkownik może przeglądać listę celów
   - Każdy cel wyświetla opis, kategorię i wagę
   - Widoczna jest suma wag wszystkich celów

3. **Obsługa błędów**:
   - W przypadku błędu, użytkownik może kliknąć przycisk ponownego załadowania

4. **Nawigacja**:
   - Użytkownik może wrócić do dashboardu za pomocą istniejącej nawigacji z DashboardLayout

## 9. Warunki i walidacja

Warunki i walidacja dla widoku przeglądania celów:

1. **Warunki dostępu**:
   - Użytkownik musi być zalogowany
   - Użytkownik musi mieć uprawnienia do przeglądania celów
   - Proces musi istnieć i być w statusie "W definiowaniu"

2. **Walidacja danych**:
   - Informacyjne wyświetlenie sumy wag celów (czy wynosi 100%)
   - Informacja o braku celów, jeśli lista jest pusta

3. **Walidacje komponentów**:
   - GoalsList: Sprawdzenie czy suma wag wynosi dokładnie 100%
   - ProcessStepper: Sprawdzenie aktualnego statusu procesu

## 10. Obsługa błędów

Strategia obsługi błędów w widoku przeglądania celów - wykorzystaj istniejące mechanizmy z dashboardu:

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

5. **Stan pustych danych**:
   - Informacja o braku celów dla użytkownika w procesie

## 11. Kroki implementacji

1. **Analiza istniejącej struktury**:
   - Przegląd istniejących komponentów w dashboardzie
   - Identyfikacja komponentów do ponownego użycia (DashboardLayout, ProcessStepper, itp.)
   - Analiza istniejących hooków i serwisów API
   - Analiza konwencji nazewniczych i struktury plików

2. **Przygotowanie struktury plików**:
   - Utworzenie pliku `src/pages/process/[processId]/goals-view.astro` (weryfikacja struktury routingu)
   - Utworzenie komponentów React w `src/components/goals-view/` (lub w strukturze zgodnej z istniejącym dashboardem):
     - `GoalsViewPage.tsx`
     - `GoalsList.tsx`
     - `GoalCard.tsx`

3. **Implementacja typów**:
   - Dodanie nowych interfejsów i typów do plików z komponentami lub do oddzielnego pliku typów

4. **Implementacja hooka useGoals**:
   - Wykorzystanie istniejących wzorców dla hooków
   - Implementacja hooka `useGoals.ts` w odpowiednim katalogu

5. **Implementacja lub rozszerzenie API**:
   - Wykorzystanie istniejących serwisów API lub utworzenie nowych
   - Dostosowanie do konwencji stosowanych w projekcie

6. **Implementacja komponentów UI**:
   - Wykorzystanie istniejących komponentów (DashboardLayout, ProcessStepper, itp.)
   - Implementacja GoalCard z wykorzystaniem komponentów Shadcn/ui
   - Implementacja GoalsList z zachowaniem spójności wizualnej
   - Implementacja GoalsViewPage z integracją istniejących komponentów

7. **Integracja z routingiem Astro**:
   - Konfiguracja strony Astro z komponentem React
   - Integracja z istniejącą nawigacją

8. **Implementacja walidacji i obsługi błędów**:
   - Wykorzystanie istniejących mechanizmów obsługi błędów
   - Implementacja walidacji w komponentach

9. **Testowanie**:
   - Testowanie komponentów w różnych stanach (ładowanie, błąd, dane)
   - Testowanie responsywności
   - Testowanie integracji z istniejącym dashboardem

10. **Optymalizacja wydajności**:
    - Zastosowanie React.memo dla komponentów wielokrotnego użytku
    - Optymalizacja renderowania listy celów

11. **Dokumentacja**:
    - Dodanie komentarzy JSDoc do kluczowych funkcji i komponentów
    - Aktualizacja dokumentacji projektu 