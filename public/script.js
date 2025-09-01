/**
 * Fichier de script principal pour l'interactivité du site.
 * Attend que le DOM soit entièrement chargé avant d'exécuter les scripts.
 */
document.addEventListener('DOMContentLoaded', () => {

    /**
     * Initialise toutes les fonctionnalités du site.
     */
    const initApp = () => {
        initStickyHeader();
        initMobileMenu();
        initScrollAnimations();
        initContactForm();
        initFloatingButtonObserver();
        initFancybox();
        // On charge la galerie de la page d'accueil avec uniquement les photos mises en avant
        loadFeaturedGallery();
    };

    /**
     * Ajoute une ombre au header lors du défilement.
     */
    const initStickyHeader = () => {
        const header = document.querySelector('.header');
        if (!header) return;

        window.addEventListener('scroll', () => {
            header.classList.toggle('scrolled', window.scrollY > 50);
        });
    };

    /**
     * Gère l'ouverture/fermeture du menu de navigation sur mobile.
     */
    const initMobileMenu = () => {
        const navMenu = document.getElementById('nav-menu');
        const navToggle = document.getElementById('nav-toggle');
        const navLinks = document.querySelectorAll('.nav__link');

        if (!navMenu || !navToggle) return;

        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('show-menu');
        });

        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('show-menu');
            });
        });
    };

    /**
     * Anime les éléments lorsqu'ils deviennent visibles à l'écran.
     */
    const initScrollAnimations = () => {
        const elementsToAnimate = document.querySelectorAll('.animate-on-scroll');
        if (elementsToAnimate.length === 0) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        elementsToAnimate.forEach(element => {
            observer.observe(element);
        });
    };

    /**
     * Gère la soumission asynchrone du formulaire de contact vers le serveur Node.js.
     */
    const initContactForm = () => {
        const form = document.getElementById('contact-form');
        if (!form) return;

        const status = document.getElementById('form-status');

        const handleSubmit = async (event) => {
            event.preventDefault();
            const data = new FormData(event.target);
            const jsonData = Object.fromEntries(data.entries());

            try {
                const response = await fetch(event.target.action, {
                    method: form.method,
                    body: JSON.stringify(jsonData),
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                });

                const responseData = await response.json();

                if (response.ok) {
                    status.textContent = responseData.message;
                    status.style.color = 'green';
                    form.reset();
                } else {
                    status.textContent = responseData.message || "Oops! Une erreur s'est produite.";
                    status.style.color = 'red';
                }
            } catch (error) {
                status.textContent = "Oops! Une erreur de connexion s'est produite.";
                status.style.color = 'red';
            }
        };

        form.addEventListener("submit", handleSubmit);
    };

    /**
     * Cache le bouton flottant lorsque la section contact est visible.
     */
    const initFloatingButtonObserver = () => {
        const floatingButton = document.getElementById('floating-button');
        const contactSection = document.getElementById('contact');

        if (!floatingButton || !contactSection) return;

        const observerCallback = (entries) => {
            entries.forEach(entry => {
                floatingButton.classList.toggle('is-hidden', entry.isIntersecting);
            });
        };

        const observer = new IntersectionObserver(observerCallback, { threshold: 0.1 });
        observer.observe(contactSection);
    };

    /**
     * Initialise la bibliothèque de lightbox Fancybox.
     */
    const initFancybox = () => {
        if (typeof Fancybox !== 'undefined') {
            Fancybox.bind("[data-fancybox]", {
                // Options personnalisées si besoin
            });
        }
    };

    /**
     * Charge uniquement les réalisations mises en avant sur la page d'accueil.
     */
    const loadFeaturedGallery = () => {
        const galleryContainer = document.getElementById('realisations-gallery');
        if (!galleryContainer) return;

        // C'est cette ligne qui fait la magie : elle demande uniquement les photos "featured"
        fetch('/api/photos?featured=true')
            .then(response => response.json())
            .then(photosToShow => {
                if (photosToShow.length === 0) {
                    galleryContainer.innerHTML = '<p>Aucune réalisation à afficher pour le moment.</p>';
                    return;
                }

                galleryContainer.innerHTML = ''; // Vider le conteneur

                photosToShow.forEach(photo => {
                    let galleryItemHTML = '';
                    const descriptionHTML = `<div class="gallery__caption"><span class="gallery__caption-title">${photo.description || ''}</span></div>`;

                    if (photo.type === 'single') {
                        galleryItemHTML = `
                            <div class="gallery__item">
                                <a href="/images/realisations/${photo.filename}" data-fancybox="gallery" data-caption="${photo.description || ''}">
                                    <img src="/images/realisations/${photo.filename}" alt="Réalisation" class="gallery__image">
                                </a>
                                ${descriptionHTML}
                            </div>`;
                    } else if (photo.type === 'before-after') {
                        galleryItemHTML = `
                            <div class="gallery__item">
                                <div class="before-after__container">
                                    <div class="before-after__image-wrapper">
                                        <span class="before-after__label">AVANT</span>
                                        <a href="/images/realisations/${photo.filename_before}" data-fancybox="gallery-${photo.id}" data-caption="Avant: ${photo.description || ''}">
                                            <img src="/images/realisations/${photo.filename_before}" alt="Avant" class="gallery__image">
                                        </a>
                                    </div>
                                    <div class="before-after__image-wrapper">
                                        <span class="before-after__label">APRÈS</span>
                                        <a href="/images/realisations/${photo.filename_after}" data-fancybox="gallery-${photo.id}" data-caption="Après: ${photo.description || ''}">
                                            <img src="/images/realisations/${photo.filename_after}" alt="Après" class="gallery__image">
                                        </a>
                                    </div>
                                </div>
                                ${descriptionHTML}
                            </div>`;
                    }
                    galleryContainer.innerHTML += galleryItemHTML;
                });

                // Ré-initialiser Fancybox après avoir ajouté les nouveaux éléments
                if (typeof Fancybox !== 'undefined') {
                    Fancybox.bind("[data-fancybox]", {
                        // Options
                    });
                }
            })
            .catch(error => {
                console.error('Erreur de chargement des photos:', error);
                galleryContainer.innerHTML = '<p>Impossible de charger les réalisations.</p>';
            });
    };

    // Lance l'application
    initApp();
});