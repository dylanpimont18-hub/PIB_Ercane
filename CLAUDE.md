# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Business website for **Placo Isolation du Berry (PIB)**, a French plaster/drywall and insulation contractor based in Vierzon. The site showcases services, project galleries, and a contact/quote form.

Live URL: `https://pib-vierzon.fr` (GitHub Pages)

## Commands

```bash
# Start the local dev server (production is GitHub Pages, not this)
npm start          # runs: node server.js

# Test in the exact conditions of GitHub Pages (no Express)
python -m http.server 8099

# Install dependencies
npm install
```

No build step — this is a static site with a minimal Node.js backend.

## Architecture

**Stack:** Vanilla HTML/CSS/JS frontend + Express.js backend. No framework, no bundler.

**Entry points:**
- `index.html` — homepage (services, gallery, process, contact form)
- `realisations.html` — dedicated gallery page (loads images dynamically)
- `server.js` — Express server, port `10000` (or `PORT` env var)

**Backend (`server.js`):**
- Serves static files from the project root
- Routes `/` → `index.html`, `/realisations` → `realisations.html`
- `GET /api/photos` — scans `photos_autres/` and returns a JSON array of image filenames

**Frontend (`script.js`):**
- Sticky header, mobile menu toggle, scroll-triggered animations via `IntersectionObserver`
- Contact form: AJAX submission to Formspree (`https://formspree.io/f/xgvlepql`)
- Gallery on `realisations.html`: fetches `/api/photos`, renders images, initializes FancyBox lightbox

**Image folders:**
- `photo_pp/` — before/after comparison images used on the homepage
- `photos_autres/` — project photos served dynamically via the API

## Styling

CSS variables in `style.css`:
- `--primary`: `#8B5A2B` (brown)
- `--secondary`: `#F5F5F3` (light gray)
- `--accent`: `#E87E5A` (burnt orange)

BEM-style class naming. Mobile-responsive, no preprocessor.

## Key Dependencies

- **express** `4.19.2` — static file server + API
- **cors** `2.8.5` — CORS middleware
- **FancyBox 5** (CDN) — image lightbox on gallery page
- **Font Awesome 6.5.2** (CDN) — icons
- **Google Fonts** (CDN) — Poppins, Lato

## Deployment

Hosted on **GitHub Pages**: the site is served statically from the root of the `main` branch, so **any push to `main` deploys it**. There is no build step and no server in production.

- Custom domain `pib-vierzon.fr` (bought from Hostinger), declared in the `CNAME` file.
- `.nojekyll` disables Jekyll processing.
- `server.js` is now a **local dev server only** (`npm start`). Two caveats: its extensionless routes (`/realisations`, `/admin`) do not exist on Pages — always link `realisations.html` / `admin.html`; and security headers cannot be set on Pages, so the helmet CSP is mirrored as a `<meta http-equiv="Content-Security-Policy">` tag in every HTML page. **Keep both in sync.**
- See `README.md` for the Pages settings and the Hostinger DNS records.

No environment variables are required — the Formspree endpoint is hardcoded in `script.js` and the Supabase anon key in `supabase-config.js` (both are meant to be public; write access is gated by Supabase RLS policies).
