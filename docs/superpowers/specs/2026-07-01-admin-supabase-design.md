# Page admin Supabase — gestion des réalisations et des avis clients

## Contexte

Le site PIB est un site statique (HTML/CSS/JS) + backend Express minimal, déployé sur Render. La galerie de réalisations (`realisations.html`) charge la liste des photos depuis un fichier statique `photos.json`, qui doit être édité manuellement à chaque nouvelle photo — alors qu'une route `/api/photos` existe déjà côté serveur mais n'est pas utilisée. Les avis clients affichés sur la homepage sont des cartes codées en dur dans `index.html`.

Render utilise un système de fichiers éphémère : tout fichier écrit dynamiquement sur le disque du serveur (ex. upload direct) disparaîtrait au redéploiement. Une page d'administration permettant d'ajouter/supprimer photos, vidéos et avis nécessite donc un stockage persistant externe — d'où le choix de Supabase (Storage + Postgres + Auth).

## Objectif

Créer une page admin (`admin.html`) permettant à plusieurs comptes authentifiés de :
- gérer les réalisations (projets avec photos avant/après, photo seule, ou vidéo)
- gérer les avis clients affichés sur la homepage

Et faire en sorte que le site public (`realisations.html`, `index.html`) affiche ce contenu dynamiquement depuis Supabase, en remplacement du contenu actuellement statique/codé en dur.

## Architecture retenue : accès direct Supabase côté client

Le site public et la page admin utilisent le SDK JS Supabase directement dans le navigateur, avec la clé publique "anon". La sécurité n'est pas assurée par l'obscurité de l'URL `admin.html`, mais par les règles RLS (Row Level Security) de Supabase : lecture publique pour le contenu destiné au site, écriture réservée aux utilisateurs authentifiés.

Alternative envisagée et écartée : faire transiter les écritures par `server.js` avec une clé "service role". Rejetée car elle ajoute une couche de code à maintenir sans bénéfice concret pour la taille de ce projet — Supabase est conçu pour l'accès direct sécurisé par RLS.

## Modèle de données Supabase

### Table `projects`
| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid, pk | `default gen_random_uuid()` |
| `title` | text | requis |
| `description` | text | optionnel |
| `before_image_path` | text | nullable, chemin dans le bucket `media` |
| `after_image_path` | text | nullable, chemin dans le bucket `media` |
| `video_path` | text | nullable, chemin dans le bucket `media` |
| `sort_order` | int | défaut 0, ordre d'affichage |
| `created_at` | timestamptz | `default now()` |

Contrainte applicative (vérifiée côté formulaire admin, pas en DB) : au moins un des trois champs média doit être renseigné.

### Table `testimonials`
| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid, pk | `default gen_random_uuid()` |
| `author_name` | text | requis |
| `rating` | int | 1 à 5 |
| `text` | text | requis |
| `is_visible` | bool | défaut `true` |
| `sort_order` | int | défaut 0 |
| `created_at` | timestamptz | `default now()` |

### Bucket Storage `media`
Public en lecture. Écriture (upload/suppression) réservée aux utilisateurs authentifiés.

### RLS
- `projects` : `select` public (aucune condition) ; `insert`/`update`/`delete` réservés à `auth.role() = 'authenticated'`.
- `testimonials` : `select` public filtré à `is_visible = true` ; `insert`/`update`/`delete` réservés à `auth.role() = 'authenticated'` (sans filtre `is_visible`, pour permettre à l'admin de voir et modifier les avis masqués).
- Bucket `media` : `select` public ; `insert`/`delete` réservés à `auth.role() = 'authenticated'`.

## Authentification

Comptes créés manuellement dans le dashboard Supabase (Auth → Invite user) — pas d'inscription publique. `admin.html` présente un formulaire de connexion email/mot de passe (`supabase.auth.signInWithPassword`). Le contenu du dashboard (onglets Réalisations/Avis) reste masqué tant qu'aucune session valide n'est active. Un bouton de déconnexion (`supabase.auth.signOut`) est visible en permanence une fois connecté.

La protection réelle des données vient des règles RLS, pas de la page cachée : un utilisateur non authentifié qui trouverait l'URL `admin.html` ne pourrait rien écrire en base ni dans le Storage.

## Page admin (`admin.html` + `admin.js`)

Page unique, deux onglets, styles réutilisant `style.css` (variables `--primary`/`--secondary`/`--accent`) pour rester cohérente visuellement avec le reste du site.

### Onglet "Réalisations"
- Liste des projets existants : titre, miniatures (avant/après ou vidéo), bouton supprimer
- Formulaire d'ajout : titre, description, upload photo avant (optionnel), upload photo après (optionnel), upload vidéo (optionnel)
- Soumission : upload des fichiers sélectionnés vers le bucket `media`, puis insertion de la ligne `projects` avec les chemins obtenus
- Suppression : supprime la ligne `projects` et les fichiers associés dans Storage (avant, après, vidéo) pour éviter les fichiers orphelins

### Onglet "Avis clients"
- Liste des avis : nom, étoiles, texte, statut visible/masqué, boutons éditer/supprimer
- Formulaire d'ajout/édition : nom, note (sélecteur 1-5 étoiles), texte, case à cocher "visible sur le site"

## Intégration site public

### `realisations.html`
`loadRealisationsGallery()` (dans `script.js`) est réécrite pour interroger la table `projects` via le SDK Supabase (triée par `sort_order`) au lieu de fetch `photos.json`. Pour chaque projet :
- si `before_image_path` et `after_image_path` sont tous deux renseignés → affichage en paire avant/après (comme le rendu actuel)
- sinon → média unique (image ou vidéo, selon le champ renseigné)

Les URLs d'image/vidéo sont construites à partir de l'URL publique du bucket Supabase Storage.

### `index.html`
La section avis clients (actuellement des cartes codées en dur) devient dynamique : un script fetch les `testimonials` où `is_visible = true` (triés par `sort_order`) et génère les cartes, avec le même rendu visuel qu'aujourd'hui.

### Nettoyage
Une fois la migration effectuée (données existantes de `photos.json` / `photos_autres/` importées dans `projects` + bucket `media`) :
- suppression de `photos.json`
- suppression de la route `/api/photos` dans `server.js`
- suppression du dossier `photos_autres/`

## Gestion des erreurs

- Échec de connexion (mauvais identifiants) : message d'erreur affiché sous le formulaire de login.
- Échec d'upload (réseau, fichier trop lourd) : message d'erreur affiché dans le formulaire d'ajout, aucune ligne DB créée si l'upload échoue.
- Échec de suppression Storage après suppression DB (ou l'inverse) : suppression DB en premier échoue → on n'attaque pas le Storage. Si la suppression Storage échoue après la suppression DB réussie, un message avertit l'admin qu'un fichier orphelin peut subsister dans le bucket (nettoyage manuel occasionnel acceptable, pas de garantie transactionnelle attendue pour ce projet).
- RLS refuse une écriture (session expirée) : message générique "Session expirée, reconnectez-vous" et redirection vers le formulaire de login.

## Tests / vérification

Pas de framework de test automatisé sur ce projet (site statique). Vérification manuelle après implémentation :
- Connexion admin avec un compte créé dans Supabase → accès au dashboard
- Ajout d'un projet avec photo avant/après → apparaît correctement sur `realisations.html`
- Ajout d'un projet avec vidéo seule → apparaît correctement
- Suppression d'un projet → disparaît du site public et les fichiers ne restent pas dans le bucket
- Ajout d'un avis, bascule visible/masqué → reflété sur la homepage
- Déconnexion → dashboard admin inaccessible, formulaire de login réaffiché
