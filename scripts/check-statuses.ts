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

const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
);

async function run() {
    // 1. Fetch recent providers
    const { data: providers, error: provErr } = await supabaseAdmin
        .from('providers')
        .select('id, commercial_name, moderation_status, pending_changes, user_id, status')
        .order('created_at', { ascending: false })
        .limit(5);

    if (provErr) {
        console.error("Error fetching providers:", provErr);
    } else {
        console.log("=== Recent Providers ===");
        providers.forEach(p => console.log(`- ${p.commercial_name}: ModStatus='${p.moderation_status}', Status='${p.status}', Pending=${!!p.pending_changes}`));
    }

    // 2. Fetch users
    const { data: users, error: userErr } = await supabaseAdmin
        .from('users')
        .select('id, user_id, status')
        .order('created_at', { ascending: false })
        .limit(5);

    if (userErr) {
        console.error("Error fetching users:", userErr);
    } else {
        console.log("\n=== Recent Users ===");
        users.forEach(u => console.log(`- User ${u.display_name || u.id}: Status='${u.status}', AuthID='${u.user_id}'`));
    }
}

run();
