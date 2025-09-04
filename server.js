const express = require('express');
const session = require('express-session');
const multer = require('multer'); // CORRECTION APPLIQUÉE ICI
const path = require('path');
const { Pool } = require('pg');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const nodemailer = require('nodemailer');
require('dotenv').config();

// --- INITIALISATION ET CONFIGURATION ---
const app = express();
const port = process.env.PORT || 3000;

// Configuration de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Configuration du stockage des images avec Multer et Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'pib_ercane_realisations',
    format: 'webp',
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }],
  },
});

const upload = multer({ storage }).fields([
    { name: 'photo', maxCount: 1 },
    { name: 'photo_avant', maxCount: 1 },
    { name: 'photo_apres', maxCount: 1 }
]);

// Configuration de la base de données PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Création automatique de la table "photos" au démarrage
const createPhotosTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS photos (
      id SERIAL PRIMARY KEY,
      type VARCHAR(20) NOT NULL,
      description TEXT,
      is_featured BOOLEAN DEFAULT false,
      image_url_single TEXT,
      image_public_id_single TEXT,
      image_url_before TEXT,
      image_public_id_before TEXT,
      image_url_after TEXT,
      image_public_id_after TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(query);
    console.log('Table "photos" est prête.');
  } catch (err) {
    console.error('Erreur lors de la création de la table photos:', err);
  }
};

// --- MIDDLEWARES ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: process.env.SESSION_SECRET || 'un-super-secret-pour-le-developpement',
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 heures
    } 
}));

// Middleware pour vérifier si l'utilisateur est authentifié
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    res.status(401).json({ error: 'Accès non autorisé' });
};

// --- ROUTES API ---

// [GET] Récupérer toutes les réalisations (ou seulement celles en vedette)
app.get('/api/photos', async (req, res) => {
    try {
        let query = 'SELECT id, type, description, is_featured, image_url_single, image_url_before, image_url_after FROM photos ORDER BY created_at DESC';
        if (req.query.featured === 'true') {
            query = 'SELECT id, type, description, is_featured, image_url_single, image_url_before, image_url_after FROM photos WHERE is_featured = true ORDER BY created_at DESC';
        }
        const { rows } = await pool.query(query);
        res.status(200).json(rows);
    } catch (err) {
        console.error('Erreur API [GET /api/photos]:', err);
        res.status(500).json({ error: 'Erreur serveur lors de la récupération des photos.' });
    }
});

// [POST] Ajouter une nouvelle réalisation
app.post('/api/upload', isAuthenticated, upload, async (req, res) => {
    const { description, uploadType } = req.body;
    try {
        let query, values;
        if (uploadType === 'single' && req.files.photo) {
            const { path: url, filename: public_id } = req.files.photo[0];
            query = `INSERT INTO photos (type, description, image_url_single, image_public_id_single) VALUES ($1, $2, $3, $4) RETURNING *;`;
            values = ['single', description, url, public_id];
        } else if (uploadType === 'before-after' && req.files.photo_avant && req.files.photo_apres) {
            const { path: url_before, filename: public_id_before } = req.files.photo_avant[0];
            const { path: url_after, filename: public_id_after } = req.files.photo_apres[0];
            query = `INSERT INTO photos (type, description, image_url_before, image_public_id_before, image_url_after, image_public_id_after) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;`;
            values = ['before-after', description, url_before, public_id_before, url_after, public_id_after];
        } else {
            return res.status(400).json({ error: "Fichiers manquants pour l'upload." });
        }
        const { rows } = await pool.query(query, values);
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('Erreur API [POST /api/upload]:', err);
        if (req.files.photo) cloudinary.uploader.destroy(req.files.photo[0].filename);
        if (req.files.photo_avant) cloudinary.uploader.destroy(req.files.photo_avant[0].filename);
        if (req.files.photo_apres) cloudinary.uploader.destroy(req.files.photo_apres[0].filename);
        res.status(500).json({ error: 'Erreur serveur lors de l\'ajout de la réalisation.' });
    }
});

// [POST] Supprimer une réalisation
app.post('/api/delete/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    try {
        const findResult = await pool.query('SELECT image_public_id_single, image_public_id_before, image_public_id_after FROM photos WHERE id = $1', [id]);
        if (findResult.rows.length === 0) return res.status(404).json({ error: 'Photo non trouvée.' });
        
        const idsToDelete = Object.values(findResult.rows[0]).filter(Boolean);
        await pool.query('DELETE FROM photos WHERE id = $1', [id]);
        if (idsToDelete.length > 0) await cloudinary.api.delete_resources(idsToDelete);
        
        res.status(200).json({ message: 'Réalisation supprimée avec succès.' });
    } catch (err) {
        console.error(`Erreur API [POST /api/delete/${id}]:`, err);
        res.status(500).json({ error: 'Erreur serveur lors de la suppression.' });
    }
});

// [POST] Mettre à jour le statut "en vedette"
app.post('/api/photos/:id/feature', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    const { isFeatured } = req.body;
    try {
        const { rows } = await pool.query('UPDATE photos SET is_featured = $1 WHERE id = $2 RETURNING *', [isFeatured, id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Photo non trouvée.' });
        res.status(200).json(rows[0]);
    } catch (err) {
        console.error(`Erreur API [POST /api/photos/${id}/feature]:`, err);
        res.status(500).json({ error: 'Erreur serveur lors de la mise à jour.' });
    }
});

// --- ROUTES ADMIN ET CONTACT ---

app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
        req.session.user = { username: username, loggedIn: true };
        res.status(200).json({ message: 'Connexion réussie' });
    } else {
        res.status(401).json({ error: 'Identifiants incorrects' });
    }
});

app.post('/admin/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ error: 'Déconnexion impossible.' });
        res.clearCookie('connect.sid');
        res.status(200).json({ message: 'Déconnexion réussie' });
    });
});

app.post('/send-email', (req, res) => {
    const { nom, prenom, telephone, email, message } = req.body;
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
    const mailOptions = {
        from: `"${nom} ${prenom}" <${email}>`,
        to: process.env.EMAIL_RECEIVER,
        subject: 'Nouveau message depuis le site PIB Ercane',
        text: `Message de : ${nom} ${prenom}\nTéléphone: ${telephone}\nEmail: ${email}\n\nMessage:\n${message}`
    };
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Erreur Nodemailer:', error);
            return res.status(500).json({ error: "Une erreur est survenue lors de l'envoi de l'e-mail." });
        }
        res.status(200).json({ message: 'E-mail envoyé avec succès !' });
    });
});

// --- DÉMARRAGE DU SERVEUR ---
app.listen(port, () => {
    console.log(`Serveur en écoute sur http://localhost:${port}`);
    createPhotosTable();
});