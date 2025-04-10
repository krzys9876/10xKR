# API Endpoint Implementation Plan: Self-Assessments

## 1. Przegląd punktu końcowego

Self-Assessment API obejmuje dwa endpointy, które umożliwiają pracownikom tworzenie i przeglądanie samooceny swoich celów. Te endpointy pozwalają pracownikom na ocenę własnego wykonania celów w ramach procesu oceny. Samoocena jest kluczowym etapem w procesie oceny pracowniczej, który następuje po zdefiniowaniu celów, a przed oceną przez menedżera.

**Endpointy:**
- `POST /goals/{goalId}/self-assessment` - tworzenie lub aktualizacja samooceny dla określonego celu
- `GET /goals/{goalId}/self-assessment` - pobranie samooceny dla określonego celu

## 2. Szczegóły żądania

### POST /goals/{goalId}/self-assessment

- **Metoda HTTP:** POST
- **Struktura URL:** `/goals/{goalId}/self-assessment`
- **Parametry URL:**
  - Wymagane: `goalId` (UUID) - identyfikator celu, dla którego tworzona jest samoocena
- **Request Body:**
  ```json
  {
    "rating": number,     // Ocena (0-150%)
    "comments": string    // Opcjonalny komentarz
  }
  ```

### GET /goals/{goalId}/self-assessment

- **Metoda HTTP:** GET
- **Struktura URL:** `/goals/{goalId}/self-assessment`
- **Parametry URL:**
  - Wymagane: `goalId` (UUID) - identyfikator celu, dla którego pobierana jest samoocena
- **Request Body:** Brak

## 3. Wykorzystywane typy

Dla implementacji potrzebne będą następujące typy:

- **DTO:**
  - `AssessmentDTO` - do prezentacji danych samooceny
  - `AssessmentResponse` - do zwracania odpowiedzi z API

- **Command Models:**
  - `CreateAssessmentCommand` - do modelowania danych wejściowych dla utworzenia/aktualizacji samooceny

- **Entity Types:**
  - `SelfAssessment` - reprezentacja encji w bazie danych
  - `Goal` - dla walidacji i powiązań
  - `AssessmentProcess` - dla weryfikacji statusu procesu oceny

## 4. Szczegóły odpowiedzi

### POST /goals/{goalId}/self-assessment

- **Sukces (201 Created):**
  ```json
  {
    "id": "uuid",            // Identyfikator utworzonej/zaktualizowanej samooceny
    "rating": number,        // Ocena (0-150%)
    "comments": string|null, // Komentarz (jeśli podany)
    "createdAt": "datetime"  // Data utworzenia
  }
  ```

- **Kody błędów:**
  - 400 Bad Request - nieprawidłowe dane wejściowe
  - 401 Unauthorized - brak uwierzytelnienia
  - 403 Forbidden - brak uprawnień (np. próba oceny cudzego celu lub ocena w niewłaściwym statusie procesu)
  - 404 Not Found - cel nie istnieje

### GET /goals/{goalId}/self-assessment

- **Sukces (200 OK):**
  ```json
  {
    "id": "uuid",            // Identyfikator samooceny
    "rating": number,        // Ocena (0-150%)
    "comments": string|null, // Komentarz (jeśli podany)
    "createdAt": "datetime", // Data utworzenia
    "updatedAt": "datetime"  // Data ostatniej aktualizacji (opcjonalna)
  }
  ```

- **Kody błędów:**
  - 401 Unauthorized - brak uwierzytelnienia
  - 403 Forbidden - brak uprawnień (np. próba dostępu do cudzej samooceny)
  - 404 Not Found - samoocena lub cel nie istnieje

## 5. Przepływ danych

### POST /goals/{goalId}/self-assessment

1. **Walidacja żądania:**
   - Sprawdzenie poprawności formatu danych wejściowych
   - Walidacja zakresu oceny (0-150%)

2. **Autoryzacja:**
   - Weryfikacja, czy zalogowany użytkownik jest właścicielem celu
   - Sprawdzenie statusu procesu oceny (musi być "in self-assessment")

3. **Operacja bazodanowa:**
   - Sprawdzenie, czy samoocena już istnieje dla danego celu
   - Jeśli istnieje - aktualizacja istniejącego rekordu
   - Jeśli nie istnieje - utworzenie nowego rekordu

4. **Zwrócenie odpowiedzi:**
   - Przygotowanie i zwrócenie obiektu `AssessmentResponse`

### GET /goals/{goalId}/self-assessment

1. **Autoryzacja:**
   - Weryfikacja, czy zalogowany użytkownik jest właścicielem celu lub jego menedżerem

2. **Operacja bazodanowa:**
   - Pobranie samooceny dla wskazanego celu

3. **Zwrócenie odpowiedzi:**
   - Przygotowanie i zwrócenie obiektu `AssessmentDTO`
   - Zwrócenie błędu 404, jeśli samoocena nie istnieje

## 6. Względy bezpieczeństwa

1. **Uwierzytelnianie:**
   - Implementacja uwierzytelniania JWT poprzez Supabase Auth
   - Walidacja tokenu JWT dla każdego żądania

2. **Autoryzacja:**
   - Weryfikacja właściciela celu - tylko właściciel celu może tworzyć/edytować swoją samoocenę
   - Weryfikacja roli użytkownika - pracownik może widzieć tylko swoje samooceny, menedżer może widzieć samooceny swoich bezpośrednich podwładnych
   - Wykorzystanie Row Level Security (RLS) w Supabase dla dodatkowej warstwy zabezpieczeń

3. **Walidacja danych:**
   - Sanityzacja wszystkich danych wejściowych
   - Ograniczenie wartości oceny do zakresu 0-150%
   - Ograniczenie długości komentarza

4. **Uwierzytelnianie kontekstowe:**
   - Sprawdzenie statusu procesu oceny przed umożliwieniem tworzenia/edycji samooceny

## 7. Obsługa błędów

1. **Błędy walidacji (400 Bad Request):**
   - Nieprawidłowy format danych wejściowych
   - Ocena poza dozwolonym zakresem (0-150%)
   - Zbyt długi komentarz

2. **Błędy uwierzytelniania (401 Unauthorized):**
   - Brak tokenu JWT
   - Nieważny lub wygasły token JWT

3. **Błędy autoryzacji (403 Forbidden):**
   - Próba utworzenia/edycji samooceny dla cudzego celu
   - Próba utworzenia/edycji samooceny w niewłaściwym statusie procesu (innym niż "in self-assessment")
   - Próba dostępu do samooceny innego pracownika bez uprawnień menedżerskich

4. **Błędy zasobów (404 Not Found):**
   - Cel o podanym ID nie istnieje
   - Samoocena dla danego celu nie istnieje (tylko dla GET)

5. **Błędy serwera (500 Internal Server Error):**
   - Problemy z połączeniem do bazy danych
   - Nieoczekiwane błędy przetwarzania

Każdy błąd powinien zwracać odpowiednią strukturę błędu z kodem HTTP i opisowym komunikatem.

## 8. Rozważania dotyczące wydajności

1. **Indeksowanie bazy danych:**
   - Utworzenie indeksu na kolumnie `goal_id` w tabeli `self_assessments`
   - Utworzenie złożonego indeksu dla efektywnego filtrowania samoocen według użytkownika i procesu oceny

2. **Caching:**
   - Implementacja cache dla często pobieranych samoocen
   - Unieważnianie cache po aktualizacji samooceny

3. **Optymalizacja zapytań:**
   - Ograniczenie pobieranych pól do niezbędnego minimum
   - Wykorzystanie relacji w Supabase do efektywnego łączenia tabel

4. **Paginacja:**
   - Dla przyszłych rozszerzeń API umożliwiających pobieranie wielu samoocen, implementacja paginacji wyników

## 9. Etapy wdrożenia

1. **Tworzenie struktury plików:**
   - Utworzenie kontrolerów API w `src/pages/api/goals/[goalId]/self-assessment.{ts,js}`
   - Utworzenie serwisu dla samoocen w `src/lib/services/self-assessment.service.ts`

2. **Implementacja walidacji:**
   - Utworzenie funkcji walidacyjnych dla danych wejściowych
   - Implementacja sprawdzania zakresu oceny (0-150%)

3. **Implementacja autoryzacji:**
   - Utworzenie middleware do weryfikacji właściciela celu
   - Implementacja sprawdzania statusu procesu oceny

4. **Implementacja zapytań bazodanowych:**
   - Utworzenie funkcji do pobierania samooceny dla celu
   - Implementacja logiki tworzenia/aktualizacji samooceny

5. **Implementacja obsługi błędów:**
   - Utworzenie standardowych formatów odpowiedzi błędów
   - Implementacja wyłapywania i obsługi wyjątków

6. **Implementacja kontrolerów API:**
   - Implementacja kontrolera GET dla pobierania samooceny
   - Implementacja kontrolera POST dla tworzenia/aktualizacji samooceny

7. **Testy jednostkowe:**
   - Testy walidacji danych wejściowych
   - Testy autoryzacji
   - Testy zapytań bazodanowych

8. **Testy integracyjne:**
   - Testy kompletnego przepływu API
   - Testy scenariuszy błędów

9. **Dokumentacja:**
   - Aktualizacja dokumentacji API
   - Dodanie przykładów użycia

10. **Wdrożenie:**
    - Przeprowadzenie code review
    - Konfiguracja RLS w Supabase
    - Wdrożenie na środowisko testowe
    - Wdrożenie na środowisko produkcyjne 