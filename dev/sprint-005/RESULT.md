# Sprint 005 — wynik implementacji

Status: zaimplementowano odsłuch pojedynczych zdań w widoku ćwiczenia i bibliotece. Weryfikacji funkcjonalnej nie uruchamiano.

## Zmiany

- Każde zdanie ma przycisk odsłuchu w liście ćwiczenia i w bibliotece; przyciski są dostępne wyłącznie dla aktualnego audio zestawu.
- Odtwarzacz korzysta z jednego złożonego WAV i zapisanych w manifeście granic mowy (`start`–`speech_end`). Cisza po zdaniu nie jest odtwarzana w podglądzie.
- Audio jest pobierane do Blob i przechowywane pod tymczasowym URL-em w pamięci aplikacji. Wspólny element audio pozostaje zamontowany podczas przełączania widoków, a cache jest czyszczony przy zmianie wybranego zestawu/audio i przy odmontowaniu aplikacji.
- Odsłuch zdania przerywa pętlę i po zakończeniu przywraca jej wcześniejszą pozycję oraz stan odtwarzania. Kolejne kliknięcie zdania rozpoczyna je od początku; uruchomienie pętli podczas podglądu rozpoczyna cały zestaw od początku.

## Weryfikacja

- Nie uruchamiano testów, lintowania ani builda.
- `git diff --check` nie zgłosił błędów whitespace.
