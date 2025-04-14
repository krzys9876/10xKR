# Plan Testów dla Systemu Oceny Celów

## 1. Wprowadzenie i cele testowania

Niniejszy plan testów został opracowany dla aplikacji "System Oceny Celów" - rozwiązania do definiowania i oceny celów rocznych pracowników. Testy mają na celu weryfikację, czy aplikacja spełnia wymagania funkcjonalne i niefunkcjonalne określone w dokumentacji projektowej, zapewniając wysoką jakość, niezawodność oraz bezpieczeństwo.

### Cele testowania:
- Weryfikacja prawidłowego działania wszystkich funkcjonalności systemu
- Wykrycie potencjalnych błędów i niedoskonałości przed wdrożeniem
- Zapewnienie zgodności z wymaganiami biznesowymi
- Sprawdzenie responsywności i dostępności interfejsu użytkownika
- Zapewnienie poprawnego działania w różnych scenariuszach użycia

## 2. Zakres testów

### W zakresie testów:
- Testy funkcjonalne wszystkich modułów aplikacji
- Weryfikacja procesów logowania i uwierzytelniania
- Testy procesu definiowania celów przez kierowników
- Testy procesu samooceny przez pracowników
- Testy procesu oceny końcowej przez kierowników
- Testy walidacji danych (np. suma wag celów = 100%)
- Testy integracji z backendem Supabase
- Testy UI/UX oraz dostępności interfejsu użytkownika
- Testy wydajnościowe podstawowych operacji

### Poza zakresem testów:
- Testy penetracyjne bezpieczeństwa infrastruktury Supabase
- Testy kompatybilności z aplikacjami mobilnymi
- Integracja z systemami zewnętrznymi (poza MVP)
- Testy automatyzacji powiadomień (poza MVP)

## 3. Typy testów do przeprowadzenia

### 3.1. Testy jednostkowe
- **Komponenty React**: Testowanie izolowanych komponentów React przy użyciu React Testing Library
- **Hooki**: Testowanie niestandardowych hooków
- **Walidatory**: Testowanie funkcji walidujących dane formularzy

### 3.2. Testy integracyjne
- Testy współpracy komponentów w ramach procesu oceny
- Testy integracji frontend-backend z wykorzystaniem zamockowanego API
- Testy przepływu danych między komponentami

### 3.3. Testy end-to-end
- Testy całych scenariuszy użytkownika od początku do końca
- Testy przepływu procesu oceny celów (definiowanie -> samoocena -> ocena końcowa)
- Testy logowania i uwierzytelniania

### 3.4. Testy UI/UX
- Testy zgodności z projektami interfejsu
- Testy responsywności (różne rozdzielczości ekranu)
- Testy dostępności (WCAG)

### 3.5. Testy wydajnościowe
- Testy ładowania komponentów
- Testy renderowania list celów
- Testy czasu odpowiedzi podczas operacji CRUD

### 3.6. Testy API
- Testy poprawności działania endpointów API
- Testy obsługi błędów i wyjątków
- Testy autoryzacji i walidacji zapytań

## 4. Scenariusze testowe dla kluczowych funkcjonalności

### 4.1. Logowanie użytkownika
1. **Scenariusz**: Logowanie poprawne
   - Dane wejściowe: Poprawny email i hasło
   - Oczekiwany rezultat: Użytkownik zostaje zalogowany i przekierowany do panelu głównego

2. **Scenariusz**: Logowanie niepoprawne
   - Dane wejściowe: Niepoprawny email lub hasło
   - Oczekiwany rezultat: Wyświetlenie komunikatu o błędzie logowania

3. **Scenariusz**: Walidacja formularza logowania
   - Dane wejściowe: Pusty formularz lub nieprawidłowy format email
   - Oczekiwany rezultat: Wyświetlenie komunikatów walidacyjnych

### 4.2. Definiowanie celów przez kierownika
1. **Scenariusz**: Dodanie celu ręcznie
   - Kroki: Wybór pracownika, wprowadzenie danych celu (tytuł, opis, waga, kategoria)
   - Oczekiwany rezultat: Cel zostaje dodany do listy, aktualizacja sumy wag

2. **Scenariusz**: Edycja istniejącego celu
   - Kroki: Wybór celu z listy, zmiana danych, zapisanie
   - Oczekiwany rezultat: Cel zostaje zaktualizowany

3. **Scenariusz**: Usunięcie celu
   - Kroki: Wybór celu z listy, usunięcie
   - Oczekiwany rezultat: Cel zostaje usunięty, aktualizacja sumy wag

4. **Scenariusz**: Walidacja wag celów
   - Kroki: Dodanie celów o sumie wag przekraczającej 100%
   - Oczekiwany rezultat: Wyświetlenie komunikatu walidacyjnego

### 4.3. Przeglądanie celów przez pracownika
1. **Scenariusz**: Wyświetlenie przypisanych celów
   - Kroki: Zalogowanie jako pracownik, przejście do widoku celów
   - Oczekiwany rezultat: Lista celów w trybie tylko do odczytu

2. **Scenariusz**: Sprawdzenie dostępności funkcji samooceny
   - Status procesu: "in_definition"
   - Oczekiwany rezultat: Brak możliwości dokonania samooceny

### 4.4. Samoocena celów przez pracownika
1. **Scenariusz**: Przeprowadzenie samooceny
   - Status procesu: "in_self_assessment"
   - Kroki: Wybranie celu, wprowadzenie oceny (rating) i komentarza, zapisanie
   - Oczekiwany rezultat: Samoocena zostaje zapisana w systemie

2. **Scenariusz**: Edycja samooceny
   - Kroki: Wybór wcześniej ocenionego celu, zmiana danych, zapisanie
   - Oczekiwany rezultat: Samoocena zostaje zaktualizowana

### 4.5. Ocena końcowa przez kierownika
1. **Scenariusz**: Przeprowadzenie oceny końcowej
   - Status procesu: "awaiting_manager_assessment"
   - Kroki: Wybór pracownika, przeglądanie samoocen, wprowadzenie oceny końcowej, zapisanie
   - Oczekiwany rezultat: Ocena kierownika zostaje zapisana

2. **Scenariusz**: Przejście procesu do statusu "completed"
   - Kroki: Zakończenie oceniania wszystkich celów pracownika, zmiana statusu
   - Oczekiwany rezultat: Status procesu zmienia się na "completed"

### 4.6. Zarządzanie procesem oceny
1. **Scenariusz**: Zmiana statusu procesu
   - Kroki: Wybór procesu, zmiana statusu, zapisanie
   - Oczekiwany rezultat: Status procesu zostaje zaktualizowany

2. **Scenariusz**: Weryfikacja przepływu procesu
   - Kroki: Przejście przez cały cykl procesu (definiowanie -> samoocena -> ocena końcowa -> zakończony)
   - Oczekiwany rezultat: Proces przechodzi prawidłowo przez wszystkie etapy

## 5. Środowisko testowe

### 5.1. Środowisko deweloperskie
- Lokalna instalacja aplikacji z wykorzystaniem lokalnej instancji Supabase
- Node.js v18 lub nowszy
- Astro 5
- React 19
- TypeScript 5
- Baza danych PostgreSQL (poprzez Supabase)

### 5.2. Środowisko testowe
- Środowisko testowe w chmurze z dedykowaną instancją Supabase
- Wdrożenie aplikacji poprzez obraz Docker
- Monitoring i logowanie zdarzeń

### 5.3. Konfiguracja testowa
- Automatyczne tworzenie testowych użytkowników (pracownicy i kierownicy)
- Predefiniowane kategorie celów
- Przykładowe procesy oceny w różnych statusach

## 6. Narzędzia do testowania

### 6.1. Narzędzia do testów jednostkowych i integracyjnych
- Jest
- React Testing Library
- MSW (Mock Service Worker) do mockowania API

### 6.2. Narzędzia do testów end-to-end
- Playwright lub Cypress
- Narzędzia do nagrywania sesji testowych

### 6.3. Narzędzia do testów UI/UX
- Playwright/Cypress do testów wizualnych
- Axe lub pa11y do testów dostępności

### 6.4. Narzędzia do testów wydajnościowych
- Lighthouse do analizy wydajności frontend
- React Profiler do analizy wydajności komponentów

### 6.5. Narzędzia do zarządzania testami
- GitHub Issues do śledzenia błędów
- GitHub Projects do zarządzania zadaniami testowymi

## 7. Harmonogram testów

### 7.1. Faza przygotowawcza (1 dzień)
- Przygotowanie środowiska testowego
- Konfiguracja narzędzi testowych
- Opracowanie szczegółowych przypadków testowych

### 7.2. Faza testów jednostkowych (2 dni)
- Implementacja i wykonanie testów jednostkowych
- Analiza wyników i naprawa błędów

### 7.3. Faza testów integracyjnych (2 dni)
- Implementacja i wykonanie testów integracyjnych
- Analiza wyników i naprawa błędów

### 7.4. Faza testów end-to-end (2 dni)
- Implementacja i wykonanie testów end-to-end
- Analiza wyników i naprawa błędów

### 7.5. Faza testów UI/UX i wydajnościowych (1 dzień)
- Przeprowadzenie testów interfejsu użytkownika
- Wykonanie testów wydajnościowych
- Analiza wyników

### 7.6. Faza testów regresyjnych (1 dzień)
- Weryfikacja naprawionych błędów
- Przeprowadzenie testów regresyjnych

### 7.7. Faza raportowania (1 dzień)
- Przygotowanie raportu końcowego
- Rekomendacje do wdrożenia

## 8. Kryteria akceptacji testów

### 8.1. Kryteria wejściowe
- Kod aplikacji jest gotowy do testów
- Środowisko testowe jest skonfigurowane
- Przypadki testowe są zdefiniowane i zatwierdzone

### 8.2. Kryteria wyjściowe
- Wszystkie krytyczne i wysokopriorytowe błędy zostały naprawione
- Co najmniej 90% testów zostało wykonanych z pozytywnym wynikiem
- Wszystkie główne funkcjonalności działają zgodnie z wymaganiami
- Suma wag celów zawsze wynosi 100% po walidacji
- Brak problemów z wydajnością blokujących korzystanie z aplikacji
- Interfejs użytkownika jest zgodny z wymaganiami dostępności

## 9. Role i odpowiedzialności w procesie testowania

### 9.1. Kierownik testów
- Koordynacja procesu testowania
- Zarządzanie harmonogramem testów
- Raportowanie postępów

### 9.2. Testerzy funkcjonalni
- Wykonywanie testów funkcjonalnych
- Raportowanie błędów
- Weryfikacja poprawek

### 9.3. Testerzy techniczni
- Implementacja testów automatycznych
- Testowanie API i integracji z backendem
- Analiza wydajności

### 9.4. Deweloperzy
- Naprawianie zgłoszonych błędów
- Wsparcie w analizie problemów technicznych
- Implementacja testów jednostkowych

## 10. Procedury raportowania błędów

### 10.1. Szablon zgłoszenia błędu
- Tytuł: Krótki opis problemu
- Priorytet: Krytyczny/Wysoki/Średni/Niski
- Środowisko: Deweloperskie/Testowe
- Kroki do odtworzenia: Szczegółowy opis kroków
- Rezultat aktualny: Co się dzieje obecnie
- Rezultat oczekiwany: Co powinno się dziać
- Zrzuty ekranu/nagrania: Załączniki obrazujące problem
- Dodatkowe informacje: Wersja przeglądarki, rozdzielczość ekranu itp.

### 10.2. Priorytetyzacja błędów
- **Krytyczny**: Błąd uniemożliwiający korzystanie z kluczowej funkcjonalności
- **Wysoki**: Błąd poważnie ograniczający funkcjonalność, ale z możliwością obejścia
- **Średni**: Błąd wpływający na funkcjonalność, ale niekrytyczny dla działania aplikacji
- **Niski**: Drobne problemy UI, literówki, usprawnienia

### 10.3. Proces obsługi błędów
1. Zgłoszenie błędu w systemie śledzenia błędów
2. Triaging i przypisanie priorytetu
3. Przypisanie do właściwego dewelopera
4. Implementacja poprawki
5. Weryfikacja poprawki przez testera
6. Zamknięcie zgłoszenia

## 11. Załączniki i dokumenty powiązane

- Dokument wymagań produktu (PRD)
- Specyfikacja techniczna projektu
- Schemat bazy danych
- Diagram przepływu procesu oceny
- Macierz wymagania-testy 