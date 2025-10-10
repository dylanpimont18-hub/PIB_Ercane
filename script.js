document.addEventListener('DOMContentLoaded', () => {

    const initApp = () => {
        initStickyHeader();
        initMobileMenu();
        initScrollAnimations();
        initContactForm(); // On réactive cette fonction
        initFloatingButtonObserver();
        initFancybox();

        if (document.getElementById('realisations-gallery')) {
            loadRealisationsGallery();
        }
    };

    const loadRealisationsGallery = async () => {
        const galleryGrid = document.getElementById('realisations-gallery');
        if (!galleryGrid) return;

        try {
            const response = await fetch('/api/photos');
            if (!response.ok) {
                throw new Error('La réponse du serveur n\'est pas OK');
            }
            const images = await response.json();

            if (images.length === 0) {
                galleryGrid.innerHTML = '<p>Aucune réalisation à afficher pour le moment.</p>';
                return;
            }

            galleryGrid.innerHTML = ''; 

            images.forEach(imageFile => {
                const galleryItem = document.createElement('div');
                galleryItem.className = 'gallery__item';

                const title = imageFile
                    .replace(/\.(jpg|jpeg|png|gif)$/i, '')
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, l => l.toUpperCase());

                galleryItem.innerHTML = `
                    <a href="photos_autres/${imageFile}" data-fancybox="gallery" data-caption="${title}">
                        <img src="photos_autres/${imageFile}" alt="${title}" class="gallery__image">
                    </a>
                    <div class="gallery__caption">
                        <span class="gallery__caption-title">${title}</span>
                    </div>
                `;
                galleryGrid.appendChild(galleryItem);
            });
            
            Fancybox.bind("[data-fancybox='gallery']", {});

        } catch (error) {
            console.error('Erreur lors du chargement de la galerie:', error);
            galleryGrid.innerHTML = '<p>Impossible de charger les réalisations. Veuillez réessayer plus tard.</p>';
        }
    };
    
    // NOUVELLE FONCTION POUR LE FORMULAIRE AVEC FORMSPREE
    const initContactForm = () => {
        const form = document.getElementById('contact-form');
        const status = document.getElementById('form-status');
        if (!form || !status) return;

        form.addEventListener("submit", async (event) => {
            event.preventDefault(); // Empêche la redirection
            const formData = new FormData(form);

            status.textContent = "Envoi en cours...";
            status.style.color = 'gray';

            try {
                const response = await fetch(form.action, {
                    method: form.method,
                    body: formData,
                    headers: {
                        'Accept': 'application/json' // Important pour que Formspree ne redirige pas
                    }
                });

                if (response.ok) {
                    status.textContent = "Votre message a bien été envoyé !";
                    status.style.color = 'green';
                    form.reset(); // Vide les champs du formulaire
                } else {
                    const data = await response.json();
                    if (Object.hasOwn(data, 'errors')) {
                        status.textContent = data["errors"].map(error => error["message"]).join(", ");
                    } else {
                        status.textContent = "Une erreur s'est produite lors de l'envoi du message.";
                    }
                    status.style.color = 'red';
                }
            } catch (error) {
                status.textContent = "Impossible d'envoyer le message. Vérifiez votre connexion internet.";
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

    initApp();
});