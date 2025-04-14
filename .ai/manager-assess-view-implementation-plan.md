# Plan implementacji widoku oceny kierownika

## 1. Przegląd
Widok oceny kierownika to rozszerzenie istniejącego widoku celów pracownika, które umożliwia kierownikom ocenę realizacji celów przez pracowników po zakończeniu etapu samooceny. Nowa funkcjonalność będzie zintegrowana z istniejącym widokiem, dodając sekcję oceny kierownika pod sekcją samooceny dla każdego celu.

## 2. Routing widoku
Wykorzystamy istniejący routing:
- Widok pracownika: `/process/{processId}/goals`
- Widok kierownika: `/process/{processId}/employee/{employeeId}/goals`

Ocena kierownika będzie dostępna w tym samym widoku, bez dodatkowego routingu.

## 3. Struktura komponentów
```
GoalsViewPage
├── ProcessStepper
├── GoalsList
│   ├── GoalItem (dla każdego celu)
│   │   ├── GoalDetails
│   │   ├── SelfAssessmentForm (jeśli dostępna)
│   │   └── ManagerAssessmentForm (nowy komponent, jeśli dostępny)
```

## 4. Szczegóły komponentów
### ManagerAssessmentForm
- Opis komponentu: Formularz umożliwiający kierownikowi wprowadzenie oceny realizacji celu przez pracownika z opcjonalnym komentarzem.
- Główne elementy: 
  - Pole numeryczne na ocenę (0-150)
  - Pole tekstowe na komentarz
  - Przycisk zapisu oceny
  - Wskaźnik ładowania podczas zapisywania
  - Komunikaty błędów walidacji
- Obsługiwane interakcje: 
  - Wprowadzanie wartości oceny
  - Wprowadzanie komentarza
  - Zapisywanie oceny
- Obsługiwana walidacja: 
  - Ocena musi być liczbą w zakresie 0-150
  - Ocena jest wymagana
  - Komentarz jest opcjonalny
- Typy: 
  - ManagerAssessmentFormProps
  - ManagerAssessmentDTO
- Propsy: 
  ```typescript
  interface ManagerAssessmentFormProps {
    goalId: string;
    initialRating?: number;
    initialComment?: string;
    onSave: (goalId: string, rating: number, comment: string) => Promise<void>;
    isSaving: boolean;
    canEdit: boolean;
  }
  ```

### GoalsList (rozszerzenie)
- Opis komponentu: Lista celów pracownika z możliwością wyświetlania formularzy samooceny i oceny kierownika.
- Główne elementy:
  - Lista celów z ich szczegółami
  - Formularze samooceny (istniejące)
  - Formularze oceny kierownika (nowe)
- Obsługiwane interakcje:
  - Wyświetlanie formularzy oceny kierownika gdy status procesu to "awaiting_manager_assessment" lub "completed"
  - Przełączanie między trybem edycji i tylko do odczytu w zależności od statusu i roli
- Typy:
  - Rozszerzenie istniejących propsów GoalsList o managerAssessments, canEditManagerAssessment, saveManagerAssessment, isSavingManagerAssessment

## 5. Typy
### ManagerAssessmentDTO
```typescript
interface ManagerAssessmentDTO {
  id: string;
  rating: number;
  comments: string | null;
  createdAt: string;
  updatedAt?: string;
}
```

### ManagerAssessmentFormProps
```typescript
interface ManagerAssessmentFormProps {
  goalId: string;
  initialRating?: number;
  initialComment?: string;
  onSave: (goalId: string, rating: number, comment: string) => Promise<void>;
  isSaving: boolean;
  canEdit: boolean;
}
```

### Rozszerzenie GoalsListProps
```typescript
interface GoalsListProps {
  // istniejące propsy
  goals: GoalDTO[];
  totalWeight: number;
  isLoading: boolean;
  canEditSelfAssessment: boolean;
  saveSelfAssessment?: (goalId: string, rating: number, comment: string) => Promise<void>;
  isSaving: boolean;
  employee?: EmployeeDTO;
  
  // nowe propsy
  managerAssessments?: Record<string, ManagerAssessmentDTO>;
  canEditManagerAssessment: boolean;
  saveManagerAssessment?: (goalId: string, rating: number, comment: string) => Promise<void>;
  isSavingManagerAssessment: boolean;
}
```

## 6. Zarządzanie stanem
### useManagerAssessment (nowy hook)
Hook do zarządzania stanem ocen kierownika, pobierania i zapisywania ocen.

```typescript
function useManagerAssessment({
  processId,
  employeeId,
}: {
  processId: string;
  employeeId: string;
}) {
  const [assessments, setAssessments] = useState<Record<string, ManagerAssessmentDTO>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [canEditManagerAssessment, setCanEditManagerAssessment] = useState(false);

  // Logika pobierania ocen kierownika dla wszystkich celów pracownika
  // Logika określania, czy kierownik może edytować oceny
  // Funkcja zapisywania oceny kierownika

  return {
    assessments,
    isLoading,
    error,
    saveManagerAssessment,
    isSaving,
    canEditManagerAssessment,
  };
}
```

### Rozszerzenie useGoals (opcjonalnie)
Alternatywnie można rozszerzyć istniejący hook useGoals o funkcjonalność związaną z ocenami kierownika.

## 7. Integracja API
### Pobieranie ocen kierownika
```typescript
// Dla każdego celu pracownika:
const fetchManagerAssessment = async (goalId: string) => {
  try {
    const response = await fetch(`/api/goals/${goalId}/manager-assessment`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    
    if (!response.ok) {
      // Obsługa błędów HTTP
      return null;
    }
    
    const data = await response.json();
    return data as ManagerAssessmentDTO;
  } catch (error) {
    console.error("Błąd pobierania oceny kierownika:", error);
    return null;
  }
};
```

### Zapisywanie oceny kierownika
```typescript
const saveManagerAssessment = async (goalId: string, rating: number, comments: string) => {
  try {
    setIsSaving(true);
    
    const response = await fetch(`/api/goals/${goalId}/manager-assessment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        rating,
        comments,
      }),
    });
    
    if (!response.ok) {
      // Obsługa błędów HTTP
      throw new Error("Błąd zapisywania oceny");
    }
    
    const data = await response.json();
    
    // Aktualizacja stanu z nową oceną
    setAssessments(prev => ({
      ...prev,
      [goalId]: data,
    }));
    
    return data;
  } catch (error) {
    console.error("Błąd zapisywania oceny kierownika:", error);
    throw error;
  } finally {
    setIsSaving(false);
  }
};
```

## 8. Interakcje użytkownika
1. **Wyświetlanie formularza oceny kierownika:**
   - Formularz oceny kierownika jest wyświetlany tylko gdy:
     - Użytkownik jest kierownikiem (isManager = true)
     - Status procesu to "awaiting_manager_assessment" lub "completed"
   - W statusie "completed" formularz jest wyświetlany w trybie tylko do odczytu

2. **Wprowadzanie oceny:**
   - Kierownik wprowadza wartość liczbową w polu oceny (0-150)
   - System waliduje wartość i wyświetla komunikat błędu jeśli wartość jest niepoprawna

3. **Wprowadzanie komentarza:**
   - Kierownik może wprowadzić opcjonalny komentarz do oceny
   - Komentarz nie podlega specjalnej walidacji

4. **Zapisywanie oceny:**
   - Kierownik klika przycisk "Zapisz ocenę"
   - System waliduje dane i wysyła żądanie do API
   - Podczas zapisywania przycisk jest wyłączony i wyświetlany jest wskaźnik ładowania
   - Po zapisaniu formularz pozostaje aktywny z możliwością edycji

## 9. Warunki i walidacja
### Warunki wyświetlania formularza oceny kierownika
- Użytkownik musi być zalogowany
- Użytkownik musi być kierownikiem (isManager = true)
- Status procesu musi być "awaiting_manager_assessment" lub "completed"
- W statusie "completed" formularz jest wyświetlany w trybie tylko do odczytu

### Walidacja oceny
- Ocena musi być liczbą w zakresie 0-150
- Ocena jest wymagana do zapisania formularza
- Komentarz jest opcjonalny

## 10. Obsługa błędów
### Błędy pobierania ocen
- Wyświetlenie komunikatu o błędzie w interfejsie użytkownika
- Możliwość ponownej próby pobrania danych

### Błędy walidacji formularza
- Wyświetlenie komunikatu o błędzie pod polem formularza
- Blokada możliwości zapisania formularza do czasu poprawienia błędów

### Błędy zapisywania oceny
- Wyświetlenie komunikatu o błędzie
- Zachowanie wprowadzonych danych w formularzu
- Możliwość ponownej próby zapisania formularza

### Brak uprawnień
- Ukrycie formularza oceny kierownika
- Wyświetlenie komunikatu o braku uprawnień

## 11. Kroki implementacji
1. **Utworzenie komponentu ManagerAssessmentForm:**
   - Stworzenie nowego pliku `src/components/goals-view/ManagerAssessmentForm.tsx`
   - Implementacja formularza na wzór istniejącego `SelfAssessmentForm.tsx`
   - Dodanie walidacji oceny (0-150)

2. **Utworzenie hooka useManagerAssessment:**
   - Stworzenie nowego pliku `src/components/goals-view/hooks/useManagerAssessment.ts`
   - Implementacja logiki pobierania i zapisywania ocen kierownika
   - Implementacja logiki określania, czy kierownik może edytować oceny

3. **Aktualizacja komponentu GoalsList:**
   - Dodanie obsługi nowych propsów związanych z ocenami kierownika
   - Rozszerzenie logiki wyświetlania celów o formularze oceny kierownika

4. **Aktualizacja komponentu GoalsViewPage:**
   - Wykorzystanie hooka useManagerAssessment
   - Przekazanie propsów związanych z ocenami kierownika do GoalsList

5. **Aktualizacja typów:**
   - Dodanie nowych typów i interfejsów w odpowiednich miejscach
   - Aktualizacja istniejących interfejsów o nowe pola

6. **Testowanie:**
   - Testowanie różnych scenariuszy użycia
   - Testowanie obsługi błędów
   - Testowanie walidacji formularza

7. **Finalizacja i dokumentacja:**
   - Czyszczenie kodu i usuwanie zbędnych logów
   - Aktualizacja dokumentacji i komentarzy
   - Przygotowanie PR do mergowania 