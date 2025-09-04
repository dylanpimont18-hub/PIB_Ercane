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
    };
    
    /**
     * Gère la soumission asynchrone du formulaire de contact vers le serveur.
     * NOTE : Pour un site 100% statique, ce formulaire ne fonctionnera pas sans backend.
     * Vous pouvez utiliser un service tiers comme Formspree ou Netlify Forms.
     */
    const initContactForm = () => {
        const form = document.getElementById('contact-form');
        if (!form) return;
        const status = document.getElementById('form-status');

        // La partie envoi de mail est désactivée car elle nécessite un serveur.
        form.addEventListener("submit", (event) => {
            event.preventDefault();
            status.textContent = "Le formulaire de contact n'est pas actif sur cette version statique.";
            status.style.color = 'orange';
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