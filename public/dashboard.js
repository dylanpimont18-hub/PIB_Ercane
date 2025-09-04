document.addEventListener('DOMContentLoaded', function() {
    const gallery = document.getElementById('admin-gallery');
    const logoutButton = document.getElementById('logout-btn');
    const uploadForm = document.getElementById('uploadForm');
    const uploadTypeRadios = document.querySelectorAll('input[name="uploadType"]');
    const singlePhotoFields = document.getElementById('singlePhoto-fields');
    const beforeAfterFields = document.getElementById('beforeAfter-fields');
    const submitButton = uploadForm.querySelector('button[type="submit"]');
    const formStatus = document.getElementById('form-status');

    const showStatusMessage = (message, isError = false) => {
        formStatus.textContent = message;
        formStatus.style.color = isError ? '#e74c3c' : '#2ecc71';
        formStatus.style.display = 'block';
        setTimeout(() => { formStatus.style.display = 'none'; }, 4000);
    };

    logoutButton.addEventListener('click', async () => {
        await fetch('/admin/logout', { method: 'POST' });
        window.location.href = '/admin.html';
    });
    
    uploadTypeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            singlePhotoFields.style.display = (e.target.value === 'single') ? 'block' : 'none';
            beforeAfterFields.style.display = (e.target.value === 'before-after') ? 'block' : 'none';
        });
    });

    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(uploadForm);
        
        submitButton.disabled = true;
        submitButton.textContent = 'Envoi en cours...';

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                showStatusMessage('Réalisation ajoutée avec succès !');
                uploadForm.reset();
                loadPhotos();
            } else {
                 if (response.status === 401) window.location.href = '/admin.html';
                const result = await response.json();
                showStatusMessage(`Erreur : ${result.error || 'Problème serveur'}`, true);
            }
        } catch (error) {
            showStatusMessage('Erreur de connexion. Veuillez réessayer.', true);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Ajouter la réalisation';
        }
    });

    async function loadPhotos() {
        try {
            const response = await fetch('/api/photos');
            if (response.status === 401) {
                window.location.href = '/admin.html';
                return;
            }
            if (!response.ok) throw new Error('Impossible de charger les photos.');
            
            const photos = await response.json();
            gallery.innerHTML = photos.length > 0 ? photos.map(createPhotoElement).join('') : '<p>Aucune réalisation à afficher.</p>';
        } catch (error) {
            gallery.innerHTML = `<p style="color: red;">${error.message}</p>`;
        }
    }

    function createPhotoElement(photo) {
        const isChecked = photo.is_featured ? 'checked' : '';
        let imageHtml = '';
        
        if (photo.type === 'single') {
            imageHtml = `<img src="${photo.image_url_single}" alt="Réalisation">`;
        } else {
            imageHtml = `
                <div class="dashboard-ba">
                    <img src="${photo.image_url_before}" alt="Avant">
                    <img src="${photo.image_url_after}" alt="Après">
                </div>
            `;
        }

        return `
            <div class="dashboard-item" data-id="${photo.id}">
                ${imageHtml}
                <p>${photo.description || '<i>Pas de description</i>'}</p>
                <div class="dashboard-actions">
                    <button class="delete-btn">Supprimer</button>
                    <label class="feature-label">
                        <input type="checkbox" class="feature-cb" ${isChecked}>
                        Mettre en avant
                    </label>
                </div>
            </div>
        `;
    }

    gallery.addEventListener('click', async (e) => {
        const item = e.target.closest('.dashboard-item');
        if (!item || !e.target.classList.contains('delete-btn')) return;
        
        const id = item.dataset.id;
        if (confirm('Voulez-vous vraiment supprimer cette réalisation ?')) {
            e.target.textContent = '...';
            e.target.disabled = true;
            const response = await fetch(`/api/delete/${id}`, { method: 'POST' });
            if (response.ok) item.remove();
            else alert('Erreur lors de la suppression.');
        }
    });
    
    gallery.addEventListener('change', async (e) => {
        const item = e.target.closest('.dashboard-item');
        if (!item || !e.target.classList.contains('feature-cb')) return;
        
        const id = item.dataset.id;
        const isFeatured = e.target.checked;

        await fetch(`/api/photos/${id}/feature`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isFeatured }),
        });
    });

    loadPhotos();
});