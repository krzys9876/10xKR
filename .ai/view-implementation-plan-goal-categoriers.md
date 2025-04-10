# API Endpoint Implementation Plan: GET /goal-categories

## 1. Przegląd punktu końcowego
Endpoint `/goal-categories` umożliwia pobranie listy wszystkich kategorii celów dostępnych w systemie. Kategorie celów są wykorzystywane do klasyfikacji i organizacji celów pracowników w procesach oceny. Endpoint zwraca prostą listę kategorii zawierającą identyfikatory i nazwy.

## 2. Szczegóły żądania
- Metoda HTTP: GET
- Struktura URL: /goal-categories
- Parametry: Brak
- Wymagane nagłówki: 
  - Authorization: Bearer {token} - token JWT uzyskany podczas logowania

## 3. Wykorzystywane typy
```typescript
// Z src/types.ts:
import { GoalCategoryDTO, GoalCategoryListResponse } from "../types";

// Typy używane w implementacji
interface GoalCategoryDBRecord {
  id: string;
  name: string;
  // inne pola z tabeli goal_categories, jeśli istnieją
}
```

## 4. Szczegóły odpowiedzi
- Format odpowiedzi:
  ```json
  {
    "categories": [
      {
        "id": "uuid",
        "name": "string"
      }
    ]
  }
  ```
- Kody stanu:
  - 200 OK - Pomyślne pobranie listy kategorii
  - 401 Unauthorized - Brak autoryzacji (nieprawidłowy lub brak tokenu JWT)
  - 500 Internal Server Error - Błąd serwera podczas przetwarzania żądania

## 5. Przepływ danych
1. Żądanie trafia do endpointu `/goal-categories` i przechodzi walidację JWT
2. Serwer wykonuje zapytanie do tabeli `goal_categories` w bazie danych Supabase
3. Dane z bazy są mapowane na DTO i formowane w odpowiedź
4. Odpowiedź jest zwracana klientowi w formacie JSON

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Wymagane uwierzytelnienie poprzez token JWT
- **Autoryzacja**: Zgodnie ze specyfikacją, każdy zalogowany użytkownik ma dostęp do listy kategorii celów
- **Walidacja danych**: Nie jest wymagana dla tego endpointu, ponieważ jest to operacja tylko do odczytu bez parametrów wejściowych
- **Supabase RLS (Row Level Security)**: Należy upewnić się, że polityki RLS na tabeli `goal_categories` pozwalają na odczyt zalogowanym użytkownikom

## 7. Obsługa błędów
- **Brak autoryzacji (401)**: Zwracany, gdy token JWT jest nieprawidłowy lub wygasł
- **Błąd serwera (500)**: Zwracany w przypadku nieoczekiwanych błędów podczas przetwarzania zapytania
- **Logowanie błędów**: Implementacja powinna zawierać odpowiednie logowanie błędów dla celów diagnostycznych

## 8. Rozważania dotyczące wydajności
- **Buforowanie**: Rozważ buforowanie listy kategorii, ponieważ rzadko się zmienia
- **Indeksowanie**: Upewnij się, że tabela `goal_categories` ma odpowiednie indeksy dla optymalnej wydajności zapytań
- **Monitoring**: Wprowadź monitorowanie czasu odpowiedzi dla tego endpointu, aby wykryć potencjalne problemy z wydajnością

## 9. Etapy wdrożenia
1. Utwórz plik `/src/pages/api/goal-categories.ts` dla obsługi endpointu
2. Zaimplementuj logikę endpointu zgodnie z poniższym schematem:

```typescript
import type { APIRoute } from "astro";
import { supabaseClient } from "../../db/supabase.client";
import { GoalCategoryDTO, GoalCategoryListResponse } from "../../types";

export const GET: APIRoute = async ({ request }) => {
  try {
    // 1. Walidacja tokenu JWT
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Brak tokenu autoryzacyjnego" }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    const token = authHeader.split(" ")[1];
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Nieprawidłowy token autoryzacyjny" }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    // 2. Pobranie kategorii celów z bazy danych
    const { data: categories, error: categoriesError } = await supabaseClient
      .from('goal_categories')
      .select('id, name')
      .order('name');

    if (categoriesError) {
      console.error("Błąd podczas pobierania kategorii celów:", categoriesError);
      return new Response(
        JSON.stringify({ error: "Wystąpił błąd podczas pobierania kategorii celów" }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    // 3. Przekształcenie danych na format DTO
    const categoryDTOs: GoalCategoryDTO[] = categories.map(category => ({
      id: category.id,
      name: category.name
    }));

    // 4. Przygotowanie odpowiedzi
    const response: GoalCategoryListResponse = {
      categories: categoryDTOs
    };

    // 5. Zwrócenie odpowiedzi
    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

  } catch (error) {
    console.error("Nieoczekiwany błąd podczas obsługi żądania:", error);
    return new Response(
      JSON.stringify({ error: "Wystąpił błąd serwera" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }
};
```

3. Dodaj testy jednostkowe dla endpointu w odpowiednim katalogu testów
4. Upewnij się, że polityki RLS w Supabase są poprawnie skonfigurowane
5. Przetestuj endpoint ręcznie za pomocą narzędzi takich jak Postman lub Thunder Client
6. Zintegruj endpoint z frontendem, tworząc odpowiednie komponenty do wyświetlania kategorii celów
7. Wdróż zmiany w środowisku produkcyjnym 