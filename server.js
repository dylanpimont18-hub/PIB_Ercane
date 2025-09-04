// Importation des librairies nécessaires
const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs'); // <--- Module ajouté pour lire les fichiers

// Charge les variables d'environnement depuis le fichier .env en développement
require('dotenv').config();

// Créer l'application serveur
const app = express();

// Définir le port d'écoute. Render fournira sa propre variable PORT.
const PORT = process.env.PORT || 3000;

// === MIDDLEWARE ===
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
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

// === ROUTE API POUR LE FORMULAIRE ===
app.post('/send-email', (req, res) => {
    console.log('Requête reçue sur /send-email');
    console.log('Données du formulaire :', req.body);

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: `"${req.body.name}" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_TO,
        replyTo: req.body.email,
        subject: `Nouveau message de ${req.body.name} via le site web`,
        html: `
            <h2>Nouvelle demande de devis de : ${req.body.name}</h2>
            <p><strong>Email :</strong> <a href="mailto:${req.body.email}">${req.body.email}</a></p>
            <p><strong>Téléphone :</strong> ${req.body.phone}</p>
            <p><strong>Adresse du chantier :</strong> ${req.body.address}</p>
            <p><strong>Type de bien :</strong> ${req.body['property-type']}</p>
            <p><strong>Type de projet :</strong> ${req.body['project-type']}</p>
            <hr>
            <h3>Message :</h3>
            <p style="white-space: pre-wrap;">${req.body.message}</p>
        `
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Erreur lors de l\'envoi de l\'e-mail:', error);
            return res.status(500).json({ success: false, message: "Erreur lors de l'envoi de l'e-mail." });
        }
        console.log('E-mail envoyé:', info.response);
        res.status(200).json({ success: true, message: 'Votre message a bien été envoyé !' });
    });
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});