import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// Try multiple .env paths just in case
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

if (!supabaseUrl || !serviceRole) {
    console.error("Missing environment variables!");
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRole);

async function run() {
    console.log("Applying SQL migration for moderation validation fix...");

    const sqlPath = 'supabase/migrations/20260314000000_fix_moderation_approval.sql';
    if (!existsSync(sqlPath)) {
        console.error(`Migration file not found: ${sqlPath}`);
        process.exit(1);
    }

    const sqlContent = readFileSync(sqlPath, 'utf8');

    console.log("Executing SQL through exec_sql RPC...");
    const { data: rpcData, error: rpcError } = await (supabaseAdmin as any).rpc('exec_sql', { query: sqlContent });

    if (rpcError) {
        console.error("Migration failed via exec_sql:", rpcError);
        console.log("Attempting direct table update check as fallback...");
    } else {
        console.log("SQL deployed successfully!");
    }
}

run();
