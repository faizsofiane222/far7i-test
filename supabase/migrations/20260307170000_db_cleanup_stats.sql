-- Migration to clean up database for statistics testing
-- This script deletes all users except zayeftest2@gmail.com and clears all data for that user.

DO $$
DECLARE
    v_keep_user_id UUID;
BEGIN
    -- 1. Identify the user to keep
    SELECT id INTO v_keep_user_id 
    FROM auth.users 
    WHERE email = 'zayeftest2@gmail.com';

    IF v_keep_user_id IS NULL THEN
        RAISE NOTICE 'User zayeftest2@gmail.com not found in auth.users. Proceeding cautiously...';
    ELSE
        RAISE NOTICE 'Keeping user ID: %', v_keep_user_id;
    END IF;

    -- 2. Delete all other users from auth.users
    -- This will cascade to public.users, public.user_roles, public.providers, etc.
    DELETE FROM auth.users 
    WHERE email != 'zayeftest2@gmail.com' OR email IS NULL;

    -- 3. Clear data for the kept user
    IF v_keep_user_id IS NOT NULL THEN
        -- Delete providers (services) - will cascade to media, prices, etc.
        DELETE FROM public.providers WHERE user_id = v_keep_user_id;

        -- Clear any residual analytics linked to this user (as viewer)
        DELETE FROM public.provider_views WHERE viewer_id = v_keep_user_id;
        DELETE FROM public.provider_leads WHERE viewer_id = v_keep_user_id;

        -- Clear reviews WRITTEN by this user (as client)
        DELETE FROM public.reviews WHERE client_id = v_keep_user_id;

        -- Clear notifications and messages
        DELETE FROM public.notifications WHERE user_id = v_keep_user_id;
        
        -- Clear messages in conversations involving the user
        DELETE FROM public.messages 
        WHERE conversation_id IN (
            SELECT id FROM public.conversations 
            WHERE participant1_id = v_keep_user_id OR participant2_id = v_keep_user_id
        );
        DELETE FROM public.conversations 
        WHERE participant1_id = v_keep_user_id OR participant2_id = v_keep_user_id;
    END IF;

    -- 4. Final safety check: Clean public.users if any orphans (shouldn't happen with CASCADE)
    DELETE FROM public.users WHERE user_id NOT IN (SELECT id FROM auth.users);
    
    RAISE NOTICE 'Database cleanup completed successfully.';
END $$;
