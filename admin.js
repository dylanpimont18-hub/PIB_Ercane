document.addEventListener('DOMContentLoaded', () => {

    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');

    const showDashboard = () => {
        loginSection.style.display = 'none';
        dashboardSection.classList.add('is-active');
        loadProjects();
        loadTestimonialsAdmin();
    };

    const showLogin = () => {
        loginSection.style.display = 'block';
        dashboardSection.classList.remove('is-active');
    };

    const initAuth = async () => {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            showDashboard();
        } else {
            showLogin();
        }

        supabaseClient.auth.onAuthStateChange((_event, session) => {
            if (session) {
                showDashboard();
            } else {
                showLogin();
            }
        });
    };

    const initLoginForm = () => {
        const form = document.getElementById('login-form');
        const errorEl = document.getElementById('login-error');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorEl.textContent = '';
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
            if (error) {
                errorEl.textContent = "Email ou mot de passe incorrect.";
            }
        });
    };

    const initLogout = () => {
        document.getElementById('logout-button').addEventListener('click', async () => {
            await supabaseClient.auth.signOut();
        });
    };

    const initTabs = () => {
        const buttons = document.querySelectorAll('.admin-tabs__button');
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                buttons.forEach(b => b.classList.remove('is-active'));
                document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('is-active'));
                button.classList.add('is-active');
                document.getElementById(`panel-${button.dataset.tab}`).classList.add('is-active');
            });
        });
    };

    const isSessionError = (error) => error && /session|jwt|auth/i.test(error.message || '');

    const handleSessionError = (error, errorEl) => {
        if (isSessionError(error)) {
            errorEl.textContent = "Session expirée, reconnectez-vous.";
            supabaseClient.auth.signOut();
        } else {
            errorEl.textContent = "Une erreur s'est produite : " + error.message;
        }
    };

    // === RÉALISATIONS ===

    const uploadMedia = async (file) => {
        if (!file) return null;
        const path = `${Date.now()}-${file.name}`;
        const { error } = await supabaseClient.storage.from('media').upload(path, file);
        if (error) throw error;
        return path;
    };

    const initProjectForm = () => {
        const form = document.getElementById('project-form');
        const errorEl = document.getElementById('project-form-error');
        const successEl = document.getElementById('project-form-success');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorEl.textContent = '';
            successEl.textContent = '';

            const title = document.getElementById('project-title').value;
            const description = document.getElementById('project-description').value;
            const beforeFile = document.getElementById('project-before').files[0];
            const afterFile = document.getElementById('project-after').files[0];
            const videoFile = document.getElementById('project-video').files[0];

            if (!beforeFile && !afterFile && !videoFile) {
                errorEl.textContent = "Ajoutez au moins une photo ou une vidéo.";
                return;
            }

            try {
                const [before_image_path, after_image_path, video_path] = await Promise.all([
                    uploadMedia(beforeFile),
                    uploadMedia(afterFile),
                    uploadMedia(videoFile),
                ]);

                const { error } = await supabaseClient.from('projects').insert({
                    title, description, before_image_path, after_image_path, video_path,
                });
                if (error) throw error;

                successEl.textContent = "Réalisation ajoutée.";
                form.reset();
                loadProjects();
            } catch (error) {
                handleSessionError(error, errorEl);
            }
        });
    };

    const loadProjects = async () => {
        const list = document.getElementById('projects-list');
        const { data: projects, error } = await supabaseClient
            .from('projects')
            .select('*')
            .order('sort_order', { ascending: true });

        if (error) {
            list.innerHTML = `<p>Impossible de charger les réalisations : ${error.message}</p>`;
            return;
        }

        list.innerHTML = '';
        (projects || []).forEach(project => {
            const item = document.createElement('div');
            item.className = 'admin-list__item';

            const thumbs = [project.before_image_path, project.after_image_path]
                .filter(Boolean)
                .map(p => `<img src="${publicUrl(p)}" alt="">`).join('');
            const videoThumb = project.video_path
                ? `<video src="${publicUrl(project.video_path)}"></video>` : '';

            item.innerHTML = `
                <div class="admin-list__thumbs">${thumbs}${videoThumb}</div>
                <div class="admin-list__info">
                    <p class="admin-list__title">${project.title}</p>
                    <p>${project.description || ''}</p>
                </div>
                <div class="admin-list__actions">
                    <button class="button button--danger button--small" data-id="${project.id}">Supprimer</button>
                </div>
            `;
            item.querySelector('button').addEventListener('click', () => deleteProject(project));
            list.appendChild(item);
        });
    };

    const deleteProject = async (project) => {
        if (!confirm(`Supprimer la réalisation "${project.title}" ?`)) return;

        const paths = [project.before_image_path, project.after_image_path, project.video_path].filter(Boolean);

        const { error: deleteError } = await supabaseClient.from('projects').delete().eq('id', project.id);
        if (deleteError) {
            alert("Impossible de supprimer la réalisation : " + deleteError.message);
            return;
        }

        if (paths.length > 0) {
            const { error: storageError } = await supabaseClient.storage.from('media').remove(paths);
            if (storageError) {
                alert("La réalisation a été supprimée, mais certains fichiers médias n'ont pas pu être supprimés du stockage : " + storageError.message);
            }
        }

        loadProjects();
    };

    const publicUrl = (path) => supabaseClient.storage.from('media').getPublicUrl(path).data.publicUrl;

    // === AVIS CLIENTS ===

    const initTestimonialForm = () => {
        const form = document.getElementById('testimonial-form');
        const errorEl = document.getElementById('testimonial-form-error');
        const successEl = document.getElementById('testimonial-form-success');
        const cancelButton = document.getElementById('testimonial-cancel-edit');
        const idField = document.getElementById('testimonial-id');
        const titleEl = document.getElementById('testimonial-form-title');

        const resetForm = () => {
            form.reset();
            idField.value = '';
            titleEl.textContent = 'Ajouter un avis';
            cancelButton.style.display = 'none';
        };

        cancelButton.addEventListener('click', resetForm);

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorEl.textContent = '';
            successEl.textContent = '';

            const payload = {
                author_name: document.getElementById('testimonial-author').value,
                rating: parseInt(document.getElementById('testimonial-rating').value, 10),
                text: document.getElementById('testimonial-text').value,
                is_visible: document.getElementById('testimonial-visible').checked,
            };

            try {
                const id = idField.value;
                const { error } = id
                    ? await supabaseClient.from('testimonials').update(payload).eq('id', id)
                    : await supabaseClient.from('testimonials').insert(payload);
                if (error) throw error;

                successEl.textContent = "Avis enregistré.";
                resetForm();
                loadTestimonialsAdmin();
            } catch (error) {
                handleSessionError(error, errorEl);
            }
        });

        return { startEdit: (testimonial) => {
            idField.value = testimonial.id;
            document.getElementById('testimonial-author').value = testimonial.author_name;
            document.getElementById('testimonial-rating').value = testimonial.rating;
            document.getElementById('testimonial-text').value = testimonial.text;
            document.getElementById('testimonial-visible').checked = testimonial.is_visible;
            titleEl.textContent = "Modifier l'avis";
            cancelButton.style.display = 'inline-block';
            window.scrollTo({ top: form.offsetTop, behavior: 'smooth' });
        }};
    };

    let testimonialFormApi;

    const loadTestimonialsAdmin = async () => {
        const list = document.getElementById('testimonials-list');
        const { data: testimonials, error } = await supabaseClient
            .from('testimonials')
            .select('*')
            .order('sort_order', { ascending: true });

        if (error) {
            list.innerHTML = `<p>Impossible de charger les avis : ${error.message}</p>`;
            return;
        }

        list.innerHTML = '';
        (testimonials || []).forEach(testimonial => {
            const item = document.createElement('div');
            item.className = 'admin-list__item';
            const stars = '★'.repeat(testimonial.rating);

            item.innerHTML = `
                <div class="admin-list__info">
                    <p class="admin-list__title">${testimonial.author_name} <span class="admin-list__stars">${stars}</span></p>
                    <p>${testimonial.text}</p>
                    <p>${testimonial.is_visible ? 'Visible' : 'Masqué'}</p>
                </div>
                <div class="admin-list__actions">
                    <button class="button button--small" data-action="edit">Modifier</button>
                    <button class="button button--danger button--small" data-action="delete">Supprimer</button>
                </div>
            `;
            item.querySelector('[data-action="edit"]').addEventListener('click', () => testimonialFormApi.startEdit(testimonial));
            item.querySelector('[data-action="delete"]').addEventListener('click', () => deleteTestimonial(testimonial));
            list.appendChild(item);
        });
    };

    const deleteTestimonial = async (testimonial) => {
        if (!confirm(`Supprimer l'avis de "${testimonial.author_name}" ?`)) return;
        const { error } = await supabaseClient.from('testimonials').delete().eq('id', testimonial.id);
        if (error) {
            alert("Impossible de supprimer l'avis : " + error.message);
            return;
        }
        loadTestimonialsAdmin();
    };

    initAuth();
    initLoginForm();
    initLogout();
    initTabs();
    initProjectForm();
    testimonialFormApi = initTestimonialForm();
});
