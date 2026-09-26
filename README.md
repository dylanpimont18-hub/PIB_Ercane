# Placo Isolation du Berry (PIB) — site vitrine

Site vitrine de **Placo Isolation du Berry**, plaquiste à Vierzon (Cher).

- **Site en ligne :** https://pib-vierzon.fr
- **Hébergement :** GitHub Pages (branche `main`, racine du dépôt)
- **Domaine :** `pib-vierzon.fr`, acheté chez Hostinger

## Stack

Site statique : HTML / CSS / JavaScript vanilla, sans build ni bundler.

Les données dynamiques viennent de services externes appelés directement depuis le navigateur :

| Service | Usage |
|---|---|
| **Supabase** | Tables `projects` (galerie) et `testimonials` (avis), bucket `media` (photos/vidéos) |
| **Formspree** | Réception du formulaire de devis |
| **Google Analytics 4** | Statistiques, chargé uniquement après consentement |

## Déployer

Le déploiement est automatique : **tout push sur `main` met le site à jour** en une minute environ.

```bash
git add .
git commit -m "Description des modifications"
git push
```

Aucune étape de build. GitHub Pages sert les fichiers tels quels.

## Développer en local

```bash
npm install     # une seule fois
npm start       # http://localhost:10000
```

`server.js` est un **serveur de développement uniquement** — il n'est plus utilisé en production. Deux différences à garder en tête :

- Il expose des routes sans extension (`/realisations`, `/admin`) qui **n'existent pas** sur GitHub Pages. Liez toujours `realisations.html` et `admin.html`.
- Il applique la CSP via helmet ; sur Pages, c'est la balise `<meta http-equiv="Content-Security-Policy">` présente dans chaque page HTML. **Toute modification de la politique doit être reportée dans les deux endroits.**

Pour tester dans les conditions exactes de GitHub Pages (sans Express) :

```bash
python -m http.server 8099    # http://localhost:8099
```

## Configuration GitHub Pages

À faire une seule fois, dans **Settings → Pages** du dépôt :

- **Source :** Deploy from a branch
- **Branch :** `main`, dossier `/ (root)`
- **Custom domain :** `pib-vierzon.fr`
- **Enforce HTTPS :** coché (une fois le certificat émis, ce qui peut prendre jusqu'à 24 h)

Le fichier `CNAME` à la racine porte le domaine ; ne pas le supprimer, GitHub le réécrit depuis ce réglage.

## Configuration DNS (Hostinger)

Dans **hPanel → Domaines → pib-vierzon.fr → DNS / Serveurs de noms**, supprimer les enregistrements A et CNAME existants pointant vers Hostinger, puis créer :

| Type | Nom | Valeur | TTL |
|---|---|---|---|
| A | `@` | `185.199.108.153` | 3600 |
| A | `@` | `185.199.109.153` | 3600 |
| A | `@` | `185.199.110.153` | 3600 |
| A | `@` | `185.199.111.153` | 3600 |
| CNAME | `www` | `dylanpimont18-hub.github.io` | 3600 |

La propagation prend de quelques minutes à quelques heures. Vérification :

```bash
nslookup pib-vierzon.fr
```

## Structure

Voir [CODEBASE_MAP.md](CODEBASE_MAP.md) pour l'index détaillé des fichiers.

Fichiers spécifiques à l'hébergement :

- `CNAME` — domaine personnalisé lu par GitHub Pages
- `.nojekyll` — désactive Jekyll (accélère le déploiement, évite l'exclusion des dossiers commençant par `_`)
- `robots.txt` / `sitemap.xml` — référencement ; penser à mettre à jour `lastmod` après une refonte de contenu

## Administration des contenus

La page `admin.html` permet d'ajouter ou supprimer des réalisations et des avis. Elle est protégée par **Supabase Auth**, pas par le secret de son URL : les policies RLS n'autorisent l'écriture qu'aux utilisateurs authentifiés.

Deux précautions :

- utiliser un mot de passe solide sur le compte Supabase ;
- vérifier dans Supabase (**Authentication → Providers**) que l'inscription libre est **désactivée**, sinon n'importe qui pourrait se créer un compte et écrire en base.
