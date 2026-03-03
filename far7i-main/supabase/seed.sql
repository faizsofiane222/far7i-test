-- Wilayas are populated via migrations (e.g. 20260228103000_insert_all_wilayas.sql)

-- Clear and seed categories
TRUNCATE TABLE public.service_categories CASCADE;
INSERT INTO public.service_categories (id, label, slug) VALUES
(gen_random_uuid(), 'Salle des fêtes / Lieu de réception', 'lieu_de_reception'),
(gen_random_uuid(), 'Traiteur (repas, restauration)', 'traiteur'),
(gen_random_uuid(), 'Photographe (photo & vidéo)', 'photographe'),
(gen_random_uuid(), 'DJ / Orchestre', 'dj_orchestre'),
(gen_random_uuid(), 'Animation musicale (zorna, karkabou)', 'animation_musicale_traditionnelle'),
(gen_random_uuid(), 'Pièce montée & Tartes', 'piece_montee_tartes'),
(gen_random_uuid(), 'Gâteau traditionnel', 'gateau_traditionnel'),
(gen_random_uuid(), 'Pâtisserie & Salés', 'patisserie_sales'),
(gen_random_uuid(), 'Location des tenues', 'location_tenues'),
(gen_random_uuid(), 'Habilleuse (Négafa & mashta)', 'habilleuse'),
(gen_random_uuid(), 'Coiffure & beauté', 'coiffure_beaute'),
(gen_random_uuid(), 'Location de voiture', 'location_voiture');

-- Clear and seed events
TRUNCATE TABLE public.event_types CASCADE;
INSERT INTO public.event_types (id, label, slug) VALUES
(gen_random_uuid(), 'Mariage', 'mariage'),
(gen_random_uuid(), 'Fiançailles (Khotba)', 'fiancailles'),
(gen_random_uuid(), 'Circoncision (Khitan)', 'circoncision'),
(gen_random_uuid(), 'Naissance (Sbou3)', 'naissance'),
(gen_random_uuid(), 'Soutenance', 'soutenance'),
(gen_random_uuid(), 'Anniversaire', 'anniversaire'),
(gen_random_uuid(), 'Événement d''entreprise', 'entreprise');
