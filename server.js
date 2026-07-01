const express = require('express');
const path = require('path');
const cors = require('cors');

// Créer l'application serveur
const app = express();

// Définir le port d'écoute. Render fournira sa propre variable PORT.
const PORT = process.env.PORT || 10000;

// === MIDDLEWARE ===
app.use(cors());
app.use(express.static(path.join(__dirname, '/')));

// === ROUTES HTML ===
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/realisations', (req, res) => {
    res.sendFile(path.join(__dirname, 'realisations.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});