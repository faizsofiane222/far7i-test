import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
// Use Service Role to force fetching a known admin user ID, then make the query auth'd as them
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '';
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, serviceRole);

async function run() {
    // get a known admin user
    const { data: roles } = await supabaseAdmin.from('user_roles').select('user_id').eq('role', 'admin').limit(1);
    const adminId = roles?.[0]?.user_id;
    if (!adminId) {
        console.log("No admin found.");
        return;
    }

    // Now query just like the UI does, using admin privileges but directly on the admin supabase client?
    // Wait, let's just query conversations without auth to see what happens since we are service role
    const { data, error } = await supabaseAdmin
        .from('conversations')
        .select(`
            *,
            conversation_participants(
                user_id,
                profiles:user_id(full_name, avatar_url)
            )
        `)
        .order('updated_at', { ascending: false });

    console.log("Error:", error);
    console.log("Total convs found by service role:", data?.length);
    if (data?.length > 0) {
        console.log("First conv:", JSON.stringify(data[0], null, 2));
    }
}

run();
