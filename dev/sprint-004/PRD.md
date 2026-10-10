# Sprint 004 — powtarzanie własnych zdań

Data: 2026-09-16. Właściciel produktu: Karol.

Status początkowy: zakres uzgodniony i przekazany do implementacji. Status końcowy: sprint zamknięty decyzją Karola z 2026-10-10; demonstracja i test urządzenia pozostają niewykonane według dostępnych zapisów. Wynik techniczny jest zapisany w [RESULT.md](RESULT.md), a szczegóły weryfikacji w [REVIEW.md](REVIEW.md).

## Decyzje Karola

- Priorytetem jest powtarzanie własnych zdań. Automatyczne przesyłanie zdań z rozmowy ma niższy priorytet.
- Sprint obejmuje generowanie audio własnych zestawów, odtwarzanie, ponowne generowanie po edycji i próbę na iPhonie.
- Cisza po każdym zdaniu wynosi dokładnie **1,5 × rzeczywisty czas czytania tego zdania przez wybrany głos**, bez dodatkowej sekundy.
- Bieżące zlecenie obejmuje tylko dokumentację dla nowego agenta, bez zmian kodu i uruchamiania usług.

Ta decyzja zastępuje wcześniejszą hipotezę przerwy `1,5 × czas mowy + 1 s` oraz pierwotną propozycję sprintu 004 dotyczącą dopasowania rozmówcy. Nie jest akceptacją nieprzeprowadzonego review biblioteki ani testu telefonu.

## Cel i demonstracja

Karol może ćwiczyć dowolny własny zestaw zapisany w bibliotece, a nie tylko osiem zdań demonstracyjnych.

Przepływ demonstracyjny: dodanie/import pięciu własnych zdań → przygotowanie audio → Start → automatyczna mowa i przerwy w pętli → edycja jednego zdania → przygotowanie aktualnego nagrania → ćwiczenie poprawionej wersji. Po ponownym wejściu sesja i gotowe nagranie pozostają dostępne.

## Stan wejściowy projektu

Na podstawie dokumentacji sprintów 001–003 i przeglądu kodu przy lokalnym HEAD `f7cb13c`:

- Aplikacja ma bibliotekę sesji w Cloudflare D1, import JSON, dodawanie, edycję i usuwanie zdań. Model obejmuje zestawy ćwiczeń i metadane audio.
- Zmiana zestawu unieważnia poprzednie audio; interfejs blokuje użycie nieaktualnego nagrania.
- Odtwarzacz HTML audio obsługuje pętlę, pauzę/wznowienie i Media Session. Cisza jest częścią pliku.
- Gotowe nagranie istnieje tylko dla ośmiu zdań demo. Endpoint przygotowania audio podpina ten plik wyłącznie przy zgodności treści; dla nowych zdań zwraca 409 z informacją o braku TTS.
- Oś czasu i napisy odtwarzacza nadal pochodzą ze statycznego demo.
- Skrypt Python generuje fixture przez Edge TTS i składa audio z użyciem ffmpeg. To nie jest podłączony backend generujący nagrania nowych sesji.
- Dynamiczny dostawca TTS nie został wybrany; magazyn generowanych plików, np. R2, nie został uruchomiony.
- Import w interfejsie wymaga wklejenia JSON-a. Nie ma automatycznego połączenia rozmowy z biblioteką ani rozmowy głosowej w aplikacji.
- Sprint 003 pozostaje częściowy. Sprint 004 przejmuje brakujące generowanie audio; nie oznacza to zamknięcia sprintu 003 ani akceptacji całego MVP.
- W dokumentacji zapisano wcześniejsze udane sprawdzenia builda i lokalnej bazy. Podczas przygotowania tego PRD nie uruchamiano ich ponownie. Test iPhone/iOS pozostaje niewykonany.

## Zakres funkcjonalny

### Przygotowanie i zachowanie nagrania

1. Z poziomu wybranej, niepustej sesji można przygotować audio wszystkich jej zdań w kolejności zestawu.
2. Backend generuje rzeczywistą mowę niemiecką, składa ją z ciszą w jeden plik i zapisuje plik oraz metadane potrzebne do odtwarzania.
3. Widać stan przygotowania, gotowości lub błędu. Po błędzie można ponowić operację; częściowego pliku nie pokazujemy jako gotowego.
4. Gotowe, aktualne nagranie jest używane ponownie po odświeżeniu i kolejnym wejściu. Samo odtworzenie nie uruchamia ponownej syntezy.
5. Pusty zestaw nie uruchamia generowania ani odtwarzania.

### Przerwy i pętla

- Dla każdego zdania osobno: `czas_ciszy = czas_mowy × 1,5`.
- Przykład: 2 s mowy → 3 s ciszy; 4 s mowy → 6 s ciszy. Nie dodajemy stałego `+1 s`.
- Czas mowy wynika z wygenerowanego klipu przy faktycznym tempie głosu, nie z liczby znaków ani czasu odpowiedzi usługi. Nie wliczamy dokładanej ciszy na powtórzenie.
- Cisza występuje również po ostatnim zdaniu, przed początkiem następnego obiegu.
- Cisza jest zapisana w audio; nie odmierzają jej timery JavaScript. Dopuszczalne jest jedynie zaokrąglenie wynikające z rozdzielczości próbek audio.
- Jeden Start uruchamia cały zestaw w pętli aż do zatrzymania. Dostępna jest pauza i wznowienie.

### Aktualność i odtwarzacz

- Dodanie, zmiana lub usunięcie zdania powoduje konieczność przygotowania aktualnego nagrania.
- Jeśli zestaw zmieni się podczas generowania, wynik dla wcześniejszej wersji nie może zostać uznany za aktualny.
- Aktualność uwzględnia tekst, kolejność zdań, głos i parametry generowania, w tym regułę ciszy. Dotychczasowe demo z dodatkową sekundą nie spełnia nowej reguły.
- Każde nagranie ma własną oś czasu. Tekst aktualnego zdania i stan mowa/przerwa odpowiadają jego treści; nie korzystają z czasów demo. Jeżeli wyświetlane są napisy, muszą dotyczyć tego samego nagrania.
- Brak nagrania, nieaktualność i błąd mają zrozumiały komunikat oraz właściwą akcję użytkownika.

### Próba na telefonie

- Na iPhonie sprawdzamy co najmniej dwa pełne obiegi i 15 minut przy zablokowanym ekranie, pauzę/wznowienie oraz powrót do aplikacji.
- Sprawdzamy Safari i uruchomienie z ekranu głównego; odnotowujemy model telefonu, wersję iOS i sposób słuchania.
- Krótka próba utraty sieci oraz przerwania połączeniem telefonicznym służy zapisaniu faktycznego zachowania i możliwości wznowienia. Nie deklarujemy pełnego offline.
- Karol ocenia naturalność głosu i wygodę przerw. Wyniku testu urządzenia ani akceptacji nie wolno domniemywać.

## Poza zakresem

Automatyczny zapis z rozmowy, agent głosowy w aplikacji, dopasowanie rozmówcy, ocena wymowy, statystyki, powtórki interwałowe, wiele języków, rozbudowa kont użytkowników i ogólne przeprojektowanie PWA. Istniejący import i edycja wystarczają jako wejście do tego sprintu. Test telefonu nie jest deklaracją ukończenia całego MVP.

## Decyzje techniczne do podjęcia podczas implementacji

- Wybór usługi TTS i niemieckiego głosu oraz ustalenie kosztów/budżetu przed uruchomieniem usługi. Nie wybrano dostawcy w tej rozmowie.
- Trwałe miejsce na audio i manifesty: R2 jest kandydatem, nie zatwierdzoną decyzją.
- Sposób wykonania syntezy i składania audio zgodny ze środowiskiem aplikacji; obecność lokalnego skryptu Python/ffmpeg nie oznacza możliwości uruchomienia go bezpośrednio w Cloudflare Worker.
- Obsługa dłuższego przygotowania i ponowień bez wielokrotnego uruchamiania tej samej pracy, z ponownym sprawdzeniem wersji przed oznaczeniem nagrania jako gotowego.
- Klucze dostawców wyłącznie po stronie serwera. Sposób dostępu do generowania i plików musi odpowiadać uzgodnionemu sposobowi udostępnienia aplikacji; nie zakładać publicznego, nieograniczonego endpointu płatnej syntezy.

Te punkty są otwarte, a nie blokadą dla przygotowania kodu i projektu rozwiązania. Dokument nie stanowi zgody na zakup usług ani publiczną publikację.

## Kryteria zakończenia

1. Pięć nowych zdań, innych niż demo, otrzymuje działające nagranie w prawidłowej kolejności.
2. Każde zdanie, także ostatnie, ma w pliku ciszę równą 1,5 × czas jego mowy, bez dodatkowej sekundy.
3. Start, pętla, pauza/wznowienie oraz tekst na ekranie działają dla nowego zestawu.
4. Ponowne wejście zachowuje dostęp do sesji i aktualnego audio bez ponownej syntezy.
5. Edycja unieważnia stare audio; nowe nagranie zawiera poprawkę. Zmiana podczas generowania nie oznacza starej wersji jako aktualnej.
6. Błąd generowania jest widoczny i możliwe jest ponowienie; pusty zestaw nie jest generowany.
7. Build i adekwatne sprawdzenia integracji przechodzą. Testy składania sprawdzają nową regułę ciszy, jej obecność po ostatnim zdaniu i zgodność osi czasu.
8. Wyniki demonstracji i testu iPhone'a oraz feedback Karola są zapisane. Bez wyniku telefonu status może być „gotowy do testu urządzenia”, nie pełne ukończenie.

## Przekazanie dla nowego agenta

Przeczytaj ten dokument, `dev/PRD.md` oraz wynik i review sprintu 003. Zweryfikuj bieżący kod i lokalne zmiany przed implementacją. Bieżące przekazanie jest dokumentacyjne; realizację rozpocznij na podstawie zlecenia użytkownika.

Najważniejsze miejsca w repozytorium:

- `app/app/page.tsx` — biblioteka, import, przycisk przygotowania audio i odtwarzacz; do odpięcia statyczna oś czasu oraz napisy demo.
- `app/app/api/practice-sets/[practiceSetId]/audio/route.ts` — obecnie tylko dopasowanie do fixture; miejsce wejścia do generowania.
- `app/app/api/sessions/route.ts` — import i automatyczne podpinanie demo; uwzględnić nową regułę aktualności.
- `app/app/api/sessions/[sessionId]/sentences/route.ts`, `app/app/api/sentences/[sentenceId]/route.ts` — zmiany zdań.
- `app/lib/sessions.ts` — skróty treści, odczyt biblioteki, unieważnianie audio. Obecny skrót treści nie obejmuje głosu ani reguły przerw.
- `app/db/schema.ts`, `app/drizzle/` — model i migracje; obecne metadane audio nie opisują całego profilu generowania.
- `src/audio/assemble.py` — składanie PCM i osi czasu. Obecne domyślne `pause_extra=1.0` oraz CLI wymagają dostosowania do nowej reguły.
- `src/audio/generate_demo.py` — jednorazowe generowanie demo; inspiracja dla składania, nie gotowy backend.
- `tests/test_audio_assemble.py` — obecne oczekiwania uwzględniają dodatkową sekundę; zaktualizować przy implementacji.
- `app/public/audio/` — stare demo, manifest i napisy; nie traktować jako nagrania zgodnego z nową regułą ciszy.

Zalecana kolejność: ustalenie sposobu generowania i przechowywania → jeden własny zestaw od backendu do odtwarzacza → trwałość, ponowienia i aktualność → weryfikacja techniczna → demonstracja i test telefonu.

Po implementacji dodaj `RESULT.md` z faktycznie wykonanym zakresem i wynikami sprawdzeń oraz `REVIEW.md` z wynikami użytkownika lub jawnym statusem oczekiwania. Nie przepisuj dawnych testów jako nowych ani nie zmieniaj historycznych wyników sprintów.
