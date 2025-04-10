# API Endpoint Implementation Plan: GET /auth/me

## 1. Przegląd punktu końcowego
Endpoint służy do pobierania informacji o aktualnie zalogowanym użytkowniku. Wymaga ważnego tokenu uwierzytelniającego i zwraca podstawowe dane o użytkowniku, w tym jego identyfikator, adres e-mail oraz identyfikator managera (jeśli istnieje).

## 2. Szczegóły żądania
- Metoda HTTP: GET
- Struktura URL: /auth/me
- Parametry: Brak
- Wymagane nagłówki: 
  - Authorization: Bearer {token} - token JWT uzyskany podczas logowania

## 3. Wykorzystywane typy
```typescript
// Z src/types.ts:
import { UserProfile } from "../types";

// Do walidacji:
import { z } from "zod";
```

## 4. Szczegóły odpowiedzi
- Sukces (200 OK):
  ```json
  {
    "id": "uuid",
    "email": "string",
    "managerId": "uuid" | null
  }
  ```
- Niepowodzenie:
  - 401 Unauthorized: Brak tokenu lub nieprawidłowy token
  - 500 Internal Server Error: Błąd serwera

## 5. Przepływ danych
1. Endpoint odbiera żądanie GET z nagłówkiem Authorization
2. Middleware autoryzacyjne weryfikuje token JWT
3. Pobierane są dane użytkownika z Supabase na podstawie identyfikatora użytkownika z tokenu
4. Zwracane są wymagane informacje o użytkowniku

## 6. Względy bezpieczeństwa
- Weryfikacja tokenu JWT przed udostępnieniem danych
- Filtrowanie wrażliwych danych użytkownika przed zwróceniem odpowiedzi
- Implementacja ograniczeń czasowych dla tokenu JWT
- Możliwość unieważnienia tokenu po stronie serwera
- Zabezpieczenie przed atakami XSS i CSRF

## 7. Obsługa błędów
- 401 Unauthorized: Gdy token jest nieważny, wygasły lub nie został dostarczony
- 404 Not Found: Gdy nie znaleziono użytkownika (rzadki przypadek, powinien być obsłużony przez middleware JWT)
- 500 Internal Server Error: Gdy wystąpi nieoczekiwany błąd serwera

## 8. Rozważania dotyczące wydajności
- Buforowanie danych użytkownika w Redis lub podobnej usłudze
- Minimalizacja danych zwracanych do klienta
- Optymalizacja zapytań do bazy danych

## 9. Etapy wdrożenia
1. Utworzenie pliku `/src/pages/api/auth/me.ts`
2. Implementacja logiki pobierania danych użytkownika na podstawie tokenu
3. Filtrowanie i mapowanie danych użytkownika do wymaganego formatu odpowiedzi
4. Implementacja obsługi błędów
5. Testowanie endpointu
6. Dokumentacja endpointu

## 10. Przykładowa implementacja

```typescript
// src/pages/api/auth/me.ts
import type { APIRoute } from "astro";
import type { UserProfile } from "../../../types";

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const supabase = locals.supabase;
    
    // Pobierz dane użytkownika z sesji Supabase
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({
          error: "Użytkownik niezalogowany lub brak uprawnień"
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }
    
    // Pobierz dodatkowe informacje o użytkowniku z tabeli users
    const { data: userData, error: profileError } = await supabase
      .from('users')
      .select('id, email, manager_id')
      .eq('id', user.id)
      .single();
    
    if (profileError || !userData) {
      return new Response(
        JSON.stringify({
          error: "Nie znaleziono profilu użytkownika"
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
    const response: UserProfile = {
      id: userData.id,
      email: userData.email,
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
    console.error("Error in /auth/me endpoint:", err);
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