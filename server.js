// ============================================================================
// SERVEUR DE DÉVELOPPEMENT LOCAL UNIQUEMENT
//
// Le site est hébergé sur GitHub Pages (https://pib-vierzon.fr), qui sert
// directement les fichiers statiques de la branche main. Ce serveur n'est
// donc plus en production : il ne sert qu'à prévisualiser le site en local
// avant de pousser (`npm start`, puis http://localhost:10000).
//
// Attention aux deux différences avec GitHub Pages :
//   - les routes sans extension ci-dessous (/realisations, /admin) n'existent
//     PAS sur Pages : il faut toujours lier realisations.html et admin.html ;
//   - la CSP est appliquée ici par helmet, mais sur Pages c'est la balise
//     <meta http-equiv="Content-Security-Policy"> de chaque page HTML qui
//     l'applique. Toute modification doit être reportée dans les deux.
// ============================================================================

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');

// Créer l'application serveur
const app = express();

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