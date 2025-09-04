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
        loadFeaturedGallery(); // Appelle la fonction qui charge les données depuis l'API
    };

    /**
     * Charge uniquement les réalisations "mises en avant" depuis l'API pour la page d'accueil.
     */
    const loadFeaturedGallery = async () => {
        const galleryContainer = document.getElementById('realisations-gallery');
        if (!galleryContainer) return;

        try {
            const response = await fetch('/api/photos?featured=true');
            if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
            const photosToShow = await response.json();

            if (photosToShow.length === 0) {
                galleryContainer.innerHTML = '<p>Aucune réalisation à afficher pour le moment.</p>';
                return;
            }

            galleryContainer.innerHTML = photosToShow.map(photo => {
                const descriptionHTML = `<div class="gallery__caption"><span class="gallery__caption-title">${photo.description || ''}</span></div>`;
                if (photo.type === 'single') {
                    return `
                        <div class="gallery__item">
                            <a href="${photo.image_url_single}" data-fancybox="gallery" data-caption="${photo.description || ''}">
                                <img src="${photo.image_url_single}" alt="Réalisation" class="gallery__image">
                            </a>
                            ${descriptionHTML}
                        </div>`;
                } else { // 'before-after'
                    return `
                        <div class="gallery__item">
                            <div class="before-after__container">
                                <div class="before-after__image-wrapper">
                                    <span class="before-after__label">AVANT</span>
                                    <a href="${photo.image_url_before}" data-fancybox="gallery-${photo.id}" data-caption="Avant: ${photo.description || ''}">
                                        <img src="${photo.image_url_before}" alt="Avant" class="gallery__image">
                                    </a>
                                </div>
                                <div class="before-after__image-wrapper">
                                    <span class="before-after__label">APRÈS</span>
                                    <a href="${photo.image_url_after}" data-fancybox="gallery-${photo.id}" data-caption="Après: ${photo.description || ''}">
                                        <img src="${photo.image_url_after}" alt="Après" class="gallery__image">
                                    </a>
                                </div>
                            </div>
                            ${descriptionHTML}
                        </div>`;
                }
            }).join('');
            
            if (typeof Fancybox !== 'undefined') {
                Fancybox.unbind(galleryContainer);
                Fancybox.bind(galleryContainer, "[data-fancybox]", {});
            }

        } catch (error) {
            console.error('Erreur de chargement des photos:', error);
            galleryContainer.innerHTML = '<p style="color:red;">Impossible de charger les réalisations.</p>';
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

    // Lance l'application
    initApp();
});