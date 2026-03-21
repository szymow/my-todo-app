const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); // Wymusza użycie DNS Google

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());


const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) throw new Error('Brak tokena');

        const decoded = jwt.verify(token, 'TWOJ_TAJNY_KLUCZ');
        const user = await User.findOne({ _id: decoded._id });

        if (!user) throw new Error();

        req.user = user; // To naprawia błąd "Cannot read properties of undefined"
        next();
    } catch (e) {
        res.status(401).json({ message: 'Zaloguj się ponownie' });
    }
};


// 1. Połączenie z MongoDB (Zastąp URL swoim ze strony Atlas)
const DB_URL = "mongodb+srv://szymow94_db_user:FqsKwnh5pZBNUY6S@cluster0.mofq7og.mongodb.net/?appName=Cluster0"; 

mongoose.connect(DB_URL)
    .then(() => console.log("Połączono z bazą danych! 💾"))
    .catch(err => console.error("Błąd połączenia:", err));


// Ta linia sprawia, że pliki z folderu 'public' są widoczne w przeglądarce
app.use(express.static('public'));

// 3. Endpointy API

// Pobierz wszystkie zadania
app.get('/tasks', auth, async (req, res) => {
    try {
        // 1. POPRAWKA: Używamy req.user._id (zgodnie z Twoim middleware auth)
        // Szukamy tylko zadań należących do zalogowanego użytkownika
        let tasks = await Task.find({ owner: req.user._id });

        // 2. Definiujemy wagę dla priorytetów
        const priorityOrder = { 'high': 1, 'medium': 2, 'low': 3 };

        // 3. Zaawansowane sortowanie
        tasks.sort((a, b) => {
            // A. Najpierw status: Nieukończone (false = 0) przed ukończonymi (true = 1)
            if (a.completed !== b.completed) {
                return a.completed - b.completed;
            }

            // B. Potem priorytet: High (1) przed Low (3)
            const weightA = priorityOrder[a.priority] || 3;
            const weightB = priorityOrder[b.priority] || 3;
            if (weightA !== weightB) {
                return weightA - weightB;
            }

            // C. Na końcu data: Najbliższe terminy na górze
            // Jeśli oba mają daty, porównujemy je
            if (a.dueDate && b.dueDate) {
                return new Date(a.dueDate) - new Date(b.dueDate);
            }
            // Zadania z datą wyżej niż te bez daty
            if (a.dueDate) return -1;
            if (b.dueDate) return 1;

            return 0;
        });

        // Wysyłamy gotową, posortowaną listę
        res.json(tasks);
    } catch (err) {
        console.error("Błąd pobierania zadań:", err);
        res.status(500).json({ error: "Błąd pobierania zadań" });
    }
});

// Dodaj nowe zadanie
// 1. Upewnij się, że masz tu 'auth' jako drugi parametr!
app.post('/tasks', auth, async (req, res) => {
    try {
        console.log("Serwer otrzymał:", req.body); // Sprawdź to w terminalu!

        const task = new Task({
            title: req.body.title,
            priority: req.body.priority || 'low',
            dueDate: req.body.dueDate || null, // PRZYPISANIE DATY
            owner: req.user._id
        });

        await task.save();
        res.status(201).send(task); 
    } catch (err) {
        console.error("Błąd zapisu:", err);
        res.status(400).send(err);
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Serwer działa na porcie ${PORT}`);
});

mongoose.connect(DB_URL, {
    serverSelectionTimeoutMS: 5000 // Szybciej wyrzuci błąd zamiast czekać 30s
})
.then(() => console.log("✅ Sukces! Połączono z MongoDB Atlas"))
.catch(err => {
    console.error("❌ Błąd połączenia z bazą!");
    console.error("Szczegóły:", err.message);
});

mongoose.connect(DB_URL)
  .then(() => {
    console.log("✅ POŁĄCZONO POMYŚLNIE!");
  })
  .catch(err => {
    console.error("❌ NADAL BŁĄD:");
    if (err.message.includes('ECONNREFUSED')) {
        console.log("👉 Twoja sieć lub DNS blokuje połączenie. Spróbuj użyć Hotspotu z telefonu.");
    }
    console.error(err.message);
  });

// Aktualizacja zadania (np. zmiana statusu na wykonane)
app.patch('/tasks/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['title', 'dueDate', 'priority', 'completed'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Nieprawidłowe pola do aktualizacji!' });
    }

    try {
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });

        if (!task) {
            return res.status(404).send();
        }

        updates.forEach((update) => task[update] = req.body[update]);
        await task.save();
        res.send(task);
    } catch (e) {
        res.status(400).send(e);
    }
});

// Trasa do przełączania statusu zadania
// TRASA W app.js
app.patch('/tasks/:id/toggle', auth, async (req, res) => {
    try {
        // Szukamy zadania po ID ORAZ właścicielu (bezpieczeństwo!)
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });

        if (!task) {
            return res.status(404).json({ error: "Nie znaleziono zadania" });
        }

        // Zmieniamy status na przeciwny
        task.completed = !task.completed;
        await task.save();

        res.json(task);
    } catch (e) {
        res.status(500).json({ error: "Błąd serwera podczas aktualizacji" });
    }
});
// Usuwanie zadania
app.delete('/tasks/:id', async (req, res) => {
    try {
        await Task.findByIdAndDelete(req.params.id);
        res.json({ message: "Zadanie usunięte pomyślnie" });
    } catch (err) {
        res.status(400).json({ error: "Błąd podczas usuwania" });
    }
});

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Model Użytkownika
const UserSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true }
});

const User = mongoose.model('User', UserSchema);

// Aktualizacja modelu Zadania (dodajemy pole owner)
const TaskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    completed: { type: Boolean, default: false },
    priority: { type: String, default: 'low' },
    dueDate: { type: Date }, // To już mamy
    owner: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    }
});

const Task = mongoose.model('Task', TaskSchema);

const JWT_SECRET = process.env.JWT_SECRET || 'super-tajny-klucz';

// REJESTRACJA
app.post('/auth/register', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const user = new User({ username: req.body.username, password: hashedPassword });
        await user.save();
        res.status(201).json({ message: "Użytkownik stworzony" });
    } catch (e) {
        res.status(400).json({ error: "Nazwa użytkownika zajęta" });
    }
});

// LOGOWANIE
app.post('/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log("Próba logowania dla:", username);

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: 'Błędny użytkownik lub hasło' });
        }

        // Sprawdzenie hasła (upewnij się, że używasz bcrypt przy rejestracji!)
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Błędny użytkownik lub hasło' });
        }

        // Generowanie tokena - klucz 'SECRET' musi być taki sam w auth
        const token = jwt.sign({ _id: user._id }, 'TWOJ_TAJNY_KLUCZ', { expiresIn: '7d' });

        res.json({ token, username: user.username });
    } catch (err) {
        console.error("BŁĄD LOGOWANIA:", err); // TO WYJAŚNI BŁĄD 500 W TERMINALU
        res.status(500).json({ message: 'Błąd serwera', error: err.message });
    }
});