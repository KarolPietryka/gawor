# Sprint 004 — wynik implementacji

Data implementacji: 2026-09-16.

Zaimplementowano przygotowanie nagrań dla dowolnego niepustego zestawu zapisów w bibliotece. Worker pobiera dla każdego zdania rzeczywistą mowę niemiecką jako PCM 24 kHz z OpenAI TTS, oblicza czas mowy z liczby próbek i tworzy jeden WAV. Po każdym zdaniu, również ostatnim, zapisuje ciszę `1,5 × czas_mowy`; nie dodaje stałej sekundy.

Plik wraz z manifestem osi czasu jest przechowywany w R2. D1 zapisuje status, profil wersji, czas trwania, klucz obiektu i manifest. Profil obejmuje tekst, kolejność, głos, model, częstotliwość próbkowania, mnożnik przerwy oraz wersję formatu. Stary plik zostaje nieaktualny po dodaniu, zmianie lub usunięciu zdania. Wynik rozpoczęty przed taką zmianą nie może zostać opublikowany jako aktualny.

Interfejs pokazuje stan przygotowania, gotowości lub błędu oraz pozwala ponowić nieudane przygotowanie. Odtwarzacz pobiera plik wyłącznie przez endpoint, który ponownie sprawdza aktualność profilu. Napisy i oznaczenie mowa/przerwa pochodzą z manifestu tego samego nagrania, a nie z fixture demonstracyjnego.

Wprowadzono migrację `app/drizzle/0001_secret_hex.sql` dla metadanych obiektu i manifestu oraz unikalności wersji nagrania. Konfiguracja hostingu wiąże R2 jako `GAWOR_AUDIO`. Do uruchomienia rzeczywistej syntezy po wdrożeniu wymagany jest sekret Workers `OPENAI_API_KEY`; nie został i nie może zostać zapisany w repozytorium.

Weryfikacja:

- `python -m unittest tests.test_audio_assemble` — 5 testów przeszło; sprawdzają kolejność, ciszę po ostatnim zdaniu, dwa obiegi i dokładną regułę bez `+1 s`.
- `npx tsc --noEmit` — przeszło.
- `git diff --check` — przeszło.
- `npm run lint` nadal zgłasza istniejące błędy w dostarczonych komponentach `components/ui` i hooku `hooks/use-mobile.ts`; po zmianie odtwarzacz ma dynamiczny, zgodny z nagraniem track napisów.
- `npm run build` nie uruchamia się w bieżącym środowisku z Node `20.19.1`, podczas gdy projekt wymaga Node `>=22.13`.

Test z iPhone'em i demonstracja z działającym sekretem pozostają do wykonania; nie zostały oznaczone jako zaliczone.
