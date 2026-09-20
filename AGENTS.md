# Gawor — zasady pracy agentów

## Cel produktu

Gawor jest osobistą, polskojęzyczną aplikacją PWA do nauki niemieckiego.
Użytkownik rozmawia z agentem językowym, eksportuje na końcu sesji JSON z
poprawnymi zdaniami niemieckimi, importuje go do Gawora, a następnie odsłuchuje
zestaw zdań w pętli i je powtarza. Pełny kontekst produktu i decyzje są w
`dev/PRD.md`; aktualny zakres sprintu w `dev/sprint-*/`.

## Architektura

- `app/` to aplikacja React/Vinext budowana przez Vite i wdrażana jako
  Cloudflare Worker. Interfejs jest po polsku, a treść ćwiczeń po niemiecku.
- Cloudflare D1 jest prywatną, trwałą bazą dla sesji, zdań, słownictwa,
  zestawów i metadanych audio. Migracje są w `app/drizzle/`.
- Cloudflare R2 jest prywatnym storage dla wygenerowanych plików WAV i ich
  manifestów czasu; Worker udostępnia je przez endpoint aplikacji.
- Worker wywołuje OpenAI TTS tylko po stronie serwera. `OPENAI_API_KEY` jest
  sekretem Workers — nigdy nie zapisuj go w kodzie, dokumentacji ani commitach.
- Konfiguracja bindingów D1/R2 jest w `app/.openai/hosting.json` i
  `app/vite.config.ts`. Prawdziwe nazwy/ID są podawane lokalnie przez
  `GAWOR_D1_DATABASE_NAME`, `GAWOR_D1_DATABASE_ID` i `GAWOR_R2_BUCKET_NAME`.
  Nie publikuj `.env*` (poza `.env.example`), `.dev.vars`, `.wrangler*`, logów,
  tokenów ani prywatnych identyfikatorów infrastruktury.
- `app/.openai/hosting.json` zawiera projekt Sites; nie zmieniaj go bez
  wyraźnej potrzeby wdrożeniowej.

## Kontrakt importu rozmowy

`POST /api/sessions` przyjmuje JSON z wymaganym niepustym `sentences` (do 100
pozycji) oraz opcjonalnymi `session_summary`, `title` i `vocabulary`.
Zdanie ma `german` oraz opcjonalne `polish` i `note`; słownictwo ma `german` i
opcjonalne `polish`. Logika walidacji jest źródłem prawdy w
`app/app/api/sessions/route.ts`. Nie zmieniaj formatu ani semantyki bez
aktualizacji UI, endpointu i dokumentacji/promptu rozmowy.

## Audio

Każdy zestaw ma WAV i manifest w R2. TTS zwraca PCM 24 kHz; po każdym zdaniu,
również ostatnim, plik zawiera ciszę równą dokładnie 1,5× długość wypowiedzi.
Nie zastępuj tego przeglądarkowym `speechSynthesis` ani timerami JavaScript.

## Proces pracy i bramka Karola

1. Przed zmianą przeczytaj właściwy PRD/sprint oraz kod, którego dotyczy praca.
2. Po zmianach uruchom z `app/` co najmniej `npm.cmd run build` na Windows
   (PowerShell może blokować `npm.ps1`). Uruchom także testy/lint, jeśli są
   dostępne i istotne dla zmienionego kodu.
3. Zanim powstanie commit, push lub wdrożenie, przygotuj lokalną weryfikację:
   uruchom serwer na interfejsie LAN (`npm.cmd run dev -- --hostname 0.0.0.0`
   albo odpowiednio `npm.cmd run start`) i przekaż Karolowi aktualny adres IPv4
   Wi-Fi oraz pełny link `http://ADRES_IP:PORT/` do otwarcia na iPhonie w tej
   samej sieci. Jasno wskaż też, co ma ręcznie sprawdzić.
4. Czekaj na wyraźne potwierdzenie Karola, że lokalny test przeszedł. Dopiero
   po nim wolno commitować, wykonywać `git push` lub `npm.cmd run deploy` /
   `wrangler deploy`. Nie zakładaj, że pomyślny build zastępuje test ręczny.
5. Wdrożenie produkcyjne wymaga dodatkowo jednoznacznego polecenia Karola.
   Nigdy nie twórz ani nie zmieniaj zdalnych zasobów Cloudflare (D1, R2,
   sekrety, Worker) bez takiego polecenia.

## Jakość i granice

- Zachowuj istniejące dane użytkownika i migracje; nie wykonuj destrukcyjnych
  operacji na D1/R2 bez osobnego potwierdzenia.
- Dla zmian w odtwarzaniu uwzględnij ręczny test na iPhonie, w tym blokadę
  ekranu, jako wymaganie końcowe sprintu.
- Aktualizuj dokumentację i `dev/sprint-*/RESULT.md`, gdy zmiana wpływa na
  zachowanie, architekturę lub sposób wdrożenia.

## Orkiestracja modeli i subagentów

- Aktualnie wybrany model działa przede wszystkim jako orkiestrator — planuje
  operację, deleguje pracę i interpretuje wyniki subagentów.
- Dla oszczędności tokenów deleguj subagentom kosztowne operacje, w
  szczególności czytanie kodu i dokumentacji, pobieranie materiałów z sieci
  oraz ich późniejszą analizę, a także instalowanie zależności i narzędzi.
- Orkiestrator zachowuje odpowiedzialność za decyzje, koordynację, kontrolę
  zakresu i końcową weryfikację rezultatu.
