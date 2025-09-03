const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config();

// --- INITIALISATION ---
const app = express();
const port = process.env.PORT || 3000;

// --- MIDDLEWARES ---
// Pour servir les fichiers statiques (HTML, CSS, JS, images) du dossier 'public'
app.use(express.static(path.join(__dirname, 'public')));
// Pour lire les données JSON envoyées par le formulaire de contact
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// --- UNIQUE ROUTE : ENVOI D'E-MAIL ---

app.post('/send-email', (req, res) => {
    // Récupération des données du formulaire
    const { nom, prenom, telephone, email, message } = req.body;

    // Configuration du transporteur d'e-mail (via Gmail dans ce cas)
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER, // Votre adresse e-mail dans .env
            pass: process.env.EMAIL_PASS  // Votre mot de passe d'application dans .env
        }
    });

    // Contenu de l'e-mail
    const mailOptions = {
        from: `"${nom} ${prenom}" <${email}>`,
        to: process.env.EMAIL_RECEIVER, // L'adresse qui reçoit l'e-mail
        subject: 'Nouveau message depuis le site PIB Ercane',
        text: `Message de : ${nom} ${prenom}\nTéléphone: ${telephone}\nEmail: ${email}\n\nMessage:\n${message}`
    };

    // Envoi de l'e-mail
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
    console.log(`Serveur léger en écoute sur http://localhost:${port}`);
});