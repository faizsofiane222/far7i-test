-- Migration: Cleanup Junction Table Triggers (The real culprits)
-- These triggers were trying to update the score on the provider when services/events were modified.

-- 1. Drop trigger function first (cascades usually, but explicit is better)
DROP FUNCTION IF EXISTS public.trg_fn_junction_score_sync() CASCADE;

-- 2. Explicitly drop triggers just in case CASCADE didn't catch them or they were detached
DROP TRIGGER IF EXISTS trg_score_sync_services ON public.provider_services;
DROP TRIGGER IF EXISTS trg_score_sync_events ON public.provider_events;
DROP TRIGGER IF EXISTS trg_score_sync_travel ON public.provider_travel_zones;

-- 3. Double check for any other triggers on junction tables using the same logic
DO $$
DECLARE
    trg RECORD;
BEGIN
    FOR trg IN 
        SELECT trigger_name, event_object_table 
        FROM information_schema.triggers 
        WHERE trigger_name ILIKE '%score%' 
        AND event_object_table IN ('provider_services', 'provider_events', 'provider_travel_zones')
    LOOP
        EXECUTE 'DROP TRIGGER "' || trg.trigger_name || '" ON public.' || trg.event_object_table;
        RAISE NOTICE 'Dropped zombie trigger: % on %', trg.trigger_name, trg.event_object_table;
    END LOOP;
END $$;
