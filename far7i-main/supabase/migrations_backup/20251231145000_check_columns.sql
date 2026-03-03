-- Diagnostic: Check columns on services table
DO $$
DECLARE
    col RECORD;
BEGIN
    RAISE NOTICE '--- Columns in services table ---';
    FOR col IN 
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'services' 
    LOOP
        RAISE NOTICE '%', col.column_name;
    END LOOP;
END $$;
