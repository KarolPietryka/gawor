# Gawor — aplikacja webowa

Sprint 001. Plan produktu i dziennik: `../dev/`.

Wymagane środowisko: Node >=22.13, npm. `npm run dev` uruchamia podgląd, `npm run build` buduje wersję wdrożeniową.

Odtwarzacz używa jednego elementu HTML audio z `loop`. Cisza jest w pliku, bez timerów JavaScript. Media Session udostępnia Start/Pauza systemowi. `timeupdate` aktualizuje wyłącznie tekst na ekranie i nie steruje odtwarzaniem.

Wejście odtwarzacza: `public/audio/practice.json` oraz wskazany w nim plik audio. Brak gotowego nagrania jest pokazywany jawnie; przycisk startu pozostaje niedostępny.

Przygotowanie nagrania po uzyskaniu plików PCM WAV z syntezy mowy (01.wav–08.wav, ten sam format), z katalogu nadrzędnego:

```
python src/audio/assemble.py dev/sprint-001/sentences.json CLIP_DIR app/public/audio/practice.wav
```

Generator tworzy również manifest `practice.json`, z czasami zdań i przerw. Zestaw w aplikacji i generatorze musi odpowiadać `sentences.json`. Długi plik wielokrotnych powtórzeń można przygotować parametrem `--repeats`, ale bieżący ekran przyjmuje pojedynczy obieg; wariant długiego pliku wymaga osobnego rozszerzenia po review.

Nie używamy przeglądarkowego speechSynthesis jako zamiennika testu gotowego pliku. Brak usługi syntezy i brak testu na iPhonie oznaczają, że sprint nie jest jeszcze ukończony.
