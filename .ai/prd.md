# Dokument wymagań produktu (PRD) - System Oceny Celów

## 1. Przegląd produktu
System Oceny Celów to aplikacja webowa przeznaczona do definiowania i oceny celów rocznych przez pracowników firmy. Umożliwia kierownikom tworzenie celów dla swoich podwładnych poprzez ręczne wpisywanie lub wybór z predefiniowanych propozycji, a także przegląd i ocenę realizacji tych celów. Cały proces oceny odbywa się w jednej sesji, co zapewnia spójny przepływ pracy oraz prosty i intuicyjny interfejs użytkownika.

## 2. Problem użytkownika
Głównym problemem jest brak narzędzia umożliwiającego efektywne definiowanie i ocenę celów rocznych w firmie. Kierownicy potrzebują prostego sposobu na ustalanie celów dla swoich pracowników, natomiast pracownicy chcą mieć możliwość przeglądania przypisanych im celów oraz przeprowadzenia samooceny. Proces musi być realizowany w ramach jednej sesji, eliminując potrzebę wielokrotnego logowania czy przechodzenia między ekranami.

## 3. Wymagania funkcjonalne
- Kierownicy muszą mieć możliwość dodawania celów dla pracowników poprzez:
  - Ręczne wpisywanie celu na początkowym etapie procesu.
  - Wybór celu z listy predefiniowanych propozycji.
- Każdy cel musi posiadać przypisaną wagę (wyrażoną w procentach) oraz kategorię, wybieraną z predefiniowanej listy.
- System musi walidować wprowadzone cele, upewniając się, że suma wag celów wynosi 100%. W przypadku błędu, użytkownik otrzymuje odpowiednią informację zwrotną.
- Pracownicy mają możliwość:
  - Przeglądania przypisanych celów w trybie tylko do odczytu w momencie, gdy etap samooceny jeszcze się nie rozpoczął.
  - Dokonywania samooceny realizacji przypisanych celów po rozpoczęciu etapu samooceny.
- Kierownicy mają możliwość dokonywania końcowej oceny celów po zakończeniu samooceny przez pracowników.
- System powinien umożliwiać definiowanie przynależności pracownika do konkretnego kierownika.
- Proces oceny musi być zrealizowany w ramach jednej sesji użytkownika, bez konieczności przewijania ekranu.
- Interfejs użytkownika powinien być zaprojektowany jako jednowierszowy układ, prezentujący wszystkie etapy procesu oceny (np. za pomocą nazw etapów ze statusami wyrażonymi kolorami).
- Aplikacja powinna umożliwiać bezpieczny dostęp poprzez mechanizm logowania i uwierzytelniania.

## 4. Granice produktu
- Aplikacja będzie dostępna wyłącznie jako rozwiązanie webowe; wersje mobilne nie wchodzą w zakres MVP.
- Nie będą wdrożone zaawansowane kalkulacje celów – stosowane będą jedynie proste procentowe wartości.
- Powiadomienia związane z procesem oceny będą realizowane poza aplikacją i nie wchodzą w zakres MVP.
- Nie przewiduje się integracji z innymi systemami firmowymi, jest całkowicie autonomiczna.
- MVP koncentruje się na kluczowych funkcjonalnościach i musi być udostępnione w ciągu dwóch tygodni od rozpoczęcia projektu.

## 5. Historyjki użytkowników
- US-001
  - Tytuł: Definiowanie celu przez kierownika
  - Opis: Jako kierownik chcę dodać cel pracownikowi, aby zapewnić jasność i przejrzystość celów.
  - Kryteria akceptacji:
    - Możliwość ręcznego wpisania treści celu.
    - Wprowadzenie wagi (w procentach) oraz wyboru kategorii dla celu.
    - Walidacja, która upewnia się, że suma wag wszystkich celów wynosi 100%.

- US-002
  - Tytuł: Przegląd celów przez pracownika przed etapem samooceny
  - Opis: Jako pracownik chcę przeglądać przypisane mi cele, aby być świadomym moich obowiązków i celów bez możliwości ich modyfikacji.
  - Kryteria akceptacji:
    - Lista celów wyświetlana w trybie tylko do odczytu.
    - Brak możliwości edycji celów przez pracownika.

- US-003
  - Tytuł: Samoocena celów przez pracownika
  - Opis: Jako pracownik chcę dokonać samooceny realizacji przypisanych celów, aby móc ocenić swoje postępy i wyniki.
  - Kryteria akceptacji:
    - Dostęp do formularza samooceny po przeglądzie celów.
    - Możliwość wprowadzenia oceny dla każdego celu z osobna.
    - Zapewnienie mechanizmu zapisu wyników samooceny.

- US-004
  - Tytuł: Ocena realizacji celów przez kierownika po etapie samooceny
  - Opis: Jako kierownik chcę ocenić realizację celów po zakończeniu samooceny przez pracownika, aby zatwierdzić ostateczną ocenę.
  - Kryteria akceptacji:
    - Dostęp do formularza końcowej oceny po zakończeniu samooceny przez pracownika.
    - Możliwość wprowadzenia oceny dla każdego celu z uwzględnieniem wagi i kategorii.

- US-005
  - Tytuł: Bezpieczny dostęp i uwierzytelnianie
  - Opis: Jako użytkownik chcę mieć możliwość bezpiecznego logowania i uwierzytelniania, aby chronić dane oceny i zapewnić dostęp tylko autoryzowanym osobom.
  - Kryteria akceptacji:
    - Implementacja mechanizmu logowania i uwierzytelniania.
    - Po udanym logowaniu, użytkownik widzi interfejs odpowiedni dla swojej roli (kierownik lub pracownik)
    - Jako kierownik użytkownik widzi cele swoich pracowników. 

## 6. Metryki sukcesu
- Liczba przeprowadzonych sesji oceny przez kierowników i pracowników.
- Dokładność walidacji, mierzona jako suma wag równająca się 100%.
- Czas ukończenia sesji oceny przez użytkowników.
- Satysfakcja użytkowników z interfejsu, mierzona np. poprzez ankiety.
- Liczba błędów walidacji zgłaszanych podczas procesu oceny. 