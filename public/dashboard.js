document.addEventListener('DOMContentLoaded', function() {
    const gallery = document.getElementById('admin-gallery');
    const logoutButton = document.getElementById('logout-btn');
    const uploadForm = document.getElementById('uploadForm');
    const uploadTypeRadios = document.querySelectorAll('input[name="uploadType"]');
    const singlePhotoFields = document.getElementById('singlePhoto-fields');
    const beforeAfterFields = document.getElementById('beforeAfter-fields');

    // Déconnexion
    logoutButton.addEventListener('click', async () => {
        await fetch('/admin/logout', { method: 'POST' });
        window.location.href = '/admin.html';
    });
    
    // Gérer le changement de type d'upload
    uploadTypeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'single') {
                singlePhotoFields.style.display = 'block';
                beforeAfterFields.style.display = 'none';
            } else {
                singlePhotoFields.style.display = 'none';
                beforeAfterFields.style.display = 'block';
            }
        });
    });

    // Gérer l'upload du formulaire
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(uploadForm);
        
        // Nettoyer le FormData en fonction du type de réalisation
        const uploadType = formData.get('uploadType');
        if (uploadType === 'single') {
            formData.delete('photo_avant');
            formData.delete('photo_apres');
        } else {
            formData.delete('photo');
        }
        formData.delete('uploadType');


        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            uploadForm.reset();
            loadPhotos();
        } else {
            const result = await response.json();
            alert(`Erreur lors de l'upload : ${result.error}`);
        }
    });


    // Charger les photos
    async function loadPhotos() {
        const response = await fetch('/api/photos');
        if (response.status === 401) {
            window.location.href = '/admin.html';
            return;
        }
        const photos = await response.json();
        gallery.innerHTML = '';
        photos.reverse().forEach(photo => { // reverse() pour voir les plus récents en premier
            gallery.innerHTML += createPhotoElement(photo);
        });
    }

    function createPhotoElement(photo) {
        const isChecked = photo.isFeatured ? 'checked' : '';
        let imageHtml = '';
        // MODIFICATION: Changer le chemin des images
        if (photo.type === 'single') {
            imageHtml = `<img src="/uploads/${photo.filename}" alt="Réalisation">`;
        } else {
            imageHtml = `
                <div class="dashboard-ba">
                    <img src="/uploads/${photo.filename_before}" alt="Avant">
                    <img src="/uploads/${photo.filename_after}" alt="Après">
                </div>
            `;
        }

        return `
            <div class="dashboard-item">
                ${imageHtml}
                <p>${photo.description || '<i>Pas de description</i>'}</p>
                <div class="dashboard-actions">
                    <button class="delete-btn" data-id="${photo.id}">Supprimer</button>
                    <label class="feature-label">
                        <input type="checkbox" class="feature-cb" data-id="${photo.id}" ${isChecked}>
                        Mettre en avant
                    </label>
                </div>
            </div>
        `;
    }

    // Gérer les actions (suppression, mise en avant)
    gallery.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        if (e.target.classList.contains('delete-btn')) {
            if (confirm('Voulez-vous vraiment supprimer cette réalisation ?')) {
                await fetch(`/api/delete/${id}`, { method: 'POST' });
                loadPhotos();
            }
        }
    });

    gallery.addEventListener('change', async (e) => {
        const id = e.target.dataset.id;
        if (e.target.classList.contains('feature-cb')) {
            const isFeatured = e.target.checked;
            await fetch(`/api/photos/${id}/feature`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isFeatured })
            });
            loadPhotos();
        }
    });

    // Charger les photos au démarrage
    loadPhotos();
});