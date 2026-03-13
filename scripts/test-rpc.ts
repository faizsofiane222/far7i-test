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
    // 1. Find a pending provider
    const { data: pendingProviders, error: fetchErr } = await supabaseAdmin
        .from('providers')
        .select('id, commercial_name, moderation_status, user_id, status')
        .or('moderation_status.eq.pending,status.eq.pending')
        .limit(1);

    if (fetchErr) {
        console.error("Error fetching pending providers:", fetchErr);
        return;
    }

    if (!pendingProviders || pendingProviders.length === 0) {
        console.log("No pending providers found.");
        return;
    }

    const target = pendingProviders[0];
    console.log("Targeting Provider:", target);

    // 2. Call the RPC directly
    console.log(`\nCalling approve_moderation_item('providers', '${target.id}')...`);
    const { data: rpcResult, error: rpcErr } = await supabaseAdmin.rpc('approve_moderation_item', {
        p_table: 'providers',
        p_id: target.id
    });

    console.log("RPC Result:", rpcResult);
    if (rpcErr) console.error("RPC Error:", rpcErr);

    // 3. Verify the change
    const { data: updatedTarget } = await supabaseAdmin
        .from('providers')
        .select('id, commercial_name, moderation_status, status')
        .eq('id', target.id)
        .single();

    console.log("\nAfter RPC Provider State:", updatedTarget);

    // 4. Verify user state
    const { data: updatedUser } = await supabaseAdmin
        .from('users')
        .select('id, status')
        .eq('user_id', target.user_id)
        .maybeSingle();

    console.log("After RPC User State:", updatedUser);
}

run();
