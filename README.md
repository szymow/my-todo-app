# 📝 Advanced Todo App

Nowoczesna aplikacja do zarządzania zadaniami zbudowana w architekturze **Fullstack** (Node.js + MongoDB + Vanilla JS). Projekt skupia się na przejrzystym interfejsie użytkownika (UX) oraz płynnych animacjach.

## 🚀 Główne Funkcje

* **System Autoryzacji**: Bezpieczne logowanie i rejestracja z użyciem **JSON Web Token (JWT)** oraz szyfrowania haseł (bcrypt).
* **Zarządzanie Zadaniami**: Dodawanie, usuwanie oraz oznaczanie zadań jako ukończone.
* **System Priorytetów**: Wizualne rozróżnienie zadań (Wysoki, Średni, Niski) za pomocą kolorowych krawędzi.
* **Inteligentne Sortowanie**: Zadania o najwyższym priorytecie automatycznie pojawiają się na górze listy.
* **Pasek Postępu & Statystyki**: Dynamiczny licznik (np. "Pozostało 3 z 5") oraz pasek postępu zmieniający kolor po ukończeniu wszystkich zadań.
* **Dynamiczny UI**: 
    * Przycisk "Dodaj" pulsuje, gdy pole jest puste.
    * Zadania pojawiają się z płynną animacją "fade-in" (Animate.css).

## 🛠️ Technologia

* **Backend**: Node.js, Express.js
* **Baza danych**: MongoDB (Mongoose)
* **Frontend**: HTML5, CSS3 (Bootstrap 5), JavaScript (Vanilla ES6+)
* **Animacje**: Animate.css

## 📦 Instalacja i Uruchomienie

1. Sklonuj repozytorium:
   ```bash
   git clone [https://github.com/TWOJA-NAZWA/todo-app.git](https://github.com/TWOJA-NAZWA/todo-app.git)

   ## 🚀 Plany na przyszłość (Roadmap)

Projekt jest stale rozwijany. W najbliższych iteracjach planowane jest wdrożenie następujących funkcjonalności:

* **🌓 Tryb Ciemny (Dark Mode)**: Pełne wsparcie dla ciemnego motywu, przełączane ręcznie lub dostosowujące się do ustawień systemowych.
* **📅 Terminy realizacji (Due Dates)**: Możliwość wyznaczania daty i godziny zakończenia zadania wraz z wizualnym ostrzeżeniem o zbliżającym się terminie.
* **📂 Kategorie i Tagi**: Grupowanie zadań (np. Praca, Dom, Zakupy) dla lepszej organizacji i łatwiejszego filtrowania.
* **🖱️ Przeciągnij i Upuść (Drag & Drop)**: Intuicyjna zmiana kolejności zadań na liście za pomocą myszki lub dotyku.
* **🔍 Zaawansowane Wyszukiwanie**: Szybkie odnajdywanie zadań po słowach kluczowych oraz filtrowanie widoku (tylko ukończone / tylko aktywne).
* **🔔 Powiadomienia Web Push**: Przypomnienia o ważnych zadaniach wysyłane bezpośrednio do przeglądarki użytkownika.