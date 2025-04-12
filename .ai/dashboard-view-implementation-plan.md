# Plan implementacji widoku Dashboard

## 1. Przegląd
Dashboard jest głównym widokiem aplikacji po zalogowaniu, prezentującym dostępne procesy oceny oraz - w przypadku kierownika - listę podwładnych pracowników. Widok umożliwia wybór procesu oceny oraz (dla kierownika) wybór pracownika, którego cele będą przeglądane lub oceniane.

## 2. Routing widoku
Ścieżka: `/dashboard`

## 3. Struktura komponentów
```
DashboardView
├── UserProfileHeader
├── ProcessList
│   └── ProcessCard (many)
├── EmployeeList (tylko dla kierowników)
│   └── EmployeeItem (many)
└── ProcessStepper (widoczny po wybraniu procesu)
```

## 4. Szczegóły komponentów

### DashboardView
- **Opis komponentu:** Główny kontener widoku, zarządzający stanem i renderujący podkomponenty w zależności od roli użytkownika
- **Główne elementy:** Container z nagłówkiem, sekcjami procesów i pracowników
- **Obsługiwane interakcje:** Wybór procesu oceny, wybór pracownika (dla kierownika)
- **Obsługiwana walidacja:** N/D (widok agregujący)
- **Typy:** `DashboardViewModel`, `UserViewModel`, `AssessmentProcessViewModel`, `EmployeeDTO`
- **Propsy:** N/D (komponent najwyższego poziomu)

### UserProfileHeader
- **Opis komponentu:** Nagłówek z informacjami o zalogowanym użytkowniku i przyciskiem wylogowania
- **Główne elementy:** Avatar użytkownika, nazwa użytkownika, przycisk wylogowania
- **Obsługiwane interakcje:** Kliknięcie przycisku wylogowania
- **Obsługiwana walidacja:** N/D
- **Typy:** `UserViewModel`
- **Propsy:** 
  ```typescript
  {
    user: UserViewModel;
    onLogout: () => void;
  }
  ```

### ProcessList
- **Opis komponentu:** Lista dostępnych procesów oceny z opcją filtrowania
- **Główne elementy:** Filtry (status, aktywność), lista kart procesów
- **Obsługiwane interakcje:** Filtrowanie procesów, paginacja, wybór procesu
- **Obsługiwana walidacja:** N/D (widok prezentacji danych)
- **Typy:** `AssessmentProcessViewModel[]`
- **Propsy:** 
  ```typescript
  {
    processes: AssessmentProcessViewModel[];
    totalCount: number;
    page: number;
    limit: number;
    onPageChange: (page: number) => void;
    onProcessSelect: (process: AssessmentProcessViewModel) => void;
    onFilterChange: (filter: AssessmentProcessFilterQueryParams) => void;
    isLoading: boolean;
  }
  ```

### ProcessCard
- **Opis komponentu:** Karta prezentująca podstawowe informacje o pojedynczym procesie oceny
- **Główne elementy:** Tytuł procesu, daty, status, wskaźnik aktywności
- **Obsługiwane interakcje:** Kliknięcie (wybór procesu)
- **Obsługiwana walidacja:** N/D
- **Typy:** `AssessmentProcessViewModel`
- **Propsy:** 
  ```typescript
  {
    process: AssessmentProcessViewModel;
    onClick: (process: AssessmentProcessViewModel) => void;
    isSelected: boolean;
  }
  ```

### EmployeeList
- **Opis komponentu:** Lista pracowników podwładnych kierownikowi
- **Główne elementy:** Lista elementów pracowników, wyszukiwarka
- **Obsługiwane interakcje:** Wyszukiwanie pracowników, paginacja, wybór pracownika
- **Obsługiwana walidacja:** N/D
- **Typy:** `EmployeeDTO[]`
- **Propsy:** 
  ```typescript
  {
    employees: EmployeeDTO[];
    totalCount: number;
    page: number;
    limit: number;
    onPageChange: (page: number) => void;
    onEmployeeSelect: (employee: EmployeeDTO) => void;
    selectedEmployeeId?: string;
    isLoading: boolean;
  }
  ```

### EmployeeItem
- **Opis komponentu:** Element listy reprezentujący pojedynczego pracownika
- **Główne elementy:** Imię i nazwisko pracownika, email, avatar
- **Obsługiwane interakcje:** Kliknięcie (wybór pracownika)
- **Obsługiwana walidacja:** N/D
- **Typy:** `EmployeeDTO`
- **Propsy:** 
  ```typescript
  {
    employee: EmployeeDTO;
    onClick: (employee: EmployeeDTO) => void;
    isSelected: boolean;
  }
  ```

### ProcessStepper
- **Opis komponentu:** Wizualizacja etapów procesu oceny w formie jednowierszowego steppera
- **Główne elementy:** Etapy procesu (statusy) z wyróżnionym aktualnym statusem
- **Obsługiwane interakcje:** N/D (komponent informacyjny)
- **Obsługiwana walidacja:** N/D
- **Typy:** `AssessmentProcessStatus`
- **Propsy:** 
  ```typescript
  {
    currentStatus: AssessmentProcessStatus;
    processId: string;
  }
  ```

## 5. Typy

### ViewModele (rozszerzenia istniejących DTO):

```typescript
// Rozszerzenie istniejącego UserDTO
interface UserViewModel extends UserDTO {
  isManager: boolean;
  managerName?: string;
}

// Rozszerzenie istniejącego AssessmentProcessDTO
interface AssessmentProcessViewModel extends AssessmentProcessDTO {
  statusLabel: string;
  formattedStartDate: string;
  formattedEndDate: string;
}

// Główny model widoku
interface DashboardViewModel {
  user: UserViewModel;
  processes: AssessmentProcessViewModel[];
  employees: EmployeeDTO[];
  selectedProcess?: AssessmentProcessViewModel;
  selectedEmployee?: EmployeeDTO;
  isManager: boolean;
  isLoading: boolean;
  error?: string;
}

// Mapowanie statusów na etykiety w języku polskim
const STATUS_LABELS: Record<AssessmentProcessStatus, string> = {
  in_definition: 'W definiowaniu',
  in_self_assessment: 'W samoocenie',
  awaiting_manager_assessment: 'W ocenie kierownika',
  completed: 'Zakończony',
};
```

## 6. Zarządzanie stanem

### Hook useDashboard

```typescript
interface UseDashboardResult {
  dashboardState: DashboardViewModel;
  fetchProcesses: (params?: AssessmentProcessFilterQueryParams) => Promise<void>;
  fetchEmployees: (page?: number, limit?: number) => Promise<void>;
  selectProcess: (process: AssessmentProcessDTO) => void;
  selectEmployee: (employee: EmployeeDTO) => void;
  logout: () => void;
}

const useDashboard = (): UseDashboardResult => {
  const [dashboardState, setDashboardState] = useState<DashboardViewModel>({ 
    // Stan początkowy
  });
  
  // Implementacja metod pobrania danych i obsługi akcji użytkownika
  
  return {
    dashboardState,
    fetchProcesses,
    fetchEmployees,
    selectProcess,
    selectEmployee,
    logout
  };
};
```

Hook zarządza:
- Pobieraniem i formatowaniem danych użytkownika
- Pobieraniem i filtrowaniem procesów oceny
- Pobieraniem listy pracowników (dla kierownika)
- Wyborem procesu i pracownika
- Obsługą akcji wylogowania
- Obsługą błędów i stanów ładowania

## 7. Integracja API

### Wykorzystywane endpointy:

1. **Pobieranie danych użytkownika:**
   ```typescript
   // GET /users/{userId}
   const fetchUserData = async (userId: string) => {
     const response = await fetch(`/api/users/${userId}`);
     if (!response.ok) throw new Error('Błąd pobierania danych użytkownika');
     return await response.json() as UserDTO;
   };
   ```

2. **Pobieranie procesów oceny:**
   ```typescript
   // GET /assessment-processes
   const fetchProcesses = async (params?: AssessmentProcessFilterQueryParams) => {
     const queryParams = new URLSearchParams();
     if (params?.status) queryParams.set('status', params.status);
     if (params?.active !== undefined) queryParams.set('active', params.active.toString());
     if (params?.page) queryParams.set('page', params.page.toString());
     if (params?.limit) queryParams.set('limit', params.limit.toString());
     
     const response = await fetch(`/api/assessment-processes?${queryParams}`);
     if (!response.ok) throw new Error('Błąd pobierania procesów oceny');
     return await response.json() as AssessmentProcessListResponse;
   };
   ```

3. **Pobieranie szczegółów procesu:**
   ```typescript
   // GET /assessment-processes/{processId}
   const fetchProcessDetails = async (processId: string) => {
     const response = await fetch(`/api/assessment-processes/${processId}`);
     if (!response.ok) throw new Error('Błąd pobierania szczegółów procesu');
     return await response.json() as AssessmentProcessDTO;
   };
   ```

## 8. Interakcje użytkownika

1. **Logowanie i przekierowanie do dashboardu:**
   - Po udanym logowaniu system przekierowuje użytkownika do widoku dashboardu
   - Dashboard automatycznie pobiera dane użytkownika i dostępne procesy oceny
   - W przypadku kierownika pobierana jest również lista podwładnych pracowników

2. **Wybór procesu oceny:**
   - Użytkownik klika na kartę procesu oceny z listy dostępnych procesów
   - System wyświetla stepper z etapami procesu i wyróżnionym aktualnym statusem
   - W zależności od statusu procesu i roli użytkownika, system przygotowuje odpowiedni widok procesu

3. **Wybór pracownika (dla kierownika):**
   - Kierownik klika na pracownika z listy podwładnych
   - System przygotowuje widok celów wybranego pracownika w kontekście wybranego procesu oceny

4. **Filtrowanie procesów:**
   - Użytkownik może filtrować procesy oceny według statusu i aktywności
   - Lista procesów jest dynamicznie aktualizowana zgodnie z wybranymi filtrami

5. **Wylogowanie:**
   - Użytkownik klika przycisk wylogowania w nagłówku
   - System wylogowuje użytkownika i przekierowuje do strony logowania

## 9. Warunki i walidacja

1. **Widoczność komponentu EmployeeList:**
   - Warunek: Użytkownik ma rolę kierownika
   - Implementacja: `{isManager && <EmployeeList ... />}`

2. **Przejście do widoku procesu:**
   - Warunek: Wybrany proces oceny
   - Implementacja: `{selectedProcess && <ProcessStepper ... />}`

3. **Aktywacja przycisku zmiany statusu procesu:**
   - Warunek: Użytkownik jest kierownikiem i spełnione są warunki przejścia do następnego statusu
   - Implementacja: Sprawdzanie uprawnienia do zmiany statusu i wyświetlanie przycisku tylko gdy jest to możliwe

## 10. Obsługa błędów

1. **Błąd uwierzytelnienia:**
   - Przechwytywanie błędów 401 (Unauthorized)
   - Przekierowanie do strony logowania z komunikatem o wygaśnięciu sesji

2. **Błąd pobierania danych:**
   - Obsługa w try-catch w hooku useDashboard
   - Ustawienie stanu błędu w modelu widoku
   - Wyświetlenie komunikatu o błędzie z opcją ponowienia próby

3. **Brak dostępnych procesów:**
   - Sprawdzenie pustej tablicy procesów
   - Wyświetlenie komunikatu informacyjnego "Brak dostępnych procesów oceny"

4. **Brak dostępu do zasobów:**
   - Obsługa błędów 403 (Forbidden)
   - Wyświetlenie komunikatu o braku uprawnień do danego zasobu

## 11. Kroki implementacji

1. **Utworzenie struktury plików:**
   - Utworzenie katalogu `src/components/dashboard`
   - Utworzenie plików dla głównego komponentu i podkomponentów

2. **Implementacja typów i modeli widoku:**
   - Zdefiniowanie interfejsów dla ViewModele
   - Implementacja funkcji mapujących DTO na ViewModele

3. **Implementacja hooka useDashboard:**
   - Implementacja zarządzania stanem
   - Implementacja funkcji pobierania danych z API
   - Implementacja obsługi akcji użytkownika

4. **Implementacja komponentu głównego DashboardView:**
   - Struktura podstawowa komponentu
   - Integracja z hookiem useDashboard
   - Warunkowe renderowanie podkomponentów w zależności od roli użytkownika

5. **Implementacja podkomponentów:**
   - UserProfileHeader
   - ProcessList i ProcessCard
   - EmployeeList i EmployeeItem
   - ProcessStepper

6. **Implementacja routingu:**
   - Dodanie ścieżki `/dashboard` do konfiguracji routingu
   - Implementacja przekierowania po zalogowaniu

7. **Implementacja integracji z API:**
   - Funkcje do komunikacji z endpointami API
   - Obsługa błędów i stanów ładowania

8. **Testy i walidacja:**
   - Testowanie różnych ról użytkowników
   - Testowanie różnych scenariuszy błędów
   - Walidacja zgodności z wymaganiami PRD 