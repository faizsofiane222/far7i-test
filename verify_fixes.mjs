import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read .env.local
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(
    envFile.split('\n')
        .filter(line => line.includes('='))
        .map(line => line.split('=').map(s => s.trim()))
);

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function verify() {
    console.log('--- Verifying Users & Roles ---');
    const { data: users } = await supabase.from('users').select('id, email, role');
    const { data: roles } = await supabase.from('user_roles').select('user_id, role');

    console.log(`Users count: ${users?.length || 0}`);
    console.log(`Roles count: ${roles?.length || 0}`);

    const missingInUsers = roles?.filter(r => !users?.some(u => u.id === r.user_id));
    console.log('Roles without matching Users:', missingInUsers);

    console.log('\n--- Verifying Test Provider Categories ---');
    const { data: ps } = await supabase.from('provider_services').select('provider_id, category_id');
    console.log('Provider Services entries:', ps?.length || 0);
    console.log('Sample entry:', ps?.[0]);

    if (ps?.length > 0) {
        console.log('SUCCESS: Seed data for provider categories is present.');
    } else {
        console.log('FAILURE: Seed data for provider categories is missing.');
    }

    if (missingInUsers?.length === 0) {
        console.log('SUCCESS: All roles have matching users (Sync OK).');
    } else {
        console.log('FAILURE: Some roles are missing user entries.');
    }
}

verify();
