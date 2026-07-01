-- À exécuter dans Supabase Dashboard > SQL Editor
-- (le bucket "media" doit être créé au préalable via Storage > New bucket, voir guide)

-- === TABLES ===

create table public.projects (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    description text,
    before_image_path text,
    after_image_path text,
    video_path text,
    sort_order int not null default 0,
    created_at timestamptz not null default now()
);

create table public.testimonials (
    id uuid primary key default gen_random_uuid(),
    author_name text not null,
    rating int not null check (rating between 1 and 5),
    text text not null,
    is_visible boolean not null default true,
    sort_order int not null default 0,
    created_at timestamptz not null default now()
);

-- === RLS ===

alter table public.projects enable row level security;
alter table public.testimonials enable row level security;

create policy "projects_public_read" on public.projects
    for select using (true);

create policy "projects_admin_write" on public.projects
    for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "testimonials_public_read" on public.testimonials
    for select using (is_visible = true);

create policy "testimonials_admin_write" on public.testimonials
    for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- === STORAGE (bucket "media" déjà créé en public via le dashboard) ===

create policy "media_public_read" on storage.objects
    for select using (bucket_id = 'media');

create policy "media_admin_write" on storage.objects
    for insert with check (bucket_id = 'media' and auth.role() = 'authenticated');

create policy "media_admin_delete" on storage.objects
    for delete using (bucket_id = 'media' and auth.role() = 'authenticated');

-- === MIGRATION DES 6 PHOTOS EXISTANTES ===
-- À exécuter APRÈS avoir uploadé ces fichiers (depuis photos_autres/) dans le bucket "media"
-- via Storage > media > Upload files, en gardant les mêmes noms.

insert into public.projects (title, description, before_image_path, after_image_path, sort_order) values
    ('Aménagement de Combles', 'Transformation complète d''un grenier en un espace de vie lumineux.', 'avant_1.jpg', 'apres_1.jpg', 0),
    ('Isolation sous Rampants', 'Isolation et finition placo pour un confort thermique optimal.', 'avant_2.jpg', 'apres_2.jpg', 1);

insert into public.projects (title, description, after_image_path, sort_order) values
    ('Meuble TV sur Mesure', 'Intégration d''un meuble TV design avec niches de rangement.', 'meuble_tv.jpg', 2),
    ('Création de Salle d''eau', 'Préparation des murs et plafonds avec des plaques hydrofuges.', 'salle_d_eau.jpg', 3);

-- === MIGRATION DES 4 AVIS EXISTANTS (codés en dur dans index.html) ===

insert into public.testimonials (author_name, rating, text, sort_order) values
    ('Avis Google vérifié', 5, 'Très satisfait de cette prestation. Artisan réactif, disponible et à l''écoute. Le travail réalisé est de grande qualité avec des finitions soignées. Je recommande vivement pour son professionnalisme et son sérieux.', 0),
    ('Avis Google vérifié', 5, 'Excellent plaquiste ! Travail soigné, finitions impeccables et chantier propre. Professionnel, ponctuel et de bon conseil. Je recommande sans hésiter.', 1),
    ('Avis Google vérifié', 5, 'Une équipe vraiment à l''écoute, disponible et sympathique. Les travaux de rénovation ont été faits avec soin. Je recommande sans hésitation.', 2),
    ('Avis Google vérifié', 5, 'Très satisfait de la société PIB pour l''exécution de travaux dans mon salon. Travail sérieux, propre et professionnel. Adressez-vous à PIB sans hésiter.', 3);
