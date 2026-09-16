# Review sprintu 003

Status: gotowy do demonstracji biblioteki i decyzji o syntezie audio.

## Scenariusz demonstracji

1. W zakładce Import wkleić JSON z podsumowaniem i kilkoma zdaniami, w tym pustym lub powtórzonym.
2. Zapisać sesję i sprawdzić, że biblioteka pokazuje tylko poprawne, unikalne zdania.
3. Odświeżyć aplikację i potwierdzić, że sesja nadal jest dostępna.
4. Dodać zdanie, zmienić istniejące i usunąć inne.
5. Potwierdzić komunikat, że wcześniejsze audio zostało unieważnione.
6. Wybrać zestaw demonstracyjny i sprawdzić odtwarzanie istniejącego MP3.

## Decyzja potrzebna od Karola

Przed domknięciem sprintu trzeba wybrać sposób generowania nowych nagrań. Docelowy wariant wymaga usługi TTS wywoływanej przez backend oraz miejsca na pliki audio, najpewniej R2. Obecny mechanizm Edge TTS pozostaje narzędziem do jednorazowego fixture, nie produkcyjnym backendem.

## Akceptacja

Nie domniemywać. Do zapisania po rozmowie: wygoda importu, czytelność biblioteki i edycji, decyzja o TTS oraz wynik próby na iPhonie.
