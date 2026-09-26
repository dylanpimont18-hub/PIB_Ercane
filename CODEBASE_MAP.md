# CODEBASE_MAP.md

Index de navigation du site vitrine PIB (Placo Isolation du Berry).

## server.js
**Serveur de développement local uniquement** — le site est hébergé sur GitHub Pages, qui sert les fichiers statiques de `main` sans passer par Express. Lancé avec `npm start` pour prévisualiser en local.
Deux écarts avec la production à garder en tête : les routes sans extension ci-dessous n'existent pas sur Pages (toujours lier `realisations.html` / `admin.html`), et la CSP appliquée ici par helmet est doublée par la balise `<meta http-equiv="Content-Security-Policy">` de chaque page HTML — toute modification doit être reportée dans les deux.
- app.get('/') — sert index.html
- app.get('/realisations') — sert realisations.html
- app.get('/admin') — sert admin.html
- app.listen(PORT) — démarre le serveur (port 10000 ou env PORT)

## CNAME
Domaine personnalisé lu par GitHub Pages : `pib-vierzon.fr` (sans protocole ni slash). Ne pas supprimer — GitHub le réécrit depuis Settings > Pages > Custom domain.

## .nojekyll
Fichier vide qui désactive le traitement Jekyll sur GitHub Pages (déploiement plus rapide, pas d'exclusion des dossiers commençant par `_`).

## README.md
Documentation d'hébergement : procédure de déploiement (push sur `main`), développement local, réglages GitHub Pages, table des enregistrements DNS à saisir chez Hostinger, et précautions sur la page admin.

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
Page d'accueil : hero (titre + badge zone, voile sombre géré en CSS — pas de `style` inline), présentation de l'entreprise (#a-propos : texte éditorial + 4 chiffres clés dont « 15 ans » mis en avant, aucun nom de personne à la demande du client), services (6 cartes avec vocabulaire métier pour le SEO), avant/après (statique, dossier photo_pp/, images en `loading="lazy"`), méthode, zone d'intervention (#zone-intervention : ~45 communes dans un rayon de 50 km groupées en 4 secteurs + encart d'appel), réassurance (.trust, 4 cartes), avis clients dynamiques (section #avis, conteneur #reviews-list rempli via Supabase, secours codé en dur si Supabase indisponible), formulaire de contact (dont surface et upload photo facultatifs, envoyés à Formspree en multipart/form-data), bandeau cookies (#cookie-banner, GA4), SEO (title/description/keywords orientés plaquiste-placo-isolation-combles + Vierzon, JSON-LD LocalBusiness `@id` `https://pib-vierzon.fr/#entreprise` (référencé par les pages services) avec adresse complète, `areaServed` listant 29 villes, `hasOfferCatalog` de 5 services et `knowsAbout`), FAQ (#faq, 5 questions en `<details>` + JSON-LD FAQPage à garder identique au texte visible), liens « En savoir plus » des cartes services vers les pages services, préchargement de banniere.jpg (LCP).
Ton rédactionnel : « nous » partout (jamais « je »), et les 15 ans sont toujours rattachés au métier (« 15 ans d'expérience dans le bâtiment et la rénovation »), jamais à l'ancienneté de la société — le SIRET date de 2023.

## Pages services (pose-placo-vierzon.html, isolation-interieure-vierzon.html, amenagement-combles-vierzon.html, faux-plafond-vierzon.html, plaquiste-bourges.html)
Landing pages SEO statiques (une requête cible chacune : « pose placo Vierzon », « isolation intérieure Vierzon », « aménagement combles Vierzon », « faux plafond Vierzon », « plaquiste Bourges »). Même gabarit : fil d'Ariane, h1 + chapeau + CTA, article `.service-page` (h2/h3, photos photo_pp/), bandeau `.cta-band`, FAQ `<details>`, bloc « Nos autres services » (maillage interne), footer 4 colonnes, bandeau cookies. JSON-LD Service (provider = `#entreprise`) + BreadcrumbList + FAQPage. Pas de Supabase ni Fancybox : seul script.js est chargé. Contenu rédigé sans prix, certification ni garantie inventés.

## 404.html
Page d'erreur servie par GitHub Pages pour toute URL inconnue (statut 404, `noindex`). Tous les chemins sont absolus (`/style.css`, `/`) car elle peut s'afficher à n'importe quelle profondeur d'URL. Générée depuis le gabarit des pages services.

## realisations.html
Page galerie dédiée : conteneur #realisations-gallery rempli dynamiquement par script.js via la table Supabase `projects`, bandeau cookies (#cookie-banner, GA4).

## mentions-legales.html
Page statique de mentions légales (éditeur FIDAN Ercane — entreprise individuelle, SIRET 983 082 595 00015, hébergeur GitHub Pages, propriété intellectuelle, crédit conception Sparklearning), bandeau cookies (#cookie-banner, GA4).

## politique-confidentialite.html
Page statique de politique de confidentialité RGPD (données du formulaire, Formspree, droits des utilisateurs — contact par téléphone, cookies/GA4 avec lien #cookie-preferences-link pour rouvrir le bandeau), bandeau cookies (#cookie-banner, GA4).

## style.css
Feuille de style unique du site (variables couleurs --primary-color/--secondary-color/--accent-color, BEM, responsive mobile-first), inclut les styles du bandeau cookies (.cookie-banner).
Sections 9 à 11 (fin de fichier) : #a-propos (.about__grid 2 colonnes ≥1024px, .about__stats en grille sticky, .about-stat--highlight = bloc brun « 15 ans »), #zone-intervention (.zone__grid 1/2/4 colonnes, .zone-card, .zone__note), .hero__badge, .footer__services, et le resserrement de .nav__list entre 768 et 1100px (la nav compte 7 entrées).
Section 12 (fin de fichier) : pages services (.breadcrumb, .page-header__lead/__actions, .service-page, .service-page__figure(--single), .faq/.faq__item, .cta-band, .related-services, .service-card__link). Footer en 4 colonnes (brand, contact, Nos services, navigation) sur toutes les pages publiques.

## admin.css
Styles de la page admin (login, onglets, formulaires, listes) — s'appuie sur les variables de style.css.

## docs/supabase-setup.sql
Script SQL à exécuter dans Supabase (tables projects/testimonials, RLS, policies Storage, migration des 6 photos et 4 avis existants).

## sitemap.xml
Plan de site soumis à Google : 7 URLs indexables (accueil sur `/` pour coller au canonical, 5 pages services, réalisations). Les pages en `noindex` (mentions, confidentialité, admin) n'y figurent pas avec `lastmod` et `changefreq`. À réactualiser (`lastmod`) à chaque refonte de contenu.

## robots.txt
Autorise tous les robots et pointe vers sitemap.xml.

## package.json
Manifest npm : dépendances (express, cors, helmet) et script `start` → node server.js.

## banniere.jpg / favicon.png / apple-touch-icon.png
Image du hero et d'Open Graph (JPEG ~100 Ko, remplace l'ancien PNG de 1,4 Mo), favicon carré 192×192 et icône iOS 180×180 recadrés depuis le logo.

## photo_pp/
Images avant/après utilisées sur la page d'accueil.

## photos_autres/
Photos de chantiers historiques, désormais gérées via le bucket Supabase `media` (voir docs/supabase-setup.sql).

## prototypes/
Maquettes autonomes de refonte (non liées au site en production, aucune dépendance : CSS et JS inline, images depuis `../photo_pp/`). Charte conservée à l'identique (#8B5A2B / #E87E5A / #F5F5F3, Poppins + Lato).
- proto-1-editorial.html — direction « Éditorial » : fond crème, titres XXL, grille asymétrique, sections numérotées, bande d'avis sombre
- proto-2-immersif.html — direction « Immersif » : fond sombre, hero plein écran avec parallaxe, slider avant/après au pointeur, timeline sticky, bande d'avis claire. Section #projections (rendus 3D, badges « Vue d'artiste » + mention de non-réalisation) tenue séparée de #realisations (vraies photos)
- proto-3-atelier.html — direction « Atelier » : bento grid sur 6 colonnes, nav flottante en pilule, tuiles tactiles, densité conversion (CTA accent + formulaire)

## rendus/
Rendus 3D d'aménagement générés via `~/Desktop/mammouth-image-gen/generer_image.py` (modèle gemini-2.5-flash-image), utilisés uniquement comme vues d'artiste explicitement libellées — jamais présentés comme des chantiers réalisés, jamais post-traités pour masquer leur origine.
- rendu-combles.jpg — combles aménagés sous rampants
- rendu-niche-tv.jpg — cloison avec niche TV et étagères LED
- rendu-faux-plafond.jpg — faux plafond à décrochement, gorge lumineuse
- rendu-salle-eau.jpg — salle d'eau, cloison hydrofuge et plafond suspendu
