# Plan implementacji widoku logowania

## 1. Przegląd
Widok logowania to pierwszy punkt kontaktu użytkownika z systemem oceny celów. Zapewnia on bezpieczny dostęp do aplikacji poprzez mechanizm uwierzytelniania. Po zalogowaniu użytkownik zostanie przekierowany do dashboardu, gdzie zobaczy interfejs dostosowany do swojej roli (kierownik lub pracownik).

## 2. Routing widoku
- Strona logowania: `/login`
- Dashboard (po zalogowaniu): `/dashboard`

## 3. Struktura komponentów
```
- LoginPage (Astro)
  - LoginForm (React)
    - EmailInput (Shadcn/ui)
    - PasswordInput (Shadcn/ui)
    - SubmitButton (Shadcn/ui)
    - ErrorMessage (Shadcn/ui)

- DashboardLayout (Astro)
  - Header
    - UserProfileInfo (React)
    - LogoutButton (Shadcn/ui)
  - MainContent (zależne od roli)
```

## 4. Szczegóły komponentów
### LoginPage (Astro)
- Opis komponentu: Strona logowania zawierająca formularz uwierzytelniania
- Główne elementy: Nagłówek strony, LoginForm (React), stopka
- Obsługiwane interakcje: Brak (interakcje obsługiwane przez LoginForm)
- Obsługiwana walidacja: Brak (walidacja obsługiwana przez LoginForm)
- Typy: Brak
- Propsy: Brak

### LoginForm (React)
- Opis komponentu: Interaktywny formularz logowania z polami email i hasło
- Główne elementy: Pola formularza (email, hasło), przycisk submitu, komunikat błędu
- Obsługiwane interakcje: 
  - Wprowadzanie danych przez użytkownika
  - Kliknięcie przycisku logowania
  - Reakcja na błędy uwierzytelniania
- Obsługiwana walidacja: 
  - Email: wymagany, poprawny format email
  - Hasło: wymagane, niepuste
- Typy: LoginFormData, LoginFormProps, LoginError
- Propsy: 
  ```typescript
  interface LoginFormProps {
    onSubmit: (data: LoginFormData) => Promise<void>;
    isLoading: boolean;
    error: LoginError | null;
  }
  ```

### UserProfileInfo (React)
- Opis komponentu: Wyświetla informacje o zalogowanym użytkowniku w nagłówku
- Główne elementy: Email użytkownika, rola użytkownika (kierownik/pracownik)
- Obsługiwane interakcje: Brak
- Obsługiwana walidacja: Brak
- Typy: UserProfile, UserProfileInfoProps
- Propsy: 
  ```typescript
  interface UserProfileInfoProps {
    userProfile: UserProfile;
  }
  ```

### LogoutButton (React)
- Opis komponentu: Przycisk wylogowywania użytkownika
- Główne elementy: Przycisk
- Obsługiwane interakcje: Kliknięcie przycisku wylogowania
- Obsługiwana walidacja: Brak
- Typy: LogoutButtonProps
- Propsy: 
  ```typescript
  interface LogoutButtonProps {
    onLogout: () => void;
  }
  ```

## 5. Typy
```typescript
// Dane formularza logowania
interface LoginFormData {
  email: string;
  password: string;
}

// Błąd logowania
interface LoginError {
  message: string;
  code?: string;
}

// Zapytanie logowania (zgodne z API)
interface LoginRequest {
  email: string;
  password: string;
}

// Odpowiedź z API logowania
interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
  };
}

// Profil użytkownika
interface UserProfile {
  id: string;
  email: string;
  managerId: string | null;
  isManager: boolean; // Pochodna z managerId (true jeśli null)
}
```

## 6. Zarządzanie stanem
Logowanie będzie zarządzane przez dwa główne hooki:

### useLoginForm
```typescript
const useLoginForm = () => {
  const [formData, setFormData] = useState<LoginFormData>({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<LoginError | null>(null);

  // Funkcje obsługujące formularz: handleChange, validateForm, handleSubmit
  
  return { formData, errors, isLoading, error, handleChange, handleSubmit };
};
```

### useAuth
Hook zarządzający stanem uwierzytelnienia, implementowany jako kontekst React (AuthContext):

```typescript
const useAuth = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Funkcje: login, logout, getUserProfile, isManager
  
  return { user, isLoading, isAuthenticated, login, logout };
};
```

## 7. Integracja API
### Logowanie
```typescript
const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Błąd logowania');
  }

  return await response.json();
};
```

### Pobieranie profilu użytkownika
```typescript
const getUserProfile = async (): Promise<UserProfile> => {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch('/api/auth/me', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Nie udało się pobrać profilu użytkownika');
  }

  const data = await response.json();
  
  // Dodanie flagi isManager na podstawie managerId
  return {
    ...data,
    isManager: data.managerId === null,
  };
};
```

## 8. Interakcje użytkownika
### Proces logowania
1. Użytkownik wchodzi na stronę `/login`
2. Wypełnia formularz (email, hasło)
3. Walidacja pól formularza:
   - Email: wymagany, poprawny format
   - Hasło: wymagane, niepuste
4. Kliknięcie przycisku "Zaloguj się"
5. Wysłanie żądania do `/api/auth/login`
6. Obsługa odpowiedzi:
   - Sukces: zapisanie tokena, pobranie profilu, przekierowanie do `/dashboard`
   - Błąd: wyświetlenie komunikatu błędu

### Proces wylogowania
1. Użytkownik klika przycisk "Wyloguj się" w nagłówku
2. Usunięcie tokena z localStorage
3. Przekierowanie do strony logowania

## 9. Warunki i walidacja
### Walidacja formularza logowania
- Email:
  - Jest wymagany
  - Musi być w poprawnym formacie (regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
- Hasło:
  - Jest wymagane
  - Nie może być puste

### Walidacja tokena
- Token jest przechowywany w localStorage
- Przed każdym żądaniem wymagającym uwierzytelnienia, token jest dodawany do nagłówka
- Jeśli token jest nieważny, użytkownik jest przekierowywany do strony logowania

## 10. Obsługa błędów
### Błędy logowania
- Nieprawidłowe dane logowania: "Nieprawidłowy email lub hasło"
- Brak połączenia z serwerem: "Nie można połączyć się z serwerem"
- Wygaśnięcie sesji: "Twoja sesja wygasła, zaloguj się ponownie"

### Błędy pobierania profilu
- Nieważny token: automatyczne wylogowanie i przekierowanie do strony logowania
- Błąd serwera: komunikat "Wystąpił błąd podczas pobierania danych użytkownika"

## 11. Kroki implementacji
1. Utworzenie strony `/src/pages/login.astro`
2. Implementacja komponentu `LoginForm.tsx` w `/src/components/auth/`
3. Utworzenie hooka `useLoginForm.ts` w `/src/hooks/`
4. Implementacja kontekstu uwierzytelniania:
   - Utworzenie `AuthContext.tsx` w `/src/context/`
   - Implementacja hooka `useAuth.ts`
5. Utworzenie strony dashboardu `/src/pages/dashboard.astro`
6. Implementacja komponentów:
   - `UserProfileInfo.tsx`
   - `LogoutButton.tsx`
7. Implementacja middleware zabezpieczającego strony wymagające uwierzytelnienia
8. Testowanie:
   - Scenariusze pozytywne: poprawne logowanie, wylogowanie
   - Scenariusze negatywne: błędne dane, wygaśnięcie tokena
9. Integracja z systemem routingu Astro
10. Testowanie end-to-end całego przepływu logowania i wylogowania 