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
        cloison: {
            label: 'Cloison',
            file: 'animations/cloison.svg',
            steps: [
                { short: 'Départ', title: 'Le point de départ', text: 'Une grande pièce à séparer en deux. On la regarde de dessus, comme sur un plan : la cloison va traverser la pièce de gauche à droite.', gauge: { value: 0, text: '0 dB' } },
                { short: 'Tracé', title: 'Le tracé au sol', text: 'On trace au sol l\u2019emplacement exact de la cloison au cordeau, puis on le reporte au plafond avec un laser.', gauge: { value: 0, text: '0 dB' } },
                { short: 'Rails', title: 'Les rails', text: 'Un rail est vissé au sol et un autre au plafond, le long du tracé. Ils tiendront les montants.', gauge: { value: 0, text: '0 dB' } },
                { short: 'Montants', title: 'Un montant tous les 60 cm', text: 'Les montants sont glissés dans les rails, un tous les 60 cm. Une porte prévue ? L\u2019ossature est renforcée à cet endroit.', gauge: { value: 0.05, text: '2 dB' } },
                { short: 'Laine', title: 'Laine entre les montants', text: 'La laine est glissée entre les montants. C\u2019est elle qui absorbe le bruit : sans elle, une cloison sonne creux.', gauge: { value: 0.3, text: '15 dB' } },
                { short: 'Face 1', title: 'Première face de placo', text: 'Les plaques sont vissées sur les montants, d\u2019un seul côté de l\u2019ossature.', gauge: { value: 0.55, text: '30 dB' } },
                { short: 'Face 2', title: 'Seconde face : le coffre se ferme', text: 'Les plaques de l\u2019autre côté referment la cloison comme un coffre. Deux parois et de la laine entre les deux : le bruit est étouffé.', gauge: { value: 0.8, text: '42 dB' } },
                { short: 'Bandes', title: 'Bandes et enduit', text: 'Des deux côtés : bandes sur les joints, deux passes d\u2019enduit, ponçage.', gauge: { value: 0.82, text: '43 dB' } },
                { short: 'Peinture', title: 'Peinture', text: 'Deux pièces indépendantes, prêtes à peindre. Une cloison de 7 cm suffit à isoler une chambre du salon.', gauge: { value: 0.82, text: '43 dB' } }
            ]
        },
        plafond: {
            label: 'Plafond',
            file: 'animations/plafond.svg',
            steps: [
                { short: 'Départ', title: 'Le point de départ', text: 'Une dalle en béton, ou une charpente, au-dessus de la pièce. Trop haute, irrégulière ou nue : on va créer un plafond suspendu dessous.' },
                { short: 'Suspentes', title: 'Les suspentes', text: 'Des suspentes métalliques sont fixées une à une dans la dalle, tous les 60 cm environ. Ce sont elles qui portent tout le plafond.' },
                { short: 'Fourrures', title: 'Les fourrures', text: 'Des fourrures, rails fins en acier, se clipsent en travers sur les suspentes. Réglées au laser, elles forment une grille parfaitement plane.' },
                { short: 'Isolant', title: 'L\u2019isolant', text: 'La laine est déroulée au-dessus des fourrures. Elle coupe le froid et amortit les bruits venant de l\u2019étage.' },
                { short: 'Placo', title: 'Les plaques de plâtre', text: 'Les plaques sont levées et vissées sous les fourrures, une vis tous les 30 cm.' },
                { short: 'Bandes', title: 'Bandes et enduit', text: 'Les joints sont bandés, enduits et poncés. Le plafond devient un plan lisse et continu.' },
                { short: 'Peinture', title: 'Peinture', text: 'Le plafond est prêt à peindre. Spots, corniche ou gorge lumineuse peuvent s\u2019y intégrer.' }
            ]
        },
        renovation: {
            label: 'Rénovation',
            group: 'renovation',
            variant: 'Mur abîmé',
            file: 'animations/renovation-mur.svg',
            steps: [
                { short: 'Diagnostic', weight: 2.5, title: 'Le diagnostic', text: 'Avant tout, on regarde. Touchez les pastilles pour comprendre chaque désordre : fissure, humidité, enduit friable, papier décollé.',
                    hotspots: {
                        fissure: { title: 'Fissure', text: 'Une fissure fine suit souvent un joint de maçonnerie ou un mouvement du bâti. On ne la rebouche pas : on la couvre d\u2019une nouvelle paroi désolidarisée.' },
                        humidite: { title: 'Humidité', text: 'Auréoles et cloques en bas de mur : l\u2019eau remonte ou traverse. On traite la cause, puis on isole avec un pare-vapeur côté pièce.' },
                        friable: { title: 'Enduit friable', text: 'Le vieux plâtre sonne creux et part en poussière. Impossible de peindre dessus : il faut déposer jusqu\u2019au support.' },
                        papier: { title: 'Papier décollé', text: 'Le papier se décolle parce que le support bouge ou est humide. Il sera retiré avec l\u2019ancien enduit.' }
                    } },
                { short: 'Dépose', weight: 1.5, title: 'La dépose', text: 'L\u2019ancien revêtement est arraché : papier, plâtre friable, tout tombe jusqu\u2019au mur nu. On repart sur une base saine.' },
                { short: 'Reconstruction', weight: 1.5, title: 'La reconstruction', text: 'Comme en neuf, en accéléré : rails, montants, laine, pare-vapeur et plaques viennent recouvrir le mur nu.' },
                { short: 'Finitions', title: 'Les finitions', text: 'Bandes, enduit, ponçage, peinture. Le mur est neuf, plan et isolé.' },
                { short: 'Avant / après', weight: 1.5, compare: true, title: 'Avant / après', text: 'Glissez le curseur pour comparer le mur d\u2019origine et le mur rénové.' }
            ]
        },
        'renovation-plafond': {
            label: 'Rénovation',
            group: 'renovation',
            variant: 'Plafond abîmé',
            file: 'animations/renovation-plafond.svg',
            steps: [
                { short: 'Diagnostic', weight: 2.5, title: 'Le diagnostic', text: 'Un plafond taché ou qui pend n\u2019est jamais anodin. Touchez les pastilles pour comprendre.',
                    hotspots: {
                        tache: { title: 'Tache d\u2019humidité', text: 'Une auréole brune signale une fuite ou une condensation passée. Une fois la cause réglée, le plâtre taché reste fragile et poreux.' },
                        affaissement: { title: 'Plafond affaissé', text: 'Le vieux plâtre sur lattis se décroche de ses fixations et pend. Il peut tomber : on le dépose sans attendre.' }
                    } },
                { short: 'Dépose', weight: 1.5, title: 'La dépose', text: 'L\u2019ancien plafond est déposé jusqu\u2019à la structure : dalle ou solives.' },
                { short: 'Plafond neuf', weight: 1.5, title: 'Le plafond neuf', text: 'Suspentes, fourrures, isolant, plaques : un plafond neuf, plan et léger, en quelques heures.' },
                { short: 'Finitions', title: 'Les finitions', text: 'Bandes, enduit, ponçage, peinture.' },
                { short: 'Avant / après', weight: 1.5, compare: true, title: 'Avant / après', text: 'Glissez le curseur pour comparer.' }
            ]
        }
    };

    const stepWeight = (step) => (step && step.weight) || 1;
    const totalWeight = (scene) => scene.steps.reduce((sum, step) => sum + stepWeight(step), 0);

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
        tip: root.querySelector('.anim__tip'),
        tipTitle: root.querySelector('.anim__tip-title'),
        tipText: root.querySelector('.anim__tip-text'),
        tipClose: root.querySelector('.anim__tip-close'),
        compare: root.querySelector('.anim__compare'),
        subtabs: root.querySelector('.anim__subtabs'),
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
        const animated = Array.from(svg.querySelectorAll('[data-in], [data-out]'));
        animated.forEach((el) => {
            const k = el.dataset.in !== undefined ? `in${el.dataset.in}` : `out${el.dataset.out}`;
            counters[k] = counters[k] || 0;
            el.style.setProperty('--i', el.dataset.i !== undefined ? el.dataset.i : counters[k]);
            counters[k] += 1;
        });
        return animated;
    };

    const setCompare = (svg, percent) => {
        const clip = svg.querySelector('[data-compare-clip]');
        const handle = svg.querySelector('[data-compare-handle]');
        const width = Number(svg.getAttribute('viewBox').split(/\s+/)[2]) || 720;
        const x = (width * percent) / 100;
        if (clip) clip.setAttribute('width', x);
        if (handle) handle.setAttribute('transform', `translate(${x} 0)`);
    };

    const applyStateToSvg = (svg, animated, step, scene) => {
        animated.forEach((el) => {
            if (el.dataset.in !== undefined) el.classList.toggle('is-in', Number(el.dataset.in) <= step);
            if (el.dataset.out !== undefined) el.classList.toggle('is-out', Number(el.dataset.out) <= step);
        });
        const stepData = scene.steps[step];
        if (stepData && stepData.gauge) {
            svg.style.setProperty('--gauge', stepData.gauge.value);
            const label = svg.querySelector('[data-gauge-text]');
            if (label) label.textContent = stepData.gauge.text;
        }
        svg.classList.toggle('is-diagnostic', Boolean(stepData && stepData.hotspots));
    };

    /* ---------------------------------------------------------------------
       Mode scroll (par défaut)
       --------------------------------------------------------------------- */
    /* Vide la scène en conservant le curseur avant/après (élément HTML fixe). */
    const clearScene = () => {
        Array.from(els.scene.children).forEach((child) => {
            if (child !== els.compare) child.remove();
        });
    };

    const setTrackHeight = () => {
        const stageHeight = els.stage.offsetHeight;
        const scrollLength = totalWeight(state.scene) * STEP_VH * window.innerHeight;
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
        const position = ((window.scrollY - trackTop) / length) * totalWeight(state.scene);
        let cumulated = 0;
        for (let k = 0; k < state.scene.steps.length; k += 1) {
            cumulated += stepWeight(state.scene.steps[k]);
            if (position < cumulated) return k;
        }
        return state.stepCount;
    };

    const scrollToStep = (k) => {
        const { trackTop, length } = scrollRange();
        const total = totalWeight(state.scene);
        let before = 0;
        for (let j = 0; j < k; j += 1) before += stepWeight(state.scene.steps[j]);
        const target = trackTop + ((before + stepWeight(state.scene.steps[k]) / 2) / total) * length;
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

    const hideTip = () => {
        els.tip.hidden = true;
        els.captionInner.hidden = false;
    };

    const showTip = (id) => {
        const data = state.scene.steps[state.step];
        const info = data && data.hotspots && data.hotspots[id];
        if (!info) return;
        els.tipTitle.textContent = info.title;
        els.tipText.textContent = info.text;
        els.captionInner.hidden = true;
        els.tip.hidden = false;
    };

    const applyStep = (step) => {
        if (step === state.step) return;
        state.step = step;
        const svg = els.scene.querySelector('svg');
        const data = state.scene.steps[step];
        if (svg) applyStateToSvg(svg, state.animated, step, state.scene);
        hideTip();
        renderCaption(step);
        renderProgress(step);
        const compare = Boolean(data && data.compare);
        els.compare.hidden = !compare;
        els.scene.classList.toggle('is-comparing', compare);
        if (compare && svg) {
            els.compare.value = 50;
            setCompare(svg, 50);
        }
        els.cta.classList.toggle('is-visible', state.stepCount > 0 && step === state.stepCount);
    };

    const initHotspots = (svg) => {
        svg.querySelectorAll('[data-hotspot]').forEach((spot) => {
            spot.setAttribute('role', 'button');
            spot.setAttribute('tabindex', '0');
            const open = (event) => {
                event.preventDefault();
                showTip(spot.dataset.hotspot);
            };
            spot.addEventListener('click', open);
            spot.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') open(event);
            });
        });
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
            if (data.compare) setCompare(svg, 50);
            const caption = document.createElement('figcaption');
            caption.innerHTML = `<p class="anim__step-number">${k === 0 ? scene.label : `Étape ${k} / ${scene.steps.length - 1}`}</p>`
                + `<h3 class="anim__step-title">${data.title}</h3><p class="anim__step-text">${data.text}</p>`;
            if (data.hotspots) {
                const list = document.createElement('dl');
                list.className = 'anim__hotspot-list';
                Object.values(data.hotspots).forEach((info) => {
                    list.innerHTML += `<dt>${info.title}</dt><dd>${info.text}</dd>`;
                });
                caption.appendChild(list);
            }
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

        const tabId = scene.group || id;
        els.tabs.forEach((tab) => {
            const selected = tab.dataset.scene === tabId;
            tab.setAttribute('aria-selected', selected ? 'true' : 'false');
            tab.tabIndex = selected ? 0 : -1;
        });
        renderSubtabs(id);
        if (scrollToStart && window.history.replaceState) window.history.replaceState(null, '', `#${id}`);

        if (reduceMotion.matches) {
            await renderStatic();
            return;
        }

        clearScene();
        els.cta.classList.remove('is-visible');
        if (!scene.file) {
            els.scene.insertAdjacentHTML('beforeend', '<p class="anim__scene--empty">Cette animation arrive bientôt.</p>');
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
            initHotspots(svg);
            els.scene.appendChild(svg);
        } catch (error) {
            els.scene.insertAdjacentHTML('beforeend', '<p class="anim__scene--empty">Impossible de charger l’animation.</p>');
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

    /* Sous-onglets (Rénovation : mur / plafond) */
    const renderSubtabs = (currentId) => {
        const current = SCENES[currentId];
        els.subtabs.innerHTML = '';
        if (!current.group) {
            els.subtabs.hidden = true;
            return;
        }
        Object.keys(SCENES)
            .filter((id) => SCENES[id].group === current.group)
            .forEach((id) => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'anim__subtab';
                button.textContent = SCENES[id].variant;
                button.setAttribute('aria-pressed', id === currentId ? 'true' : 'false');
                button.addEventListener('click', () => selectScene(id, { scrollToStart: true }));
                els.subtabs.appendChild(button);
            });
        els.subtabs.hidden = false;
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

        els.compare.addEventListener('input', () => {
            const svg = els.scene.querySelector('svg');
            if (svg) setCompare(svg, Number(els.compare.value));
        });
        els.tipClose.addEventListener('click', hideTip);

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
