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
    console.log("Applying SQL migration for lieu_reception...");

    const sqlContent = readFileSync('supabase/migrations/20260309100000_lieu_reception_updates.sql', 'utf8');

    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('exec_sql', { query: sqlContent });
    if (rpcError) {
        console.error("Migration failed via exec_sql:", rpcError);
        // Fallback: try doing it through raw query if supported, but usually it's not.
    } else {
        console.log("SQL deployed successfully!");
    }
}

run();
