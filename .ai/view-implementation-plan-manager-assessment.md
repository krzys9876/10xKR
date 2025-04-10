# API Endpoint Implementation Plan: Manager Assessments

## 1. Przegląd punktu końcowego
Manager Assessment API obejmuje dwa endpointy, które umożliwiają menedżerom tworzenie i przeglądanie ocen celów swoich pracowników. Te endpointy są kluczowym elementem procesu oceny wyników, pozwalając menedżerom na ocenę wykonania celów przez pracowników. Manager Assessment jest finalnym etapem procesu oceny, który następuje po etapie samooceny przez pracownika.

**Endpointy:**
- `POST /goals/{goalId}/manager-assessment` - tworzenie lub aktualizacja oceny menedżerskiej dla określonego celu
- `GET /goals/{goalId}/manager-assessment` - pobranie oceny menedżerskiej dla określonego celu

## 2. Szczegóły żądania

### POST /goals/{goalId}/manager-assessment

- **Metoda HTTP:** POST
- **Struktura URL:** `/goals/{goalId}/manager-assessment`
- **Parametry URL:**
  - Wymagane: `goalId` (UUID) - identyfikator celu, dla którego tworzona jest ocena menedżerska
- **Request Body:**
  ```json
  {
    "rating": number,     // Ocena (0-150%)
    "comments": string    // Opcjonalny komentarz
  }
  ```

### GET /goals/{goalId}/manager-assessment

- **Metoda HTTP:** GET
- **Struktura URL:** `/goals/{goalId}/manager-assessment`
- **Parametry URL:**
  - Wymagane: `goalId` (UUID) - identyfikator celu, dla którego pobierana jest ocena menedżerska
- **Request Body:** Brak

## 3. Wykorzystywane typy

Dla implementacji potrzebne będą następujące typy:

- **DTO:**
  - `AssessmentDTO` - do prezentacji danych oceny menedżerskiej
  - `AssessmentResponse` - do zwracania odpowiedzi z API

- **Command Models:**
  - `CreateAssessmentCommand` - do modelowania danych wejściowych dla utworzenia/aktualizacji oceny menedżerskiej

- **Entity Types:**
  - `ManagerAssessment` - reprezentacja encji w bazie danych
  - `Goal` - dla walidacji i powiązań
  - `AssessmentProcess` - dla weryfikacji statusu procesu oceny
  - `User` - dla weryfikacji relacji menedżer-pracownik

## 4. Szczegóły odpowiedzi

### POST /goals/{goalId}/manager-assessment

- **Sukces (201 Created):**
  ```json
  {
    "id": "uuid",            // Identyfikator utworzonej/zaktualizowanej oceny
    "rating": number,        // Ocena (0-150%)
    "comments": string|null, // Komentarz (jeśli podany)
    "createdAt": "datetime"  // Data utworzenia
  }
  ```

- **Kody błędów:**
  - 400 Bad Request - nieprawidłowe dane wejściowe
  - 401 Unauthorized - brak uwierzytelnienia
  - 403 Forbidden - brak uprawnień (np. próba oceny celu pracownika, który nie jest podwładnym lub ocena w niewłaściwym statusie procesu)
  - 404 Not Found - cel nie istnieje

### GET /goals/{goalId}/manager-assessment

- **Sukces (200 OK):**
  ```json
  {
    "id": "uuid",            // Identyfikator oceny menedżerskiej
    "rating": number,        // Ocena (0-150%)
    "comments": string|null, // Komentarz (jeśli podany)
    "createdAt": "datetime", // Data utworzenia
    "updatedAt": "datetime"  // Data ostatniej aktualizacji (opcjonalna)
  }
  ```

- **Kody błędów:**
  - 401 Unauthorized - brak uwierzytelnienia
  - 403 Forbidden - brak uprawnień (np. próba dostępu do oceny menedżerskiej przez osobę niebędącą menedżerem lub właścicielem celu)
  - 404 Not Found - ocena menedżerska lub cel nie istnieje

## 5. Przepływ danych

### POST /goals/{goalId}/manager-assessment

1. **Walidacja żądania:**
   - Sprawdzenie poprawności formatu danych wejściowych
   - Walidacja zakresu oceny (0-150%)

2. **Autoryzacja:**
   - Weryfikacja, czy zalogowany użytkownik jest menedżerem pracownika, do którego należy cel
   - Sprawdzenie statusu procesu oceny (musi być "awaiting_manager_assessment")

3. **Operacja bazodanowa:**
   - Sprawdzenie, czy ocena menedżerska już istnieje dla danego celu
   - Jeśli istnieje - aktualizacja istniejącego rekordu
   - Jeśli nie istnieje - utworzenie nowego rekordu

4. **Zwrócenie odpowiedzi:**
   - Przygotowanie i zwrócenie obiektu `AssessmentResponse`

### GET /goals/{goalId}/manager-assessment

1. **Autoryzacja:**
   - Weryfikacja, czy zalogowany użytkownik jest właścicielem celu lub jego menedżerem

2. **Operacja bazodanowa:**
   - Pobranie oceny menedżerskiej dla danego celu

3. **Zwrócenie odpowiedzi:**
   - Przygotowanie i zwrócenie obiektu `AssessmentDTO`

## 6. Względy bezpieczeństwa

### Uwierzytelnianie
- Każde żądanie musi zawierać token JWT w nagłówku `Authorization`
- Brak ważnego tokenu skutkuje odpowiedzią z kodem błędu 401 Unauthorized

### Autoryzacja
- Oceny menedżerskie mogą być tworzone i aktualizowane **tylko** przez menedżerów pracowników, do których należą oceniane cele
- Oceny menedżerskie mogą być przeglądane przez:
  - Menedżera, który utworzył ocenę
  - Pracownika, do którego należy oceniany cel
- Wykorzystanie Row Level Security (RLS) w bazie danych Supabase dla zapewnienia separacji danych

### Walidacja danych
- Wartość oceny (rating) musi być w zakresie 0-150%
- Komentarz (comments) jest opcjonalny
- Żądanie może być wykonane tylko, gdy proces oceny jest w statusie "awaiting_manager_assessment"

## 7. Obsługa błędów

### Potencjalne błędy i ich obsługa

| Scenariusz błędu | Kod HTTP | Komunikat błędu |
|------------------|----------|-----------------|
| Brak autoryzacji (brak tokenu) | 401 | "Użytkownik niezalogowany" |
| Nieprawidłowy format UUID dla goalId | 400 | "Nieprawidłowy format identyfikatora celu" |
| Cel nie istnieje | 404 | "Nie znaleziono celu o podanym identyfikatorze" |
| Zalogowany użytkownik nie jest menedżerem pracownika, do którego należy cel | 403 | "Brak uprawnień do oceny tego celu" |
| Ocena poza dozwolonym zakresem (0-150%) | 400 | "Wartość oceny musi być w zakresie 0-150%" |
| Status procesu oceny nie pozwala na edycję oceny menedżerskiej | 403 | "Ocena menedżerska możliwa tylko w statusie procesu 'awaiting_manager_assessment'" |
| Nie znaleziono oceny menedżerskiej dla celu | 404 | "Nie znaleziono oceny menedżerskiej dla podanego celu" |
| Błąd wewnętrzny serwera | 500 | "Wystąpił błąd podczas przetwarzania żądania" |

## 8. Rozważania dotyczące wydajności

- Implementacja indeksów w bazie danych dla szybszego dostępu (indeks na `manager_assessments.goal_id`)
- Normalizacja danych w celu minimalizacji duplikacji
- Implementacja mechanizmu buforowania odpowiedzi dla częstych żądań GET
- Kontrola rozmiaru odpowiedzi

## 9. Etapy wdrożenia

### Implementacja endpointu POST /goals/{goalId}/manager-assessment

1. **Utworzenie pliku src/pages/api/goals/[goalId]/manager-assessment.ts**:
   - Implementacja metody POST dla tworzenia/aktualizacji oceny menedżerskiej
   - Wykorzystanie Zod dla walidacji danych wejściowych
   - Implementacja uwierzytelniania za pomocą Supabase Auth

2. **Implementacja walidacji danych wejściowych**:
   - Walidacja poprawności formatu UUID dla goalId
   - Walidacja zakresu oceny (0-150%)
   - Walidacja opcjonalnego komentarza

3. **Implementacja kontroli autoryzacji**:
   - Sprawdzenie, czy zalogowany użytkownik jest menedżerem pracownika, do którego należy cel
   - Weryfikacja statusu procesu oceny

4. **Implementacja operacji bazodanowych**:
   - Sprawdzenie, czy ocena menedżerska dla danego celu już istnieje
   - Implementacja upsert (insert/update) dla oceny menedżerskiej

5. **Implementacja obsługi błędów**:
   - Obsługa przypadków brzegowych i błędów
   - Generowanie odpowiednich kodów HTTP i komunikatów błędów

### Implementacja endpointu GET /goals/{goalId}/manager-assessment

1. **Rozszerzenie pliku src/pages/api/goals/[goalId]/manager-assessment.ts**:
   - Implementacja metody GET dla pobierania oceny menedżerskiej
   - Wykorzystanie Supabase do pobierania danych

2. **Implementacja kontroli autoryzacji**:
   - Sprawdzenie, czy zalogowany użytkownik jest właścicielem celu lub jego menedżerem

3. **Implementacja operacji bazodanowych**:
   - Pobranie oceny menedżerskiej dla danego celu
   - Pobieranie dodatkowych informacji kontekstowych (jeśli potrzebne)

4. **Implementacja obsługi błędów**:
   - Obsługa przypadków brzegowych i błędów
   - Generowanie odpowiednich kodów HTTP i komunikatów błędów

5. **Testy**:
   - Testy jednostkowe dla endpointów
   - Testy integracyjne sprawdzające interakcję z bazą danych
   - Testy wydajnościowe dla scenariuszy o dużym obciążeniu 