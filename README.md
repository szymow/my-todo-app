# 📝 Secure ToDo App (JWT Auth + MongoDB)

Nowoczesna i bezpieczna aplikacja do zarządzania zadaniami (To-Do List) zbudowana w architekturze klient-serwer. Projekt wykorzystuje uwierzytelnianie **JWT (JSON Web Tokens)**, bazę danych **MongoDB Atlas** oraz responsywny interfejs **Bootstrap 5** z obsługą trybu ciemnego i powiadomień systemowych.

---

## 📂 Struktura Projektu

```text
/twoj-projekt
│
├── /public
│   └── index.html       # Frontend (HTML, CSS, Vanilla JS)
│
├── .env                 # Zmienne środowiskowe (poufne dane)
├── app.js               # Główny plik serwera (Node.js + Express)
├── package.json         # Zależności projektu
└── README.md            # Dokumentacja projektu


# 🛡️ 1. Uwierzytelnianie i Bezpieczeństwo (JWT & Bcrypt)

Aplikacja chroni dane użytkowników i pozwala im widzieć tylko ich własne zadania.

* **Middleware `auth`:** Sprawdza, czy w nagłówku zapytania (`Authorization`) znajduje się poprawny token JWT. Jeśli tak, dekoduje go, znajduje użytkownika w bazie i "dokleja" go do obiektu zapytania (`req.user = user`). Jeśli tokena nie ma lub jest zły — wyrzuca błąd `401` (Nieautoryzowany).
* **Rejestracja (`/auth/register`):** Pobiera hasło i haszuje je za pomocą biblioteki `bcryptjs` (nie zapisujemy czystych haseł w bazie!), a następnie tworzy konto.
* **Logowanie (`/auth/login`):** Porównuje wpisane hasło z zahaszowanym w bazie danych. Jeśli się zgadzają, generuje token JWT ważny przez 7 dni.

---

# 🗄️ 2. Modele Danych (Baza danych MongoDB)

Na samym dole kodu zdefiniowano dwie kolekcje (tabele):

* **User (Użytkownik):** Zawiera unikalny `username` oraz zahaszowane `password`.
* **Task (Zadanie):** Zawiera tytuł, status wykonania (`completed`), priorytet (`high`, `medium`, `low`), datę wykonania, kategorię oraz najważniejsze: `owner`. Pole `owner` to identyfikator użytkownika (relacja), dzięki czemu zadanie należy do konkretnej osoby.

---

# 🛠️ 3. Połączenie z Bazą i Konfiguracja

Na początku i w środku kodu widzimy próby łączenia z MongoDB Atlas:

* **DNS Google:** Kod ustawia serwery DNS na Google (`8.8.8.8`). Robi się to często w Node.js, gdy lokalny dostawca internetu ma problem z rozwiązaniem adresów serwerów MongoDB Atlas.
* **Wielokrotne połączenia:** W kodzie występuje kilkukrotne wywołanie `mongoose.connect()`. To drobny błąd w kodzie (bałagan) — łączysz się z bazą aż 3 razy w różnych miejscach z różnymi opcjami i komunikatami błędów! Wystarczy połączyć się raz na samym początku.

---

# 🚦 4. Endpointy API (Zarządzanie zadaniami)

Aplikacja udostępnia zestaw operacji CRUD (*Create, Read, Update, Delete*) dla zadań:

### 📥 Pobieranie zadań (`GET /tasks`)
Zabezpieczone przez `auth`. Pobiera z bazy tylko zadania, których właścicielem jest zalogowany użytkownik:
`Task.find({ owner: req.user._id })`.

Kod zawiera też zaawansowane sortowanie po stronie serwera:
1. Najpierw zadania nieukończone.
2. Potem według priorytetu (*High* ➔ *Medium* ➔ *Low*).
3. Na końcu po dacie (te z najbliższym terminem na górze, a te bez daty na samym dole).

### 📤 Dodawanie zadania (`POST /tasks`)
Zabezpieczone przez `auth`. Tworzy nowe zadanie i automatycznie przypisuje je do zalogowanego użytkownika pobranego z tokena.

### ✏️ Edycja i Przełączanie statusu (`PATCH /tasks/:id` oraz `/tasks/:id/toggle`)
Zabezpieczone przez `auth`. Zanim kod cokolwiek zmieni, upewnia się, że zadanie o danym ID należy do Ciebie:
```javascript
const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });

# 🔐 1. System Logowania i Rejestracji (Zarządzanie Widokiem)

Na samym początku plik sprawdza, czy użytkownik jest zalogowany:
* **`checkLogin()`**: Sprawdza, czy w pamięci przeglądarki (`localStorage`) znajduje się klucz token.
  * **Jest token:** Ukrywa panel logowania (`authSection`), pokazuje listę zadań (`todoSection`) i pobiera zadania z bazy danych.
  * **Nie ma tokena:** Pokazuje formularz logowania/rejestracji.
* **`handleAuth(type)`**: Wysyła wpisany login i hasło do Twojego serwera. Przy logowaniu zapisuje otrzymany token do `localStorage`.

---

# 📝 2. Zarządzanie Zadaniami (Operacje CRUD)

W sekcji `<script>` znajdują się funkcje do komunikacji z bazą danych API:
* **`fetchTasks()`**: Pobiera zadania z serwera, dołączając token w nagłówku `Authorization: Bearer token`. Następnie dynamicznie generuje kod HTML dla każdego zadania i rysuje je na ekranie.
* **`handleTaskSubmit()`**: Uniwersalna funkcja zapisu. Jeśli pole ukryte `editTaskId` jest puste — wysyła żądanie `POST` (tworzy nowe zadanie). Jeśli coś tam jest — wysyła żądanie `PATCH` (edytuje stare zadanie).
* **`deleteTask(id)` oraz `toggleTask(id)`**: Usuwają zadanie lub zmieniają jego status (wykonane / niewykonane) za pomocą zapytań asynchronicznych do serwera.

---

# 📊 3. Liczniki i Pasek Postępu

Wewnątrz funkcji `fetchTasks()` zachodzi automatyczna kalkulacja paska postępu:
* Zlicza ile zadań jest ogółem, a ile zostało ukończonych (`completed`).
* Oblicza procent postępu według wzoru: 
  $$\text{procent} = \frac{\text{wykonane}}{\text{ogółem}} \cdot 100\%$$
* Płynnie aktualizuje zielony pasek postępu Bootstrapa (`taskProgressBar`) oraz tekstowy licznik *"Pozostało X z Y"*.

---

# 🎨 4. Filtrowanie Zadań i Wygląd

* **Kategorie i Priorytety:** Zadania dostają kolorowe paski z lewej strony kafelka w zależności od wagi (czerwony dla *High*, żółty dla *Medium*, niebieski dla *Low*).
* **`filterTasks(category, btn)`**: Po kliknięciu np. na przycisk "praca", funkcja przeszukuje kafelki na ekranie i ukrywa te, które nie pasują do wybranej kategorii za pomocą stylów CSS (`display: none`).

---

# 🌙 5. Tryb Ciemny (Dark Mode)

Kod zawiera dynamiczną obsługę motywów:
* Używa natywnych zmiennych CSS (np. `var(--bg-color)`), które zmieniają się podmieniając barwy globalne, gdy na znaczniku `<html>` ląduje atrybut `data-theme="dark"`.
* Wybór użytkownika jest zapisywany w `localStorage`. Dzięki temu po odświeżeniu strony To-Do aplikacja pamięta preferowany styl graficzny.

---

# 🔔 6. Przypomnienia i Powiadomienia (Web Notifications)

To zaawansowana i bardzo przydatna funkcja w Twoim kodzie:
* **`requestNotificationPermission()`**: Prosi użytkownika o zgodę systemową na wysyłanie powiadomień w przeglądarce.
* **`checkDeadlines()`**: Analizuje czasy zadań. Jeśli jakieś zadanie jest nieukończone i ma termin wykonania w ciągu najbliższych 30 minut, przeglądarka wyskakuje z systemowym powiadomieniem push!
* Zastosowano strukturę `Set` o nazwie `notifiedTasks`, aby zapobiec duplikacji i wielokrotnemu wysyłaniu powiadomienia o tym samym zadaniu.

---

# ♻️ 7. Automatyczne Odświeżanie (Polling)

Na samym dole pliku znajduje się interwał czasowy JavaScript `setInterval(...)`. Co 60 sekund przeglądarka pyta serwer: *"Hej, czy zmieniły się jakieś zadania?"* i pobiera je na nowo. Dzięki temu jeśli otworzysz aplikację na telefonie i komputerze jednocześnie, zmiany będą się automatycznie synchronizować między urządzeniami.