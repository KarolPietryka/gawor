# Sprint 003 — biblioteka i sesje

Cel: zamknąć pętlę rozmowa → serwer → biblioteka → ćwiczenie. Nowe rozmowy mają trafiać do backendu, który odczytuje ich podsumowanie i tworzy trwałą sesję oraz zestaw zdań.

Zakres:

- model `Session`, `Sentence`, `PracticeSet` i `AudioAsset`;
- endpoint przyjmujący wynik sesji rozmowy z czatu (JSON z promptu końca sesji);
- walidacja i normalizacja niemieckich zdań po stronie serwera, z odrzuceniem pustych lub zduplikowanych pozycji;
- zapis nowej rozmowy jako sesji i udostępnienie jej w bibliotece;
- odczyt sesji przez aplikację po ponownym wejściu;
- zapis oraz odczyt danych po stronie aplikacji bez ręcznego kopiowania;
- lista sesji i zestawów z wyborem zestawu do ćwiczeń;
- dodawanie, edycja i usuwanie zdania;
- unieważnienie starego audio po zmianie tekstu;
- generowanie aktualnego audio dla wybranego zestawu na podstawie istniejącego mechanizmu fixture;
- pusty stan i błędy zapisu pokazane w interfejsie.

Poza zakresem: prowadzenie rozmowy głosowej wewnątrz aplikacji, logowanie, S3 i produkcyjny dostawca TTS. Źródłem pierwszej sesji jest eksport JSON wygenerowany przez czat zgodnie z promptem Gawora.

Kryteria zakończenia:

1. JSON z zakończonej rozmowy można wysłać do backendu i otrzymać potwierdzenie zapisu.
2. Serwer odczytuje dane, tworzy sesję i udostępnia ją po ponownym wejściu do aplikacji.
3. Zestaw pozostaje po ponownym wejściu do aplikacji.
4. Można dodać, zmienić i usunąć zdanie.
5. Po zmianie tekstu aplikacja nie odtwarza starego audio jako aktualnego.
6. Wybrany zestaw uruchamia odtwarzanie zgodne z jego treścią.
7. Demo i test techniczny przechodzą przed review Karola.

Review: pokazanie pełnego przepływu: rozmowa w czacie → eksport JSON → wysłanie do serwera → odczyt sesji → edycja → wygenerowanie audio → ponowne wejście → ćwiczenie.
