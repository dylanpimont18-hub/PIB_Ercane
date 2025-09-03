const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const { Pool } = require('pg');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

const app = express();

// ---- Configuration de Cloudinary ----
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'pib_ercane',
    format: async (req, file) => 'jpg',
    public_id: (req, file) => file.fieldname + '-' + Date.now(),
  },
});

const upload = multer({ storage: storage }).fields([
    { name: 'photo', maxCount: 1 },
    { name: 'photo_avant', maxCount: 1 },
    { name: 'photo_apres', maxCount: 1 }
]);


// ---- Configuration de la base de données PostgreSQL ----
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// ---- Création de la table si elle n'existe pas ----
const createTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS photos (
      id SERIAL PRIMARY KEY,
      type VARCHAR(20) NOT NULL,
      description TEXT,
      isFeatured BOOLEAN DEFAULT false,
      filename VARCHAR(255),
      file_url TEXT,
      filename_before VARCHAR(255),
      file_url_before TEXT,
      filename_after VARCHAR(255),
      file_url_after TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(query);
    console.log('Table "photos" est prête.');
  } catch (err) {
    console.error('Erreur lors de la création de la table', err.stack);
  }
};
createTable();


// ---- Middlewares ----
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
    secret: process.env.SESSION_SECRET || 'une_cle_secrete_par_defaut',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' } 
}));

const isAuthenticated = (req, res, next) => {
    if (req.session.user) return next();
    res.status(401).send('Accès non autorisé');
};

// ---- Routes API (modifiées pour PostgreSQL) ----

// Obtenir les photos
app.get('/api/photos', async (req, res) => {
    try {
        let query = 'SELECT * FROM photos ORDER BY created_at DESC';
        if (req.query.featured) {
            query = 'SELECT * FROM photos WHERE isFeatured = true ORDER BY created_at DESC';
        }
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Erreur serveur');
    }
});

// Uploader une réalisation
app.post('/api/upload', isAuthenticated, (req, res) => {
    upload(req, res, async (err) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const { description } = req.body;

        try {
            if (req.files['photo']) {
                const photo = req.files['photo'][0];
                const query = `INSERT INTO photos (type, description, filename, file_url) VALUES ($1, $2, $3, $4) RETURNING *`;
                const values = ['single', description, photo.filename, photo.path];
                const result = await pool.query(query, values);
                res.json(result.rows[0]);

            } else if (req.files['photo_avant'] && req.files['photo_apres']) {
                const avant = req.files['photo_avant'][0];
                const apres = req.files['photo_apres'][0];
                const query = `INSERT INTO photos (type, description, filename_before, file_url_before, filename_after, file_url_after) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
                const values = ['before-after', description, avant.filename, avant.path, apres.filename, apres.path];
                const result = await pool.query(query, values);
                res.json(result.rows[0]);
            } else {
                return res.status(400).json({ error: "Fichiers manquants." });
            }
        } catch (dbErr) {
            console.error(dbErr);
            res.status(500).json({ error: "Erreur lors de la sauvegarde en base de données." });
        }
    });
});

// Supprimer une réalisation
app.post('/api/delete/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    try {
        // 1. Récupérer les noms des fichiers à supprimer de Cloudinary
        const findResult = await pool.query('SELECT filename, filename_before, filename_after FROM photos WHERE id = $1', [id]);
        if (findResult.rows.length === 0) {
            return res.status(404).send('Photo non trouvée');
        }
        const photoToDelete = findResult.rows[0];

        // 2. Supprimer les fichiers sur Cloudinary
        if (photoToDelete.filename) cloudinary.uploader.destroy(photoToDelete.filename);
        if (photoToDelete.filename_before) cloudinary.uploader.destroy(photoToDelete.filename_before);
        if (photoToDelete.filename_after) cloudinary.uploader.destroy(photoToDelete.filename_after);

        // 3. Supprimer l'entrée de la base de données
        await pool.query('DELETE FROM photos WHERE id = $1', [id]);
        res.status(200).send('Réalisation supprimée');
    } catch (err) {
        console.error(err);
        res.status(500).send('Erreur serveur');
    }
});

// Mettre en avant une réalisation
app.post('/api/photos/:id/feature', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    const { isFeatured } = req.body;
    try {
        const result = await pool.query('UPDATE photos SET isFeatured = $1 WHERE id = $2 RETURNING *', [isFeatured, id]);
        if (result.rows.length === 0) return res.status(404).send('Photo non trouvée');
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Erreur serveur');
    }
});


// ---- Route pour le formulaire de contact (inchangée) ----
app.post('/send-email', (req, res) => {
    // ... votre code pour nodemailer reste le même ...
});

// ---- Routes d'administration (inchangées) ----
app.post('/admin/login', (req, res) => {
    // ... votre code de login reste le même ...
});
app.post('/admin/logout', (req, res) => {
    // ... votre code de logout reste le même ...
});

// ---- Démarrage du serveur ----
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Serveur en écoute sur http://localhost:${port}`);
});