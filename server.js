const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// ---- Middlewares ----
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// ---- Configuration de la session (Version corrigée pour le déploiement) ----
app.use(session({
    secret: process.env.SESSION_SECRET || 'une_cle_secrete_par_defaut',
    resave: false,
    saveUninitialized: true,
    // En production (HTTPS), le cookie doit être sécurisé.
    cookie: { secure: process.env.NODE_ENV === 'production' } 
}));

// ---- Configuration de Multer pour l'upload de fichiers ----
const storage = multer.diskStorage({
    destination: './public/images/realisations',
    filename: function(req, file, cb){
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage }).fields([
    { name: 'photo', maxCount: 1 },
    { name: 'photo_avant', maxCount: 1 },
    { name: 'photo_apres', maxCount: 1 }
]);

// ---- Chemin vers notre "base de données" JSON ----
const photosDbPath = path.join(__dirname, 'photos.json');
const uploadDir = path.join(__dirname, 'public', 'images', 'realisations');


// Assurer que le dossier d'upload et le fichier JSON existent
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(photosDbPath)) fs.writeFileSync(photosDbPath, '[]');

// ---- Middleware pour protéger les routes admin ----
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    res.status(401).send('Accès non autorisé');
};

// ---- Routes API publiques ----
app.get('/api/photos', (req, res) => {
    fs.readFile(photosDbPath, (err, data) => {
        if (err) return res.status(500).send('Erreur serveur');
        let photos = JSON.parse(data.toString() || '[]');
        if (req.query.featured) {
            photos = photos.filter(p => p.isFeatured);
        }
        res.json(photos);
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
        to: 'dylan.pimont18@gmail.com',
        subject: 'Nouveau message depuis le formulaire de contact',
        text: `Vous avez reçu un nouveau message de :
        Nom: ${nom}
        Prénom: ${prenom}
        Téléphone: ${telephone}
        Email: ${email}
        
        Message:
        ${message}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
            res.status(500).send('Une erreur est survenue lors de l\'envoi de l\'e-mail.');
        } else {
            console.log('Email sent: ' + info.response);
            res.status(200).send('E-mail envoyé avec succès !');
        }
    });
});

// ---- Routes d'Administration ----
app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
        req.session.user = { username: username };
        res.status(200).json({ message: 'Connexion réussie' });
    } else {
        res.status(401).json({ message: 'Identifiants incorrects' });
    }
});

app.post('/admin/logout', (req, res) => {
    req.session.destroy();
    res.status(200).send('Déconnexion réussie');
});

// Route d'upload
app.post('/api/upload', isAuthenticated, (req, res) => {
    upload(req, res, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const photos = JSON.parse(fs.readFileSync(photosDbPath));
        const description = req.body.description || '';
        let newEntry;

        if (req.files['photo']) {
            newEntry = {
                id: Date.now(),
                type: 'single',
                filename: req.files['photo'][0].filename,
                description: description,
                isFeatured: false
            };
        } else if (req.files['photo_avant'] && req.files['photo_apres']) {
            newEntry = {
                id: Date.now(),
                type: 'before-after',
                filename_before: req.files['photo_avant'][0].filename,
                filename_after: req.files['photo_apres'][0].filename,
                description: description,
                isFeatured: false
            };
        } else {
            return res.status(400).json({ error: "Fichiers manquants." });
        }
        
        photos.push(newEntry);
        fs.writeFileSync(photosDbPath, JSON.stringify(photos, null, 2));
        res.json(newEntry);
    });
});

// Route de suppression
app.post('/api/delete/:id', isAuthenticated, (req, res) => {
    const id = parseInt(req.params.id, 10);
    let photos = JSON.parse(fs.readFileSync(photosDbPath));
    const photoToDelete = photos.find(p => p.id === id);

    if (!photoToDelete) return res.status(404).send('Photo non trouvée');

    try {
        if (photoToDelete.type === 'single') {
            const filePath = path.join(uploadDir, photoToDelete.filename);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } else {
            const filePathBefore = path.join(uploadDir, photoToDelete.filename_before);
            if (fs.existsSync(filePathBefore)) fs.unlinkSync(filePathBefore);
            
            const filePathAfter = path.join(uploadDir, photoToDelete.filename_after);
            if (fs.existsSync(filePathAfter)) fs.unlinkSync(filePathAfter);
        }
    } catch (e) {
        console.error("Erreur suppression fichier:", e);
    }
    
    const updatedPhotos = photos.filter(photo => photo.id !== id);
    fs.writeFileSync(photosDbPath, JSON.stringify(updatedPhotos, null, 2));
    res.status(200).send('Réalisation supprimée');
});

// Route pour mettre à jour isFeatured
app.post('/api/photos/:id/feature', isAuthenticated, (req, res) => {
    const id = parseInt(req.params.id, 10);
    const { isFeatured } = req.body;

    let photos = JSON.parse(fs.readFileSync(photosDbPath));
    const photoIndex = photos.findIndex(p => p.id === id);

    if (photoIndex === -1) return res.status(404).send('Photo non trouvée');

    photos[photoIndex].isFeatured = isFeatured;
    fs.writeFileSync(photosDbPath, JSON.stringify(photos, null, 2));
    res.status(200).json(photos[photoIndex]);
});

// ---- Démarrage du serveur (Version corrigée pour le déploiement) ----
// L'hébergeur fournit le port via process.env.PORT. En local, on garde 3000.
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Serveur en écoute sur http://localhost:${port}`);
});