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
        if (document.getElementById('reviews-list')) {
            loadTestimonials();
        }
    };

    const mediaPublicUrl = (path) => {
        return supabaseClient.storage.from('media').getPublicUrl(path).data.publicUrl;
    };

    const loadRealisationsGallery = async () => {
        const galleryGrid = document.getElementById('realisations-gallery');
        if (!galleryGrid) return;

        try {
            const { data: projects, error } = await supabaseClient
                .from('projects')
                .select('*')
                .order('sort_order', { ascending: true });

            if (error) throw error;

            if (!projects || projects.length === 0) {
                galleryGrid.innerHTML = '<p>Aucune réalisation à afficher pour le moment.</p>';
                return;
            }

            galleryGrid.innerHTML = '';

            projects.forEach(project => {
                const galleryItem = document.createElement('div');
                galleryItem.className = 'gallery__item';
                galleryItem.innerHTML = buildProjectMarkup(project);
                galleryGrid.appendChild(galleryItem);
            });

            Fancybox.bind("[data-fancybox='gallery']", {});

        } catch (error) {
            console.error('Erreur lors du chargement de la galerie:', error);
            galleryGrid.innerHTML = '<p>Impossible de charger les réalisations. Veuillez réessayer plus tard.</p>';
        }
    };

    const buildProjectMarkup = (project) => {
        const { title, description, before_image_path, after_image_path, video_path } = project;

        if (before_image_path && after_image_path) {
            const beforeUrl = mediaPublicUrl(before_image_path);
            const afterUrl = mediaPublicUrl(after_image_path);
            return `
                <div class="before-after__container">
                    <div class="before-after__image-wrapper">
                        <span class="before-after__label">AVANT</span>
                        <a href="${beforeUrl}" data-fancybox="gallery" data-caption="Avant: ${title}">
                            <img src="${beforeUrl}" alt="Avant: ${title}" class="gallery__image">
                        </a>
                    </div>
                    <div class="before-after__image-wrapper">
                        <span class="before-after__label">APRÈS</span>
                        <a href="${afterUrl}" data-fancybox="gallery" data-caption="Après: ${title}">
                            <img src="${afterUrl}" alt="Après: ${title}" class="gallery__image">
                        </a>
                    </div>
                </div>
                <div class="gallery__caption">
                    <h3 class="gallery__caption-title">${title}</h3>
                    <p class="gallery__caption-text">${description || ''}</p>
                </div>
            `;
        }

        if (video_path) {
            const videoUrl = mediaPublicUrl(video_path);
            return `
                <video src="${videoUrl}" class="gallery__image gallery__image--single" controls></video>
                <div class="gallery__caption">
                    <h3 class="gallery__caption-title">${title}</h3>
                    <p class="gallery__caption-text">${description || ''}</p>
                </div>
            `;
        }

        const imagePath = after_image_path || before_image_path;
        const imageUrl = mediaPublicUrl(imagePath);
        return `
            <a href="${imageUrl}" data-fancybox="gallery" data-caption="${title}">
                <img src="${imageUrl}" alt="${title}" class="gallery__image gallery__image--single">
                <div class="gallery__overlay">
                    <h3 class="gallery__caption-title">${title}</h3>
                    <p class="gallery__caption-text">${description || ''}</p>
                </div>
            </a>
        `;
    };

    const loadTestimonials = async () => {
        const reviewsGrid = document.getElementById('reviews-list');
        if (!reviewsGrid) return;

        try {
            const { data: testimonials, error } = await supabaseClient
                .from('testimonials')
                .select('*')
                .eq('is_visible', true)
                .order('sort_order', { ascending: true });

            if (error) throw error;
            if (!testimonials || testimonials.length === 0) return; // garde les avis codés en dur en secours

            reviewsGrid.innerHTML = '';
            testimonials.forEach(review => {
                const card = document.createElement('div');
                card.className = 'review-card is-visible';
                const stars = '<i class="fa-solid fa-star"></i>'.repeat(review.rating);
                card.innerHTML = `
                    <div class="review-card__stars" aria-label="${review.rating} étoiles sur 5">${stars}</div>
                    <p class="review-card__text">« ${review.text} »</p>
                    <p class="review-card__author">${review.author_name}</p>
                `;
                reviewsGrid.appendChild(card);
            });
        } catch (error) {
            console.error('Erreur lors du chargement des avis:', error); // garde les avis codés en dur en secours
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