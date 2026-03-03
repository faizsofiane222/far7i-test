-- Complete System Test for Moderation
-- Run these queries in Supabase Studio SQL Editor to diagnose the issue

-- TEST 1: Check if providers exist with pending status
SELECT 
    id,
    commercial_name,
    moderation_status,
    pending_changes,
    user_id,
    created_at
FROM public.providers
WHERE moderation_status = 'pending'
ORDER BY created_at DESC;

-- Expected: Should return at least 1 provider

-- TEST 2: Check if is_admin() function works
SELECT public.is_admin();

-- Expected: Should return true if you're logged in as admin

-- TEST 3: Check user roles
SELECT user_id, role
FROM public.user_roles
WHERE user_id = auth.uid();

-- Expected: Should show 'admin' role

-- TEST 4: Test the exact query used by frontend
SELECT 
    *
FROM public.providers
WHERE moderation_status = 'pending'
  AND pending_changes IS NULL
ORDER BY created_at DESC;

-- Expected: Should return providers

-- TEST 5: Test with wilaya join (like frontend)
SELECT 
    p.*,
    w.name as wilaya_name
FROM public.providers p
LEFT JOIN public.wilayas w ON p.wilaya_id = w.id
WHERE p.moderation_status = 'pending'
  AND p.pending_changes IS NULL
ORDER BY p.created_at DESC;

-- Expected: Should return providers with wilaya info

-- TEST 6: Check RLS policies on providers
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'providers';

-- Expected: Should show all RLS policies

-- TEST 7: Test get_moderation_stats function
SELECT public.get_moderation_stats();

-- Expected: Should return JSON with stats

-- TEST 8: Force bypass RLS to see if that's the issue
SET LOCAL ROLE postgres;
SELECT * FROM public.providers WHERE moderation_status = 'pending';
RESET ROLE;

-- If this returns data but normal query doesn't, it's an RLS issue
