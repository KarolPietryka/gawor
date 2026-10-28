# Gawor — dziennik rozwoju

Pracujemy przyrostowo: plan sprintu → implementacja → weryfikacja → demonstracja → rozmowa z Karolem → zapis decyzji → kolejny sprint. Nie rozpoczynamy kolejnego sprintu przed review poprzedniego.

- [PRD](PRD.md) — wymagania produktu i granice MVP.
- [Backlog](BACKLOG.md) — kolejność przyrostów, aktualizowana po review.
- [Sprint 004 — PRD i przekazanie](sprint-004/PRD.md) — uzgodniony zakres powtarzania własnych zdań; punkt startowy dla nowego agenta.
- [Sprint 005 — PRD, wynik i review](sprint-005/PRD.md) — osobne odtwarzanie każdego zdania; Karol potwierdził działanie i zamknął sprint 2026-10-10.
- [Sprint 006 — PRD, wynik i review](sprint-006/PRD.md) — uruchamianie zestawu bezpośrednio z wiersza Biblioteki; aktywny.
- [Sprint 007 — PRD i wynik](sprint-007/PRD.md) — przełącznik ukrywający niemieckie zdania na dolnej liście Ćwiczeń; implementacja gotowa, Karol zlecił wydanie bez testu ręcznego.
- [Kandydaci do przyszłych sprintów](BACKLOG.md) — w tym cykliczny eksport bazy przeniesiony z draftu sprintu 005.
- [Ustalenia początkowe](decisions/2026-09-12-kickoff.md).
- Każdy sprint ma osobny katalog `sprint-NNN` z planem, wynikiem i review. Feedback zapisujemy jako fakty dopiero po wypowiedzi interesariusza. Akceptacji nie domniemujemy.

Status: sprinty 001–005 zamknięte decyzją Karola; sprint 006 jest aktywny. Testy urządzenia niepotwierdzone w dokumentacji pozostają zadaniami eksploatacyjnymi, a nie otwartymi sprintami.

2026-10-10: Karol potwierdził, że odsłuchiwanie pojedynczych zdań działa, i zamknął sprint 005. Testów automatycznych nie uruchamiano.

2026-09-16: Karol zatwierdził kierunek sprintu 004 — powtarzanie własnych zdań i przerwy równe 1,5 × czas mowy, bez dodatkowej sekundy. Sprint przejął brakujące generowanie audio; jego wynik jest w [sprint-004/RESULT.md](sprint-004/RESULT.md).

2026-10-10: Karol zdecydował o zamknięciu sprintów 003 i 004. Test iPhone'a i demonstracja nie zostały oznaczone jako wykonane; pozostają zadaniami eksploatacyjnymi.

2026-10-18: Karol potwierdził zamknięcie wszystkich dotychczasowych sprintów. Następny przyrost: przycisk uruchamiania wybranego zestawu na każdym wierszu Biblioteki.

2026-10-18: Rozpoczęto sprint 006 — uruchamianie zestawu z poziomu jego wiersza w Bibliotece. Karol zwolnił ten sprint z ręcznej weryfikacji na iPhonie przed commitem/pushem.
