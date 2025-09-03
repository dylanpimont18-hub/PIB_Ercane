/**
 * Fichier de script principal pour l'interactivité du site.
 */
document.addEventListener('DOMContentLoaded', () => {

    /**
     * Les données des réalisations.
     * Pour ajouter, modifier ou supprimer une réalisation, modifiez cette liste.
     * N'oubliez pas d'ajouter les images correspondantes dans le dossier /images/realisations/
     */
    const galleryData = [
        {
            "type": "before-after",
            "description": "Aménagement et isolation de combles",
            "image_url_before": "images/realisations/photo_avant-1756663344336.jpg",
            "image_url_after": "images/realisations/photo_apres-1756663344346.jpg"
        },
        {
            "type": "single",
            "description": "Création d'un meuble TV sur mesure en placo",
            "image_url_single": "images/realisations/photo-1756663407366.jpg"
        },
        {
            "type": "single",
            "description": "Préparation d'une salle d'eau (placo hydrofuge)",
            "image_url_single": "images/realisations/photo-1756663411960.jpg"
        },
        {
            "type": "before-after",
            "description": "Transformation et isolation d'une pièce sous les toits",
            "image_url_before": "images/realisations/photo_avant-1756663371410.jpg",
            "image_url_after": "images/realisations/photo_apres-1756663371416.jpg"
        }
    ];

    /**
     * Initialise toutes les fonctionnalités du site.
     */
    const initApp = () => {
        initStickyHeader();
        initMobileMenu();
        initScrollAnimations();
        initContactForm(); // Garde la fonctionnalité d'envoi de mail
        initFloatingButtonObserver();
        initFancybox();
        loadStaticGallery(); // Utilise la galerie statique
    };

    /**
     * Gère la galerie de manière statique à partir de la variable 'galleryData'.
     */
    const loadStaticGallery = () => {
        const galleryContainer = document.getElementById('realisations-gallery');
        if (!galleryContainer) return;

        if (galleryData.length === 0) {
            galleryContainer.innerHTML = '<p>Aucune réalisation à afficher pour le moment.</p>';
            return;
        }

        galleryContainer.innerHTML = ''; // Vider le conteneur

        galleryData.forEach((photo, index) => {
            const descriptionHTML = `<div class="gallery__caption"><span class="gallery__caption-title">${photo.description || ''}</span></div>`;
            let galleryItemHTML = '';

            if (photo.type === 'single') {
                galleryItemHTML = `
                    <div class="gallery__item">
                        <a href="${photo.image_url_single}" data-fancybox="gallery" data-caption="${photo.description || ''}">
                            <img src="${photo.image_url_single}" alt="Réalisation : ${photo.description || ''}" class="gallery__image">
                        </a>
                        ${descriptionHTML}
                    </div>`;
            } else if (photo.type === 'before-after') {
                galleryItemHTML = `
                    <div class="gallery__item">
                        <div class="before-after__container">
                            <div class="before-after__image-wrapper">
                                <span class="before-after__label">AVANT</span>
                                <a href="${photo.image_url_before}" data-fancybox="gallery-${index}" data-caption="Avant: ${photo.description || ''}">
                                    <img src="${photo.image_url_before}" alt="Avant : ${photo.description || ''}" class="gallery__image">
                                </a>
                            </div>
                            <div class="before-after__image-wrapper">
                                <span class="before-after__label">APRÈS</span>
                                <a href="${photo.image_url_after}" data-fancybox="gallery-${index}" data-caption="Après: ${photo.description || ''}">
                                    <img src="${photo.image_url_after}" alt="Après : ${photo.description || ''}" class="gallery__image">
                                </a>
                            </div>
                        </div>
                        ${descriptionHTML}
                    </div>`;
            }
            galleryContainer.innerHTML += galleryItemHTML;
        });

        if (typeof Fancybox !== 'undefined') {
            Fancybox.unbind(galleryContainer);
            Fancybox.bind(galleryContainer, "[data-fancybox]", {});
        }
    };

    const initStickyHeader = () => {
        const header = document.querySelector('.header');
        if (header) window.addEventListener('scroll', () => header.classList.toggle('scrolled', window.scrollY > 50));
    };

    const initMobileMenu = () => {
        const navMenu = document.getElementById('nav-menu');
        const navToggle = document.getElementById('nav-toggle');
        const navLinks = document.querySelectorAll('.nav__link');
        if (navMenu && navToggle) {
            navToggle.addEventListener('click', () => navMenu.classList.toggle('show-menu'));
            navLinks.forEach(link => link.addEventListener('click', () => navMenu.classList.remove('show-menu')));
        }
    };

    const initScrollAnimations = () => {
        const elements = document.querySelectorAll('.animate-on-scroll');
        if (elements.length > 0) {
            const observer = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1 });
            elements.forEach(el => observer.observe(el));
        }
    };

    /**
     * Gère la soumission asynchrone du formulaire de contact vers le serveur.
     */
    const initContactForm = () => {
        const form = document.getElementById('contact-form');
        if (!form) return;
        const status = document.getElementById('form-status');
        form.addEventListener("submit", async (event) => {
            event.preventDefault();
            const data = new FormData(event.target);
            const nameParts = (data.get('name') || '').split(' ');
            const jsonData = {
                prenom: nameParts[0] || '',
                nom: nameParts.slice(1).join(' ') || '',
                email: data.get('email'),
                telephone: data.get('phone'),
                message: data.get('message')
            };
            try {
                const response = await fetch(event.target.action, {
                    method: form.method,
                    body: JSON.stringify(jsonData),
                    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
                });
                const responseData = await response.json();
                if (response.ok) {
                    status.textContent = responseData.message || 'E-mail envoyé avec succès !';
                    status.style.color = 'green';
                    form.reset();
                } else {
                    status.textContent = responseData.error || "Oops! Une erreur s'est produite.";
                    status.style.color = 'red';
                }
            } catch (error) {
                status.textContent = "Oops! Une erreur de connexion s'est produite.";
                status.style.color = 'red';
            }
        });
    };

    const initFloatingButtonObserver = () => {
        const floatingButton = document.getElementById('floating-button');
        const contactSection = document.getElementById('contact');
        if (floatingButton && contactSection) {
            const observer = new IntersectionObserver(entries => {
                entries.forEach(entry => floatingButton.classList.toggle('is-hidden', entry.isIntersecting));
            }, { threshold: 0.1 });
            observer.observe(contactSection);
        }
    };
    
    const initFancybox = () => {
        if (typeof Fancybox !== 'undefined') {
            Fancybox.bind("[data-fancybox]", {});
        }
    };

    initApp();
});