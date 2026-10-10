# Sprint 005 — odsłuchiwanie pojedynczych zdań

Data: 2026-10-10. Właściciel produktu: Karol.

Status: zamknięty 2026-10-10 po potwierdzeniu Karola, że funkcja działa i sprint jest skończony. Szczegóły: [wynik](RESULT.md) i [review](REVIEW.md).

## Potrzeba

Obecnie można odtworzyć cały zestaw ćwiczeniowy jako całość, zwykle w pętli. Karol chce dodatkowo odsłuchiwać wybrane zdanie osobno, bez uruchamiania całego zestawu.

## Zakres

- W podglądzie zestawu każde zdanie ma własny przycisk odtwarzania.
- Kliknięcie przycisku odtwarza tylko przypisane do niego zdanie.
- Przycisk jest dostępny zarówno przy zdaniu na ekranie ćwiczenia, jak i w podglądzie zestawu w bibliotece.
- Istniejące odtwarzanie całego zestawu i jego pętla pozostają dostępne.
- Odtwarzanie pojedynczego zdania korzysta z aktualnego nagrania zestawu i zapisanych dla niego metadanych; zmienione zdanie nie może odtworzyć nieaktualnego audio.
- Przyciski w obu widokach sterują tym samym odtwarzaczem i stanem audio.
- Pobrany plik audio jest cache'owany w pamięci aplikacji na czas bieżącej sesji i wykorzystywany ponownie. Zmiana treści lub wersji audio unieważnia cache.

## Kryteria akceptacji

1. W zestawie ośmiu zdań każde zdanie ma osobny przycisk odtwarzania w widoku ćwiczenia i w podglądzie biblioteki.
2. Pojedynczy odsłuch używa timestampu początku zdania i kończy się na końcu mowy (`speech_end`), bez odtwarzania przypisanej ciszy, kolejnych zdań ani pętli.
3. Gdy nie trwa pętla, odsłuch pojedynczego zdania kończy się i nie uruchamia dalszego odtwarzania.
4. Gdy trwa pętla, pojedynczy odsłuch zapamiętuje jej dokładną pozycję, odtwarza zdanie i wznawia pętlę od zapamiętanego miejsca. Jeśli pętla była zapauzowana, po odsłuchu pozostaje zapauzowana w tym samym miejscu.
5. Kliknięcie innego zdania w czasie pojedynczego odsłuchu przerywa go i odtwarza nowe zdanie od początku. Ponowne kliknięcie tego samego zdania także rozpoczyna je od początku; pojedynczy odsłuch nie ma osobnej pauzy.
6. Uruchomienie pełnej pętli podczas pojedynczego odsłuchu przerywa go i rozpoczyna zestaw od początku.
7. Użytkownik może nadal uruchomić cały zestaw w dotychczasowy sposób.
8. Przyciski są aktywne tylko dla gotowego i aktualnego audio zestawu. Brak lub nieaktualność nagrania prowadzi do istniejącego przygotowania audio, a stara wersja nie jest odtwarzana.
9. Jeden plik audio jest pobierany i cache'owany w pamięci aplikacji na czas sesji, następnie używany do odsłuchu zdań i pełnego zestawu. Zmiana treści/assetu unieważnia starą kopię.

## Decyzje implementacyjne uzgodnione 2026-10-10

- Nie generować ani nie przechowywać osobnego pliku dla każdego zdania. Korzystać z istniejącego, złożonego audio zestawu.
- Nie wyznaczać granic zdań z tekstu ani na oko. TTS generuje osobne klipy; składanie audio zna ich długości z próbek i zapisuje metadane osi czasu. Użyć początku zdania oraz `speech_end`, pomijając ciszę.
- Dane biblioteki już zawierają manifest. Użyć tych metadanych z istniejącego endpointu; nie dublować manifestu na endpointzie pliku audio.
- Endpoint pliku obecnie zwraca cały WAV i ustawia `no-store`. Dla tej funkcji pobrać cały plik raz, zachować go w pamięci aplikacji podczas sesji i używać ponownie; nie dodawać obsługi żądań Range w ramach tego zakresu.
- Odtwarzacz i cache są wspólne dla widoku ćwiczenia i biblioteki.
- Szczegóły drobnego feedbacku UI, takie jak tekst/ikona ładowania, pozostają wyborem implementacyjnym agenta.

## Późniejszy temat

Wcześniejszy draft cyklicznych kopii bazy został zachowany jako [Sprint 006](../sprint-006/PRD.md). Nie jest częścią zakresu tego sprintu.
