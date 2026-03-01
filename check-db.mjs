import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Read .env.local
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(
    envFile.split('\n')
        .filter(line => line.includes('='))
        .map(line => line.split('=').map(s => s.trim()))
);

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function check() {
    console.log('Checking RPCs...');

    // Check if get_admin_platform_stats exists in information_schema
    const { data: rpcs, error: rpcError } = await supabase.rpc('get_admin_platform_stats');

    if (rpcError) {
        console.error('get_admin_platform_stats failed:', rpcError.message);
    } else {
        console.log('get_admin_platform_stats success:', rpcs);
    }

    // Check tables
    const { data: tables, error: tableError } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true });

    if (tableError) {
        console.error('conversations table check failed:', tableError);
    } else {
        console.log('conversations table exists.');
    }
}

check();
