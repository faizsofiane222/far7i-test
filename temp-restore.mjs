import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Client } = pg;

// Local Supabase PostgreSQL connection (standard CLI defaults)
const client = new Client({
    host: '127.0.0.1',
    port: 54322,
    database: 'postgres',
    user: 'postgres',
    password: 'postgres'
});

async function executeRestore() {
    try {
        console.log('🔌 Connecting to local database (127.0.0.1:54322)...');
        await client.connect();

        const sqlPath = 'C:\\Users\\faizb\\.gemini\\antigravity\\brain\\8f923409-ced1-4fd6-9f98-72d9c69e2032\\restore_messaging.sql';
        console.log(`📝 Reading SQL from ${sqlPath}...`);
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('🚀 Executing SQL...');
        await client.query(sql);

        console.log('✅ SQL executed successfully!');
        console.log('✨ Messaging tables and RPCs restored.');

    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.error('❌ Connection refused. Is local Supabase running?');
        } else {
            console.error('❌ Execution failed:', error.message);
        }
        process.exit(1);
    } finally {
        await client.end();
    }
}

executeRestore();
