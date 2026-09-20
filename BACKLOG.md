# Backlog projektu Gawor

## Zabezpieczenie generowania audio

- Nie generować ponownie audio, jeżeli dla danego zestawu i identycznej wersji treści nagranie jest już aktualne.
- Zabezpieczyć równoległe żądania „Przygotuj audio”, aby dwa requesty nie uruchomiły jednocześnie tej samej syntezy.
- Po zakończeniu generowania ponownie sprawdzić hash treści przed publikacją pliku jako aktualnego.
- Dodać test dla podwójnego kliknięcia/równoległych requestów oraz ponownego użycia gotowego audio.
