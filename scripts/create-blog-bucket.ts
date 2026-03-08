import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '';

if (!supabaseUrl || !serviceRole) {
    console.error("Missing environment variables!");
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRole);

async function run() {
    console.log("Creating blog-images bucket...");

    // Create the bucket via the REST API or official JS client
    const { data: bucket, error: bucketError } = await supabaseAdmin
        .storage
        .createBucket('blog-images', { public: true });

    if (bucketError) {
        if (bucketError.message.includes('already exists') || bucketError.message.includes('duplicate')) {
            console.log("Bucket already exists.");
        } else {
            console.error("Error creating bucket:", bucketError);
        }
    } else {
        console.log("Bucket created successfully!");
    }

    // Now execute the SQL script to create policies (since storage policies are SQL-based)
    // Unfortunately, Supabase JS client doesn't execute raw SQL directly easily unless rpc
    // Best way is to just create policies via the dashboard. However we can use the `exec_sql` RPC if it exists.

    const sqlContent = readFileSync('supabase/migrations/20260308120000_blog_images_bucket.sql', 'utf8');

    // We will try to apply it via the migrations table approach or just tell the user.
    // Actually, wait, the user's supabase has `exec_sql` ?
    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('exec_sql', { query: sqlContent });
    if (rpcError) {
        console.log("Warning: exec_sql RPC failed (maybe not installed). We'll try the policies manually or user must push.");
        console.log(rpcError.message);
    } else {
        console.log("SQL deployed!");
    }
}

run();
