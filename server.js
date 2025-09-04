// Importer la librairie Express
const express = require('express');
const path = require('path');

// Créer l'application serveur
const app = express();

// Définir le port d'écoute. Render fournira sa propre variable PORT.
const PORT = process.env.PORT || 3000;

// Indiquer à Express que nos fichiers statiques (CSS, JS, images) sont à la racine
app.use(express.static(path.join(__dirname, '/')));

// Route principale pour servir la page d'accueil
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Route pour la page des réalisations
app.get('/realisations', (req, res) => {
    res.sendFile(path.join(__dirname, 'realisations.html'));
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});