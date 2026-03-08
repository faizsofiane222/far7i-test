-- ============================================================
-- FIX: Admin User Search + start_admin_conversation robustness
-- Version: 20260308110000
-- ============================================================

-- ROOT CAUSE: public.users RLS only allows users to read their own row.
-- An admin querying public.users directly from the frontend gets 0 results.
-- SOLUTION: SECURITY DEFINER RPC that bypasses RLS and only works for admins.

-- 1. Admin user search RPC (bypasses RLS, admin-only)
CREATE OR REPLACE FUNCTION public.search_users(p_query TEXT)
RETURNS TABLE(
    user_id UUID,
    display_name TEXT,
    email TEXT,
    role TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only admins can search users
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_roles.user_id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Accès refusé : réservé aux administrateurs.';
    END IF;

    RETURN QUERY
    SELECT 
        u.user_id,
        u.display_name,
        u.email,
        ur.role::TEXT
    FROM public.users u
    LEFT JOIN public.user_roles ur ON ur.user_id = u.user_id
    WHERE 
        u.display_name ILIKE '%' || p_query || '%'
        OR u.email ILIKE '%' || p_query || '%'
    ORDER BY u.display_name ASC NULLS LAST
    LIMIT 10;
END;
$$;

-- 2. Fix start_admin_conversation to inline admin check (no longer depends on is_admin())
CREATE OR REPLACE FUNCTION public.start_admin_conversation(
    p_target_user_id UUID,
    p_initial_message TEXT
)
RETURNS UUID AS $$
DECLARE
    v_conv_id UUID;
    v_admin_id UUID := auth.uid();
BEGIN
    -- Inline admin check (does NOT depend on is_admin() which references profiles)
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = v_admin_id AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only administrators can initiate these conversations.';
    END IF;

    -- Check if conversation already exists between these two users
    SELECT cp1.conversation_id INTO v_conv_id
    FROM public.conversation_participants cp1
    JOIN public.conversation_participants cp2 
        ON cp1.conversation_id = cp2.conversation_id
    WHERE cp1.user_id = v_admin_id 
      AND cp2.user_id = p_target_user_id
    LIMIT 1;

    -- If no existing conversation, create one
    IF v_conv_id IS NULL THEN
        INSERT INTO public.conversations (type, status)
        VALUES ('support', 'open')
        RETURNING id INTO v_conv_id;

        -- Add admin participant
        INSERT INTO public.conversation_participants (conversation_id, user_id)
        VALUES (v_conv_id, v_admin_id)
        ON CONFLICT DO NOTHING;

        -- Add target user participant
        INSERT INTO public.conversation_participants (conversation_id, user_id)
        VALUES (v_conv_id, p_target_user_id)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Insert the message
    INSERT INTO public.messages (conversation_id, sender_id, content)
    VALUES (v_conv_id, v_admin_id, p_initial_message);

    RETURN v_conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Grant permissions
GRANT EXECUTE ON FUNCTION public.search_users(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_admin_conversation(UUID, TEXT) TO authenticated;
