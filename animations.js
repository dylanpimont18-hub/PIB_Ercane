/* ==========================================================================
   ANIMATIONS PÉDAGOGIQUES — moteur scroll (comment-nous-travaillons.html)

   Principe :
   - La section est une « piste » haute (.anim__track) contenant une zone
     collante (.anim__stage). Pendant qu'on défile la piste, la zone reste
     à l'écran : chaque ~40 % de hauteur d'écran = une étape.
   - Chaque élément du SVG porte data-in="k" (l'étape où il apparaît) et une
     classe de mouvement (anim-drop, anim-rise, ...). Le moteur ajoute
     .is-in aux éléments dont l'étape est atteinte ; le CSS fait le reste.
     Remonter retire .is-in : l'animation se joue à l'envers.
   - Avec « réduire les animations », on rend une image figée par étape.
   ========================================================================== */
(() => {
    'use strict';

    const STEP_VH = 0.4; // hauteur de scroll par étape, en fraction de l'écran

    /* ---------------------------------------------------------------------
       Scènes : légendes + jauge par étape. L'étape 0 est le point de départ.
       gauge : valeur de 0 à 1 (hauteur du remplissage) et texte affiché.
       --------------------------------------------------------------------- */
    const SCENES = {
        doublage: {
            label: 'Doublage',
            file: 'animations/doublage.svg',
            steps: [
                { short: 'Départ', title: 'Le point de départ', text: 'Une pièce à isoler contre un mur qui donne sur l’extérieur. À gauche, dehors ; à droite, la pièce à vivre.', gauge: { value: 0.2, text: '5 °C' } },
                { short: 'Parpaings', title: 'Le mur en parpaings', text: 'Le mur porteur est monté rangée par rangée. Seul, il isole très peu : le froid le traverse.', gauge: { value: 0.28, text: '7 °C' } },
                { short: 'Rails', title: 'Rails bas et haut', text: 'Deux rails métalliques sont fixés au sol et au plafond, à quelques centimètres du mur. Ils guident toute l’ossature.', gauge: { value: 0.28, text: '7 °C' } },
                { short: 'Montants', title: 'Un montant tous les 60 cm', text: 'Les montants verticaux se clipsent dans les rails, un tous les 60 cm. C’est le squelette du doublage.', gauge: { value: 0.28, text: '7 °C' } },
                { short: 'Laine', title: 'Laine de verre', text: 'L’isolant est glissé entre le mur et les montants. Il piège l’air et arrête le froid : la température intérieure grimpe.', gauge: { value: 0.64, text: '16 °C' } },
                { short: 'Pare-vapeur', title: 'Pare-vapeur côté pièce', text: 'Une membrane est tendue côté pièce. Elle empêche l’humidité de l’air d’aller mouiller l’isolant.', gauge: { value: 0.68, text: '17 °C' } },
                { short: 'Placo', title: 'Plaques de plâtre vissées', text: 'Les plaques sont vissées sur les montants, une vis tous les 30 cm environ. Le mur prend forme.', gauge: { value: 0.76, text: '19 °C' } },
                { short: 'Bandes', title: 'Bandes et enduit', text: 'Les joints sont recouverts d’une bande et de deux passes d’enduit, puis poncés : le mur devient parfaitement lisse.', gauge: { value: 0.76, text: '19 °C' } },
                { short: 'Peinture', title: 'Peinture', text: 'Le mur est prêt à peindre. Isolé, plan et propre : la pièce est confortable, hiver comme été.', gauge: { value: 0.8, text: '20 °C' } }
            ]
        },
        cloison: { label: 'Cloison', file: null, steps: [] },
        plafond: { label: 'Plafond', file: null, steps: [] },
        renovation: { label: 'Rénovation', file: null, steps: [] }
    };

    const root = document.getElementById('animations');
    if (!root) return;

    const els = {
        tabs: root.querySelectorAll('.anim__tab'),
        tablist: root.querySelector('.anim__tabs'),
        track: root.querySelector('.anim__track'),
        stage: root.querySelector('.anim__stage'),
        scene: root.querySelector('.anim__scene'),
        captionInner: root.querySelector('.anim__caption-inner'),
        stepNumber: root.querySelector('.anim__step-number'),
        stepTitle: root.querySelector('.anim__step-title'),
        stepText: root.querySelector('.anim__step-text'),
        cta: root.querySelector('.anim__cta'),
        progress: root.querySelector('.anim__progress'),
        progressFill: root.querySelector('.anim__progress-fill'),
        staticWrap: root.querySelector('.anim__static')
    };

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const svgCache = {};

    const state = {
        sceneId: null,
        scene: null,
        step: -1,
        stepCount: 0,      // nombre d'étapes après l'étape 0
        animated: [],      // éléments [data-in] de la scène courante
        ticking: false
    };

    /* ---------------------------------------------------------------------
       Chargement d'une scène SVG (inline pour pouvoir la styler)
       --------------------------------------------------------------------- */
    const loadSvg = async (file) => {
        if (svgCache[file]) return svgCache[file].cloneNode(true);
        const response = await fetch(file);
        if (!response.ok) throw new Error(`SVG introuvable : ${file}`);
        const text = await response.text();
        const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
        const svg = doc.documentElement;
        if (svg.nodeName !== 'svg') throw new Error(`SVG invalide : ${file}`);
        svgCache[file] = svg;
        return svg.cloneNode(true);
    };

    /* Assigne --i (rang dans la cascade) à chaque élément d'une même étape. */
    const prepareSvg = (svg) => {
        const counters = {};
        const animated = Array.from(svg.querySelectorAll('[data-in]'));
        animated.forEach((el) => {
            const k = Number(el.dataset.in);
            counters[k] = counters[k] || 0;
            el.style.setProperty('--i', el.dataset.i !== undefined ? el.dataset.i : counters[k]);
            counters[k] += 1;
        });
        return animated;
    };

    const applyStateToSvg = (svg, animated, step, scene) => {
        animated.forEach((el) => el.classList.toggle('is-in', Number(el.dataset.in) <= step));
        const stepData = scene.steps[step];
        if (stepData && stepData.gauge) {
            svg.style.setProperty('--gauge', stepData.gauge.value);
            const label = svg.querySelector('[data-gauge-text]');
            if (label) label.textContent = stepData.gauge.text;
        }
    };

    /* ---------------------------------------------------------------------
       Mode scroll (par défaut)
       --------------------------------------------------------------------- */
    const setTrackHeight = () => {
        const stageHeight = els.stage.offsetHeight;
        const scrollLength = (state.stepCount + 1) * STEP_VH * window.innerHeight;
        els.track.style.height = `${Math.round(stageHeight + scrollLength)}px`;
    };

    const scrollRange = () => {
        const trackTop = els.track.getBoundingClientRect().top + window.scrollY;
        const length = els.track.offsetHeight - els.stage.offsetHeight;
        return { trackTop, length };
    };

    const stepFromScroll = () => {
        const { trackTop, length } = scrollRange();
        if (length <= 0) return 0;
        const progress = (window.scrollY - trackTop) / length;
        const states = state.stepCount + 1;
        const index = Math.floor(progress * states);
        return Math.max(0, Math.min(state.stepCount, index));
    };

    const scrollToStep = (k) => {
        const { trackTop, length } = scrollRange();
        const states = state.stepCount + 1;
        const target = trackTop + ((k + 0.5) / states) * length;
        window.scrollTo({ top: Math.round(target), behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    };

    const renderCaption = (step) => {
        const data = state.scene.steps[step];
        if (!data) return;
        els.captionInner.classList.add('is-changing');
        els.stepNumber.textContent = step === 0 ? state.scene.label : `Étape ${step} / ${state.stepCount}`;
        els.stepTitle.textContent = data.title;
        els.stepText.textContent = data.text;
        // Force un reflow pour rejouer la petite transition de la légende
        void els.captionInner.offsetWidth;
        els.captionInner.classList.remove('is-changing');
    };

    const renderProgress = (step) => {
        const dots = els.progress.querySelectorAll('.anim__dot');
        dots.forEach((dot, k) => {
            dot.classList.toggle('is-current', k === step);
            dot.classList.toggle('is-done', k < step);
            dot.setAttribute('aria-current', k === step ? 'step' : 'false');
        });
        const ratio = state.stepCount ? step / state.stepCount : 0;
        els.progressFill.style.width = `calc((100% - 1.8rem) * ${ratio})`;
    };

    const applyStep = (step) => {
        if (step === state.step) return;
        state.step = step;
        const svg = els.scene.querySelector('svg');
        if (svg) applyStateToSvg(svg, state.animated, step, state.scene);
        renderCaption(step);
        renderProgress(step);
        els.cta.classList.toggle('is-visible', state.stepCount > 0 && step === state.stepCount);
    };

    const onScroll = () => {
        if (state.ticking || !state.scene) return;
        state.ticking = true;
        window.requestAnimationFrame(() => {
            state.ticking = false;
            applyStep(stepFromScroll());
        });
    };

    const buildProgress = () => {
        els.progress.innerHTML = '';
        for (let k = 0; k <= state.stepCount; k += 1) {
            const li = document.createElement('li');
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'anim__dot';
            button.setAttribute('aria-label', `Aller à l’étape ${k} : ${state.scene.steps[k].title}`);
            button.innerHTML = `${k}<span class="anim__dot-label" aria-hidden="true">${state.scene.steps[k].short}</span>`;
            button.addEventListener('click', () => scrollToStep(k));
            li.appendChild(button);
            els.progress.appendChild(li);
        }
    };

    /* ---------------------------------------------------------------------
       Mode « réduire les animations » : une image figée par étape
       --------------------------------------------------------------------- */
    const renderStatic = async () => {
        els.staticWrap.innerHTML = '';
        const scene = state.scene;
        if (!scene.file) {
            els.staticWrap.innerHTML = '<p class="anim__scene anim__scene--empty">Cette animation arrive bientôt.</p>';
            return;
        }
        const master = await loadSvg(scene.file);
        scene.steps.forEach((data, k) => {
            const figure = document.createElement('figure');
            figure.className = 'anim__static-step';
            const sceneBox = document.createElement('div');
            sceneBox.className = 'anim__scene';
            const svg = master.cloneNode(true);
            const animated = prepareSvg(svg);
            applyStateToSvg(svg, animated, k, scene);
            sceneBox.appendChild(svg);
            const caption = document.createElement('figcaption');
            caption.innerHTML = `<p class="anim__step-number">${k === 0 ? scene.label : `Étape ${k} / ${scene.steps.length - 1}`}</p>`
                + `<h3 class="anim__step-title">${data.title}</h3><p class="anim__step-text">${data.text}</p>`;
            if (k === scene.steps.length - 1) {
                const cta = els.cta.cloneNode(true);
                cta.classList.add('is-visible');
                caption.appendChild(cta);
            }
            figure.append(sceneBox, caption);
            els.staticWrap.appendChild(figure);
        });
    };

    /* ---------------------------------------------------------------------
       Onglets
       --------------------------------------------------------------------- */
    const selectScene = async (id, { scrollToStart = false } = {}) => {
        const scene = SCENES[id];
        if (!scene || id === state.sceneId) return;
        state.sceneId = id;
        state.scene = scene;
        state.step = -1;
        state.stepCount = Math.max(0, scene.steps.length - 1);

        els.tabs.forEach((tab) => {
            const selected = tab.dataset.scene === id;
            tab.setAttribute('aria-selected', selected ? 'true' : 'false');
            tab.tabIndex = selected ? 0 : -1;
        });
        if (scrollToStart && window.history.replaceState) window.history.replaceState(null, '', `#${id}`);

        if (reduceMotion.matches) {
            await renderStatic();
            return;
        }

        els.scene.innerHTML = '';
        els.cta.classList.remove('is-visible');
        if (!scene.file) {
            els.scene.innerHTML = '<p class="anim__scene--empty">Cette animation arrive bientôt.<br>Choisissez « Doublage » pour découvrir la première.</p>';
            state.animated = [];
            els.progress.innerHTML = '';
            els.progressFill.style.width = '0';
            els.stepNumber.textContent = scene.label;
            els.stepTitle.textContent = 'En préparation';
            els.stepText.textContent = 'Cette animation est en cours de réalisation.';
            setTrackHeight();
            return;
        }

        try {
            const svg = await loadSvg(scene.file);
            state.animated = prepareSvg(svg);
            els.scene.appendChild(svg);
        } catch (error) {
            els.scene.innerHTML = '<p class="anim__scene--empty">Impossible de charger l’animation.</p>';
            return;
        }

        buildProgress();
        setTrackHeight();
        if (scrollToStart) {
            const { trackTop } = scrollRange();
            window.scrollTo({ top: Math.round(trackTop), behavior: 'auto' });
        }
        applyStep(stepFromScroll());
    };

    const initTabs = () => {
        els.tabs.forEach((tab, index) => {
            tab.addEventListener('click', () => selectScene(tab.dataset.scene, { scrollToStart: true }));
            tab.addEventListener('keydown', (event) => {
                const keys = { ArrowRight: 1, ArrowLeft: -1 };
                if (!(event.key in keys)) return;
                event.preventDefault();
                const next = (index + keys[event.key] + els.tabs.length) % els.tabs.length;
                els.tabs[next].focus();
                selectScene(els.tabs[next].dataset.scene, { scrollToStart: true });
            });
        });
    };

    /* En mode statique la zone épinglée est masquée : les onglets sortent
       de la zone pour rester utilisables. */
    const placeTabs = () => {
        if (reduceMotion.matches) {
            root.classList.add('anim--static');
            els.track.before(els.tablist);
        } else {
            root.classList.remove('anim--static');
            els.stage.prepend(els.tablist);
        }
    };

    /* ---------------------------------------------------------------------
       Démarrage
       --------------------------------------------------------------------- */
    const init = () => {
        initTabs();
        placeTabs();

        const hash = window.location.hash.replace('#', '');
        const initial = SCENES[hash] ? hash : 'doublage';
        selectScene(initial);

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', () => {
            if (!state.scene || reduceMotion.matches) return;
            setTrackHeight();
            state.step = -1;
            applyStep(stepFromScroll());
        });

        // Bascule à chaud si l'utilisateur change son réglage d'accessibilité
        reduceMotion.addEventListener('change', () => {
            placeTabs();
            const current = state.sceneId;
            state.sceneId = null;
            selectScene(current);
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
