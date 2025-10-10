const express = require('express');
const path = require('path');
const fs = require('fs');
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

// === NOUVELLE ROUTE API POUR LIRE LES PHOTOS ===
app.get('/api/photos', (req, res) => {
    const photosDir = path.join(__dirname, 'photos_autres');

    fs.readdir(photosDir, (err, files) => {
        if (err) {
            console.error("Impossible de lire le dossier photos_autres:", err);
            return res.status(500).json({ error: "Erreur interne du serveur." });
        }
        // On filtre pour ne garder que les fichiers images courants
        const imageFiles = files.filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file));
        res.json(imageFiles);
    });
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});