# API Endpoint Implementation Plan: GET /users/{userId}

## 1. Przegląd punktu końcowego
Endpoint służy do pobierania szczegółowych informacji o konkretnym użytkowniku na podstawie jego identyfikatora. Jest przeznaczony głównie do celów administracyjnych oraz do wyświetlania profilu użytkownika. Zwraca dane użytkownika, w tym jego identyfikator, adres e-mail, imię oraz identyfikator menedżera (jeśli istnieje).

## 2. Szczegóły żądania
- Metoda HTTP: GET
- Struktura URL: /users/{userId}
- Parametry ścieżki:
  - userId: identyfikator UUID użytkownika
- Wymagane nagłówki: 
  - Authorization: Bearer {token} - token JWT uzyskany podczas logowania

## 3. Wykorzystywane typy
```typescript
// Z src/types.ts:
import { UserDTO } from "../types";

// Do walidacji:
import { z } from "zod";

const userIdSchema = z.string().uuid({ message: "Nieprawidłowy format identyfikatora użytkownika" });
```

## 4. Szczegóły odpowiedzi
- Sukces (200 OK):
  ```json
  {
    "id": "uuid",
    "email": "string",
    "name": "string",
    "managerId": "uuid" | null
  }
  ```
- Niepowodzenie:
  - 400 Bad Request: Nieprawidłowy format identyfikatora
  - 401 Unauthorized: Brak tokenu lub nieprawidłowy token
  - 403 Forbidden: Brak uprawnień do wykonania operacji
  - 404 Not Found: Użytkownik o podanym identyfikatorze nie istnieje
  - 500 Internal Server Error: Błąd serwera

## 5. Przepływ danych
1. Endpoint odbiera żądanie GET z identyfikatorem użytkownika w ścieżce URL
2. Middleware autoryzacyjne weryfikuje token JWT i uprawnienia użytkownika
3. Identyfikator użytkownika jest walidowany
4. Pobierane są dane konkretnego użytkownika z bazy danych
5. Zwracana jest odpowiedź zawierająca informacje o użytkowniku lub odpowiedni kod błędu

## 6. Względy bezpieczeństwa
- Weryfikacja tokenu JWT oraz uprawnień użytkownika
- Ograniczenie dostępu do danych użytkownika tylko dla autoryzowanych użytkowników
- Filtrowanie wrażliwych danych użytkownika przed zwróceniem odpowiedzi
- Walidacja parametrów zapytania w celu zapobiegania atakom iniekcji
- Logowanie prób nieautoryzowanego dostępu

## 7. Obsługa błędów
- 400 Bad Request: Gdy identyfikator użytkownika ma nieprawidłowy format
- 401 Unauthorized: Gdy token jest nieważny, wygasły lub nie został dostarczony
- 403 Forbidden: Gdy zalogowany użytkownik nie ma odpowiednich uprawnień
- 404 Not Found: Gdy użytkownik o podanym identyfikatorze nie istnieje
- 500 Internal Server Error: Gdy wystąpi nieoczekiwany błąd serwera

## 8. Rozważania dotyczące wydajności
- Kluczowe znaczenie ma indeksowanie tabeli użytkowników po kolumnie id
- Ograniczenie liczby zwracanych pól do niezbędnego minimum
- Możliwość implementacji cache'owania dla często odwiedzanych profili

## 9. Etapy wdrożenia
1. Utworzenie pliku `/src/pages/api/users/[userId].ts`
2. Implementacja walidacji parametru ścieżki przy użyciu Zod
3. Implementacja logiki pobierania danych użytkownika na podstawie identyfikatora
4. Implementacja kontroli dostępu opartej na rolach
5. Implementacja obsługi błędów
6. Testowanie endpointu
7. Dokumentacja endpointu

## 10. Przykładowa implementacja

```typescript
// src/pages/api/users/[userId].ts
import type { APIRoute } from "astro";
import { z } from "zod";
import type { UserDTO } from "../../../types";

export const prerender = false;

// Schemat walidacji identyfikatora użytkownika
const userIdSchema = z.string().uuid({ message: "Nieprawidłowy format identyfikatora użytkownika" });

export const GET: APIRoute = async ({ params, locals }) => {
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
    
    // Walidacja identyfikatora użytkownika
    const { userId } = params;
    const validationResult = userIdSchema.safeParse(userId);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowy format identyfikatora użytkownika",
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
    
    // Sprawdź uprawnienia - czy użytkownik jest administratorem lub próbuje uzyskać swoje własne dane
    const isAdmin = await checkIfUserIsAdmin(supabase, user.id);
    const isSelf = userId === user.id;
    
    if (!isAdmin && !isSelf) {
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
    
    // Pobierz dane użytkownika
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, manager_id')
      .eq('id', userId)
      .single();
    
    if (userDataError) {
      if (userDataError.code === 'PGRST116') {
        // Nie znaleziono użytkownika (PGRST116 to kod błędu dla "nie znaleziono")
        return new Response(
          JSON.stringify({
            error: "Nie znaleziono użytkownika o podanym identyfikatorze"
          }),
          {
            status: 404,
            headers: {
              "Content-Type": "application/json"
            }
          }
        );
      }
      
      return new Response(
        JSON.stringify({
          error: "Błąd podczas pobierania danych użytkownika"
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }
    
    if (!userData) {
      return new Response(
        JSON.stringify({
          error: "Nie znaleziono użytkownika o podanym identyfikatorze"
        }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }
    
    // Przygotuj odpowiedź w wymaganym formacie
    const response: UserDTO = {
      id: userData.id,
      email: userData.email,
      name: `${userData.first_name} ${userData.last_name}`,
      managerId: userData.manager_id
    };
    
    // Zwróć dane użytkownika
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
    console.error("Error in /users/{userId} endpoint:", err);
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