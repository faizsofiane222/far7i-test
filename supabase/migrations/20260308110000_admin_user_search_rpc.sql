-- ============================================================
-- FIX DURABLE: Recherche utilisateurs pour messagerie admin
-- Version: 20260308110000 (overwrite)
-- ============================================================
-- RACINE DU PROBLÈME :
--   1. RLS de public.users : seul auth.uid() = user_id → admin voit 0 résultats
--   2. RPC search_users appelait is_admin() qui référençait public.profiles inexistante
--   3. start_admin_conversation dépendait de is_admin() cassée
-- ============================================================

-- STEP 1 : Ajouter policies RLS pour les admins
-- (IF NOT EXISTS n'existe pas pour POLICY, on DROP IF EXISTS d'abord)

DO $$
BEGIN
    -- Policy admin lecture complète sur public.users
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'users' 
        AND policyname = 'Admins can read all users'
    ) THEN
        EXECUTE $pol$
            CREATE POLICY "Admins can read all users" ON public.users
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM public.user_roles
                    WHERE user_roles.user_id = auth.uid() AND role = 'admin'
                )
            );
        $pol$;
    END IF;

    -- Policy admin lecture complète sur public.providers
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'providers' 
        AND policyname = 'Admins can read all providers'
    ) THEN
        EXECUTE $pol$
            CREATE POLICY "Admins can read all providers" ON public.providers
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM public.user_roles
                    WHERE user_roles.user_id = auth.uid() AND role = 'admin'
                )
            );
        $pol$;
    END IF;
END
$$;

-- STEP 2 : RPC de recherche d'utilisateurs pour le chat (SECURITY DEFINER = contourne RLS)
-- Cherche par display_name, email, OU commercial_name (prestataire)
DROP FUNCTION IF EXISTS public.search_users(TEXT);
DROP FUNCTION IF EXISTS public.search_users_for_chat(TEXT);

CREATE OR REPLACE FUNCTION public.search_users_for_chat(p_query TEXT)
RETURNS TABLE(
    user_id   UUID,
    display_name TEXT,
    email     TEXT,
    commercial_name TEXT,
    role      TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Vérification admin inline (sans dépendance à is_admin())
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Accès refusé : réservé aux administrateurs.';
    END IF;

    RETURN QUERY
    SELECT DISTINCT ON (u.user_id)
        u.user_id,
        u.display_name,
        u.email,
        p.commercial_name,
        ur.role::TEXT
    FROM public.users u
    LEFT JOIN public.user_roles ur ON ur.user_id = u.user_id
    LEFT JOIN public.providers p   ON p.user_id  = u.user_id
    WHERE 
        -- Ne pas retourner l'admin lui-même
        u.user_id != auth.uid()
        AND (
            u.display_name   ILIKE '%' || p_query || '%'
            OR u.email       ILIKE '%' || p_query || '%'
            OR p.commercial_name ILIKE '%' || p_query || '%'
        )
    ORDER BY u.user_id, u.display_name ASC NULLS LAST
    LIMIT 10;
END;
$$;

-- Alias pour compatibilité avec l'ancienne signature
CREATE OR REPLACE FUNCTION public.search_users(p_query TEXT)
RETURNS TABLE(
    user_id   UUID,
    display_name TEXT,
    email     TEXT,
    commercial_name TEXT,
    role      TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY SELECT * FROM public.search_users_for_chat(p_query);
END;
$$;

-- STEP 3 : fix start_admin_conversation — vérification admin inline, plus de dépendance à is_admin()
CREATE OR REPLACE FUNCTION public.start_admin_conversation(
    p_target_user_id UUID,
    p_initial_message TEXT
)
RETURNS UUID AS $$
DECLARE
    v_conv_id  UUID;
    v_admin_id UUID := auth.uid();
BEGIN
    -- Vérification admin inline
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = v_admin_id AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Seuls les administrateurs peuvent initier ces conversations.';
    END IF;

    -- Retrouver une conversation existante entre ces deux utilisateurs
    SELECT cp1.conversation_id INTO v_conv_id
    FROM public.conversation_participants cp1
    JOIN public.conversation_participants cp2
        ON cp1.conversation_id = cp2.conversation_id
    WHERE cp1.user_id = v_admin_id
      AND cp2.user_id = p_target_user_id
    LIMIT 1;

    -- Créer si inexistante
    IF v_conv_id IS NULL THEN
        INSERT INTO public.conversations (type, status)
        VALUES ('support', 'open')
        RETURNING id INTO v_conv_id;

        INSERT INTO public.conversation_participants (conversation_id, user_id)
        VALUES (v_conv_id, v_admin_id)
        ON CONFLICT DO NOTHING;

        INSERT INTO public.conversation_participants (conversation_id, user_id)
        VALUES (v_conv_id, p_target_user_id)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Insérer le message
    INSERT INTO public.messages (conversation_id, sender_id, content)
    VALUES (v_conv_id, v_admin_id, p_initial_message);

    RETURN v_conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 4: Permissions
GRANT EXECUTE ON FUNCTION public.search_users_for_chat(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_users(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_admin_conversation(UUID, TEXT) TO authenticated;
