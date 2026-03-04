
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function debug() {
    const { data, error } = await supabase
        .from('providers')
        .select('id, commercial_name, moderation_status, status, pending_changes')
        .eq('moderation_status', 'pending');

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Pending Providers:", JSON.stringify(data, null, 2));
    }

    const { data: stats, error: statsError } = await supabase.rpc('get_moderation_stats');
    console.log("Stats RPC:", JSON.stringify(stats, null, 2));
}

debug();
