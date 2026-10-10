# Backlog produktu

| Sprint | Przyrost do demonstracji | Warunek zakończenia |
|---|---|---|
| 001 — zamknięty zakresem | Ekran odtwarzacza i fixture danych | Zakres zastąpiony przez sprint 002 |
| 002 — ukończony technicznie | Gotowe audio ośmiu zdań, przerwy, pętla i sterowanie Media Session | Build, testy składania i lokalny odtwarzacz działają |
| 003 — zamknięty decyzją Karola | Feed rozmów do serwera, trwała biblioteka, sesje, edycja i kontrola aktualności audio; generowanie audio dokończone w sprincie 004 | Zakres funkcjonalny dostarczony łącznie ze sprintem 004; test iPhone'a pozostaje do wykonania |
| 004 — zamknięty decyzją Karola | Audio własnych zestawów, cisza 1,5 × czas mowy bez dodatkowej sekundy, ponowne generowanie po edycji i odtwarzanie w pętli | Implementacja techniczna ukończona; test iPhone'a i demonstracja nie są potwierdzone w dokumentacji |
| 005 — zaimplementowany, do weryfikacji | Odsłuchiwanie pojedynczego zdania z podglądu zestawu obok odtwarzania całości | Każde zdanie można odtworzyć osobno; całość nadal działa; aktualność audio jest zachowana |
| 006 — draft, później | Cykliczny eksport bazy do miejsca niezależnego od Sites | Automatyczne kopie dostępne poza Sites i sprawdzone odtworzenie biblioteki; szczegóły do uzgodnienia |

## Otwarte funkcje

- Usuwanie całych zestawów z biblioteki wraz z powiązanymi zdaniami, metadanymi audio i plikiem w R2.

[PRD sprintu 004 i przekazanie dla nowego agenta](sprint-004/PRD.md). Decyzją Karola z 2026-10-10 sprinty 003 i 004 są zamknięte. Sprint 004 przejął brakujące generowanie audio ze sprintu 003. Demonstracja i test iPhone'a pozostają niewykonane według dostępnych zapisów i są otwartym zadaniem eksploatacyjnym. Dopasowanie rozmówcy i szersze dopracowanie PWA odłożono, bez przypisania numeru sprintu.

Na każdym review można zmienić kolejność i zakres. Sprint to spójny przyrost, nie deklaracja liczby dni.

[Draft PRD sprintu 005](sprint-005/PRD.md): odsłuchiwanie zdań pojedynczo. [Wcześniejszy draft kopii bazy](sprint-006/PRD.md) zachowano jako późniejszy temat; częstotliwość, magazyn kopii i retencja pozostają do uzgodnienia.
