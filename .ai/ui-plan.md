# Architektura UI dla Systemu Oceny Celów

## 1. Przegląd struktury UI

System Oceny Celów to aplikacja webowa przeznaczona do definiowania i oceny celów rocznych przez pracowników firmy. Struktura UI będzie bazować na następujących zasadach:

- Dwa główne przepływy: dla kierownika i pracownika, dostępne po uwierzytelnieniu
- Jednowierszowy układ prezentujący wszystkie etapy procesu oceny (stepper)
- Proces w ramach jednej sesji, bez przewijania ekranu
- Kolorystyka: biały (podstawowy), szary (niedostępne), fioletowy (wyróżnione)
- Hierarchia: kierownik → pracownik
- Statusy procesu: "w definiowaniu" → "w samoocenie" → "w ocenie kierownika" → "zakończony"

Główny przepływ jest podzielony na etapy odpowiadające statusom procesu oceny, z różnymi widokami dostępnymi dla kierownika i pracownika w zależności od aktualnego statusu.

## 2. Lista widoków

### Logowanie

- **Ścieżka widoku:** `/login`
- **Główny cel:** Uwierzytelnienie użytkownika w systemie
- **Kluczowe informacje do wyświetlenia:** Formularz logowania
- **Kluczowe komponenty widoku:**
  - Formularz z polami: nazwa użytkownika i hasło
  - Przycisk "Zaloguj się"
  - Komunikat o błędach uwierzytelniania
- **Względy UX, dostępności i bezpieczeństwa:**
  - Prostota i minimalizm formularza
  - Walidacja pól formularza
  - Zabezpieczenie transmisji danych (HTTPS)
  - Obsługa błędów uwierzytelniania z czytelnymi komunikatami

### Dashboard (Strona główna)

- **Ścieżka widoku:** `/dashboard`
- **Główny cel:** Wybór procesu oceny i trybów: dla kierownika i dla pracownika
- **Kluczowe informacje do wyświetlenia:**
  - Informacje o zalogowanym użytkowniku
  - Lista dostępnych procesów oceny
  - (Dla kierownika) Lista pracowników
  - (Dla kierownika) zmiana statusu procesu
- **Kluczowe komponenty widoku:**
  - Nagłówek z nazwą użytkownika i przyciskiem wylogowania
  - Karty procesów oceny (nazwa, data rozpoczęcia/zakończenia, status)
  - (Dla kierownika) Lista pracowników z możliwością filtrowania
  - Widoczny "stepper" statusów procesu po wyborze procesu
- **Względy UX, dostępności i bezpieczeństwa:**
  - Przejrzysty układ kart procesów oceny
  - Intuicyjny wybór pracownika przez kierownika
  - Wyraźne rozróżnienie ról użytkownika

### Definiowanie celów (Widok kierownika)

- **Ścieżka widoku:** `/process/{processId}/employee/{employeeId}/goals-definition`
- **Główny cel:** Umożliwienie kierownikowi dodawania i edycji celów dla pracownika
- **Kluczowe informacje do wyświetlenia:**
  - Dane pracownika (imię, nazwisko)
  - Status procesu: "w definiowaniu"
  - Lista celów z kategoriami i wagami
  - Suma wag celów z walidacją (musi wynosić 100%)
- **Kluczowe komponenty widoku:**
  - Stepper procesu oceny z wyróżnionym aktualnym statusem
  - Formularz dodawania/edycji celu:
    - Pole tekstowe na opis celu
    - Lista rozwijana kategorii
    - Pole numeryczne na wagę (%)
  - Lista dodanych celów
  - Wizualizacja sumy wag (progress bar)
  - Przycisk usuwania celu
  - Przycisk zmiany statusu procesu na "w samoocenie"
- **Względy UX, dostępności i bezpieczeństwa:**
  - Automatyczna walidacja sumy wag (100%)
  - Komunikaty walidacji jako pop-upy
  - Automatyczne zapisywanie zmian

### Przeglądanie celów i samoocena (Widok pracownika)

- **Ścieżka widoku:** `/process/{processId}/goals`
- **Główny cel:** Umożliwienie pracownikowi przeglądania przypisanych celów oraz wprowadzania samooceny (gdy status procesu na to pozwala)
- **Kluczowe informacje do wyświetlenia:**
  - Status procesu (dynamicznie wyświetlany)
  - Lista przypisanych celów z kategoriami i wagami
  - Pola samooceny (widoczne i edytowalne tylko w statusie "in_self_assessment")
- **Kluczowe komponenty widoku:**
  - Stepper procesu oceny z wyróżnionym aktualnym statusem
  - Lista celów (opis, kategoria, waga)
  - Kondycjonalnie wyświetlane elementy samooceny (tylko dla statusu "in_self_assessment"):
    - Pole numeryczne do wprowadzenia oceny (0-150) dla każdego celu
    - Pole tekstowe na komentarz dla każdego celu
    - Przycisk zapisania samooceny
  - Automatyczne zapisywanie po każdej zmianie
- **Względy UX, dostępności i bezpieczeństwa:**
  - Wyraźne oznaczenie, czy samoocena jest dostępna czy nie
  - Walidacja zakresu oceny (0-150)
  - Komunikaty walidacji jako pop-upy
  - Automatyczne zapisywanie zmian
  - Tryb tylko do odczytu, gdy status procesu inny niż "in_self_assessment"

### Ocena kierownika

- **Ścieżka widoku:** `/process/{processId}/employee/{employeeId}/manager-assessment`
- **Główny cel:** Umożliwienie kierownikowi dokonania oceny realizacji celów przez pracownika
- **Kluczowe informacje do wyświetlenia:**
  - Dane pracownika (imię, nazwisko)
  - Status procesu: "w ocenie kierownika"
  - Lista celów z samoocenami pracownika
- **Kluczowe komponenty widoku:**
  - Stepper procesu oceny z wyróżnionym aktualnym statusem
  - Lista celów (opis, kategoria, waga)
  - Wyświetlenie samooceny pracownika dla każdego celu
  - Pole numeryczne do wprowadzenia oceny kierownika (0-150) dla każdego celu
  - Pole tekstowe na komentarz dla każdego celu
  - Przycisk zmiany statusu procesu na "zakończony"
  - Automatyczne zapisywanie po każdej zmianie
- **Względy UX, dostępności i bezpieczeństwa:**
  - Walidacja zakresu oceny (0-150)
  - Komunikaty walidacji jako pop-upy
  - Automatyczne zapisywanie zmian

### Widok porównawczy (dla pracownika i kierownika)

- **Ścieżka widoku pracownika:** `/process/{processId}/assessment-summary`
- **Ścieżka widoku kierownika:** `/process/{processId}/employee/{employeeId}/assessment-summary`
- **Główny cel:** Wyświetlenie zestawienia samooceny pracownika i oceny kierownika
- **Kluczowe informacje do wyświetlenia:**
  - Status procesu: "zakończony"
  - Lista celów z samoocenami pracownika i ocenami kierownika
- **Kluczowe komponenty widoku:**
  - Stepper procesu oceny z wyróżnionym aktualnym statusem
  - Lista celów (opis, kategoria, waga)
  - Samoocena pracownika dla każdego celu
  - Ocena kierownika dla każdego celu
  - Komentarze pracownika i kierownika
- **Względy UX, dostępności i bezpieczeństwa:**
  - Przejrzyste zestawienie obu ocen obok siebie
  - Tryb tylko do odczytu

## 3. Mapa podróży użytkownika

### Podróż kierownika

1. **Logowanie**
   - Wprowadzenie danych logowania
   - Uwierzytelnienie w systemie

2. **Dashboard**
   - Przeglądanie dostępnych procesów oceny
   - Wybór aktywnego procesu oceny

3. **Wybór pracownika**
   - Przeglądanie listy podwładnych
   - Wybór pracownika do oceny

4. **Etap definiowania celów** (status: "w definiowaniu")
   - Dodawanie celów ręcznie
   - Przypisywanie kategorii i wag
   - Walidacja sumy wag (100%)
   - Zmiana statusu procesu na "w samoocenie"

5. **Etap oczekiwania na samoocenę** (status: "w samoocenie")
   - Przeglądanie celów pracownika
   - Monitorowanie statusu samooceny
   - Zmiana statusu procesu na "w ocenie kierownika" po ukończeniu samooceny

6. **Etap oceny kierownika** (status: "w ocenie kierownika")
   - Przeglądanie samooceny pracownika
   - Wprowadzanie oceny kierownika
   - Dodawanie komentarzy
   - Zmiana statusu procesu na "zakończony"

7. **Etap podsumowania** (status: "zakończony")
   - Przeglądanie porównawczego zestawienia ocen

8. **Powrót do dashboardu**
   - Wybór innego pracownika lub procesu

### Podróż pracownika

1. **Logowanie**
   - Wprowadzenie danych logowania
   - Uwierzytelnienie w systemie

2. **Dashboard**
   - Przeglądanie dostępnych procesów oceny
   - Wybór aktywnego procesu oceny

3. **Zintegrowany widok celów i samooceny**
   - Status "w definiowaniu": Przeglądanie przypisanych celów w trybie tylko do odczytu
   - Status "w samoocenie": Przeglądanie celów i wprowadzanie samooceny (pola samooceny są dostępne)
   - Zapisywanie samooceny

4. **Etap oceny kierownika** (status: "w ocenie kierownika")
   - Przeglądanie samooceny w trybie tylko do odczytu
   - Oczekiwanie na ocenę kierownika

5. **Etap podsumowania** (status: "zakończony")
   - Przeglądanie porównawczego zestawienia ocen

6. **Powrót do dashboardu**
   - Wybór innego procesu oceny

## 4. Układ i struktura nawigacji

Struktura nawigacji składa się z trzech głównych poziomów:

### Poziom 1: Autoryzacja

- Strona logowania

### Poziom 2: Dashboard i wybór kontekstu

- Dashboard z listą procesów oceny
- (Dla kierownika) Lista pracowników

### Poziom 3: Widoki procesowe

Zawartość i dostępność widoków zależy od:
- Roli użytkownika (kierownik/pracownik)
- Statusu procesu oceny

Dla **pracownika**:
- Status "w definiowaniu" → Widok celów (tylko do odczytu)
- Status "w samoocenie" → Widok celów z dostępnymi polami samooceny
- Status "w ocenie kierownika" → Widok celów z samoocenami (tylko do odczytu)
- Status "zakończony" → Widok porównawczy

Dla **kierownika**:
- Status "w definiowaniu" → Widok definiowania celów
- Status "w samoocenie" → Widok oczekiwania na samoocenę
- Status "w ocenie kierownika" → Widok oceny kierownika
- Status "zakończony" → Widok porównawczy

Nawigacja między statusami procesu odbywa się za pomocą przycisku zmiany statusu, dostępnego tylko dla kierownika i tylko przy spełnieniu wymagań dla przejścia do kolejnego statusu.

Na każdym ekranie widoczny jest **stepper** pokazujący wszystkie etapy procesu z wyróżnionym aktualnym statusem, co zapewnia orientację w procesie.

W nagłówku aplikacji znajduje się przycisk powrotu do dashboardu oraz opcja wylogowania.

## 5. Kluczowe komponenty

### 1. Stepper statusów procesu

- **Opis:** Jednowierszowy pasek prezentujący wszystkie etapy procesu oceny z wyróżnionym aktualnym statusem.
- **Zastosowanie:** Wyświetlany na wszystkich widokach procesowych.
- **Funkcjonalność:** Wizualizacja przepływu procesu i aktualnego etapu.
- **Kolorystyka:** Biały (podstawowy), szary (niedostępne), fioletowy (wyróżnione).

### 2. Formularz dodawania/edycji celu

- **Opis:** Formularz umożliwiający dodanie nowego celu lub edycję istniejącego.
- **Zastosowanie:** Widok definiowania celów.
- **Funkcjonalność:**
  - Pole tekstowe na opis celu
  - Lista rozwijana kategorii
  - Pole numeryczne na wagę (%)
  - Przyciski zapisu i anulowania

### 3. Lista celów

- **Opis:** Komponent wyświetlający listę celów z ich opisem, kategorią i wagą.
- **Zastosowanie:** Wszystkie widoki procesowe.
- **Funkcjonalność:**
  - Tryb tylko do odczytu lub edycji (zależnie od kontekstu)
  - Możliwość usunięcia (tylko w widoku definiowania celów)
  - Wyświetlanie sumy wag
  - Walidacja sumy wag (100%)

### 4. Formularz oceny

- **Opis:** Komponent umożliwiający wprowadzenie oceny (0-150) i komentarza.
- **Zastosowanie:** Zintegrowany widok celów i samooceny (gdy status: "w samoocenie"), widok oceny kierownika.
- **Funkcjonalność:**
  - Pole numeryczne na ocenę (0-150)
  - Pole tekstowe na komentarz
  - Walidacja zakresu oceny
  - Kondycjonalne wyświetlanie (tylko w odpowiednim statusie procesu)

### 5. Widok porównawczy ocen

- **Opis:** Zestawienie samooceny pracownika i oceny kierownika obok siebie.
- **Zastosowanie:** Widok porównawczy.
- **Funkcjonalność:** Wyświetlanie obu ocen i komentarzy dla każdego celu.

### 7. Komunikaty walidacji

- **Opis:** Pop-upy wyświetlające komunikaty walidacji lub błędów.
- **Zastosowanie:** Wszystkie widoki z formularzami.
- **Funkcjonalność:** Informowanie użytkownika o błędach lub powodzeniu akcji.

### 8. Przycisk zmiany statusu procesu

- **Opis:** Przycisk umożliwiający zmianę statusu procesu oceny.
- **Zastosowanie:** Widoki dla kierownika.
- **Funkcjonalność:**
  - Zmiana statusu procesu
  - Aktywny tylko gdy spełnione są wymagania dla przejścia do kolejnego statusu 