# Hotfix 4.1 — odtwarzanie audio na telefonie

Data: 2026-09-20. Status: gotowy do lokalnego testu Karola na iPhonie.

## Problem

Po wydaniu Sprintu 4 gotowy plik WAV odtwarzał się na komputerze, ale Chrome i
Safari na iPhonie pokazywały „Nie udało się wczytać audio.” Endpoint pliku
zwracał zawsze cały obiekt R2 jako `200 OK`, bez `Content-Length`,
`Accept-Ranges` i obsługi nagłówka HTTP `Range`.

Przeglądarki mobilne mogą pobierać metadane i dane media przez żądania
zakresowe. Brak odpowiedzi `206 Partial Content` dla takiego żądania był
niezgodny z tym sposobem dostarczania plików i jest najbardziej prawdopodobną
przyczyną błędu. Test iPhone'a nie został wykonany przed wydaniem Sprintu 4,
co jest odnotowane w `RESULT.md` i `REVIEW.md`.

## Zmiana

Endpoint `GET` i `HEAD` `/api/practice-sets/:practiceSetId/audio/file` rozpoznaje
pojedynczy nagłówek `Range` i przekazuje wyliczony zakres do odczytu R2. Dla
poprawnego zakresu odpowiedź ma status `206 Partial Content` oraz nagłówki
`Content-Range`, `Content-Length` i `Accept-Ranges: bytes`; dla niemożliwego
zakresu zwraca `416 Range Not Satisfiable`. Zwykły odczyt pełnego pliku zwraca
`Content-Length` i `Accept-Ranges: bytes`.

Autoryzacja po identyfikatorze assetu, kontrola aktualności zestawu i polityka
`Cache-Control: private, no-store` pozostają bez zmian. Nie zmienia się WAV,
synteza TTS, R2 ani dane użytkownika.

## Weryfikacja

- `npm.cmd exec tsc -- --noEmit` — przeszło.
- `npm.cmd run build` — przeszło.
- `git diff --check` — przeszedł.
- `npm.cmd run lint` — nadal zgłasza istniejące błędy w dostarczonych
  komponentach `components/ui` oraz `hooks/use-mobile.ts`; hotfix nie dotyka
  tych plików.
- Serwer deweloperski nasłuchuje na `0.0.0.0:3000`; test HTTP z komputera przez
  `127.0.0.1` i adres Wi-Fi zwrócił `200`.

Do ręcznego wykonania przez Karola:

1. Na iPhonie w tej samej sieci: otworzyć adres LAN serwera lokalnego,
   zaimportować lub wybrać zestaw z gotowym audio i uruchomić odtwarzanie w
   Chrome oraz Safari.
2. Potwierdzić przynajmniej dwa pełne obiegi, pauzę/wznowienie i później
   wykonać nadal otwarty, 15-minutowy test z zablokowanym ekranem.

Hotfix nie jest akceptacją testu urządzenia ani zgodą na commit, push lub
wdrożenie. Te kroki wymagają wyraźnego potwierdzenia Karola po teście.
