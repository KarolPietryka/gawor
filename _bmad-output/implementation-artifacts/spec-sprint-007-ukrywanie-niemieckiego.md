---
title: 'Sprint 007 — ukrywanie niemieckiego na liście ćwiczeń'
type: 'feature'
created: '2026-10-28'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: ['dev/sprint-007/PRD.md', 'AGENTS.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

Karol chce przełącznika „Ukryj niemiecki” przy nagłówku „W tym zestawie” w Ćwiczeniach. Włączenie ukrywa niemiecki we wszystkich wierszach dolnej listy i pozostawia polskie tłumaczenia. Niemiecki jest domyślnie widoczny; po odświeżeniu ustawienie wraca do domyślnego. Rozwiązanie ma być możliwie proste, wyłącznie na frontendzie.

Zakres dotyczy dolnej listy, bez zmian głównej karty odtwarzacza, Biblioteki, audio, API, bazy i infrastruktury. Wiersz bez tłumaczenia pokazuje „Brak polskiego tłumaczenia” oraz zachowuje numer i odsłuch. Podstawą jest `dev/sprint-007/PRD.md` i odpowiedzi Karola. Karol 2026-10-28 jawnie polecił pominąć test ręczny i wykonać commit, push i deploy na produkcję.

</frozen-after-approval>

## Implementation Notes

- Brak luk intencji blokujących lokalną implementację; implementacja jest odwracalną zmianą widoku w dwóch plikach. Wydanie ma osobną bramkę testu lokalnego.
- `app/app/page.tsx`: lokalny `useState(false)` w `Home`, istniejący `Switch` z `checked` i `onCheckedChange` przy nagłówku listy; warunkowy DE i zawsze PL z istniejącego `item.polish`. Brak storage i dodatkowych resetów.
- `app/app/globals.css`: ograniczone do listy Ćwiczeń style nagłówka, przełącznika i dwujęzycznego tekstu, z zawijaniem na telefonie.
- `Switch` z `app/components/ui/switch.tsx` ma callback boolean; wykorzystać dostępną etykietę, nie zmieniać komponentu współdzielonego.
- Nie modyfikować handlerów audio, podświetlania zdań ani innych widoków. Uzupełnić dokumentację sprintu i `RESULT.md` rzeczywistymi wynikami.
- Weryfikacja: `npm.cmd run build`, `npm.cmd run lint`, niezależny review, lokalny serwer LAN i test Karola przed operacjami git/deploy. Nie dodawać testów odtwarzających prosty boolean.
- Zaimplementowano dwa pliki widoku; dodano polskie tłumaczenia i fallback, lokalny switch z etykietą, zawijanie na telefonie. Po review przyciemniono PL do kontrastu 5,16:1 w aktywnym wierszu. Szczegóły w `dev/sprint-007/RESULT.md`.
- Końcowy build przeszedł poza sandboxem. Lint: 24 istniejące błędy; brak wskazań nowej logiki. Lokalny Worker działa na LAN z istniejącym stanem wskazanym przez `--persist-to .wrangler/state`; strona i API zwracają 200. Review implementacji zakończone. Status `done` dotyczy implementacji; wydanie i akceptacja sprintu nadal oczekują na test Karola. Commit pominięty do spełnienia nadrzędnej bramki `AGENTS.md`.
- Aktualizacja decyzji Karola 2026-10-28: test ręczny pominięty na wyraźne polecenie; wcześniejsze oczekiwanie na test nie obowiązuje w sprincie 007. Wydanie produkcyjne, commit i push zlecone bez tego testu.
- Wydanie 2026-10-28: commit `10bf8fe4f9dfd5c70f6fe00c5696f6c14e09491a` wypchnięty na `origin/main`; istniejący Worker `gawor` wdrożony pomyślnie. Strona, API i nowy plik klienta zwracają HTTP 200; HTML i plik klienta zawierają etykietę przełącznika. Bez migracji, zmian sekretów i zapisu danych produkcyjnych.
- Akceptacja 2026-10-28: Karol potwierdził po wydaniu „ok sprawdzone. Sprint zamkniety”. Sprint 007 zamknięty; zapisano `dev/sprint-007/REVIEW.md` i zaktualizowano statusy dokumentacji.

## Review Triage Log

- low / patch: nowy tekst PL miał kontrast 4,37:1 na tle aktywnego wiersza. Obliczenie luminancji potwierdziło; kolor zmieniono na `#52645a`, kontrast 5,16:1.
- low / patch: dokumentacja opisywała etap planowania, chociaż kod był gotowy. Zaktualizowano statusy bez domniemywania akceptacji.
- low / patch: brakowało wyniku sprintu. Dodano `RESULT.md` z rzeczywistymi wynikami i oczekującym testem lokalnym.
- low / patch: plan nie wymieniał jawnie testu czytnikiem ekranu. Dopisano kontrolę etykiety, stanu i ukrytego tekstu w VoiceOver. Test nadal niewykonany.
