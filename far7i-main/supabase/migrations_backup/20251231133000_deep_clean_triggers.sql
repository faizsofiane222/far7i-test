-- Diagnostics V2: Deep Inspection of Triggers
DO $$
DECLARE
    t_rec RECORD;
    func_src TEXT;
BEGIN
    RAISE NOTICE '=== STARTING DEEP TRIGGER INSPECTION ===';
    
    FOR t_rec IN 
        SELECT 
            t.trigger_name, 
            t.event_object_table, 
            p.proname as func_name,
            pg_get_functiondef(p.oid) as func_definition
        FROM information_schema.triggers t
        JOIN pg_proc p ON t.action_statement LIKE '%HEAD ' || p.proname || '(%)%' OR t.action_statement LIKE '%FUNCTION ' || p.proname || '(%)%' 
             OR t.action_statement LIKE '%FUNCTION ' || p.proname || '()' -- Try to match function name
             -- A rough join, let's rely on name matching if standard simple trigger
        WHERE t.event_object_table = 'providers'
    LOOP
        -- Note: The join above is tricky because action_statement is "EXECUTE FUNCTION funcname()".
        -- Let's just search by name.
    END LOOP;
END $$;

-- Simplified approach using pg_catalog
DO $$
DECLARE
    r RECORD;
    src TEXT;
BEGIN
    FOR r IN 
        SELECT trg.tgname AS trigger_name,
               cls.relname AS table_name,
               proc.proname AS function_name,
               pg_get_functiondef(proc.oid) AS definition
        FROM pg_trigger trg
        JOIN pg_class cls ON trg.tgrelid = cls.oid
        JOIN pg_proc proc ON trg.tgfoid = proc.oid
        WHERE cls.relname = 'providers'
        AND NOT trg.tgisinternal
    LOOP
        RAISE NOTICE 'Trigger: % on Table: % calls Function: %', r.trigger_name, r.table_name, r.function_name;
        
        IF r.definition ILIKE '%profile_completion_score%' THEN
            RAISE WARNING '!!! OFFENDER FOUND !!! Function "%" references profile_completion_score.', r.function_name;
            RAISE NOTICE 'Definition snippet: %', substring(r.definition from '%profile_completion_score%');
            
            -- Attempt to drop
            EXECUTE 'DROP TRIGGER ' || quote_ident(r.trigger_name) || ' ON public.providers';
            RAISE NOTICE 'Dropped trigger: %', r.trigger_name;
            
            EXECUTE 'DROP FUNCTION public.' || quote_ident(r.function_name) || ' CASCADE';
            RAISE NOTICE 'Dropped function: %', r.function_name;
        ELSE
            RAISE NOTICE 'Function % seems clean.', r.function_name;
        END IF; 
    END LOOP;
END $$;
