
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_ANON_KEY) {
    console.error("Missing VITE_SUPABASE_ANON_KEY");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function check() {
    console.log("Checking conversations table...");
    const { data, error } = await supabase.from('conversations').select('count', { count: 'exact', head: true });
    
    if (error) {
        console.error("Error accessing conversations table:", error.message);
    } else {
        console.log("Success! Conversations table accessed. Count:", data);
    }
}

check();
