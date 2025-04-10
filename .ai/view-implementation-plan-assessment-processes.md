# API Endpoint Implementation Plan: Procesy Ocen

Ten dokument zawiera plany implementacji dla następujących powiązanych endpointów:

1. GET /assessment-processes
2. GET /assessment-processes/{processId}
3. GET /assessment-processes/{processId}/status-history
4. PUT /assessment-processes/{processId}/status

## Endpoint: GET /assessment-processes

### 1. Przegląd punktu końcowego
Endpoint służy do pobierania listy procesów ocen z opcjonalnym filtrowaniem według statusu i flagi aktywności. Umożliwia stronicowanie wyników w celu efektywnego zarządzania dużą liczbą procesów.

### 2. Szczegóły żądania
- Metoda HTTP: GET
- Struktura URL: /assessment-processes
- Parametry zapytania:
  - status: status procesu oceny (opcjonalny)
  - active: flaga aktywności (opcjonalna)
  - page: numer strony (opcjonalny, domyślnie 1)
  - limit: liczba procesów na stronę (opcjonalna, domyślnie 10)
- Wymagane nagłówki: 
  - Authorization: Bearer {token} - token JWT uzyskany podczas logowania

### 3. Wykorzystywane typy
```typescript
// Z src/types.ts:
import { 
  AssessmentProcessDTO, 
  AssessmentProcessListResponse, 
  AssessmentProcessStatus, 
  AssessmentProcessFilterQueryParams 
} from "../types";

// Do walidacji:
import { z } from "zod";

const assessmentProcessFilterSchema = z.object({
  status: z.enum(['in_definition', 'awaiting_self_assessment', 'in_self_assessment', 'awaiting_manager_assessment', 'completed']).optional(),
  active: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10)
});
```

### 4. Szczegóły odpowiedzi
- Sukces (200 OK):
  ```json
  {
    "processes": [
      {
        "id": "uuid",
        "name": "string",
        "status": "string",
        "active": "boolean",
        "startDate": "date",
        "endDate": "date"
      }
    ],
    "total": "number",
    "page": "number",
    "limit": "number"
  }
  ```
- Niepowodzenie:
  - 400 Bad Request: Nieprawidłowe parametry zapytania
  - 401 Unauthorized: Brak tokenu lub nieprawidłowy token
  - 500 Internal Server Error: Błąd serwera

### 5. Implementacja

```typescript
// src/pages/api/assessment-processes/index.ts
import type { APIRoute } from "astro";
import { z } from "zod";
import type { 
  AssessmentProcessDTO, 
  AssessmentProcessListResponse,
  AssessmentProcessStatus
} from "../../../types";

export const prerender = false;

// Schemat walidacji parametrów filtrowania
const assessmentProcessFilterSchema = z.object({
  status: z.enum(['in_definition', 'awaiting_self_assessment', 'in_self_assessment', 'awaiting_manager_assessment', 'completed']).optional(),
  active: z.coerce.boolean().optional(),
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
    
    // Pobierz i zwaliduj parametry zapytania
    const url = new URL(request.url);
    const validatedParams = assessmentProcessFilterSchema.safeParse({
      status: url.searchParams.get('status'),
      active: url.searchParams.get('active'),
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
    
    const { status, active, page, limit } = validatedParams.data;
    const offset = (page - 1) * limit;
    
    // Budowanie zapytania z opcjonalnymi filtrami
    let query = supabase
      .from('assessment_processes')
      .select('id, title, status, is_active, start_date, end_date', { count: 'exact' });
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (active !== undefined) {
      query = query.eq('is_active', active);
    }
    
    // Pobierz proces z paginacją
    const { data, count, error } = await query
      .order('start_date', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      return new Response(
        JSON.stringify({
          error: "Błąd podczas pobierania procesów ocen"
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
    const processes: AssessmentProcessDTO[] = data.map(process => ({
      id: process.id,
      name: process.title,
      status: process.status,
      active: process.is_active,
      startDate: process.start_date,
      endDate: process.end_date
    }));
    
    const response: AssessmentProcessListResponse = {
      processes,
      total: count || 0,
      page,
      limit
    };
    
    // Zwróć listę procesów ocen
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
    console.error("Error in GET /assessment-processes endpoint:", err);
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
```

---

## Endpoint: GET /assessment-processes/{processId}

### 1. Przegląd punktu końcowego
Endpoint służy do pobierania szczegółowych informacji o konkretnym procesie oceny na podstawie jego identyfikatora. Zwraca dane procesu, w tym jego identyfikator, nazwę, status, datę rozpoczęcia i zakończenia oraz flagę aktywności.

### 2. Szczegóły żądania
- Metoda HTTP: GET
- Struktura URL: /assessment-processes/{processId}
- Parametry ścieżki:
  - processId: identyfikator UUID procesu oceny
- Wymagane nagłówki: 
  - Authorization: Bearer {token} - token JWT uzyskany podczas logowania

### 3. Wykorzystywane typy
```typescript
// Z src/types.ts:
import { AssessmentProcessDTO } from "../types";

// Do walidacji:
import { z } from "zod";

const processIdSchema = z.string().uuid({ message: "Nieprawidłowy format identyfikatora procesu" });
```

### 4. Szczegóły odpowiedzi
- Sukces (200 OK):
  ```json
  {
    "id": "uuid",
    "name": "string",
    "status": "string",
    "active": "boolean",
    "startDate": "date",
    "endDate": "date"
  }
  ```
- Niepowodzenie:
  - 400 Bad Request: Nieprawidłowy format identyfikatora
  - 401 Unauthorized: Brak tokenu lub nieprawidłowy token
  - 404 Not Found: Proces o podanym identyfikatorze nie istnieje
  - 500 Internal Server Error: Błąd serwera

### 5. Implementacja

```typescript
// src/pages/api/assessment-processes/[processId].ts
import type { APIRoute } from "astro";
import { z } from "zod";
import type { AssessmentProcessDTO } from "../../../types";

export const prerender = false;

// Schemat walidacji identyfikatora procesu
const processIdSchema = z.string().uuid({ message: "Nieprawidłowy format identyfikatora procesu" });

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
    
    // Walidacja identyfikatora procesu
    const { processId } = params;
    const validationResult = processIdSchema.safeParse(processId);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowy format identyfikatora procesu",
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
    
    // Pobierz dane procesu
    const { data: processData, error: processError } = await supabase
      .from('assessment_processes')
      .select('id, title, status, is_active, start_date, end_date')
      .eq('id', processId)
      .single();
    
    if (processError) {
      if (processError.code === 'PGRST116') {
        // Nie znaleziono procesu (PGRST116 to kod błędu dla "nie znaleziono")
        return new Response(
          JSON.stringify({
            error: "Nie znaleziono procesu oceny o podanym identyfikatorze"
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
          error: "Błąd podczas pobierania danych procesu oceny"
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }
    
    if (!processData) {
      return new Response(
        JSON.stringify({
          error: "Nie znaleziono procesu oceny o podanym identyfikatorze"
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
    const response: AssessmentProcessDTO = {
      id: processData.id,
      name: processData.title,
      status: processData.status,
      active: processData.is_active,
      startDate: processData.start_date,
      endDate: processData.end_date
    };
    
    // Zwróć dane procesu
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
    console.error("Error in /assessment-processes/{processId} endpoint:", err);
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
```

---

## Endpoint: GET /assessment-processes/{processId}/status-history

### 1. Przegląd punktu końcowego
Endpoint służy do pobierania historii zmian statusu dla konkretnego procesu oceny. Jest to przydatne do śledzenia postępu procesu oraz wykonywania audytu zmian.

### 2. Szczegóły żądania
- Metoda HTTP: GET
- Struktura URL: /assessment-processes/{processId}/status-history
- Parametry ścieżki:
  - processId: identyfikator UUID procesu oceny
- Wymagane nagłówki: 
  - Authorization: Bearer {token} - token JWT uzyskany podczas logowania

### 3. Wykorzystywane typy
```typescript
// Z src/types.ts:
import { StatusHistoryEntry, StatusHistoryResponse } from "../types";

// Do walidacji:
import { z } from "zod";

const processIdSchema = z.string().uuid({ message: "Nieprawidłowy format identyfikatora procesu" });
```

### 4. Szczegóły odpowiedzi
- Sukces (200 OK):
  ```json
  {
    "history": [
      {
        "status": "string",
        "changedAt": "datetime",
        "changedBy": {
          "id": "uuid",
          "name": "string"
        }
      }
    ]
  }
  ```
- Niepowodzenie:
  - 400 Bad Request: Nieprawidłowy format identyfikatora
  - 401 Unauthorized: Brak tokenu lub nieprawidłowy token
  - 403 Forbidden: Brak uprawnień do wykonania operacji
  - 404 Not Found: Proces o podanym identyfikatorze nie istnieje
  - 500 Internal Server Error: Błąd serwera

### 5. Implementacja

```typescript
// src/pages/api/assessment-processes/[processId]/status-history.ts
import type { APIRoute } from "astro";
import { z } from "zod";
import type { StatusHistoryEntry, StatusHistoryResponse } from "../../../../types";

export const prerender = false;

// Schemat walidacji identyfikatora procesu
const processIdSchema = z.string().uuid({ message: "Nieprawidłowy format identyfikatora procesu" });

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
    
    // Walidacja identyfikatora procesu
    const { processId } = params;
    const validationResult = processIdSchema.safeParse(processId);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowy format identyfikatora procesu",
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
    
    // Sprawdź czy proces istnieje
    const { data: processData, error: processError } = await supabase
      .from('assessment_processes')
      .select('id')
      .eq('id', processId)
      .single();
    
    if (processError || !processData) {
      return new Response(
        JSON.stringify({
          error: "Nie znaleziono procesu oceny o podanym identyfikatorze"
        }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }
    
    // Sprawdź czy użytkownik ma uprawnienia (administrator lub menedżer)
    const isAdmin = await checkIfUserIsAdmin(supabase, user.id);
    const isManager = await checkIfUserIsManager(supabase, user.id);
    
    if (!isAdmin && !isManager) {
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
    
    // Pobierz historię zmian statusu
    // Zakładamy, że istnieje tabela status_history przechowująca historię zmian statusu procesów
    const { data: historyData, error: historyError } = await supabase
      .from('status_history')
      .select(`
        status,
        changed_at,
        changed_by_id,
        users!changed_by_id (id, first_name, last_name)
      `)
      .eq('assessment_process_id', processId)
      .order('changed_at', { ascending: false });
    
    if (historyError) {
      return new Response(
        JSON.stringify({
          error: "Błąd podczas pobierania historii statusów"
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
    const history: StatusHistoryEntry[] = historyData.map(entry => ({
      status: entry.status,
      changedAt: entry.changed_at,
      changedBy: {
        id: entry.users.id,
        name: `${entry.users.first_name} ${entry.users.last_name}`
      }
    }));
    
    const response: StatusHistoryResponse = {
      history
    };
    
    // Zwróć historię statusów
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
    console.error("Error in /assessment-processes/{processId}/status-history endpoint:", err);
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
  const { data, error } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', userId)
    .single();
  
  return !error && !!data;
}

// Funkcja pomocnicza do sprawdzania, czy użytkownik jest menedżerem
async function checkIfUserIsManager(supabase, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('manager_id', userId)
    .limit(1);
  
  return !error && data.length > 0;
}
```

---

## Endpoint: PUT /assessment-processes/{processId}/status

### 1. Przegląd punktu końcowego
Endpoint służy do aktualizacji statusu procesu oceny. Pozwala na zmianę statusu procesu w oparciu o zdefiniowany przepływ pracy: "in definition" → "in self-assessment" → "awaiting manager assessment" → "completed".

### 2. Szczegóły żądania
- Metoda HTTP: PUT
- Struktura URL: /assessment-processes/{processId}/status
- Parametry ścieżki:
  - processId: identyfikator UUID procesu oceny
- Request Body:
  ```json
  {
    "status": "string"
  }
  ```
- Wymagane nagłówki: 
  - Authorization: Bearer {token} - token JWT uzyskany podczas logowania
  - Content-Type: application/json

### 3. Wykorzystywane typy
```typescript
// Z src/types.ts:
import { 
  UpdateAssessmentProcessStatusCommand, 
  UpdateAssessmentProcessStatusResponse, 
  AssessmentProcessStatus 
} from "../types";

// Do walidacji:
import { z } from "zod";

const processIdSchema = z.string().uuid({ message: "Nieprawidłowy format identyfikatora procesu" });
const statusUpdateSchema = z.object({
  status: z.enum(['in_definition', 'awaiting_self_assessment', 'in_self_assessment', 'awaiting_manager_assessment', 'completed'])
});
```

### 4. Szczegóły odpowiedzi
- Sukces (200 OK):
  ```json
  {
    "id": "uuid",
    "status": "string",
    "previousStatus": "string",
    "changedAt": "datetime"
  }
  ```
- Niepowodzenie:
  - 400 Bad Request: Nieprawidłowy format identyfikatora lub danych wejściowych
  - 401 Unauthorized: Brak tokenu lub nieprawidłowy token
  - 403 Forbidden: Brak uprawnień do wykonania operacji
  - 404 Not Found: Proces o podanym identyfikatorze nie istnieje
  - 500 Internal Server Error: Błąd serwera

### 5. Implementacja

```typescript
// src/pages/api/assessment-processes/[processId]/status.ts
import type { APIRoute } from "astro";
import { z } from "zod";
import type { 
  UpdateAssessmentProcessStatusCommand, 
  UpdateAssessmentProcessStatusResponse,
  AssessmentProcessStatus
} from "../../../../types";

export const prerender = false;

// Schemat walidacji identyfikatora procesu
const processIdSchema = z.string().uuid({ message: "Nieprawidłowy format identyfikatora procesu" });

// Schemat walidacji danych do aktualizacji statusu
const statusUpdateSchema = z.object({
  status: z.enum(['in_definition', 'awaiting_self_assessment', 'in_self_assessment', 'awaiting_manager_assessment', 'completed'])
});

// Mapa dozwolonych przejść statusów
const allowedStatusTransitions = {
  'in_definition': ['awaiting_self_assessment'],
  'awaiting_self_assessment': ['in_self_assessment'],
  'in_self_assessment': ['awaiting_manager_assessment'],
  'awaiting_manager_assessment': ['completed'],
  'completed': []
};

export const PUT: APIRoute = async ({ params, request, locals }) => {
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
    
    // Walidacja identyfikatora procesu
    const { processId } = params;
    const validationResult = processIdSchema.safeParse(processId);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowy format identyfikatora procesu",
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
    
    // Sprawdź czy proces istnieje i pobierz jego aktualny status
    const { data: processData, error: processError } = await supabase
      .from('assessment_processes')
      .select('id, status')
      .eq('id', processId)
      .single();
    
    if (processError || !processData) {
      return new Response(
        JSON.stringify({
          error: "Nie znaleziono procesu oceny o podanym identyfikatorze"
        }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }
    
    // Sprawdź czy użytkownik ma uprawnienia (administrator lub menedżer)
    const isAdmin = await checkIfUserIsAdmin(supabase, user.id);
    const isManager = await checkIfUserIsManager(supabase, user.id);
    
    if (!isAdmin && !isManager) {
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
    
    // Parsuj i waliduj dane wejściowe
    let body;
    try {
      body = await request.json();
    } catch (err) {
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowy format danych JSON"
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }
    
    const statusValidationResult = statusUpdateSchema.safeParse(body);
    
    if (!statusValidationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowe dane wejściowe",
          details: statusValidationResult.error.format()
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }
    
    const newStatus = statusValidationResult.data.status;
    const currentStatus = processData.status as AssessmentProcessStatus;
    
    // Sprawdź czy przejście statusu jest dozwolone
    if (!allowedStatusTransitions[currentStatus].includes(newStatus)) {
      return new Response(
        JSON.stringify({
          error: `Niedozwolone przejście statusu z '${currentStatus}' do '${newStatus}'`
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }
    
    // Aktualizuj status procesu
    const now = new Date().toISOString();
    const { data: updatedProcess, error: updateError } = await supabase
      .from('assessment_processes')
      .update({ status: newStatus, updated_at: now })
      .eq('id', processId)
      .select('id, status')
      .single();
    
    if (updateError) {
      return new Response(
        JSON.stringify({
          error: "Błąd podczas aktualizacji statusu procesu"
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }
    
    // Dodaj wpis do historii statusów
    const { error: historyError } = await supabase
      .from('status_history')
      .insert({
        assessment_process_id: processId,
        status: newStatus,
        changed_at: now,
        changed_by_id: user.id
      });
    
    if (historyError) {
      console.error("Error adding status history:", historyError);
      // Kontynuujemy mimo błędu zapisu historii, ale logujemy błąd
    }
    
    // Przygotuj odpowiedź
    const response: UpdateAssessmentProcessStatusResponse = {
      id: updatedProcess.id,
      status: updatedProcess.status,
      previousStatus: currentStatus,
      changedAt: now
    };
    
    // Zwróć zaktualizowany status
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
    console.error("Error in PUT /assessment-processes/{processId}/status endpoint:", err);
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
  const { data, error } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', userId)
    .single();
  
  return !error && !!data;
}

// Funkcja pomocnicza do sprawdzania, czy użytkownik jest menedżerem
async function checkIfUserIsManager(supabase, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('manager_id', userId)
    .limit(1);
  
  return !error && data.length > 0;
} 