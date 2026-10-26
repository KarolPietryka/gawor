# Sprint 006 — wynik implementacji

Status: implementacja gotowa; oczekuje na informację zwrotną Karola.

## Zmiany

- Każdy wiersz Biblioteki ma osobny przycisk wyboru zestawu oraz przycisk uruchomienia.
- Uruchomienie wybiera zestaw, przechodzi do widoku Ćwiczeń i rozpoczyna istniejącą pętlę od początku po aktualizacji aktywnego zestawu.
- Przycisk uruchomienia jest wyłączony, jeśli audio nie jest aktualne albo manifest nie zawiera osi czasu zgodnej z liczbą zdań.
- Dotychczasowy przycisk „Ćwicz” w szczegółach pozostaje bez zmian.

## Weryfikacja

- `npm.cmd run build` — zakończony powodzeniem.
- `git diff --check` — bez błędów whitespace.
- `npm.cmd run lint` — nie przechodzi. Zgłasza liczne istniejące problemy w komponentach UI i pliku `app/page.tsx`, m.in. reguły dostępności i React Compiler; wymaga osobnego uporządkowania.
- Ręczny test na iPhonie pominięty na wyraźną prośbę Karola z 2026-10-18.
- Deploy został podjęty na polecenie Karola, ale Cloudflare odrzucił publikację Workera: binding D1 używa placeholderowego ID, ponieważ lokalne zmienne `GAWOR_D1_DATABASE_NAME`, `GAWOR_D1_DATABASE_ID` i `GAWOR_R2_BUCKET_NAME` nie są skonfigurowane. Worker nie został zaktualizowany; statyczne assety zostały przesłane.
