# Review sprintu 002

Status: ukończony technicznie i gotowy do używania w lokalnym podglądzie.

Przyrost: statyczne MP3 zawierające osiem zdań i ciszę po każdym z nich. Jeden obieg 71,928 s, plik 863756 bajtów. Głos de-DE-KatjaNeural, tempo -10%, przerwa 1,5 × długość klipu + 1 s.

Weryfikacja: pięć testów składania PCM przechodzi. Build aplikacji przechodzi. Lokalny HTTP zwraca 200 dla strony i serwuje plik audio o zgodnym rozmiarze. Nie przeprowadzono testu na iPhonie. WebMCP: brak dostępnego kontekstu do weryfikacji rejestracji narzędzia; niezweryfikowane.

Karol: otwórz aplikację w Safari, Start, zablokuj ekran, sprawdź dwa obiegi (około 2 min 24 s) i następnie 15 min. Sprawdź również pauzę/wznowienie z ekranu blokady oraz uruchomienie z ekranu głównego. Zanotuj model iPhone'a/iOS, przerwania i wygodę przerw.

Wynik: aplikacja uruchamia się, ładuje manifest i odtwarza MP3 z ośmioma zdaniami oraz przerwami. Przycisk Start/Pauza/wznowienie, pętla i stan odtwarzania działają. Build aplikacji, pięć testów składania PCM i lokalne żądania HTTP przechodzą.

Akceptacja zakresu technicznego: sprint 002 zamknięty. Test urządzenia iOS pozostaje testem eksploatacyjnym do wykonania na konkretnym modelu i wersji systemu.

Naprawa środowiska: npm exec --offline przekazywało tryb offline do instalatora potomnego; --offline=false umożliwiło pobranie brakujących natywnych zależności Windows.

Synteza testowego nagrania: https://github.com/rany2/edge-tts (narzędzie jednorazowej generacji; dostawca produkcyjny nie jest jeszcze wybrany).
