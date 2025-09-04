// Importation des librairies nécessaires
const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors');

// Charge les variables d'environnement depuis le fichier .env en développement
require('dotenv').config();

// Créer l'application serveur
const app = express();

// Définir le port d'écoute. Render fournira sa propre variable PORT.
const PORT = process.env.PORT || 3000;

// === MIDDLEWARE ===
// Active CORS pour autoriser les requêtes entre le client et le serveur
app.use(cors());
// Parse les données du formulaire (pour req.body)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Indiquer à Express que nos fichiers statiques (CSS, JS, images) sont à la racine
app.use(express.static(path.join(__dirname, '/')));

// === ROUTES HTML ===
// Route principale pour servir la page d'accueil
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Route pour la page des réalisations
app.get('/realisations', (req, res) => {
    res.sendFile(path.join(__dirname, 'realisations.html'));
});

// === ROUTE API POUR LE FORMULAIRE ===
app.post('/send-email', (req, res) => {
    console.log('Requête reçue sur /send-email');
    console.log('Données du formulaire :', req.body);

    // Configuration du transporteur d'e-mail avec Nodemailer
    // Utilise les variables d'environnement (sécurisé)
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST, // ex: 'smtp.gmail.com'
        port: process.env.EMAIL_PORT,       // ex: 465
        secure: true,                 // true pour le port 465, false pour les autres
        auth: {
            user: process.env.EMAIL_USER, // Votre adresse e-mail
            pass: process.env.EMAIL_PASS  // Le mot de passe d'application
        }
    });

    // Création du contenu de l'e-mail
    const mailOptions = {
        from: "" <>, // L'expéditeur sera vous, mais avec le nom du client
        to: process.env.EMAIL_TO, // L'adresse qui reçoit l'e-mail (vous)
        replyTo: req.body.email, // Pour que le bouton "Répondre" fonctionne
        subject: Nouveau message de  via le site web,
        html: 
            <h2>Nouvelle demande de devis de : </h2>
            <p><strong>Email :</strong> <a href="mailto:"></a></p>
            <p><strong>Téléphone :</strong> </p>
            <p><strong>Adresse du chantier :</strong> </p>
            <p><strong>Type de bien :</strong> </p>
            <p><strong>Type de projet :</strong> </p>
            <hr>
            <h3>Message :</h3>
            <p style="white-space: pre-wrap;"></p>
        
    };

    // Envoi de l'e-mail
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
    console.log(Serveur démarré sur le port );
});
