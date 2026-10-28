# Sprint 007 — ukrywanie niemieckich zdań na liście ćwiczeń

Data: 2026-10-28. Właściciel produktu: Karol.

Status: zamknięty potwierdzeniem Karola 2026-10-28: „ok sprawdzone. Sprint zamkniety”. Funkcja wdrożona na produkcję i sprawdzona przez Karola po wydaniu. Test ręczny przed wydaniem pominięto na jego wcześniejsze polecenie. Szczegóły w [wyniku sprintu](RESULT.md) i [review](REVIEW.md).

## Potrzeba

W widoku Ćwiczeń Karol chce ukryć niemieckie zdania na dolnej liście „W tym zestawie”, aby ćwiczyć na podstawie polskich tłumaczeń. Jednym przełącznikiem ma móc ponownie odsłonić niemiecki.

## Zakres i potwierdzone decyzje

- Przełącznik „Ukryj niemiecki” obok nagłówka „W tym zestawie”.
- Przełącznik obejmuje wszystkie zdania dolnej listy wybranego zestawu.
- Po włączeniu niemieckie teksty znikają, a polskie tłumaczenia pozostają widoczne. Wyłączenie przywraca niemiecki.
- Niemiecki jest domyślnie widoczny. Ustawienie nie jest zapamiętywane po odświeżeniu strony.
- Najprostsza realizacja wyłącznie na frontendzie, bez zmian backendu.

## Kryteria akceptacji

1. Przy nagłówku „W tym zestawie” jest przełącznik z polską etykietą „Ukryj niemiecki”, obsługiwany dotykiem i klawiaturą, z dostępną informacją o stanie.
2. Po otwarciu lub odświeżeniu strony przełącznik jest wyłączony, a niemieckie zdania widoczne.
3. Włączenie przełącznika ukrywa niemieckie teksty we wszystkich wierszach dolnej listy. Polskie tłumaczenia są nadal widoczne; wyłączenie przywraca niemiecki bez utraty polskiego.
4. Brak polskiego tłumaczenia nie ujawnia ukrytego niemieckiego. Wiersz zachowuje numer i przycisk odsłuchu; w miejscu tłumaczenia pokazuje „Brak polskiego tłumaczenia”. Nie generujemy tłumaczeń.
5. Przełącznik nie zatrzymuje, nie wznawia ani nie przewija audio. Przyciski odsłuchu pojedynczych zdań i wyróżnianie bieżącego zdania nadal działają.
6. Nagłówek z przełącznikiem i lista mieszczą się na ekranie iPhone’a bez poziomego przewijania.
7. Zmiana nie zapisuje ustawienia w API, bazie, cookies ani storage przeglądarki. Nie zmienia kontraktu importu, danych zdań ani audio.
8. Build przechodzi; wynik lintowania jest zapisany w wyniku sprintu. Karol jawnie zwolnił sprint 007 z testu ręcznego przed commitem, pushem i wdrożeniem produkcyjnym (2026-10-28).

## Plan implementacji

1. W `app/app/page.tsx`, w komponencie `Home`, dodać pojedynczy lokalny stan boolean, domyślnie `false`. Bez efektów zapisujących ustawienie i bez dodatkowej logiki resetowania przy zmianie zestawu; stan obowiązuje do ponownego załadowania strony.
2. Obok nagłówka listy użyć istniejącego komponentu `app/components/ui/switch.tsx` z powiązaną etykietą „Ukryj niemiecki”.
3. Dolna lista obecnie renderuje tylko `item.german`. Dodać wyświetlanie istniejącego `item.polish`, analogicznie do Biblioteki, oraz warunkowe renderowanie niemieckiego zależne od przełącznika. Brak tłumaczenia obsłużyć komunikatem z AC4.
4. W `app/app/globals.css` dostosować układ nagłówka do wąskiego ekranu oraz tekst wiersza do dwóch języków. Zachować numery, przyciski i wyróżnianie aktualnego zdania.
5. Po implementacji opisać faktyczny wynik i weryfikację w `dev/sprint-007/RESULT.md`.

## Granice

- Zmiana obejmuje dolną listę „W tym zestawie”. Główna karta bieżącego zdania w odtwarzaczu i Biblioteka zachowują dotychczasowe wyświetlanie.
- Bez zmian API, bazy D1, R2, TTS, manifestów, odtwarzacza, migracji i konfiguracji wdrożeniowej.
- Bez zapamiętywania preferencji, dodatkowych ustawień, ukrywania pojedynczych zdań i automatycznego tłumaczenia.

## Weryfikacja po implementacji

- Z `app/`: `npm.cmd run build` i `npm.cmd run lint`; odnotować ewentualne wcześniejsze błędy lintowania. Repozytorium nie ma obecnie skryptu testów automatycznych.
- Ręcznie: zestaw z kilkoma tłumaczeniami, oba stany przełącznika, ponowne odsłonięcie, brak polskiego tłumaczenia, odświeżenie strony, zmiana zestawu oraz klawiatura.
- VoiceOver na iPhonie: przełącznik ma nazwę „Ukryj niemiecki”, ogłasza zmianę stanu, a ukryte niemieckie zdania dolnej listy nie są odczytywane.
- Podczas odtwarzania przełączyć widoczność i sprawdzić ciągłość audio oraz odsłuch pojedynczego zdania.
- Podgląd LAN został przygotowany i przekazany Karolowi. Testy ręczne z powyższej listy pominięto na jego wyraźne polecenie z 2026-10-28. Karol zlecił commit, push i wydanie produkcyjne bez oczekiwania na ten test.

## Otwarte pytania

Brak pytań blokujących plan. Domyślna widoczność i brak zapamiętywania zostały potwierdzone przez Karola.

## Kontekst

- [PRD produktu](../PRD.md)
- [Poprzedni sprint](../sprint-006/PRD.md) i [jego review](../sprint-006/REVIEW.md)
- Ustalenia Karola z 2026-10-28: przełącznik obok „W tym zestawie”, ukrywanie niemieckiego na dolnej liście, tylko frontend; domyślnie niemiecki widoczny, bez pamiętania ustawienia, możliwie prosta realizacja.
