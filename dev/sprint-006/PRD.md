# Sprint 006 — uruchamianie zestawu z wiersza Biblioteki

Data: 2026-10-18. Właściciel produktu: Karol.

Status: aktywny. Zakres potwierdzony przez Karola; ręczna weryfikacja na iPhonie przed commitem/pushem jest dla tego sprintu pominięta na jego prośbę.

## Potrzeba

Aby uruchomić zestaw z Biblioteki, trzeba go wybrać, a następnie użyć przycisku „Ćwicz” w szczegółach. Na długiej liście wymaga to dodatkowego przejścia i przewijania. Karol chce mieć ikonę uruchamiania przy każdym wierszu zestawu.

## Zakres

- Każdy wiersz zestawu w Bibliotece ma ikonę uruchomienia obok tytułu i metadanych.
- Ikona uruchamia przypisany do wiersza zestaw od początku, przechodząc do widoku Ćwiczeń.
- Przycisk wyboru wiersza i szczegóły zestawu nadal działają niezależnie od ikony uruchomienia.
- Nie uruchamia się brakujące, nieaktualne ani niekompletne audio.
- Zachować dotychczasowy przycisk „Ćwicz” w szczegółach.

## Kryteria akceptacji

1. Każdy wiersz Biblioteki ma osobny, dostępny klawiaturą przycisk z etykietą opisującą uruchamiany zestaw.
2. Uruchomienie z wiersza wybiera właściwy zestaw, otwiera widok Ćwiczeń i rozpoczyna pętlę od początku po przygotowaniu właściwego odtwarzacza.
3. Wiersz można nadal wybrać bez uruchamiania audio.
4. Brak aktualnego audio lub manifestu z osią czasu zgodną z liczbą zdań wyłącza przycisk uruchomienia.
5. Nie są zagnieżdżone przyciski HTML; wybór wiersza i uruchomienie zestawu są osobnymi kontrolkami.
6. Przycisk „Ćwicz” w szczegółach nadal przechodzi do widoku Ćwiczeń zgodnie z dotychczasowym zachowaniem.
7. Build aplikacji kończy się powodzeniem; wynik lintowania jest odnotowany w wyniku sprintu. Ręczny test iPhone'a nie jest wymagany w tym sprincie na wyraźną prośbę Karola z 2026-10-18.

## Decyzje implementacyjne

- Kliknięcie ikony zaznacza zestaw i przechodzi do widoku Ćwiczeń; odtwarzanie startuje dopiero po aktualizacji wybranego zestawu, aby nie użyć stanu audio poprzedniej sesji.
- Użyć istniejącej pętli odtwarzacza oraz złożonego audio zestawu. Nie wprowadzać osobnego kanału odtwarzania.
- Ikona ma dostępny opis zawierający tytuł zestawu; przycisk jest wyłączony, jeśli audio lub manifest nie są aktualne/kompletne.
