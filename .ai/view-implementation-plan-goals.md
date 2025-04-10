# API Endpoint Implementation Plan: POST /assessment-processes/{processId}/employees/{employeeId}/goals

## 1. Przegląd punktu końcowego
Endpoint służy do tworzenia nowych celów dla pracownika w ramach konkretnego procesu oceny. Umożliwia menedżerom lub pracownikom definiowanie celów z określonym opisem, wagą oraz kategorią. Endpoint zwraca utworzony cel wraz z ewentualnymi błędami walidacji.

## 2. Szczegóły żądania
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

## 3. Wykorzystywane typy
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

## 4. Szczegóły odpowiedzi
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

## 5. Przepływ danych
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

## 6. Względy bezpieczeństwa
- Weryfikacja tokenu JWT oraz uprawnień użytkownika
- Ograniczenie dostępu tylko dla menedżerów danego pracownika lub samego pracownika
- Walidacja wszystkich danych wejściowych przed zapisem do bazy danych
- Weryfikacja, czy proces oceny jest w odpowiednim statusie (tylko "in_definition")
- Filtrowanie wrażliwych danych przed zwróceniem odpowiedzi
- Obsługa wyjątków w celu zapobiegania ujawnieniu wewnętrznych błędów serwera

## 7. Obsługa błędów
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

## 8. Rozważania dotyczące wydajności
- Zoptymalizowane zapytania do bazy danych z indeksami na kluczach obcych
- Jednoczesne sprawdzanie istnienia procesu, pracownika i kategorii w jednym zapytaniu
- Transakcyjne zapisywanie danych w celu zapewnienia spójności
- Efektywne mapowanie danych między obiektami DTO a encjami bazodanowymi

## 9. Etapy wdrożenia
1. Utworzenie pliku `/src/pages/api/assessment-processes/[processId]/employees/[employeeId]/goals.ts`
2. Implementacja walidacji parametrów ścieżki i danych wejściowych przy użyciu Zod
3. Implementacja logiki tworzenia celu w serwisie GoalService
4. Implementacja kontroli dostępu w oparciu o relacje menedżer-pracownik
5. Implementacja walidacji biznesowej (sprawdzanie statusu procesu, zakres wagi)
6. Implementacja obsługi błędów i zwracania odpowiednich kodów HTTP
7. Testowanie endpointu
8. Dokumentacja endpointu

## 10. Przykładowa implementacja

```typescript
// src/pages/api/assessment-processes/[processId]/employees/[employeeId]/goals.ts
import type { APIRoute } from "astro";
import { z } from "zod";
import { supabaseClient } from "../../../../../../db/supabase.client";
import type { 
  CreateGoalCommand, 
  GoalResponse, 
  GoalDTO, 
  AssessmentProcessStatus 
} from "../../../../../../types";

export const prerender = false;

// Schematy walidacji
const createGoalSchema = z.object({
  description: z.string().min(5, { message: "Opis celu musi mieć minimum 5 znaków" }).max(500, { message: "Opis celu nie może przekraczać 500 znaków" }),
  weight: z.number().min(0, { message: "Waga celu musi być większa lub równa 0%" }).max(100, { message: "Waga celu nie może przekraczać 100%" }),
  categoryId: z.string().uuid({ message: "Nieprawidłowy format identyfikatora kategorii" })
});

export const post: APIRoute = async ({ request, params }) => {
  try {
    // 1. Walidacja parametrów ścieżki
    const pathParamsSchema = z.object({
      processId: z.string().uuid({ message: "Nieprawidłowy format identyfikatora procesu" }),
      employeeId: z.string().uuid({ message: "Nieprawidłowy format identyfikatora pracownika" })
    });
    
    const pathValidation = pathParamsSchema.safeParse(params);
    if (!pathValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowe parametry ścieżki",
          details: pathValidation.error.format()
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }
    
    // 2. Pobranie i walidacja JWT
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: "Brak autoryzacji" }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }
    
    const token = authHeader.split(' ')[1];
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
    
    // 3. Walidacja danych wejściowych
    const requestData = await request.json();
    const validationResult = createGoalSchema.safeParse(requestData);
    
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
    
    const { processId, employeeId } = pathValidation.data;
    const { description, weight, categoryId } = validationResult.data;
    
    // 4. Sprawdzenie, czy proces oceny istnieje i ma odpowiedni status
    const { data: process, error: processError } = await supabaseClient
      .from('assessment_processes')
      .select('id, status')
      .eq('id', processId)
      .single();
    
    if (processError || !process) {
      return new Response(
        JSON.stringify({ error: "Proces oceny nie istnieje" }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }
    
    if (process.status !== 'in_definition') {
      return new Response(
        JSON.stringify({ 
          error: "Cele można tworzyć tylko dla procesów w fazie definiowania",
          validationErrors: ["Proces nie jest w stanie in_definition"]
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }
    
    // 5. Sprawdzenie, czy pracownik istnieje
    const { data: employee, error: employeeError } = await supabaseClient
      .from('users')
      .select('id, manager_id, first_name, last_name')
      .eq('id', employeeId)
      .single();
    
    if (employeeError || !employee) {
      return new Response(
        JSON.stringify({ error: "Pracownik nie istnieje" }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }
    
    // 6. Sprawdzenie uprawnień - czy użytkownik jest menedżerem pracownika lub samym pracownikiem
    if (user.id !== employeeId && user.id !== employee.manager_id) {
      return new Response(
        JSON.stringify({ error: "Brak uprawnień do tworzenia celów dla tego pracownika" }),
        {
          status: 403,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }
    
    // 7. Sprawdzenie, czy kategoria istnieje
    const { data: category, error: categoryError } = await supabaseClient
      .from('goal_categories')
      .select('id, name')
      .eq('id', categoryId)
      .single();
    
    if (categoryError || !category) {
      return new Response(
        JSON.stringify({ error: "Kategoria celu nie istnieje" }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }
    
    // 8. Utworzenie celu
    const { data: newGoal, error: createError } = await supabaseClient
      .from('goals')
      .insert({
        description,
        weight,
        category_id: categoryId,
        employee_id: employeeId,
        process_id: processId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single();
    
    if (createError || !newGoal) {
      return new Response(
        JSON.stringify({ error: "Błąd podczas tworzenia celu" }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }
    
    // 9. Przygotowanie odpowiedzi
    const response: GoalResponse = {
      id: newGoal.id,
      description,
      weight,
      category: {
        id: category.id,
        name: category.name
      },
      validationErrors: []
    };
    
    // 10. Zwrócenie odpowiedzi
    return new Response(
      JSON.stringify(response),
      {
        status: 201,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
    
  } catch (error) {
    console.error("Błąd podczas tworzenia celu:", error);
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