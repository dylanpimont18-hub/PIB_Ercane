const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');

// Créer l'application serveur
const app = express();

// Définir le port d'écoute. Render fournira sa propre variable PORT.
const PORT = process.env.PORT || 10000;

const SUPABASE_URL = 'https://bxeooiynucuclnkpqtmd.supabase.co';

// === MIDDLEWARE ===
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            // 'unsafe-inline' requis pour le JSON-LD (script) et le style inline de la bannière hero
            scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net', 'https://cdnjs.cloudflare.com', 'https://www.googletagmanager.com'],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdnjs.cloudflare.com', 'https://cdn.jsdelivr.net'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com'],
            imgSrc: ["'self'", 'data:', 'https:'],
            mediaSrc: ["'self'", SUPABASE_URL],
            connectSrc: ["'self'", SUPABASE_URL, 'https://formspree.io', 'https://www.googletagmanager.com', 'https://www.google-analytics.com', 'https://region1.google-analytics.com'],
            formAction: ["'self'", 'https://formspree.io'],
            objectSrc: ["'none'"],
        },
    },
}));
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