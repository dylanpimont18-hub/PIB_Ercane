document.addEventListener('DOMContentLoaded', () => {

    const initApp = () => {
        initStickyHeader();
        initMobileMenu();
        initScrollAnimations();
        initContactForm(); // <-- On garde cette ligne
        initFloatingButtonObserver();
        initFancybox();
    };
    
    // La fonction est maintenant mise à jour pour envoyer les données au serveur
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
                    form.reset(); // Vide le formulaire après succès
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
