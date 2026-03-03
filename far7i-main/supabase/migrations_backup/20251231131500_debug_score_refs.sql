-- Diagnostics: List all triggers on providers and search for 'profile_completion_score' in definitions

DO $$
DECLARE
    r RECORD;
    found_count INTEGER := 0;
BEGIN
    RAISE NOTICE '--- Checking for remaining references to profile_completion_score ---';

    -- 1. List all triggers on providers
    FOR r IN 
        SELECT trigger_name, event_manipulation, event_object_table, action_statement
        FROM information_schema.triggers
        WHERE event_object_table = 'providers'
    LOOP
        RAISE NOTICE 'Trigger found: % on % (Action: %)', r.trigger_name, r.event_object_table, r.action_statement;
    END LOOP;

    -- 2. Search in all function definitions
    FOR r IN 
        SELECT routine_name, routine_definition
        FROM information_schema.routines
        WHERE routine_definition ILIKE '%profile_completion_score%'
        AND routine_schema = 'public'
    LOOP
         RAISE NOTICE 'FUNCTION REFERENCE FOUND: %', r.routine_name;
         found_count := found_count + 1;
    END LOOP;

    -- 3. Search in Views
    FOR r IN 
        SELECT table_name, view_definition
        FROM information_schema.views
        WHERE view_definition ILIKE '%profile_completion_score%'
        AND table_schema = 'public'
    LOOP
         RAISE NOTICE 'VIEW REFERENCE FOUND: %', r.table_name;
         found_count := found_count + 1;
    END LOOP;

    IF found_count = 0 THEN
        RAISE NOTICE 'No direct references found in functions or views.';
    ELSE
        RAISE WARNING 'Found % references. Please check the logs above.', found_count;
    END IF;

END $$;
