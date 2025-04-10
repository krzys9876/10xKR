# API Endpoint Implementation Plan: GET /managers/{managerId}/employees

## 1. Przegląd punktu końcowego
Endpoint służy do pobierania listy pracowników podlegających konkretnemu menedżerowi. Zwraca podstawowe informacje o pracownikach, w tym ich identyfikatory, adresy e-mail oraz imiona. Umożliwia także stronicowanie wyników w celu efektywnego zarządzania dużymi zespołami.

## 2. Szczegóły żądania
- Metoda HTTP: GET
- Struktura URL: /managers/{managerId}/employees
- Parametry ścieżki:
  - managerId: identyfikator UUID menedżera
- Parametry zapytania:
  - page: numer strony (opcjonalny, domyślnie 1)
  - limit: liczba pracowników na stronę (opcjonalna, domyślnie 10)
- Wymagane nagłówki: 
  - Authorization: Bearer {token} - token JWT uzyskany podczas logowania

## 3. Wykorzystywane typy
```typescript
// Z src/types.ts:
import { EmployeeDTO, EmployeeListResponse, PaginationQueryParams } from "../types";

// Do walidacji:
import { z } from "zod";

const userIdSchema = z.string().uuid({ message: "Nieprawidłowy format identyfikatora menedżera" });
const paginationSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10)
});
```

## 4. Szczegóły odpowiedzi
- Sukces (200 OK):
  ```json
  {
    "employees": [
      {
        "id": "uuid",
        "email": "string",
        "name": "string"
      }
    ],
    "total": "number",
    "page": "number",
    "limit": "number"
  }
  ```
- Niepowodzenie:
  - 400 Bad Request: Nieprawidłowy format identyfikatora
  - 401 Unauthorized: Brak tokenu lub nieprawidłowy token
  - 403 Forbidden: Brak uprawnień do wykonania operacji
  - 404 Not Found: Menedżer o podanym identyfikatorze nie istnieje
  - 500 Internal Server Error: Błąd serwera

## 5. Przepływ danych
1. Endpoint odbiera żądanie GET z identyfikatorem menedżera w ścieżce URL oraz opcjonalnymi parametrami paginacji
2. Middleware autoryzacyjne weryfikuje token JWT
3. Identyfikator menedżera oraz parametry zapytania są walidowane
4. Sprawdzane są uprawnienia użytkownika (czy jest menedżerem lub administratorem)
5. Pobierana jest lista pracowników podlegających danemu menedżerowi
6. Zwracana jest odpowiedź zawierająca listę pracowników oraz informacje o stronicowaniu

## 6. Względy bezpieczeństwa
- Weryfikacja tokenu JWT
- Sprawdzenie czy zalogowany użytkownik jest menedżerem, którego pracownicy są żądani, lub administratorem
- Filtrowanie wrażliwych danych pracowników przed zwróceniem odpowiedzi
- Ograniczenie liczby rekordów zwracanych w jednym żądaniu (parametr limit)
- Walidacja parametrów w celu zapobiegania atakom iniekcji

## 7. Obsługa błędów
- 400 Bad Request: Gdy identyfikator menedżera ma nieprawidłowy format lub parametry zapytania są nieprawidłowe
- 401 Unauthorized: Gdy token jest nieważny, wygasły lub nie został dostarczony
- 403 Forbidden: Gdy zalogowany użytkownik nie jest menedżerem, którego pracownicy są żądani, ani administratorem
- 404 Not Found: Gdy menedżer o podanym identyfikatorze nie istnieje
- 500 Internal Server Error: Gdy wystąpi nieoczekiwany błąd serwera

## 8. Rozważania dotyczące wydajności
- Implementacja efektywnego stronnicowania w bazie danych
- Indeksowanie kolumn używanych do filtrowania (manager_id)
- Ograniczenie liczby zwracanych pól do niezbędnego minimum
- Możliwość implementacji cache'owania dla często wykonywanych zapytań

## 9. Etapy wdrożenia
1. Utworzenie pliku `/src/pages/api/managers/[managerId]/employees.ts`
2. Implementacja walidacji parametrów ścieżki i zapytania przy użyciu Zod
3. Implementacja logiki pobierania danych pracowników z uwzględnieniem stronnicowania
4. Implementacja kontroli dostępu
5. Implementacja obsługi błędów
6. Testowanie endpointu
7. Dokumentacja endpointu

## 10. Przykładowa implementacja

```typescript
// src/pages/api/managers/[managerId]/employees.ts
import type { APIRoute } from "astro";
import { z } from "zod";
import type { EmployeeDTO, EmployeeListResponse } from "../../../../types";

export const prerender = false;

// Schemat walidacji identyfikatora menedżera
const userIdSchema = z.string().uuid({ message: "Nieprawidłowy format identyfikatora menedżera" });

// Schemat walidacji parametrów paginacji
const paginationSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10)
});

export const GET: APIRoute = async ({ params, request, locals }) => {
  try {
    const supabase = locals.supabase;
    
    // Sprawdź czy użytkownik jest zalogowany
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({
          error: "Użytkownik niezalogowany"
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }
    
    // Walidacja identyfikatora menedżera
    const { managerId } = params;
    const validationResult = userIdSchema.safeParse(managerId);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowy format identyfikatora menedżera",
          details: validationResult.error.format()
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }
    
    // Sprawdź czy menedżer istnieje
    const { data: managerData, error: managerError } = await supabase
      .from('users')
      .select('id')
      .eq('id', managerId)
      .single();
    
    if (managerError || !managerData) {
      return new Response(
        JSON.stringify({
          error: "Nie znaleziono menedżera o podanym identyfikatorze"
        }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }
    
    // Sprawdź uprawnienia - czy użytkownik jest menedżerem, którego pracownicy są żądani, lub administratorem
    const isManager = user.id === managerId;
    const isAdmin = await checkIfUserIsAdmin(supabase, user.id);
    
    if (!isManager && !isAdmin) {
      return new Response(
        JSON.stringify({
          error: "Brak uprawnień do wykonania tej operacji"
        }),
        {
          status: 403,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }
    
    // Pobierz i zwaliduj parametry paginacji
    const url = new URL(request.url);
    const validatedParams = paginationSchema.safeParse({
      page: url.searchParams.get('page'),
      limit: url.searchParams.get('limit')
    });
    
    if (!validatedParams.success) {
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowe parametry zapytania",
          details: validatedParams.error.format()
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }
    
    const { page, limit } = validatedParams.data;
    const offset = (page - 1) * limit;
    
    // Pobierz całkowitą liczbę pracowników menedżera
    const { count, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('manager_id', managerId);
    
    if (countError) {
      return new Response(
        JSON.stringify({
          error: "Błąd podczas pobierania liczby pracowników"
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }
    
    // Pobierz listę pracowników menedżera z paginacją
    const { data: employeesData, error: employeesError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name')
      .eq('manager_id', managerId)
      .range(offset, offset + limit - 1);
    
    if (employeesError) {
      return new Response(
        JSON.stringify({
          error: "Błąd podczas pobierania listy pracowników"
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }
    
    // Przygotuj odpowiedź w wymaganym formacie
    const employees: EmployeeDTO[] = employeesData.map(employee => ({
      id: employee.id,
      email: employee.email,
      name: `${employee.first_name} ${employee.last_name}`
    }));
    
    const response: EmployeeListResponse = {
      employees,
      total: count || 0,
      page,
      limit
    };
    
    // Zwróć listę pracowników
    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
    
  } catch (err) {
    console.error("Error in /managers/{managerId}/employees endpoint:", err);
    return new Response(
      JSON.stringify({
        error: "Wystąpił błąd podczas przetwarzania żądania"
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }
};

// Funkcja pomocnicza do sprawdzania, czy użytkownik jest administratorem
async function checkIfUserIsAdmin(supabase, userId: string): Promise<boolean> {
  // W rzeczywistej aplikacji tutaj byłaby logika sprawdzająca czy użytkownik ma uprawnienia administratora
  // Dla uproszczenia implementacji, sprawdzamy czy użytkownik istnieje w tabeli admins
  const { data, error } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', userId)
    .single();
  
  return !error && !!data;
} 