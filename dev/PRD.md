# PRD — Gawor

Wersja 0.2 · aktualizacja 2026-09-16 · Właściciel produktu / interesariusz: Karol

Aktualny przyrost: [sprint 004 — powtarzanie własnych zdań](sprint-004/PRD.md). Karol potwierdził priorytet generowania audio własnych zestawów przed automatycznym przesyłaniem zdań z rozmowy. Implementacja techniczna jest opisana w [wyniku sprintu](sprint-004/RESULT.md); demonstracja i test iPhone'a czekają na review.

Kolejny planowany przyrost: [draft sprintu 005 — cykliczny eksport bazy](sprint-005/PRD.md). Karol chce kopii danych niezależnych od Sites; harmonogram, miejsce przechowywania i retencja pozostają do ustalenia.

## Problem

Karol uczy się niemieckiego przez naturalną rozmowę z agentem. Agent pomaga i na komendę zapisuje przydatne zdania. Obecnie zdania pozostają w historii poszczególnych czatów: trudno do nich wrócić, a ćwiczenie wymaga dodatkowej pracy.

## Cel i główny przepływ

Na iPhonie: rozmowa głosowa → „dodaj to do listy” → trwały zapis poprawnego zdania → zakończenie sesji → jeden Start → automatyczne czytanie zestawu z czasem na powtórzenie, wielokrotnie.

Produkt nie wymaga ręcznego kopiowania list, publikacji w App Store ani płatnego konta Apple Developer. Preferowana forma: aplikacja webowa dodawana do ekranu głównego (PWA). Usługi głosowe, model i hosting mogą mieć osobne koszty; dostawca i budżet do ustalenia przed ich uruchomieniem.

## Użytkownik i platforma

Pierwszy użytkownik: Karol. Interfejs po polsku, rozmowa i wzorce wymowy po niemiecku. Telefon jest podstawowym urządzeniem zarówno do rozmów, jak i ćwiczeń. Dokładna wersja iOS do odnotowania przy teście. Pierwsza wersja rozmowy wymaga aplikacji na pierwszym planie; rozmowa przy zablokowanym ekranie nie jest wymaganiem MVP. Odtwarzanie przy blokadzie jest wymaganiem i bramką techniczną.

## Wymagania MVP

### Rozmowa

- Naturalna komunikacja głosowa, większość czasu mówi użytkownik.
- Agent odpowiada najpierw na treść; krótko poprawia wypowiedź niezrozumiałą, błąd utrudniający komunikację lub na prośbę.
- Polskie i angielskie wtrącenia tłumaczy na niemiecki. Przy szukaniu słowa podaje krótką pomoc i pozwala kontynuować.
- Nie kończy zdań za użytkownika i nie prowadzi wykładów gramatycznych bez prośby.
- „Zapisz to” / „dodaj do listy” zapisuje poprawną wersję; potwierdzenie następuje po udanym zapisie. Przy niejasnym odniesieniu agent wyjaśnia, które zdanie zapisać.
- Ponowienie żądania po błędzie sieci nie tworzy duplikatu. Nieudany zapis jest widoczny i można go ponowić.
- Domyślnie zapis na komendę użytkownika. Automatyczne dodawanie często ćwiczonych zdań z opisu źródłowego jest poza MVP, dopóki użytkownik go nie potwierdzi.

### Biblioteka

- Trwała biblioteka poza historią czatu, grupowanie według sesji i dostęp do poprzednich zestawów.
- Zdanie: identyfikator, poprawny tekst niemiecki, opcjonalne polskie znaczenie/kontekst, sesja źródłowa, czas zapisu.
- Edycja i usuwanie zdań. Zmiana tekstu unieważnia stare nagranie i wymaga wygenerowania aktualnego.
- Zakończenie rozmowy pokazuje zapisany zestaw. Pusta sesja nie uruchamia pustego odtwarzacza.

### Powtarzanie

- Jeden Start uruchamia wszystkie zdania po kolei; bez ręcznego przechodzenia i bez ręcznego uruchamiania pauz.
- Po każdym zdaniu, także ostatnim, automatyczny czas na powtórzenie.
- Czas ciszy po każdym zdaniu wynosi 1,5 × rzeczywisty czas czytania tego zdania przez głos, bez dodatkowej sekundy. Decyzja Karola z 2026-09-16 zastępuje wcześniejszą hipotezę „1,5 × długość mowy + 1 sekunda”.
- Zestaw wraca do początku aż do zatrzymania. Sterowanie Start / Pauza / wznowienie.
- Odtwarzanie ma działać przy zablokowanym ekranie. Utrata sieci, wywołanie telefonu i wznowienie muszą być sprawdzone w testach urządzenia; nie obiecujemy działania offline w MVP.
- Architektura do walidacji: gotowy plik audio zawierający mowę i ciszę, odtwarzany standardowym elementem audio. Kod strony nie odmierza ciszy między zdaniami.
- Plan awaryjny: długi plik z wieloma powtórzeniami (np. 60 minut), jeżeli zapętlenie pliku w tle jest zawodne. Skończony plik nie spełnia w pełni wymagania „aż zatrzymam”; taka zmiana wymaga review z Karolem.
- Bez nagrywania i oceniania głosu użytkownika w trybie powtórek.

## Minimalny model danych

User → Session → Sentence; PracticeSet wskazuje wybrane Sentence; AudioAsset wskazuje wersję tekstu, głos, parametry ciszy, czas trwania i lokalizację pliku. Sekrety dostawców tylko po stronie serwera. Dane docelowo przypisane do zalogowanego użytkownika, nie tylko localStorage.

## Poza MVP

Ocena wymowy, gamifikacja, kurs gramatyczny, rozbudowane statystyki, algorytm powtórek interwałowych, aplikacja natywna, wiele języków, udostępnianie materiałów innym osobom. Ręczny import nie jest przepływem produktu; lista źródłowa służy tylko jako dane testowe sprintu 001.

## Kryteria sukcesu

1. Zdanie zapisane głosowo jest dostępne po ponownym otwarciu aplikacji, bez szukania czatu.
2. Od zakończenia rozmowy do ćwiczenia wystarcza wybranie zestawu i Start; zero kopiowania.
3. Osiem zdań odtwarza się w prawidłowej kolejności przez co najmniej dwa pełne obiegi, z ciszą po każdym zdaniu, przy zablokowanym iPhonie.
4. Dodatkowy test 15 minut w tle bez niezamierzonego zatrzymania. Wynik dotyczy sprawdzonego urządzenia/iOS, nie wszystkich wersji systemu.
5. Karol potwierdza, że głos i długość przerw pozwalają mu wygodnie powtarzać.

## Ryzyka i bramki

- Najpierw sprawdzamy odtwarzanie w tle. Dopiero review odblokowuje następny sprint.
- Niemiecki głos musi pochodzić z rzeczywistej syntezy mowy; przeglądarkowe speechSynthesis nie zastępuje testu odtwarzania pliku w tle.
- Dostęp do dostawcy syntezy i rozmowy może wymagać konfiguracji konta/sekretu. Nie zapisujemy sekretów w repozytorium ani dokumentacji.
- Opóźnienia rozmowy i rozpoznawanie końca wypowiedzi wymagają osobnego testu z użytkownikiem.

## Źródła decyzji technicznych

- Apple, aplikacja webowa na ekranie głównym: https://support.apple.com/en-kw/guide/iphone/iphea86e5236/ios
- WebKit, mikrofon i WebRTC: https://webkit.org/blog/7726/announcing-webrtc-and-media-capture/
- WebKit, historia problemów audio w tle: https://bugs.webkit.org/show_bug.cgi?id=198277
- Wymagania pedagogiczne: `skill i przyklady.txt.txt`; nowsze ustalenia rozmowy mają pierwszeństwo.
