<conversation_summary>
<decisions>
1. Jednowierszowy układ prezentujący etapy procesu będzie pokazywał nazwy statusów od lewej do prawej, z aktualnym statusem wyróżnionym kolorystycznie.
2. Aplikacja będzie dostępna wyłącznie jako rozwiązanie webowe, bez wersji mobilnej.
3. Nie są wymagane szczególne optymalizacje czasu ładowania, zakładając małą ilość danych.
4. Przechodzenie między etapami procesu oceny odbywa się poprzez zmianę statusu przez kierownika, pracownik widzi tylko aktualny stan bez możliwości zmiany.
5. Proces samooceny polega na wyświetleniu wszystkich celów z możliwością wprowadzenia oceny liczbowej i opcjonalnego komentarza.
6. Nie ma potrzeby porównywania z historycznymi ocenami.
7. Komunikaty walidacji powinny być wyświetlane jako pop-upy po wykonaniu akcji przez użytkownika.
8. Aplikacja działa wyłącznie w trybie online, bez obsługi trybu offline.
9. Brak specjalnych wymagań dotyczących dostępności (WCAG).
10. Samoocena pracownika i ocena kierownika będą wyświetlane obok siebie.
11. Kolorystyka interfejsu: biały jako kolor podstawowy, szary dla elementów niedostępnych, fioletowy dla elementów wyróżnionych.
12. Samoocena i ocena kierownika przyjmują wartości liczbowe z przedziału 0-150.
13. System nie przewiduje możliwości dodawania załączników.
14. Kierownik wybiera jednego pracownika z listy i dokonuje oceny jego celów. Ocena kolejnego pracownika wymaga wybrania go z listy.
15. Każde zapisanie oceny lub samooceny oznacza zapisanie wartości do bazy danych, bez rozróżnienia na dane robocze i ostateczne.
16. Kategorie celów są wybierane z listy pobieranej z bazy danych.
17. Nie ma potrzeby eksportu wyników oceny.
18. Logowanie wymaga jedynie podania nazwy użytkownika i hasła, bez dodatkowych funkcji (np. resetowania hasła).
19. Nie ma potrzeby filtrowania przy przeglądaniu celów (przewidywana mała liczba celów: 1-10).
20. Pracownicy mogą widzieć ocenę kierownika w dowolnym momencie, ale nie mogą jej modyfikować.
21. Interfejs będzie wyłącznie w języku polskim.
</decisions>

<matched_recommendations>
1. Zaimplementować prosty pasek statusów (stepper) z kolorowym wyróżnieniem aktualnego statusu, umieszczony w górnej części interfejsu, zgodnie ze schematem kolorystycznym (biały, szary, fioletowy).
2. Stworzyć oddzielne ścieżki dostępu i widoki dla ról pracownika i kierownika bezpośrednio po logowaniu z prostym mechanizmem autoryzacji.
3. Zaprojektować dashboard kierownika z listą pracowników, umożliwiający wybór jednego pracownika do oceny w danym momencie.
4. Zaimplementować widok celów pracownika z odpowiednimi polami do wprowadzania samooceny (wartość 0-150) i opcjonalnego komentarza.
5. Stworzyć analogiczny interfejs dla kierownika do oceny celów pracownika z wartościami liczbowymi (0-150) i polami na komentarze.
6. Zaprojektować widok porównawczy prezentujący samoocenę pracownika i ocenę kierownika obok siebie.
7. Zaimplementować widok wyboru predefiniowanych celów jako modalne okno z możliwością wyszukiwania.
8. Zaprojektować walidację sumy wag celów (100%) z komunikatami w formie pop-upów po wykonaniu akcji.
9. Stworzyć widok "tylko do odczytu" dla pracowników na etapach, w których nie mogą edytować celów.
10. Wykorzystać komponenty Shadcn/ui do zbudowania spójnego interfejsu zgodnego z wymaganiami kolorystycznymi.
11. Zaimplementować mechanizm zmiany statusu procesu oceny jako wyraźny przycisk dostępny tylko dla kierownika.
12. Uprościć proces logowania do podstawowego formularza z polami na nazwę użytkownika i hasło.
13. Zaprojektować interfejs z uwzględnieniem wyłącznie języka polskiego.
</matched_recommendations>

<ui_architecture_planning_summary>
Na podstawie przeprowadzonej analizy wymagań produktu (PRD), informacji o stacku technologicznym, planu API oraz sesji pytań i odpowiedzi, została zaplanowana architektura UI dla systemu oceny celów. System będzie realizowany jako aplikacja webowa wykorzystująca Astro 5, React 19, TypeScript 5, Tailwind 4 oraz komponenty Shadcn/ui.

### Główne wymagania architektury UI:
1. **Podział na role użytkownika:** System będzie oferował dwa główne przepływy - dla pracownika i kierownika, z oddzielnymi widokami dostępnymi po zalogowaniu.
2. **Zarządzanie statusami procesu:** Interface przedstawi jednowierszowy układ z nazwami statusów od lewej do prawej, z wyróżnionym kolorystycznie aktualnym statusem (biały jako podstawowy, szary dla niedostępnych, fioletowy dla wyróżnionych). Będzie istniała możliwość wyboru procesu, bowiem może istnieć więcej, niż 1 proces oceny.
3. **Proces oceny:** Umożliwienie pracownikom przeglądania celów, dokonywania samooceny (0-150) i dodawania komentarzy; kierownikom dodawania/edycji celów oraz oceny pracowników.
4. **Walidacja danych:** System będzie walidował dane (np. suma wag celów musi wynosić 100%) i wyświetlał komunikaty w formie pop-upów.

### Kluczowe widoki i przepływy użytkownika:
1. **Ekran logowania:** Prosty formularz z polami na nazwę użytkownika i hasło.
2. **Dashboard kierownika:** Lista pracowników z możliwością wyboru konkretnej osoby do zarządzania jej celami.
3. **Widok definiowania celów:** Interface umożliwiający kierownikowi dodawanie celów (ręcznie lub z predefiniowanych propozycji), przypisywanie kategorii i wag.
4. **Widok samooceny:** Lista celów z polami do wprowadzenia wartości liczbowych (0-150) i opcjonalnych komentarzy dla pracownika.
5. **Widok oceny kierownika:** Podobny do widoku samooceny, ale dostępny dla kierownika z możliwością wprowadzenia oceny i komentarzy.
6. **Widok porównawczy:** Prezentacja samooceny pracownika i oceny kierownika obok siebie.
7. **Stepper statusów:** Pasek statusów pokazujący etapy procesu oceny z wyróżnionym aktualnym etapem.

### Integracja z API i zarządzanie stanem:
1. **Autentykacja:** Wykorzystanie Supabase Auth dla procesów logowania/autoryzacji, bez dodatkowych funkcji (np. reset hasła).
2. **Zarządzanie celami:** Integracja z endpointami API do tworzenia, odczytu i aktualizacji celów.
3. **Zarządzanie ocenami:** Wykorzystanie endpointów do zapisywania i odczytu samoocen i ocen kierownika.
4. **Zarządzanie statusami:** Implementacja mechanizmu zmiany statusów procesu oceny przez kierownika.
5. **Zapisywanie danych:** Każda zmiana będzie od razu zapisywana w bazie danych, bez rozróżnienia na dane robocze i ostateczne.

### Responsywność, dostępność i bezpieczeństwo:
1. **Responsywność:** Aplikacja będzie dostępna wyłącznie jako rozwiązanie webowe, bez specjalnych wymagań dla urządzeń mobilnych.
2. **Dostępność:** Brak specjalnych wymagań WCAG, jednak podstawowe praktyki dostępności powinny być zachowane.
3. **Bezpieczeństwo:** Wykorzystanie mechanizmów uwierzytelniania i autoryzacji Supabase, z prostym systemem logowania (nazwa użytkownika i hasło).
4. **Tryb pracy:** Aplikacja będzie działać wyłącznie online, bez obsługi trybu offline.

### Technologie implementacji:
1. **Frontend:** Astro 5 z React 19 dla komponentów interaktywnych, TypeScript 5 dla typowania, Tailwind 4 do stylowania.
2. **Komponenty UI:** Shadcn/ui jako podstawa dla komponentów interfejsu.
3. **Backend:** Integracja z Supabase jako Backend-as-a-Service.
4. **Stan aplikacji:** Zarządzanie stanem za pomocą React Hooks i kontekstu.
</ui_architecture_planning_summary>

<unresolved_issues>
1. Szczegółowy mechanizm walidacji sumy wag celów (100%) w interface użytkownika i moment jej przeprowadzania.
2. Precyzyjny format prezentacji predefiniowanych celów i mechanizm ich wyboru przez kierownika.
3. Dokładny wygląd i zachowanie komunikatów pop-up dla walidacji i błędów.
4. Szczegółowa implementacja mechanizmu zmiany statusu procesu oceny przez kierownika.
5. Sposób prezentacji listy pracowników dla kierownika i mechanizm wyboru konkretnej osoby.
</unresolved_issues>
</conversation_summary>
