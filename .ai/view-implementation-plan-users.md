# API Endpoint Implementation Plan: GET /users

## 1. Przegląd punktu końcowego
Endpoint służy do pobierania listy użytkowników w systemie. Jest przeznaczony głównie do celów administracyjnych. Umożliwia stronicowanie wyników oraz zwraca podstawowe informacje o użytkownikach, w tym ich identyfikatory, adresy e-mail, imiona i powiązania z menedżerami.

## 2. Szczegóły żądania
- Metoda HTTP: GET
- Struktura URL: /users
- Parametry zapytania:
  - page: numer strony (opcjonalny, domyślnie 1)
  - limit: liczba użytkowników na stronę (opcjonalna, domyślnie 10)
- Wymagane nagłówki: 
  - Authorization: Bearer {token} - token JWT uzyskany podczas logowania

## 3. Wykorzystywane typy
```typescript
// Z src/types.ts:
import { UserDTO, UserListResponse, PaginationQueryParams, UserFilterQueryParams } from "../types";

// Do walidacji:
import { z } from "zod";

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10)
});
```

## 4. Szczegóły odpowiedzi
- Sukces (200 OK):
  ```json
  {
    "users": [
      {
        "id": "uuid",
        "email": "string",
        "name": "string",
        "managerId": "uuid" | null
      }
    ],
    "total": "number",
    "page": "number",
    "limit": "number"
  }
  ```
- Niepowodzenie:
  - 401 Unauthorized: Brak tokenu lub nieprawidłowy token
  - 403 Forbidden: Brak uprawnień do wykonania operacji
  - 500 Internal Server Error: Błąd serwera

## 5. Przepływ danych
1. Endpoint odbiera żądanie GET z opcjonalnymi parametrami paginacji
2. Middleware autoryzacyjne weryfikuje token JWT i role użytkownika
3. Parametry zapytania są walidowane
4. Pobierana jest lista użytkowników z bazy danych z uwzględnieniem stronnicowania
5. Zwracana jest odpowiedź zawierająca listę użytkowników, całkowitą liczbę użytkowników oraz informacje o stronnicowaniu

## 6. Względy bezpieczeństwa
- Weryfikacja tokenu JWT oraz uprawnień użytkownika
- Ograniczenie dostępu tylko dla użytkowników z odpowiednimi uprawnieniami (np. administratorów)
- Filtrowanie wrażliwych danych użytkowników przed zwróceniem odpowiedzi
- Ograniczenie liczby rekordów zwracanych w jednym żądaniu (parametr limit)
- Logowanie prób nieautoryzowanego dostępu

## 7. Obsługa błędów
- 400 Bad Request: Gdy parametry zapytania są nieprawidłowe
- 401 Unauthorized: Gdy token jest nieważny, wygasły lub nie został dostarczony
- 403 Forbidden: Gdy zalogowany użytkownik nie ma odpowiednich uprawnień
- 500 Internal Server Error: Gdy wystąpi nieoczekiwany błąd serwera

## 8. Rozważania dotyczące wydajności
- Implementacja efektywnego stronnicowania w bazie danych
- Indeksowanie kolumn używanych do filtrowania i sortowania
- Ograniczenie liczby zwracanych pól do niezbędnego minimum
- Implementacja cache'owania dla często wykonywanych zapytań
- Monitorowanie wydajności zapytań do bazy danych

## 9. Etapy wdrożenia
1. Utworzenie pliku `/src/pages/api/users/index.ts`
2. Implementacja walidacji parametrów zapytania przy użyciu Zod
3. Implementacja logiki pobierania danych użytkowników z uwzględnieniem stronnicowania
4. Implementacja kontroli dostępu opartej na rolach
5. Implementacja obsługi błędów
6. Optymalizacja zapytań do bazy danych
7. Testowanie endpointu
8. Dokumentacja endpointu

## 10. Przykładowa implementacja

```typescript
// src/pages/api/users/index.ts
import type { APIRoute } from "astro";
import { z } from "zod";
import type { UserDTO, UserListResponse } from "../../../types";

export const prerender = false;

// Schemat walidacji parametrów paginacji
const paginationSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10)
});

export const GET: APIRoute = async ({ request, locals }) => {
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
    
    // Sprawdź czy użytkownik ma uprawnienia administratora
    // To jest uproszczona implementacja - w rzeczywistym systemie sprawdzanie uprawnień 
    // powinno być bardziej rozbudowane lub oparte na bardziej złożonej logice
    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', user.id)
      .single();
    
    if (adminError || !adminData) {
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
    
    // Pobierz i zwaliduj parametry zapytania
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
    
    // Pobierz całkowitą liczbę użytkowników
    const { count, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      return new Response(
        JSON.stringify({
          error: "Błąd podczas pobierania liczby użytkowników"
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }
    
    // Pobierz listę użytkowników z paginacją
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, manager_id')
      .range(offset, offset + limit - 1);
    
    if (usersError) {
      return new Response(
        JSON.stringify({
          error: "Błąd podczas pobierania listy użytkowników"
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
    const users: UserDTO[] = usersData.map(user => ({
      id: user.id,
      email: user.email,
      name: `${user.first_name} ${user.last_name}`,
      managerId: user.manager_id
    }));
    
    const response: UserListResponse = {
      users,
      total: count || 0,
      page,
      limit
    };
    
    // Zwróć listę użytkowników
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
    console.error("Error in /users endpoint:", err);
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