# Struktura komponentów React w Systemie Oceny Celów

Poniżej przedstawiona została hierarchiczna struktura komponentów React w systemie, uwzględniająca logiczne zależności między komponentami:

```
  App
  │
  ├── Layout (Astro)
  │   ├── Welcome.astro (strona powitalna)
  │   └── DashboardLayout.astro
  │
  ├── Auth
  │   └── LoginForm
  │       ├── FormField (Email)
  │       ├── FormField (Password)
  │       └── Button (Submit)
  │
  ├── Dashboard
  │   ├── DashboardView
  │   │   ├── UserProfileHeader
  │   │   ├── ProcessStepper (wizualizacja status procesu)
  │   │   ├── ProcessCard (karta procesu oceny)
  │   │   └── EmployeeList (lista pracowników dla kierowników)
  │   │       └── EmployeeItem
  │   └── useDashboard (custom hook zarządzający stanem dashboardu)
  │
  ├── Goals Definition (definiowanie celów)
  │   ├── GoalsDefinitionPage (strona główna definiowania celów)
  │   │   ├── EmployeeInfo (informacje o pracowniku)
  │   │   ├── GoalForm (formularz dodawania/edycji celu)
  │   │   └── GoalsList (lista celów pracownika)
  │   └── useGoalsDefinition (custom hook zarządzający celami)
  │
  └── Goals View (ocena celów)
      ├── GoalsViewPage (strona główna przeglądania i oceny celów)
      │   ├── ProcessStepper
      │   ├── GoalsList (lista celów z oceną)
      │   │   └── GoalCard (szczegóły celu z oceną)
      │   ├── SelfAssessmentForm (formularz samooceny)
      │   └── ManagerAssessmentForm (formularz oceny kierownika)
      ├── useGoals (custom hook zarządzający celami)
      └── useManagerAssessment (custom hook zarządzający ocenami kierownika)
```

## Opis głównych komponentów

### Layout
Główny szablon aplikacji oparty na Astro, zawierający podstawową strukturę strony.

### Auth
Komponenty związane z uwierzytelnianiem użytkownika, w tym formularz logowania.

### Dashboard
Widok główny aplikacji po zalogowaniu, zawierający:
- Informacje o profilu użytkownika
- Listę procesów oceny
- Dla kierowników: listę podległych pracowników
- Wizualizację etapów procesu oceny

### Goals Definition
Komponenty odpowiedzialne za definiowanie celów pracowników:
- Formularz dodawania/edycji celu
- Lista zdefiniowanych celów
- Informacje o pracowniku dla którego definiowane są cele

### Goals View
Komponenty odpowiedzialne za przeglądanie i ocenianie celów:
- Lista celów z możliwością oceny
- Formularze samooceny pracownika
- Formularze oceny kierownika
- Karty celów z szczegółowymi informacjami

## Podejście do zarządzania stanem

System wykorzystuje dedykowane hooki custom do zarządzania stanem i operacjami na danych:
- `useDashboard` - zarządzanie stanem dashboardu
- `useGoalsDefinition` - zarządzanie celami w trybie definicji
- `useGoals` - zarządzanie celami w trybie przeglądania
- `useManagerAssessment` - zarządzanie ocenami kierownika

Każda sekcja aplikacji wykorzystuje komponenty UI z biblioteki shadcn/ui, co zapewnia spójny interfejs użytkownika. 