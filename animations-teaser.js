/* ==========================================================================
   Boucle de 10 s du doublage sur la page d'accueil (index.html).
   Rejoue automatiquement les étapes de animations/doublage.svg et renvoie
   vers la page complète au clic. Avec « réduire les animations », affiche
   l'image finale, fixe.
   ========================================================================== */
(() => {
    'use strict';

    const box = document.querySelector('[data-teaser]');
    if (!box) return;

    const STEP_MS = 1100;        // 9 états × 1,1 s ≈ 10 s
    const END_PAUSE_MS = 1800;   // pause sur le mur fini avant de recommencer
    const GAUGES = [
        [0.2, '5 °C'], [0.28, '7 °C'], [0.28, '7 °C'], [0.28, '7 °C'], [0.64, '16 °C'],
        [0.68, '17 °C'], [0.76, '19 °C'], [0.76, '19 °C'], [0.8, '20 °C']
    ];
    const LAST = GAUGES.length - 1;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const applyStep = (svg, animated, step) => {
        animated.forEach((el) => el.classList.toggle('is-in', Number(el.dataset.in) <= step));
        svg.style.setProperty('--gauge', GAUGES[step][0]);
        const label = svg.querySelector('[data-gauge-text]');
        if (label) label.textContent = GAUGES[step][1];
    };

    const start = async () => {
        let svg;
        try {
            const response = await fetch(box.dataset.teaser);
            if (!response.ok) return;
            const doc = new DOMParser().parseFromString(await response.text(), 'image/svg+xml');
            svg = doc.documentElement;
            if (svg.nodeName !== 'svg') return;
        } catch (error) {
            return;
        }
        svg.setAttribute('aria-hidden', 'true');
        svg.removeAttribute('role');
        box.appendChild(svg);

        const counters = {};
        const animated = Array.from(svg.querySelectorAll('[data-in]'));
        animated.forEach((el) => {
            const k = el.dataset.in;
            counters[k] = counters[k] || 0;
            el.style.setProperty('--i', counters[k]);
            counters[k] += 1;
        });

        if (reduceMotion.matches) {
            svg.classList.add('is-resetting');
            applyStep(svg, animated, LAST);
            return;
        }

        let step = 0;
        let timer = null;
        let running = false;
        applyStep(svg, animated, 0);

        const tick = () => {
            if (!running) return;
            if (step < LAST) {
                step += 1;
                applyStep(svg, animated, step);
                timer = window.setTimeout(tick, step === LAST ? END_PAUSE_MS : STEP_MS);
            } else {
                // Retour au départ sans rejouer l'animation à l'envers
                svg.classList.add('is-resetting');
                step = 0;
                applyStep(svg, animated, 0);
                void svg.getBoundingClientRect();
                svg.classList.remove('is-resetting');
                timer = window.setTimeout(tick, STEP_MS);
            }
        };

        const play = () => {
            if (running) return;
            running = true;
            timer = window.setTimeout(tick, STEP_MS);
        };
        const pause = () => {
            running = false;
            window.clearTimeout(timer);
        };

        // Ne tourne que lorsque la vignette est visible à l'écran
        if ('IntersectionObserver' in window) {
            new IntersectionObserver((entries) => {
                entries.forEach((entry) => (entry.isIntersecting ? play() : pause()));
            }, { threshold: 0.3 }).observe(box);
        } else {
            play();
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
