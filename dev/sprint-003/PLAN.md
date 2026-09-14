# Sprint 003 — biblioteka i sesje

Cel: zastąpić statyczny zestaw trwałą biblioteką zdań i sesji, tak aby zapisany zestaw był dostępny po ponownym wejściu do aplikacji.

Zakres:

- model `Session`, `Sentence`, `PracticeSet` i `AudioAsset`;
- zapis oraz odczyt danych po stronie aplikacji bez ręcznego kopiowania;
- lista sesji i zestawów z wyborem zestawu do ćwiczeń;
- dodawanie, edycja i usuwanie zdania;
- unieważnienie starego audio po zmianie tekstu;
- generowanie aktualnego audio dla wybranego zestawu na podstawie istniejącego mechanizmu fixture;
- pusty stan i błędy zapisu pokazane w interfejsie.

Poza zakresem: rozmowa głosowa, logowanie, S3 i produkcyjny dostawca TTS.

Kryteria zakończenia:

1. Zestaw pozostaje po ponownym wejściu do aplikacji.
2. Można dodać, zmienić i usunąć zdanie.
3. Po zmianie tekstu aplikacja nie odtwarza starego audio jako aktualnego.
4. Wybrany zestaw uruchamia odtwarzanie zgodne z jego treścią.
5. Demo i test techniczny przechodzą przed review Karola.

Review: pokazanie pełnego przepływu: utworzenie sesji → dodanie zdań → edycja → wygenerowanie audio → ponowne wejście → ćwiczenie.
