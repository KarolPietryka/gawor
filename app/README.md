# Gawor — aplikacja webowa

Sprint 001. Plan produktu i dziennik: `../dev/`.

Wymagane środowisko: Node >=22.13, npm. `npm run dev` uruchamia podgląd, `npm run build` buduje wersję wdrożeniową.

Odtwarzacz używa jednego elementu HTML audio z `loop`. Cisza jest w pliku, bez timerów JavaScript. Media Session udostępnia Start/Pauza systemowi. `timeupdate` aktualizuje wyłącznie tekst na ekranie i nie steruje odtwarzaniem.

Każdy zapisany zestaw ma własny plik WAV i manifest osi czasu w R2. Endpoint przygotowania audio wysyła tekst wyłącznie z Workera do OpenAI TTS jako PCM 24 kHz, mierzy długość każdego klipu, dodaje po nim dokładnie 1,5× tej długości ciszy i zapisuje wynik. Tekst, kolejność, głos, parametry syntezy i reguła przerwy tworzą wersję nagrania; edycja zestawu unieważnia poprzednią wersję.

Przed wdrożeniem dodaj sekret `OPENAI_API_KEY` do środowiska Workers. Konfiguracja hostingowa wiąże bucket R2 `GAWOR_AUDIO`; klucz nie należy do repozytorium. Bez obu konfiguracji przygotowanie nagrania kończy się widocznym błędem, który można ponowić po ich uzupełnieniu.

Przygotowanie nagrania po uzyskaniu plików PCM WAV z syntezy mowy (01.wav–08.wav, ten sam format), z katalogu nadrzędnego:

```
python src/audio/assemble.py dev/sprint-001/sentences.json CLIP_DIR app/public/audio/practice.wav
```

Generator tworzy również manifest `practice.json`, z czasami zdań i przerw. Jego domyślna przerwa wynosi 1,5× czas mowy bez dodatkowej sekundy. Jest to narzędzie do fixture; aplikacja korzysta z manifestów poszczególnych zestawów zapisanych w R2.

Nie używamy przeglądarkowego speechSynthesis jako zamiennika testu gotowego pliku. Brak usługi syntezy i brak testu na iPhonie oznaczają, że sprint nie jest jeszcze ukończony.

### Lokalna synteza OpenAI

Skopiuj `.dev.vars.example` do `.dev.vars`, wpisz w nim swój `OPENAI_API_KEY` i uruchom ponownie `npm run dev`. Plik `.dev.vars` jest ignorowany przez Git. Klucz jest odczytywany wyłącznie w lokalnym Workerze i nie trafia do przeglądarki. Lokalny podgląd wymaga także działającego bindingu D1 (`GAWOR_DB`) i R2 (`GAWOR_AUDIO`).
