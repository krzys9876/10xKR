# API Endpoint Implementation Plan: POST /auth/login

## 1. Przegląd punktu końcowego
Endpoint służy do uwierzytelniania użytkowników przy użyciu Supabase Auth. Po pomyślnej weryfikacji danych uwierzytelniających użytkownika, zwraca token JWT oraz podstawowe informacje o użytkowniku.

## 2. Szczegóły żądania
- Metoda HTTP: POST
- Struktura URL: /auth/login
- Parametry: Brak
- Request Body:
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```

## 3. Wykorzystywane typy
```typescript
// Z src/types.ts:
import { LoginRequest, LoginResponse } from "../types";

// Do walidacji:
import { z } from "zod";

const loginRequestSchema = z.object({
  email: z.string().email({ message: "Nieprawidłowy format adresu email" }),
  password: z.string().min(6, { message: "Hasło musi mieć minimum 6 znaków" })
});
```

## 4. Szczegóły odpowiedzi
- Sukces (200 OK):
  ```json
  {
    "token": "string",
    "user": {
      "id": "uuid",
      "email": "string"
    }
  }
  ```
- Niepowodzenie:
  - 400 Bad Request: Nieprawidłowe dane wejściowe
  - 401 Unauthorized: Nieprawidłowe dane uwierzytelniające

## 5. Przepływ danych
1. Endpont otrzymuje żądanie POST z danymi uwierzytelniającymi użytkownika
2. Dane są walidowane przy użyciu schematu Zod
3. Przeprowadzane jest uwierzytelnianie przy użyciu klienta Supabase Auth
4. W przypadku pomyślnego uwierzytelnienia, zwracany jest token JWT i dane użytkownika
5. W przypadku niepowodzenia, zwracany jest odpowiedni kod błędu

## 6. Względy bezpieczeństwa
- Walidacja danych wejściowych przy użyciu Zod
- Używanie bezpiecznych praktyk Supabase Auth (protokół OAuth, tokeny JWT)
- Sanityzacja danych wejściowych przed użyciem
- Ograniczenia liczby prób logowania (rate limiting)
- Bezpieczne przechowywanie tokenów (nie w localStorage, preferowany httpOnly cookie)
- Użycie HTTPS do szyfrowania komunikacji

## 7. Obsługa błędów
- 400 Bad Request: Gdy dane wejściowe nie spełniają wymagań walidacji
- 401 Unauthorized: Gdy dane uwierzytelniające są nieprawidłowe
- 429 Too Many Requests: Gdy przekroczono limit prób logowania
- 500 Internal Server Error: Gdy wystąpi nieoczekiwany błąd serwera

## 8. Rozważania dotyczące wydajności
- Implementacja mechanizmu buforowania tokena
- Minimalizacja czasu odpowiedzi przy użyciu asynchronicznych operacji
- Monitorowanie wydajności endpointu

## 9. Etapy wdrożenia
1. Utworzenie pliku `/src/pages/api/auth/login.ts`
2. Implementacja endpointu uwierzytelniania z użyciem Astro i Supabase
3. Implementacja walidacji danych wejściowych przy użyciu Zod
4. Implementacja logiki uwierzytelniania w odpowiednim serwisie 
5. Implementacja obsługi błędów i logiki zwracania odpowiednich kodów HTTP
6. Refaktoryzacja i optymalizacja kodu
7. Dodanie testów jednostkowych i integracyjnych
8. Dokumentacja endpointu

## 10. Przykładowa implementacja

```typescript
// src/pages/api/auth/login.ts
import type { APIRoute } from "astro";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { LoginRequest, LoginResponse } from "../../../types";

export const prerender = false;

// Schemat walidacji danych logowania
const loginRequestSchema = z.object({
  email: z.string().email({ message: "Nieprawidłowy format adresu email" }),
  password: z.string().min(6, { message: "Hasło musi mieć minimum 6 znaków" })
});

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parsowanie body żądania
    const body = await request.json();
    
    // Walidacja danych wejściowych
    const validationResult = loginRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowe dane wejściowe",
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
    
    const { email, password } = validationResult.data;
    
    // Logika uwierzytelniania z Supabase
    const supabase = locals.supabase;
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowe dane uwierzytelniające",
          message: error.message
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }
    
    // Tworzymy odpowiedź w formacie wymaganym przez API
    const response: LoginResponse = {
      token: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email!
      }
    };
    
    // Zwracamy pomyślną odpowiedź
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
    console.error("Error in /auth/login endpoint:", err);
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