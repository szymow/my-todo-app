const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); // Wymusza użycie DNS Google

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

const auth = (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (e) {
        res.status(401).json({ error: "Zaloguj się ponownie" });
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
        // 1. Pobieramy zadania użytkownika
        let tasks = await Task.find({ owner: req.userId });

        // 2. Definiujemy "wagę" dla każdego priorytetu
        const priorityOrder = { 'high': 1, 'medium': 2, 'low': 3 };

        // 3. Sortujemy tablicę
        tasks.sort((a, b) => {
            // Najpierw sortujemy po priorytecie (używając wag)
            const weightA = priorityOrder[a.priority] || 3;
            const weightB = priorityOrder[b.priority] || 3;
            
            if (weightA !== weightB) {
                return weightA - weightB;
            }
            
            // Jeśli priorytety są takie same, opcjonalnie sortujemy po statusie (nieukończone na górze)
            return a.completed - b.completed;
        });

        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: "Błąd pobierania zadań" });
    }
});

// Dodaj nowe zadanie
// 1. Upewnij się, że masz tu 'auth' jako drugi parametr!
app.post('/tasks', auth, async (req, res) => {
    try {
        // Sprawdzamy, czy title istnieje i nie jest tylko spacjami
        if (!req.body.title || req.body.title.trim() === "") {
            return res.status(400).json({ error: "Tytuł zadania nie może być pusty!" });
        }

        const newTask = new Task({
            title: req.body.title,
            priority: req.body.priority || 'low',
            owner: req.userId 
        });

        await newTask.save();
        res.status(201).json(newTask);
    } catch (err) {
        res.status(400).json({ error: "Błąd walidacji" });
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
app.patch('/tasks/:id', async (req, res) => {
    try {
        const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedTask);
    } catch (err) {
        res.status(400).json({ error: "Nie udało się zaktualizować zadania" });
    }
});

// Trasa do przełączania statusu zadania
app.patch('/tasks/:id/toggle', auth, async (req, res) => {
    try {
        // Szukamy zadania należącego do zalogowanego użytkownika
        const task = await Task.findOne({ _id: req.params.id, owner: req.userId });
        if (!task) return res.status(404).json({ error: "Nie znaleziono zadania" });

        // Odwracamy status: jeśli był false, będzie true (i odwrotnie)
        task.completed = !task.completed; 
        await task.save();

        res.json(task);
    } catch (err) {
        res.status(500).json({ error: "Błąd serwera przy zmianie statusu" });
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
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    priority: { 
        type: String, 
        enum: ['high', 'medium', 'low'], 
        default: 'low' 
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
    const user = await User.findOne({ username: req.body.username });
    if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
        return res.status(401).json({ error: "Błędne dane logowania" });
    }
    const token = jwt.sign({ userId: user._id }, JWT_SECRET);
    res.json({ token });
});

