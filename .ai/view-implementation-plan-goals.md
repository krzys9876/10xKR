# API Endpoint Implementation Plan: Goals API Endpoints

## Implementacja endpointów API dla celów (Goals)

Poniższy plan implementacyjny opisuje wszystkie endpointy API związane z zarządzaniem celami w systemie ocen pracowniczych.

### Endpointy objęte planem:

1. `POST /assessment-processes/{processId}/employees/{employeeId}/goals` - tworzenie nowego celu dla pracownika
2. `GET /assessment-processes/{processId}/employees/{employeeId}/goals` - pobieranie listy celów pracownika 
3. `GET /goals/{goalId}` - pobieranie szczegółów pojedynczego celu
4. `PUT /goals/{goalId}` - aktualizacja celu
5. `DELETE /goals/{goalId}` - usuwanie celu
6. `GET /predefined-goals` - pobieranie listy predefiniowanych celów

## 1. POST /assessment-processes/{processId}/employees/{employeeId}/goals

### 1.1. Przegląd punktu końcowego
Endpoint służy do tworzenia nowych celów dla pracownika w ramach konkretnego procesu oceny. Umożliwia menedżerom lub pracownikom definiowanie celów z określonym opisem, wagą oraz kategorią. Endpoint zwraca utworzony cel wraz z ewentualnymi błędami walidacji.

### 1.2. Szczegóły żądania
- Metoda HTTP: POST
- Struktura URL: /assessment-processes/{processId}/employees/{employeeId}/goals
- Parametry ścieżki:
  - processId: identyfikator UUID procesu oceny
  - employeeId: identyfikator UUID pracownika
- Request Body:
  ```json
  {
    "description": "string",
    "weight": "number",
    "categoryId": "uuid"
  }
  ```
- Wymagane nagłówki: 
  - Authorization: Bearer {token} - token JWT uzyskany podczas logowania

### 1.3. Wykorzystywane typy
```typescript
// Z src/types.ts:
import { 
  CreateGoalCommand, 
  GoalResponse, 
  GoalDTO, 
  AssessmentProcessStatus 
} from "../types";

// Do walidacji:
import { z } from "zod";

const createGoalSchema = z.object({
  description: z.string().min(5, { message: "Opis celu musi mieć minimum 5 znaków" }).max(500, { message: "Opis celu nie może przekraczać 500 znaków" }),
  weight: z.number().min(0, { message: "Waga celu musi być większa lub równa 0%" }).max(100, { message: "Waga celu nie może przekraczać 100%" }),
  categoryId: z.string().uuid({ message: "Nieprawidłowy format identyfikatora kategorii" })
});

const pathParamsSchema = z.object({
  processId: z.string().uuid({ message: "Nieprawidłowy format identyfikatora procesu" }),
  employeeId: z.string().uuid({ message: "Nieprawidłowy format identyfikatora pracownika" })
});
```

### 1.4. Szczegóły odpowiedzi
- Sukces (201 Created):
  ```json
  {
    "id": "uuid",
    "description": "string",
    "weight": "number",
    "category": {
      "id": "uuid",
      "name": "string"
    },
    "validationErrors": []
  }
  ```
- Niepowodzenie:
  - 400 Bad Request: Nieprawidłowe dane wejściowe lub błędy walidacji biznesowej
  - 401 Unauthorized: Brak tokenu lub nieprawidłowy token
  - 403 Forbidden: Brak uprawnień do wykonania operacji
  - 404 Not Found: Proces oceny lub pracownik o podanym identyfikatorze nie istnieje
  - 500 Internal Server Error: Błąd serwera

### 1.5. Przepływ danych
1. Endpoint odbiera żądanie POST z danymi celu do utworzenia
2. Middleware autoryzacyjne weryfikuje token JWT i sprawdza uprawnienia użytkownika
3. Parametry ścieżki oraz dane wejściowe są walidowane przy użyciu schematów Zod
4. Sprawdzane jest czy:
   - Proces oceny istnieje i ma status "in_definition"
   - Pracownik istnieje
   - Kategoria celu istnieje
   - Zalogowany użytkownik jest menedżerem pracownika lub samym pracownikiem
5. Cel jest tworzony w bazie danych
6. Zwracana jest odpowiedź z utworzonym celem lub odpowiednimi błędami walidacji

### 1.6. Względy bezpieczeństwa
- Weryfikacja tokenu JWT oraz uprawnień użytkownika
- Ograniczenie dostępu tylko dla menedżerów danego pracownika lub samego pracownika
- Walidacja wszystkich danych wejściowych przed zapisem do bazy danych
- Weryfikacja, czy proces oceny jest w odpowiednim statusie (tylko "in_definition")
- Filtrowanie wrażliwych danych przed zwróceniem odpowiedzi
- Obsługa wyjątków w celu zapobiegania ujawnieniu wewnętrznych błędów serwera

### 1.7. Obsługa błędów
- 400 Bad Request:
  - Nieprawidłowy format lub wartości danych wejściowych
  - Waga celu poza zakresem 0-100%
  - Proces nie jest w stanie "in_definition"
- 401 Unauthorized: Gdy token jest nieważny, wygasły lub nie został dostarczony
- 403 Forbidden: Gdy zalogowany użytkownik nie jest menedżerem pracownika ani samym pracownikiem
- 404 Not Found:
  - Proces oceny o podanym identyfikatorze nie istnieje
  - Pracownik o podanym identyfikatorze nie istnieje
  - Kategoria celu o podanym identyfikatorze nie istnieje
- 500 Internal Server Error: Gdy wystąpi nieoczekiwany błąd serwera

### 1.8. Rozważania dotyczące wydajności
- Zoptymalizowane zapytania do bazy danych z indeksami na kluczach obcych
- Jednoczesne sprawdzanie istnienia procesu, pracownika i kategorii w jednym zapytaniu
- Transakcyjne zapisywanie danych w celu zapewnienia spójności
- Efektywne mapowanie danych między obiektami DTO a encjami bazodanowymi

### 1.9. Etapy wdrożenia
1. Utworzenie pliku `/src/pages/api/assessment-processes/[processId]/employees/[employeeId]/goals.ts`
2. Implementacja walidacji parametrów ścieżki i danych wejściowych przy użyciu Zod
3. Implementacja logiki tworzenia celu w serwisie GoalService
4. Implementacja kontroli dostępu w oparciu o relacje menedżer-pracownik
5. Implementacja walidacji biznesowej (sprawdzanie statusu procesu, zakres wagi)
6. Implementacja obsługi błędów i zwracania odpowiednich kodów HTTP
7. Testowanie endpointu
8. Dokumentacja endpointu

## 2. GET /assessment-processes/{processId}/employees/{employeeId}/goals

### 2.1. Przegląd punktu końcowego
Endpoint służy do pobierania listy celów dla określonego pracownika w ramach konkretnego procesu oceny. Umożliwia przeglądanie wszystkich celów wraz z ich kategoriami i wagami. Dodatkowo zwraca sumę wag wszystkich celów w ramach procesu.

### 2.2. Szczegóły żądania
- Metoda HTTP: GET
- Struktura URL: /assessment-processes/{processId}/employees/{employeeId}/goals
- Parametry ścieżki:
  - processId: identyfikator UUID procesu oceny
  - employeeId: identyfikator UUID pracownika
- Wymagane nagłówki: 
  - Authorization: Bearer {token} - token JWT uzyskany podczas logowania

### 2.3. Wykorzystywane typy
```typescript
// Z src/types.ts:
import { 
  GoalDTO, 
  GoalListResponse
} from "../types";

// Do walidacji:
import { z } from "zod";

const pathParamsSchema = z.object({
  processId: z.string().uuid({ message: "Nieprawidłowy format identyfikatora procesu" }),
  employeeId: z.string().uuid({ message: "Nieprawidłowy format identyfikatora pracownika" })
});
```

### 2.4. Szczegóły odpowiedzi
- Sukces (200 OK):
  ```json
  {
    "goals": [
      {
        "id": "uuid",
        "description": "string",
        "weight": "number",
        "category": {
          "id": "uuid",
          "name": "string"
        }
      }
    ],
    "totalWeight": "number"
  }
  ```
- Niepowodzenie:
  - 401 Unauthorized: Brak tokenu lub nieprawidłowy token
  - 403 Forbidden: Brak uprawnień do wykonania operacji
  - 404 Not Found: Proces oceny lub pracownik o podanym identyfikatorze nie istnieje
  - 500 Internal Server Error: Błąd serwera

### 2.5. Przepływ danych
1. Endpoint odbiera żądanie GET z parametrami ścieżki
2. Middleware autoryzacyjne weryfikuje token JWT i sprawdza uprawnienia użytkownika
3. Parametry ścieżki są walidowane przy użyciu schematu Zod
4. Sprawdzane jest czy:
   - Proces oceny istnieje
   - Pracownik istnieje
   - Zalogowany użytkownik jest menedżerem pracownika lub samym pracownikiem
5. Pobierane są wszystkie cele dla danego pracownika w ramach konkretnego procesu
6. Obliczana jest suma wag wszystkich celów
7. Zwracana jest odpowiedź z listą celów i sumą wag

### 2.6. Względy bezpieczeństwa
- Weryfikacja tokenu JWT oraz uprawnień użytkownika
- Ograniczenie dostępu tylko dla menedżerów danego pracownika lub samego pracownika
- Filtrowanie wrażliwych danych przed zwróceniem odpowiedzi
- Obsługa wyjątków w celu zapobiegania ujawnieniu wewnętrznych błędów serwera

### 2.7. Obsługa błędów
- 401 Unauthorized: Gdy token jest nieważny, wygasły lub nie został dostarczony
- 403 Forbidden: Gdy zalogowany użytkownik nie jest menedżerem pracownika ani samym pracownikiem
- 404 Not Found:
  - Proces oceny o podanym identyfikatorze nie istnieje
  - Pracownik o podanym identyfikatorze nie istnieje
- 500 Internal Server Error: Gdy wystąpi nieoczekiwany błąd serwera

### 2.8. Rozważania dotyczące wydajności
- Zoptymalizowane zapytania do bazy danych z indeksami na kluczach obcych
- Jedno złożone zapytanie do pobrania celów wraz z kategoriami
- Efektywne mapowanie danych między obiektami DTO a encjami bazodanowymi
- Cache'owanie wyników dla często używanych kombinacji process/employee

### 2.9. Etapy wdrożenia
1. Rozszerzenie pliku `/src/pages/api/assessment-processes/[processId]/employees/[employeeId]/goals.ts` o obsługę metody GET
2. Implementacja walidacji parametrów ścieżki przy użyciu Zod
3. Implementacja logiki pobierania celów w serwisie GoalService
4. Implementacja kontroli dostępu w oparciu o relacje menedżer-pracownik
5. Implementacja obliczania sumy wag celów
6. Implementacja obsługi błędów i zwracania odpowiednich kodów HTTP
7. Testowanie endpointu
8. Dokumentacja endpointu

## 3. GET /goals/{goalId}

### 3.1. Przegląd punktu końcowego
Endpoint służy do pobierania szczegółowych informacji o konkretnym celu. Zwraca pełne dane celu wraz z informacjami o pracowniku i procesie oceny, do którego cel jest przypisany.

### 3.2. Szczegóły żądania
- Metoda HTTP: GET
- Struktura URL: /goals/{goalId}
- Parametry ścieżki:
  - goalId: identyfikator UUID celu
- Wymagane nagłówki: 
  - Authorization: Bearer {token} - token JWT uzyskany podczas logowania

### 3.3. Wykorzystywane typy
```typescript
// Z src/types.ts:
import { 
  GoalDetailDTO
} from "../types";

// Do walidacji:
import { z } from "zod";

const pathParamsSchema = z.object({
  goalId: z.string().uuid({ message: "Nieprawidłowy format identyfikatora celu" })
});
```

### 3.4. Szczegóły odpowiedzi
- Sukces (200 OK):
  ```json
  {
    "id": "uuid",
    "description": "string",
    "weight": "number",
    "category": {
      "id": "uuid",
      "name": "string"
    },
    "employee": {
      "id": "uuid",
      "name": "string"
    },
    "process": {
      "id": "uuid",
      "name": "string"
    }
  }
  ```
- Niepowodzenie:
  - 401 Unauthorized: Brak tokenu lub nieprawidłowy token
  - 403 Forbidden: Brak uprawnień do wykonania operacji
  - 404 Not Found: Cel o podanym identyfikatorze nie istnieje
  - 500 Internal Server Error: Błąd serwera

### 3.5. Przepływ danych
1. Endpoint odbiera żądanie GET z identyfikatorem celu
2. Middleware autoryzacyjne weryfikuje token JWT i sprawdza uprawnienia użytkownika
3. Parametry ścieżki są walidowane przy użyciu schematu Zod
4. Pobierany jest cel o podanym identyfikatorze wraz z powiązanymi danymi (kategoria, pracownik, proces)
5. Sprawdzane jest czy zalogowany użytkownik ma uprawnienia do przeglądania danego celu (jest menedżerem pracownika lub samym pracownikiem)
6. Zwracana jest odpowiedź z szczegółowymi danymi celu

### 3.6. Względy bezpieczeństwa
- Weryfikacja tokenu JWT oraz uprawnień użytkownika
- Ograniczenie dostępu tylko dla menedżerów danego pracownika lub samego pracownika
- Filtrowanie wrażliwych danych przed zwróceniem odpowiedzi
- Obsługa wyjątków w celu zapobiegania ujawnieniu wewnętrznych błędów serwera

### 3.7. Obsługa błędów
- 401 Unauthorized: Gdy token jest nieważny, wygasły lub nie został dostarczony
- 403 Forbidden: Gdy zalogowany użytkownik nie ma uprawnień do przeglądania danego celu
- 404 Not Found: Gdy cel o podanym identyfikatorze nie istnieje
- 500 Internal Server Error: Gdy wystąpi nieoczekiwany błąd serwera

### 3.8. Rozważania dotyczące wydajności
- Zoptymalizowane zapytanie do bazy danych z użyciem join do pobrania wszystkich powiązanych danych
- Indeksowanie klucza głównego tabeli celów dla szybkiego dostępu
- Cache'owanie wyników dla często odwiedzanych celów
- Efektywne mapowanie danych między obiektami DTO a encjami bazodanowymi

### 3.9. Etapy wdrożenia
1. Utworzenie pliku `/src/pages/api/goals/[goalId].ts`
2. Implementacja walidacji parametrów ścieżki przy użyciu Zod
3. Implementacja logiki pobierania celu w serwisie GoalService
4. Implementacja kontroli dostępu w oparciu o relacje menedżer-pracownik
5. Implementacja obsługi błędów i zwracania odpowiednich kodów HTTP
6. Testowanie endpointu
7. Dokumentacja endpointu

## 4. PUT /goals/{goalId}

### 4.1. Przegląd punktu końcowego
Endpoint służy do aktualizacji istniejącego celu. Umożliwia zmianę opisu, wagi oraz kategorii celu. Endpoint zwraca zaktualizowany cel wraz z ewentualnymi błędami walidacji.

### 4.2. Szczegóły żądania
- Metoda HTTP: PUT
- Struktura URL: /goals/{goalId}
- Parametry ścieżki:
  - goalId: identyfikator UUID celu
- Request Body:
  ```json
  {
    "description": "string",
    "weight": "number",
    "categoryId": "uuid"
  }
  ```
- Wymagane nagłówki: 
  - Authorization: Bearer {token} - token JWT uzyskany podczas logowania

### 4.3. Wykorzystywane typy
```typescript
// Z src/types.ts:
import { 
  UpdateGoalCommand, 
  GoalResponse, 
  AssessmentProcessStatus 
} from "../types";

// Do walidacji:
import { z } from "zod";

const updateGoalSchema = z.object({
  description: z.string().min(5, { message: "Opis celu musi mieć minimum 5 znaków" }).max(500, { message: "Opis celu nie może przekraczać 500 znaków" }),
  weight: z.number().min(0, { message: "Waga celu musi być większa lub równa 0%" }).max(100, { message: "Waga celu nie może przekraczać 100%" }),
  categoryId: z.string().uuid({ message: "Nieprawidłowy format identyfikatora kategorii" })
});

const pathParamsSchema = z.object({
  goalId: z.string().uuid({ message: "Nieprawidłowy format identyfikatora celu" })
});
```

### 4.4. Szczegóły odpowiedzi
- Sukces (200 OK):
  ```json
  {
    "id": "uuid",
    "description": "string",
    "weight": "number",
    "category": {
      "id": "uuid",
      "name": "string"
    },
    "validationErrors": []
  }
  ```
- Niepowodzenie:
  - 400 Bad Request: Nieprawidłowe dane wejściowe lub błędy walidacji biznesowej
  - 401 Unauthorized: Brak tokenu lub nieprawidłowy token
  - 403 Forbidden: Brak uprawnień do wykonania operacji
  - 404 Not Found: Cel lub kategoria o podanym identyfikatorze nie istnieje
  - 500 Internal Server Error: Błąd serwera

### 4.5. Przepływ danych
1. Endpoint odbiera żądanie PUT z identyfikatorem celu i danymi do aktualizacji
2. Middleware autoryzacyjne weryfikuje token JWT i sprawdza uprawnienia użytkownika
3. Parametry ścieżki oraz dane wejściowe są walidowane przy użyciu schematów Zod
4. Pobierany jest cel o podanym identyfikatorze wraz z powiązanym procesem oceny
5. Sprawdzane jest czy:
   - Cel istnieje
   - Proces oceny ma status "in_definition"
   - Kategoria celu istnieje
   - Zalogowany użytkownik jest menedżerem pracownika lub samym pracownikiem
6. Cel jest aktualizowany w bazie danych
7. Zwracana jest odpowiedź z zaktualizowanym celem lub odpowiednimi błędami walidacji

### 4.6. Względy bezpieczeństwa
- Weryfikacja tokenu JWT oraz uprawnień użytkownika
- Ograniczenie dostępu tylko dla menedżerów danego pracownika lub samego pracownika
- Walidacja wszystkich danych wejściowych przed zapisem do bazy danych
- Weryfikacja, czy proces oceny jest w odpowiednim statusie (tylko "in_definition")
- Filtrowanie wrażliwych danych przed zwróceniem odpowiedzi
- Obsługa wyjątków w celu zapobiegania ujawnieniu wewnętrznych błędów serwera

### 4.7. Obsługa błędów
- 400 Bad Request:
  - Nieprawidłowy format lub wartości danych wejściowych
  - Waga celu poza zakresem 0-100%
  - Proces nie jest w stanie "in_definition"
- 401 Unauthorized: Gdy token jest nieważny, wygasły lub nie został dostarczony
- 403 Forbidden: Gdy zalogowany użytkownik nie ma uprawnień do aktualizacji danego celu
- 404 Not Found:
  - Cel o podanym identyfikatorze nie istnieje
  - Kategoria celu o podanym identyfikatorze nie istnieje
- 500 Internal Server Error: Gdy wystąpi nieoczekiwany błąd serwera

### 4.8. Rozważania dotyczące wydajności
- Zoptymalizowane zapytania do bazy danych z indeksami na kluczach obcych
- Transakcyjne zapisywanie danych w celu zapewnienia spójności
- Efektywne mapowanie danych między obiektami DTO a encjami bazodanowymi
- Minimalizacja liczby zapytań do bazy danych

### 4.9. Etapy wdrożenia
1. Rozszerzenie pliku `/src/pages/api/goals/[goalId].ts` o obsługę metody PUT
2. Implementacja walidacji parametrów ścieżki i danych wejściowych przy użyciu Zod
3. Implementacja logiki aktualizacji celu w serwisie GoalService
4. Implementacja kontroli dostępu w oparciu o relacje menedżer-pracownik
5. Implementacja walidacji biznesowej (sprawdzanie statusu procesu, zakres wagi)
6. Implementacja obsługi błędów i zwracania odpowiednich kodów HTTP
7. Testowanie endpointu
8. Dokumentacja endpointu

## 5. DELETE /goals/{goalId}

### 5.1. Przegląd punktu końcowego
Endpoint służy do usuwania istniejących celów. Umożliwia całkowite usunięcie celu z systemu, pod warunkiem że proces oceny jest w fazie definiowania.

### 5.2. Szczegóły żądania
- Metoda HTTP: DELETE
- Struktura URL: /goals/{goalId}
- Parametry ścieżki:
  - goalId: identyfikator UUID celu
- Wymagane nagłówki: 
  - Authorization: Bearer {token} - token JWT uzyskany podczas logowania

### 5.3. Wykorzystywane typy
```typescript
// Z src/types.ts:
import { 
  AssessmentProcessStatus 
} from "../types";

// Do walidacji:
import { z } from "zod";

const pathParamsSchema = z.object({
  goalId: z.string().uuid({ message: "Nieprawidłowy format identyfikatora celu" })
});
```

### 5.4. Szczegóły odpowiedzi
- Sukces (204 No Content): Brak treści odpowiedzi
- Niepowodzenie:
  - 401 Unauthorized: Brak tokenu lub nieprawidłowy token
  - 403 Forbidden: Brak uprawnień do wykonania operacji
  - 404 Not Found: Cel o podanym identyfikatorze nie istnieje
  - 400 Bad Request: Proces nie jest w fazie definiowania
  - 500 Internal Server Error: Błąd serwera

### 5.5. Przepływ danych
1. Endpoint odbiera żądanie DELETE z identyfikatorem celu
2. Middleware autoryzacyjne weryfikuje token JWT i sprawdza uprawnienia użytkownika
3. Parametry ścieżki są walidowane przy użyciu schematu Zod
4. Pobierany jest cel o podanym identyfikatorze wraz z powiązanym procesem oceny
5. Sprawdzane jest czy:
   - Cel istnieje
   - Proces oceny ma status "in_definition"
   - Zalogowany użytkownik jest menedżerem pracownika lub samym pracownikiem
6. Cel jest usuwany z bazy danych
7. Zwracana jest odpowiedź bez treści z kodem 204 No Content

### 5.6. Względy bezpieczeństwa
- Weryfikacja tokenu JWT oraz uprawnień użytkownika
- Ograniczenie dostępu tylko dla menedżerów danego pracownika lub samego pracownika
- Weryfikacja, czy proces oceny jest w odpowiednim statusie (tylko "in_definition")
- Obsługa wyjątków w celu zapobiegania ujawnieniu wewnętrznych błędów serwera
- Usuwanie z użyciem odpowiednich technik zapewniających bezpieczeństwo danych

### 5.7. Obsługa błędów
- 400 Bad Request: Proces nie jest w stanie "in_definition"
- 401 Unauthorized: Gdy token jest nieważny, wygasły lub nie został dostarczony
- 403 Forbidden: Gdy zalogowany użytkownik nie ma uprawnień do usunięcia danego celu
- 404 Not Found: Gdy cel o podanym identyfikatorze nie istnieje
- 500 Internal Server Error: Gdy wystąpi nieoczekiwany błąd serwera

### 5.8. Rozważania dotyczące wydajności
- Zoptymalizowane zapytania do bazy danych z indeksami na kluczach obcych
- Minimalizacja liczby zapytań do bazy danych
- Transakcyjne usuwanie danych w celu zapewnienia spójności
- Obsługa równoczesnych żądań usuwania tego samego celu

### 5.9. Etapy wdrożenia
1. Rozszerzenie pliku `/src/pages/api/goals/[goalId].ts` o obsługę metody DELETE
2. Implementacja walidacji parametrów ścieżki przy użyciu Zod
3. Implementacja logiki usuwania celu w serwisie GoalService
4. Implementacja kontroli dostępu w oparciu o relacje menedżer-pracownik
5. Implementacja walidacji biznesowej (sprawdzanie statusu procesu)
6. Implementacja obsługi błędów i zwracania odpowiednich kodów HTTP
7. Testowanie endpointu
8. Dokumentacja endpointu

## 6. GET /predefined-goals

### 6.1. Przegląd punktu końcowego
Endpoint służy do pobierania listy predefiniowanych celów, które mogą być wykorzystane przez menedżerów podczas tworzenia celów dla pracowników. Umożliwia filtrowanie po kategorii oraz paginację wyników.

### 6.2. Szczegóły żądania
- Metoda HTTP: GET
- Struktura URL: /predefined-goals
- Parametry zapytania:
  - category (opcjonalny): identyfikator UUID kategorii
  - page (opcjonalny): numer strony, domyślnie 1
  - limit (opcjonalny): liczba wyników na stronę, domyślnie 10
- Wymagane nagłówki: 
  - Authorization: Bearer {token} - token JWT uzyskany podczas logowania

### 6.3. Wykorzystywane typy
```typescript
// Z src/types.ts:
import { 
  PredefinedGoalDTO,
  PredefinedGoalListResponse,
  PredefinedGoalFilterQueryParams
} from "../types";

// Do walidacji:
import { z } from "zod";

const queryParamsSchema = z.object({
  category: z.string().uuid({ message: "Nieprawidłowy format identyfikatora kategorii" }).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10)
});
```

### 6.4. Szczegóły odpowiedzi
- Sukces (200 OK):
  ```json
  {
    "goals": [
      {
        "id": "uuid",
        "description": "string",
        "categoryId": "uuid",
        "categoryName": "string"
      }
    ],
    "total": "number",
    "page": "number",
    "limit": "number"
  }
  ```
- Niepowodzenie:
  - 401 Unauthorized: Brak tokenu lub nieprawidłowy token
  - 400 Bad Request: Nieprawidłowe parametry zapytania
  - 500 Internal Server Error: Błąd serwera

### 6.5. Przepływ danych
1. Endpoint odbiera żądanie GET z parametrami zapytania
2. Middleware autoryzacyjne weryfikuje token JWT
3. Parametry zapytania są walidowane przy użyciu schematu Zod
4. Pobierane są predefiniowane cele z zastosowaniem filtrów i paginacji
5. Obliczana jest całkowita liczba wyników spełniających kryteria filtrowania
6. Zwracana jest odpowiedź z listą predefiniowanych celów, informacjami o paginacji oraz całkowitą liczbą wyników

### 6.6. Względy bezpieczeństwa
- Weryfikacja tokenu JWT
- Walidacja wszystkich parametrów zapytania
- Filtrowanie wrażliwych danych przed zwróceniem odpowiedzi
- Obsługa wyjątków w celu zapobiegania ujawnieniu wewnętrznych błędów serwera
- Ograniczenie maksymalnej liczby wyników na stronę

### 6.7. Obsługa błędów
- 400 Bad Request: Nieprawidłowe parametry zapytania (np. ujemna wartość page)
- 401 Unauthorized: Gdy token jest nieważny, wygasły lub nie został dostarczony
- 500 Internal Server Error: Gdy wystąpi nieoczekiwany błąd serwera

### 6.8. Rozważania dotyczące wydajności
- Zoptymalizowane zapytania do bazy danych z indeksami na kluczach używanych do filtrowania
- Efektywna paginacja wyników
- Cache'owanie popularnych zestawów filtrów
- Limitowanie maksymalnej liczby wyników w celu zapobiegania przeciążeniu serwera
- Kompresja odpowiedzi dla dużych zbiorów danych

### 6.9. Etapy wdrożenia
1. Utworzenie pliku `/src/pages/api/predefined-goals.ts`
2. Implementacja walidacji parametrów zapytania przy użyciu Zod
3. Implementacja logiki pobierania predefiniowanych celów w serwisie PredefinedGoalService
4. Implementacja filtrowania i paginacji wyników
5. Implementacja obliczania całkowitej liczby wyników
6. Implementacja obsługi błędów i zwracania odpowiednich kodów HTTP
7. Testowanie endpointu
8. Dokumentacja endpointu