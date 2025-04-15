# Rekomendacje dotyczące testów jednostkowych

Na podstawie analizy struktury komponentów React i planu testów, rekomendowane są testy jednostkowe dla następujących elementów:

## 1. Niestandardowe hooki (custom hooks)

### `useDashboard`
- **Co testować**: Zarządzanie stanem dashboardu, fetchowanie procesów, selekcja procesów i pracowników, aktualizacja statusu procesu
- **Dlaczego**: Hook ten zawiera złożoną logikę biznesową zarządzania procesami oceny i ich statusami. Błędy w tej części mogą powodować nieprawidłowe działanie całego dashboardu.

### `useGoalsDefinition`
- **Co testować**: Dodawanie, aktualizowanie i usuwanie celów, walidacja sumy wag
- **Dlaczego**: Zawiera kluczową logikę biznesową zarządzania celami, w tym krytyczną walidację sumy wag (= 100%).

### `useGoals` i `useManagerAssessment`
- **Co testować**: Ładowanie celów, zapisywanie ocen, walidacja dostępu do ocen
- **Dlaczego**: Zapewniają poprawny przepływ danych w procesie oceny i samooceny, co stanowi główną funkcjonalność systemu.

### `useLoginForm`
- **Co testować**: Obsługa logowania, zarządzanie stanem błędów, przekierowania po zalogowaniu
- **Dlaczego**: Jest to punkt wejścia do systemu, błędy w tym miejscu blokują dostęp do całej aplikacji.

## 2. Walidatory i funkcje pomocnicze

### Funkcje walidacyjne formularzy
- **Co testować**: Walidacja wag celów, walidacja formularzy logowania, walidacja formularzy ocen
- **Dlaczego**: Zapewniają integralność danych i zgodność z regułami biznesowymi (np. suma wag = 100%).

### Funkcje przekształcania danych
- **Co testować**: Transformacja danych z API do modeli widoku (np. AssessmentProcessDTO → AssessmentProcessViewModel)
- **Dlaczego**: Błędy w transformacji danych mogą prowadzić do niepoprawnego wyświetlania lub przetwarzania danych.

## 3. Komponenty React

### Formularze
- **Co testować**: `LoginForm`, `GoalForm`, `SelfAssessmentForm`, `ManagerAssessmentForm`
- **Dlaczego**: Zawierają logikę zbierania i walidacji danych wprowadzanych przez użytkownika.

### Komponenty prezentacyjne z logiką biznesową
- **Co testować**: `GoalsList`, `ProcessStepper`, `GoalCard`
- **Dlaczego**: Zawierają logikę biznesową (np. wyświetlanie statusów, obliczanie sumy wag) wraz z prezentacją danych.

## 4. Priorytety testów jednostkowych

1. **Najwyższy priorytet**:
   - Walidacja wag celów (suma = 100%)
   - Hook `useGoalsDefinition` (operacje CRUD na celach)
   - Formularze wprowadzania danych z walidacją

2. **Wysoki priorytet**:
   - Hook `useDashboard` (zmiana statusów procesu)
   - Hooki `useGoals` i `useManagerAssessment` (obsługa ocen)
   - `ProcessStepper` (kontrola przepływu procesu)

3. **Średni priorytet**:
   - Komponenty prezentacyjne z logiką biznesową
   - Funkcje transformacji danych
   - Hook `useLoginForm`

## 5. Podejście do testowania

1. **Dla hooków**:
   - Testować w izolacji przy użyciu `renderHook` z React Testing Library
   - Mockować zewnętrzne zależności (np. API)
   - Sprawdzać reakcje na różne stany i błędy

2. **Dla komponentów**:
   - Testować zachowanie komponentu (co widzi użytkownik)
   - Testować interakcje użytkownika (np. kliknięcia, wprowadzanie danych)
   - Sprawdzać emisję odpowiednich zdarzeń (np. onSave, onChange)

3. **Dla funkcji walidacyjnych**:
   - Testować przypadki brzegowe
   - Sprawdzać reakcje na nieprawidłowe dane
   - Weryfikować zgodność z regułami biznesowymi

Powyższe rekomendacje są zgodne z punktem 3.1 planu testów i powinny zapewnić solidne pokrycie testami jednostkowymi kluczowych elementów systemu. 