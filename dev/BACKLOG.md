# Backlog produktu

| Sprint | Przyrost do demonstracji | Warunek zakończenia |
|---|---|---|
| 001 — zamknięty zakresem | Ekran odtwarzacza i fixture danych | Zakres zastąpiony przez sprint 002 |
| 002 — ukończony technicznie | Gotowe audio ośmiu zdań, przerwy, pętla i sterowanie Media Session | Build, testy składania i lokalny odtwarzacz działają |
| 003 — do review, częściowy | Feed rozmów do serwera, trwała biblioteka, sesje, edycja i kontrola aktualności audio | Zapis i edycja działają; nowe audio wymaga wyboru oraz podłączenia dostawcy TTS |
| 004 — technicznie zaimplementowany, do review | Audio własnych zestawów, cisza 1,5 × czas mowy bez dodatkowej sekundy, ponowne generowanie po edycji, odtwarzanie i test iPhone'a | Własny zestaw działa od przygotowania nagrania do powtarzania; trwałość, aktualność audio i test urządzenia zweryfikowane |
| 005 — draft | Cykliczny eksport bazy do miejsca niezależnego od Sites | Automatyczne kopie dostępne poza Sites i sprawdzone odtworzenie biblioteki; szczegóły do uzgodnienia |

## Otwarte funkcje

- Usuwanie całych zestawów z biblioteki wraz z powiązanymi zdaniami, metadanymi audio i plikiem w R2.

[PRD sprintu 004 i przekazanie dla nowego agenta](sprint-004/PRD.md). Decyzja Karola z 2026-09-16: powtarzanie własnych zdań ma pierwszeństwo przed automatyzacją zapisu rozmów. Sprint 004 przejął brakujące generowanie audio ze sprintu 003; [wynik techniczny](sprint-004/RESULT.md) jest gotowy, a [review](sprint-004/REVIEW.md) czeka na demonstrację i test urządzenia. Dopasowanie rozmówcy i szersze dopracowanie PWA odłożono, bez przypisania numeru sprintu.

Na każdym review można zmienić kolejność i zakres. Sprint to spójny przyrost, nie deklaracja liczby dni.

[Draft PRD sprintu 005](sprint-005/PRD.md): na prośbę Karola z 2026-09-16 dodano cykliczny eksport bazy. Częstotliwość, magazyn kopii i retencja pozostają do uzgodnienia.
