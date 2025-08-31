// server.js

// 1. Importation des modules nécessaires
const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config(); // Charge les variables d'environnement depuis le fichier .env

// 2. Initialisation de l'application Express
const app = express();
const PORT = process.env.PORT || 3000;

// 3. Middlewares pour servir les fichiers statiques et parser les données du formulaire
// Sert les fichiers (HTML, CSS, JS) du dossier 'public'
app.use(express.static(path.join(__dirname, 'public')));
// Permet de lire les données envoyées par le formulaire au format URL-encoded
app.use(express.urlencoded({ extended: true }));
// Permet de lire les données au format JSON
app.use(express.json());


// 4. Création de la route pour gérer la soumission du formulaire
app.post('/send-email', (req, res) => {
    // Récupération des données du corps de la requête (envoyées par le script.js)
    const { name, email, phone, address, "property-type": propertyType, "project-type": projectType, message } = req.body;

    // 5. Configuration du transporteur Nodemailer
    // ATTENTION : Utilisez un service d'e-mail transactionnel (SendGrid, Mailgun) en production
    // Pour le développement, vous pouvez utiliser un compte Gmail avec un "mot de passe d'application"
    const transporter = nodemailer.createTransport({
        service: 'gmail', // ou un autre service SMTP
        auth: {
            user: process.env.EMAIL_USER, // Votre adresse e-mail dans le .env
            pass: process.env.EMAIL_PASS  // Votre mot de passe d'application dans le .env
        }
    });

    // 6. Définition du contenu de l'e-mail
    const mailOptions = {
        from: `"${name}" <${email}>`,
        to: process.env.RECIPIENT_EMAIL, // L'e-mail qui recevra les demandes
        subject: `Nouvelle demande de devis de ${name}`,
        html: `
            <h2>Nouvelle demande de contact depuis le site web</h2>
            <p><strong>Nom :</strong> ${name}</p>
            <p><strong>Email :</strong> ${email}</p>
            <p><strong>Téléphone :</strong> ${phone || 'Non fourni'}</p>
            <p><strong>Adresse du chantier :</strong> ${address || 'Non fournie'}</p>
            <p><strong>Type de bien :</strong> ${propertyType}</p>
            <p><strong>Type de projet :</strong> ${projectType}</p>
            <hr>
            <h3>Message :</h3>
            <p>${message}</p>
        `
    };

    // 7. Envoi de l'e-mail
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error(error);
            // En cas d'erreur, on envoie une réponse avec un statut 500
            res.status(500).json({ message: "Oops! Une erreur s'est produite lors de l'envoi." });
        } else {
            console.log('Email sent: ' + info.response);
            // Si tout s'est bien passé, on envoie une réponse de succès
            res.status(200).json({ message: "Merci pour votre message ! Je vous recontacterai bientôt." });
        }
    });
});


// 8. Démarrage du serveur
app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});