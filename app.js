const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); // Wymusza użycie DNS Google

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

// 1. Połączenie z MongoDB (Zastąp URL swoim ze strony Atlas)
const DB_URL = "mongodb+srv://szymow94_db_user:FqsKwnh5pZBNUY6S@cluster0.mofq7og.mongodb.net/?appName=Cluster0"; 

mongoose.connect(DB_URL)
    .then(() => console.log("Połączono z bazą danych! 💾"))
    .catch(err => console.error("Błąd połączenia:", err));

// 2. Definicja Schematu (Struktura danych)
const TaskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    completed: { type: Boolean, default: false } // To pole będzie przechowywać status
});

const Task = mongoose.model('Task', TaskSchema);

// Ta linia sprawia, że pliki z folderu 'public' są widoczne w przeglądarce
app.use(express.static('public'));

// 3. Endpointy API

// Pobierz wszystkie zadania
app.get('/tasks', async (req, res) => {
    // Sortujemy od najnowszych (-1 oznacza malejąco po ID)
    const tasks = await Task.find().sort({ _id: -1 });
    res.json(tasks);
});

// Dodaj nowe zadanie
app.post('/tasks', async (req, res) => {
    const newTask = new Task(req.body);
    await newTask.save();
    res.status(201).json(newTask);
});

app.listen(3000, () => console.log('Serwer działa na porcie 3000'));

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
app.patch('/tasks/:id/toggle', async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        task.completed = !task.completed; // Odwracamy obecny stan
        await task.save();
        res.json(task);
    } catch (err) {
        res.status(400).json({ error: "Błąd podczas zmiany statusu" });
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