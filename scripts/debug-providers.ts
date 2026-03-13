import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';

const envPaths = ['.env', '.env.local', '../.env'];
for (const p of envPaths) {
    const fullPath = resolve(process.cwd(), p);
    if (existsSync(fullPath)) {
        dotenv.config({ path: fullPath });
        break;
    }
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, serviceRole);

async function run() {
    const { data: users, error: usersErr } = await supabaseAdmin.from('users').select('id, user_id, status').limit(5);
    console.log("Users:", users);

    const { data: provs, error: provsErr } = await supabaseAdmin.from('providers').select('id, user_id, moderation_status').limit(5);
    console.log("Providers:", provs);
}
run();
