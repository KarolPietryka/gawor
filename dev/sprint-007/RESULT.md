# Wynik sprintu 007

Data: 2026-10-28.

Status: wdrożony na produkcję 2026-10-28; build i review zakończone. Karol jawnie zwolnił sprint z testu ręcznego i polecił wykonać commit, push i wdrożenie produkcyjne.

## Zmiana

- Przy „W tym zestawie” jest przełącznik „Ukryj niemiecki”. Obejmuje wszystkie niemieckie teksty dolnej listy Ćwiczeń.
- Polski jest widoczny w obu stanach; dla zdania bez tłumaczenia pojawia się „Brak polskiego tłumaczenia”.
- Niemiecki domyślnie widoczny, bez zapamiętywania ustawienia. Stan jest lokalnym booleanem React.
- Nagłówek zawija się na wąskim ekranie. Teksty mają oznaczenia języka; przełącznik ma powiązaną etykietę i dostępną nazwę.
- Zmiany kodu ograniczają się do `app/app/page.tsx` i `app/app/globals.css`. Backend, dane i logika odtwarzania pozostają bez zmian.

## Weryfikacja

- `npm.cmd run build`: pierwszy przebieg zablokowany przez sandbox (`spawn EPERM` przy ładowaniu konfiguracji Vite). Powtórzony poza sandboxem zakończył się powodzeniem. Końcowy build po korekcie kontrastu także przeszedł.
- Build wydania z istniejącymi bindingami produkcyjnymi D1/R2 również przeszedł; target i bindingi wygenerowanej konfiguracji sprawdzono przed publikacją. Wcześniej zatrzymano podgląd lokalny blokujący pliki `dist` na Windows.
- `npm.cmd run lint`: kod wyjścia 1, 24 istniejące błędy w komponentach współdzielonych i dotychczasowych fragmentach strony (reguły dostępności, React Compiler i interpolacja typów). Nowe fragmenty nie są wskazywane przez lint.
- `git diff --check`: bez błędów po implementacji i przy końcowej kontroli przed przekazaniem do testu.
- Niezależne review wskazało kontrast tłumaczenia w aktywnym wierszu (4,37:1); przyciemniono tekst do `#52645a` (5,16:1). Pozostałe uwagi dotyczyły uzupełnienia wyniku, aktualizacji statusów i dopisania testu VoiceOver; zostały uwzględnione.
- Automatyczna weryfikacja UI przez Computer Use została zatrzymana przez narzędzie: nie udało się wiarygodnie ustalić URL bieżącej przeglądarki Windows. Nie wykonano interakcji i nie uznano testu UI za zaliczony.
- Test Karola na iPhonie, w tym ukrycie/odsłonięcie, polskie teksty, reset po odświeżeniu, układ, VoiceOver i ciągłość audio: niewykonany, pominięty na wyraźne polecenie Karola z 2026-10-28; nie jest bramką wydania tego sprintu.

## Podgląd lokalny

- Uruchomiono z `app/`: `npm.cmd run start -- --ip 0.0.0.0 --port 8788 --persist-to .wrangler/state`.
- Jawne `--persist-to` wskazuje istniejący lokalny stan. Bez niego wygenerowana konfiguracja z `dist/server` korzystała z osobnej, pustej bazy i endpoint zwracał 503. Nie było potrzeby migracji ani zapisu danych testowych.
- Po wskazaniu istniejącego stanu `/api/sessions` zwraca HTTP 200: dwa lokalne zestawy z aktualnymi metadanymi audio. Strona sprawdzona przez adres LAN również zwraca HTTP 200. Odsłuch pozostaje do ręcznego sprawdzenia.
- Komputer ma aktywne połączenie Ethernet; Wi-Fi jest rozłączone, więc nie ma aktualnego IPv4 Wi-Fi. Bieżący adres i link do testu przekazano Karolowi w rozmowie, bez utrwalania adresu LAN w repozytorium.

## Wydanie

Karol zlecił commit, push i wydanie produkcyjne 2026-10-28, a następnie jednoznacznie polecił wykonać je bez testu ręcznego. Wydanie korzysta z istniejącego Workera i istniejących bindingów produkcyjnych D1/R2 opisanych w `app/DEPLOYMENT.md`; nie wymaga migracji, tworzenia zasobów ani zmian sekretów.

- Commit funkcji: `10bf8fe4f9dfd5c70f6fe00c5696f6c14e09491a`, wypchnięty na `origin/main`.
- Wdrożenie: `wrangler deploy --config dist/server/wrangler.json` zakończone powodzeniem; Wrangler potwierdził publikację Workera `gawor`.
- Produkcja: https://gawor.karol-pietryka11.workers.dev/.
- Po wdrożeniu strona i `/api/sessions` zwracają HTTP 200. HTML strony zawiera etykietę „Ukryj niemiecki”; opublikowany plik klienta również zawiera przełącznik i zwraca HTTP 200.
- Nie wykonywano migracji, zmian sekretów ani zapisu danych produkcyjnych.
