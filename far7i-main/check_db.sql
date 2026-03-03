select 'PROVIDERS_COUNT' as check_type, count(*) as value from public.providers;
select 'USERS_LIST' as check_type, id, email, role from public.users;
