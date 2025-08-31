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
        initContactForm(); // C'est cette fonction qui est modifiée
        initFloatingButtonObserver();
        initFancybox();
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
            const jsonData = Object.fromEntries(data.entries()); // Convertir FormData en objet JSON

            try {
                const response = await fetch(event.target.action, {
                    method: form.method,
                    // On envoie les données en JSON
                    body: JSON.stringify(jsonData),
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json' // Préciser qu'on envoie du JSON
                    }
                });

                // On récupère la réponse JSON du serveur
                const responseData = await response.json();

                if (response.ok) {
                    status.textContent = responseData.message; // Message de succès du serveur
                    status.style.color = 'green';
                    form.reset();
                } else {
                    status.textContent = responseData.message || "Oops! Une erreur s'est produite."; // Message d'erreur du serveur
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

    // Lance l'application
    initApp();
});