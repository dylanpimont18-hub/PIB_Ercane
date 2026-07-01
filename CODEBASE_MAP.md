# CODEBASE_MAP.md

Index de navigation du site vitrine PIB (Placo Isolation du Berry).

## server.js
Serveur Express : sert les fichiers statiques (dont admin.html), headers de sécurité via helmet (CSP configurée pour les CDN utilisés + Supabase + Formspree).
- app.get('/') — sert index.html
- app.get('/realisations') — sert realisations.html
- app.get('/admin') — sert admin.html
- app.listen(PORT) — démarre le serveur (port 10000 ou env PORT)

## supabase-config.js
Config partagée (index.html, realisations.html, admin.html) : crée `supabaseClient` (URL + clé anon à renseigner).

## script.js
Comportements front partagés entre les pages (menu, animations, formulaire, galerie, avis).
- initApp() — lance toutes les initialisations au DOMContentLoaded
- loadRealisationsGallery() — charge la table Supabase `projects` (triée par sort_order), génère les cartes galerie, bind Fancybox
- buildProjectMarkup(project) — génère le HTML d'un projet (paire avant/après, vidéo, ou image seule)
- mediaPublicUrl(path) — construit l'URL publique d'un fichier du bucket Supabase `media`
- loadTestimonials() — charge la table Supabase `testimonials` (is_visible=true), remplace les avis codés en dur si le fetch réussit
- initContactForm() — soumission AJAX du formulaire vers Formspree, affiche le statut
- initStickyHeader() — ajoute la classe "scrolled" au header au scroll
- initMobileMenu() — toggle du menu mobile et fermeture au clic sur un lien
- initScrollAnimations() — révèle les éléments ".animate-on-scroll" via IntersectionObserver
- initFloatingButtonObserver() — masque le bouton flottant quand la section contact est visible
- initFancybox() — bind générique de la lightbox Fancybox
- initCookieConsent() — affiche/masque #cookie-banner selon le consentement stocké en localStorage, gère le lien "modifier mes préférences"
- loadGoogleAnalytics() — injecte gtag.js (GA4) uniquement après consentement accepté

## admin.html / admin.css / admin.js
Page d'administration (protégée par Supabase Auth + RLS, pas par obscurité de l'URL) : login, onglets Réalisations / Avis clients.
- initAuth() — vérifie/écoute la session Supabase, bascule login/dashboard
- initLoginForm() / initLogout() — connexion et déconnexion Supabase Auth
- initProjectForm() / loadProjects() / deleteProject() — CRUD réalisations (upload médias vers le bucket `media`, insert/delete en table `projects`)
- initTestimonialForm() / loadTestimonialsAdmin() / deleteTestimonial() — CRUD avis clients (table `testimonials`)

## index.html
Page d'accueil : hero, services, avant/après (statique, dossier photo_pp/, images en `loading="lazy"`), méthode, avis clients dynamiques (section #avis, conteneur #reviews-list rempli via Supabase, secours codé en dur si Supabase indisponible), formulaire de contact (dont surface et upload photo facultatifs, envoyés à Formspree en multipart/form-data), bandeau cookies (#cookie-banner, GA4), SEO (JSON-LD LocalBusiness).

## realisations.html
Page galerie dédiée : conteneur #realisations-gallery rempli dynamiquement par script.js via la table Supabase `projects`, bandeau cookies (#cookie-banner, GA4).

## mentions-legales.html
Page statique de mentions légales (éditeur FIDAN Ercane — entreprise individuelle, SIRET 983 082 595 00015, hébergeur Render, propriété intellectuelle), bandeau cookies (#cookie-banner, GA4).

## politique-confidentialite.html
Page statique de politique de confidentialité RGPD (données du formulaire, Formspree, droits des utilisateurs — contact par téléphone, cookies/GA4 avec lien #cookie-preferences-link pour rouvrir le bandeau), bandeau cookies (#cookie-banner, GA4).

## style.css
Feuille de style unique du site (variables couleurs --primary/--secondary/--accent, BEM, responsive mobile-first), inclut les styles du bandeau cookies (.cookie-banner).

## admin.css
Styles de la page admin (login, onglets, formulaires, listes) — s'appuie sur les variables de style.css.

## docs/supabase-setup.sql
Script SQL à exécuter dans Supabase (tables projects/testimonials, RLS, policies Storage, migration des 6 photos et 4 avis existants).

## package.json
Manifest npm : dépendances (express, cors, helmet) et script `start` → node server.js.

## photo_pp/
Images avant/après utilisées sur la page d'accueil.

## photos_autres/
Photos de chantiers historiques, désormais gérées via le bucket Supabase `media` (voir docs/supabase-setup.sql).
