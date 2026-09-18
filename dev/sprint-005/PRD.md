# Sprint 005 — cykliczny eksport bazy danych

Data: 2026-09-16. Właściciel produktu: Karol.

Status: draft do dopracowania przed realizacją. Wyłącznie dokumentacja; nie wdrożono eksportu ani harmonogramu.

## Potrzeba i decyzja Karola

Karol chce cyklicznego eksportu bazy danych, ponieważ nie chce polegać wyłącznie na Sites jako miejscu utrzymywania projektu i danych. Celem jest posiadanie kopii, z której można odzyskać bibliotekę również przy utracie dostępu do aplikacji lub jej hostingu.

Potwierdzony zakres to cykliczny eksport bazy. Poniższe szczegóły są propozycją realizacji i wymagają doprecyzowania przed implementacją.

## Proponowany zakres

- Automatyczny, cykliczny eksport trwałej bazy używanej przez aplikację. Obecnie jest to Cloudflare D1; przed wdrożeniem ustalić właściwą instancję i środowisko, aby nie eksportować wyłącznie lokalnej bazy testowej.
- Eksport schematu oraz wszystkich danych potrzebnych do odtworzenia biblioteki: sesji, zdań, zestawów, ich powiązań, słownictwa i metadanych audio. Uwzględnić także tabele dodane w kolejnych migracjach.
- Zapis kopii poza Sites i poza samym środowiskiem aplikacji, z dostępem pozostającym pod kontrolą Karola. Dokładny magazyn nie został wybrany.
- Wersjonowane kopie z datą wykonania i uzgodnioną retencją; nie nadpisywać jedynej dobrej kopii nieudanym lub pustym eksportem.
- Informacja o ostatniej udanej kopii oraz wykrywanie nieudanego lub pominiętego wykonania. Sposób sygnalizacji do ustalenia.
- Krótka instrukcja odzyskania i próbne odtworzenie w oddzielnej bazie, bez nadpisywania bazy używanej przez aplikację.

Harmonogram powinien działać bez otwartej przeglądarki i bez aktywnej sesji agenta. Należy rozważyć uruchamianie go poza hostingiem aplikacji, aby awaria Sites nie zatrzymywała również mechanizmu kopii.

## Otwarte decyzje

1. Częstotliwość i dopuszczalna utrata najnowszych zmian. Propozycja startowa: raz dziennie, do potwierdzenia.
2. Docelowe miejsce kopii, niezależny dostęp Karola oraz ewentualne koszty.
3. Czas przechowywania i liczba wersji. Propozycja startowa: 30 dziennych kopii, do potwierdzenia.
4. Format eksportu nadający się do odtworzenia schematu i danych oraz sposób zabezpieczenia kopii i poświadczeń.
5. Miejsce uruchamiania harmonogramu i sposób sygnalizacji błędów. Ten draft nie upoważnia do wysyłania wiadomości ani podłączania zewnętrznych kont.
6. Zakres zabezpieczenia plików audio po sprincie 004: osobna kopia plików czy ponowna synteza na podstawie zachowanej bazy. Eksport bazy obejmuje metadane i odnośniki, ale **nie zawartość zewnętrznych plików audio**; sam eksport D1 nie jest pełną kopią nagrań.

## Proponowane kryteria zakończenia

1. Eksport wykonuje się automatycznie zgodnie z uzgodnionym harmonogramem, bez otwartej aplikacji.
2. Karol może pobrać kopię bez korzystania z Sites.
3. Kopia zawiera schemat i dane biblioteki wraz z relacjami; ma datę wykonania i identyfikację źródłowej bazy.
4. Nieudane wykonanie jest wykrywalne i nie usuwa ostatniej poprawnej kopii; historia odpowiada ustalonej retencji.
5. Próbne odtworzenie do oddzielnej bazy kończy się odczytem sesji, zdań i zestawów oraz sprawdzeniem ich relacji.
6. Instrukcja opisuje dostęp do kopii, odtworzenie oraz to, czy i jak odzyskuje się nagrania.

## Przekazanie dla nowego agenta

Najpierw sprawdź wynik sprintu 004 i aktualny model w `app/db/schema.ts` oraz migracje w `app/drizzle/`. Ustal, gdzie faktycznie są baza i pliki audio oraz jakie niezależne możliwości eksportu są dostępne. Nie zakładaj, że kopia kodu projektu zawiera dane D1 lub wygenerowane nagrania.

Przed wdrożeniem doprecyzuj otwarte decyzje z Karolem. To propozycja kolejnego sprintu, nie polecenie uruchomienia usługi w ramach przygotowania dokumentacji sprintu 004. Zapisz wyniki eksportu i próbnego odtworzenia w `RESULT.md`, a ocenę użytkownika w `REVIEW.md` dopiero po ich wykonaniu.
