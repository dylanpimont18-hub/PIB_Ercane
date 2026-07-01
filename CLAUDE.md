# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Business website for **Placo Isolation du Berry (PIB)**, a French plaster/drywall and insulation contractor based in Vierzon. The site showcases services, project galleries, and a contact/quote form.

Live URL: `https://pib-vierzon.onrender.com`

## Commands

```bash
# Start the Express server (serves the site)
npm start          # runs: node server.js

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

Hosted on **Render**. The `PORT` environment variable controls the listening port (defaults to `10000`). No other environment variables are required — Formspree key is hardcoded in `script.js`.
