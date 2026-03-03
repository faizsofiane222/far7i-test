-- Migration: Modification Notifications
-- Adds RPC to notify admins when a provider submits modifications

CREATE OR REPLACE FUNCTION public.notify_admins_of_modification(provider_id UUID)
RETURNS VOID AS $$
DECLARE
    provider_name TEXT;
BEGIN
    SELECT commercial_name INTO provider_name FROM public.providers WHERE id = provider_id;
    
    INSERT INTO public.notifications (user_id, type, title, message, link)
    SELECT 
        ur.user_id,
        'provider_modification',
        'Modification de profil à valider',
        'Le prestataire "' || COALESCE(provider_name, 'Inconnu') || '" a mis à jour son profil.',
        '/admin/moderation'
    FROM public.user_roles ur
    WHERE ur.role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
