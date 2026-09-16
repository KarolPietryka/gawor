# Wynik prac — sprint 003

Status: częściowy przyrost gotowy do review biblioteki. Sprint nie jest jeszcze zamknięty z powodu braku dynamicznej syntezy nowych zestawów.

Zrobione:

- trwały model D1: `Session`, `Sentence`, `PracticeSet`, powiązanie zdań z zestawem, `AudioAsset` i słownictwo;
- migracja Drizzle z kluczami obcymi, unikalnością zdań w sesji i indeksami dla głównych odczytów;
- endpoint importujący JSON z rozmowy, walidujący dane, normalizujący odstępy oraz odrzucający puste i powtórzone zdania;
- biblioteka sesji odczytywana z serwera po ponownym wejściu;
- wybór zestawu do ćwiczeń oraz dodawanie, edycja i usuwanie zdań;
- unieważnianie poprzedniego `AudioAsset` po każdej zmianie treści zestawu;
- ponowne podłączenie istniejącego fixture audio, jeśli treść zestawu dokładnie odpowiada nagranym ośmiu zdaniom;
- jawne stany pustej biblioteki, niedostępnej bazy, błędnego JSON i nieaktualnego audio;
- napisy WebVTT do istniejącego nagrania i odczyt stanu ćwiczenia przez WebMCP.

Weryfikacja:

- build aplikacji przechodzi;
- lint zmienionego kodu aplikacji, API i bazy przechodzi;
- lokalna migracja D1 wykonała 13 instrukcji bez błędu;
- sprawdzono przepływ: import z deduplikacją → odczyt → dodanie → edycja → usunięcie → ponowny odczyt. Stan pozostał w lokalnej bazie D1.

Nieukończone:

- nowe lub edytowane zestawy nie mają jeszcze generowanego pliku audio, ponieważ nie wybrano dynamicznego dostawcy TTS;
- R2 na pliki generowanego audio pozostaje wyłączone;
- pełny test iPhone/iOS oraz review Karola nie zostały przeprowadzone;
- WebMCP nie został sprawdzony w przeglądarce udostępniającej kontekst tego standardu.
