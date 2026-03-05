import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

/**
 * THIS SCRIPT APPLIES THE FINAL SIGNUP TRIGGER FIX
 * It requires either:
 * 1. DATABASE_URL (Direct Postgres connection)
 * 2. SUPABASE_SERVICE_ROLE_KEY + VITE_SUPABASE_URL (Via Supabase RPC if 'exec_sql' exists)
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DB_CONNECTION_STRING = process.env.DATABASE_URL;

async function run() {
    console.log("🚀 Starting Final Signup Trigger Fix...");

    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20260305220000_signup_trigger_fix_final.sql');
    if (!fs.existsSync(migrationPath)) {
        console.error("❌ Migration file not found at:", migrationPath);
        process.exit(1);
    }
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // --- Strategy 1: Direct PG Connection (Most reliable for function/trigger updates) ---
    if (DB_CONNECTION_STRING) {
        console.log("🔗 Connecting via DATABASE_URL...");
        const client = new pg.Client({
            connectionString: DB_CONNECTION_STRING,
            ssl: { rejectUnauthorized: false }
        });

        try {
            await client.connect();
            console.log("✅ Connected. Applying migration...");
            await client.query(sql);
            console.log("🎉 SUCCESS: Signup trigger updated via PG client.");
            await client.end();
            return;
        } catch (err: any) {
            console.error("❌ Error via PG Client:", err.message);
        }
    }

    // --- Strategy 2: Supabase Service Role Key (Via RPC) ---
    if (SUPABASE_URL && SERVICE_ROLE_KEY) {
        console.log("🔗 Connecting via Supabase Service Role Key...");
        const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

        try {
            console.log("📡 Attempting to run via 'exec_sql' RPC...");
            const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

            if (error) {
                if (error.message.includes("could not find the function")) {
                    console.warn("⚠️  'exec_sql' RPC not found. Strategy 2 failed.");
                } else {
                    console.error("❌ RPC Error:", error.message);
                }
            } else {
                console.log("🎉 SUCCESS: Signup trigger updated via Supabase RPC.");
                return;
            }
        } catch (err: any) {
            console.error("❌ RPC Exception:", err.message);
        }
    }

    console.log("\n--- INSTRUCTIONS ---");
    console.log("If the script failed, please apply the SQL manually in the Supabase SQL Editor:");
    console.log("1. Copy the contents of: supabase/migrations/20260305220000_signup_trigger_fix_final.sql");
    console.log("2. Paste it into the Supabase SQL Editor and click 'Run'.");
    console.log("3. Your signup flow will be fixed immediately.");
}

run().catch(console.error);
