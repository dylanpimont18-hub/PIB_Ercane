document.addEventListener('DOMContentLoaded', () => {

    const initApp = () => {
        initStickyHeader();
        initMobileMenu();
        initScrollAnimations();
        initContactForm(); 
        initFloatingButtonObserver();
        initFancybox();

        // Ajout : Lancer la fonction pour charger la galerie
        // si nous sommes sur la bonne page.
        if (document.getElementById('realisations-gallery')) {
            loadRealisationsGallery();
        }
    };

    // NOUVELLE FONCTION pour charger la galerie dynamiquement
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

            // Vider la galerie avant de la remplir
            galleryGrid.innerHTML = ''; 

            images.forEach(imageFile => {
                const galleryItem = document.createElement('div');
                galleryItem.className = 'gallery__item';

                // Crée un nom de titre à partir du nom du fichier
                // exemple: "mon_image_super.jpg" -> "Mon Image Super"
                const title = imageFile
                    .replace(/\.(jpg|jpeg|png|gif)$/i, '') // enlève l'extension
                    .replace(/_/g, ' ') // remplace les underscores par des espaces
                    .replace(/\b\w/g, l => l.toUpperCase()); // met la première lettre de chaque mot en majuscule

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
            
            // Une fois que toutes les images sont ajoutées au DOM,
            // on ré-initialise Fancybox pour qu'il les prenne en compte.
            Fancybox.bind("[data-fancybox='gallery']", {});

        } catch (error) {
            console.error('Erreur lors du chargement de la galerie:', error);
            galleryGrid.innerHTML = '<p>Impossible de charger les réalisations. Veuillez réessayer plus tard.</p>';
        }
    };
    
    const initContactForm = () => {
        const form = document.getElementById('contact-form');
        if (!form) return;
        
        const status = document.getElementById('form-status');

        form.addEventListener("submit", async (event) => {
            event.preventDefault();

            status.textContent = "Envoi en cours...";
            status.style.color = 'gray';

            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch('/send-email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                });

                const result = await response.json();

                if (result.success) {
                    status.textContent = result.message;
                    status.style.color = 'green';
                    form.reset();
                } else {
                    status.textContent = result.message || "Une erreur s'est produite.";
                    status.style.color = 'red';
                }
            } catch (error) {
                console.error('Erreur lors de la soumission du formulaire:', error);
                status.textContent = "Impossible de contacter le serveur. Veuillez réessayer plus tard.";
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