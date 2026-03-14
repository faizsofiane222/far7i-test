-- ============================================================
-- NOTIFICATIONS & AUDIT LOGS SYSTEM
-- ============================================================

-- 1. ENHANCE NOTIFICATIONS TABLE
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'data') THEN
        ALTER TABLE public.notifications ADD COLUMN data JSONB DEFAULT '{}'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'link') THEN
        ALTER TABLE public.notifications ADD COLUMN link TEXT;
    END IF;
    -- Rename 'read' to 'is_read' if preferred, but keep 'read' for compatibility if already used
END $$;

-- 2. CREATE PROVIDER REVISIONS (AUDIT LOGS)
CREATE TABLE IF NOT EXISTS public.provider_revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status_before TEXT,
    status_after TEXT,
    diff JSONB DEFAULT '{}'::jsonb,
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. HELPER: Calculate JSONB Diff
CREATE OR REPLACE FUNCTION public.calculate_provider_diff(p_provider_id UUID, p_updates JSONB)
RETURNS JSONB AS $$
DECLARE
    v_old_record RECORD;
    v_diff JSONB := '{}'::jsonb;
    v_key TEXT;
    v_old_val TEXT;
    v_new_val TEXT;
BEGIN
    SELECT * INTO v_old_record FROM public.providers WHERE id = p_provider_id;
    
    FOR v_key IN SELECT jsonb_object_keys(p_updates)
    LOOP
        -- Simple comparison as text for most fields
        EXECUTE format('SELECT ($1).%I::text', v_key) USING v_old_record INTO v_old_val;
        v_new_val := p_updates->>v_key;
        
        IF v_old_val IS DISTINCT FROM v_new_val THEN
            v_diff := v_diff || jsonb_build_object(v_key, jsonb_build_object('old', v_old_val, 'new', v_new_val));
        END IF;
    END LOOP;
    
    RETURN v_diff;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. TRIGGER: Notify Admin on Profile Update
CREATE OR REPLACE FUNCTION public.fn_on_provider_profile_update()
RETURNS TRIGGER AS $$
DECLARE
    v_admin_id UUID;
    v_diff JSONB;
BEGIN
    -- Check if pending_updates was just populated
    IF NEW.pending_updates IS NOT NULL AND (OLD.pending_updates IS NULL OR OLD.pending_updates <> NEW.pending_updates) THEN
        v_diff := public.calculate_provider_diff(NEW.id, NEW.pending_updates);
        
        -- Get any active admin to notify (or all)
        FOR v_admin_id IN SELECT user_id FROM public.user_roles WHERE role = 'admin'
        LOOP
            INSERT INTO public.notifications (user_id, type, title, message, data, link)
            VALUES (
                v_admin_id,
                'warning',
                'Mise à jour de profil à valider',
                'Un prestataire a soumis des modifications sur son profil.',
                jsonb_build_object(
                    'provider_id', NEW.id,
                    'commercial_name', NEW.commercial_name,
                    'diff', v_diff
                ),
                '/admin/moderation'
            );
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_on_provider_profile_update ON public.providers;
CREATE TRIGGER tr_on_provider_profile_update
    AFTER UPDATE ON public.providers
    FOR EACH ROW EXECUTE FUNCTION public.fn_on_provider_profile_update();

-- 5. TRIGGER: Notify Provider on Moderation Change (Users table for Profile status)
CREATE OR REPLACE FUNCTION public.fn_on_user_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.notifications (user_id, type, title, message, data)
        VALUES (
            NEW.user_id,
            CASE 
                WHEN NEW.status = 'approved' THEN 'success'
                WHEN NEW.status = 'rejected' THEN 'error'
                ELSE 'info'
            END,
            CASE 
                WHEN NEW.status = 'approved' THEN 'Profil Validé !'
                WHEN NEW.status = 'rejected' THEN 'Action Requise : Profil Refusé'
                ELSE 'Mise à jour de statut'
            END,
            CASE 
                WHEN NEW.status = 'approved' THEN 'Votre profil a été approuvé. Vous pouvez maintenant gérer vos prestations.'
                WHEN NEW.status = 'rejected' THEN 'Votre profil a été refusé suite à la modération. Consultez les remarques ci-dessous.'
                ELSE 'Votre statut a été mis à jour.'
            END,
            jsonb_build_object(
                'status', NEW.status,
                'rejection_reason', NEW.rejection_reason
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_on_user_status_change ON public.users;
CREATE TRIGGER tr_on_user_status_change
    AFTER UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.fn_on_user_status_change();

-- 6. TRIGGER: Welcome Notification on Signup
CREATE OR REPLACE FUNCTION public.fn_on_user_signup_notification()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role = 'provider' THEN
        INSERT INTO public.notifications (user_id, type, title, message)
        VALUES (
            NEW.user_id,
            'info',
            'Bienvenue sur FAR7I !',
            'Votre inscription est réussie. Complétez votre profil pour qu''il soit validé par notre équipe.'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_on_user_signup_notification ON public.user_roles;
CREATE TRIGGER tr_on_user_signup_notification
    AFTER INSERT ON public.user_roles
    FOR EACH ROW EXECUTE FUNCTION public.fn_on_user_signup_notification();

-- 7. CLEANUP OBSOLETE COLUMNS
DO $$ 
BEGIN
    ALTER TABLE public.providers DROP COLUMN IF EXISTS website_link;
    ALTER TABLE public.providers DROP COLUMN IF EXISTS years_of_experience;
    ALTER TABLE public.providers DROP COLUMN IF EXISTS willingness_to_travel;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 8. Final Notify
NOTIFY pgrst, 'reload schema';
