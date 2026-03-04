-- Migration to update service categories based on user request

TRUNCATE TABLE "public"."service_categories" CASCADE;

-- Insert the new categories with their labels and slugs
INSERT INTO "public"."service_categories" ("label", "slug") VALUES
('Lieu de réception (Salle des fêtes, hôtel...)', 'lieu_de_reception'),
('Traiteur (repas, restauration)', 'traiteur'),
('Photographe (photo & vidéo)', 'photographe'),
('DJ / Orchestre', 'dj_orchestre'),
('Animation musicale traditionnelle (zorna, karkabou, bendir...)', 'animation_musicale_traditionnelle'),
('Pièce montée & Tartes', 'piece_montee_tartes'),
('Gâteau traditionnel (vendu par pièce)', 'gateau_traditionnel'),
('Pâtisserie & Salés (vendus par pièce)', 'patisserie_sales'),
('Location des tenues', 'location_tenues'),
('Habilleuse (Négafa & mashta)', 'habilleuse'),
('Coiffure & beauté (coiffure & maquillage)', 'coiffure_beaute'),
('Location de voiture', 'location_voiture');
