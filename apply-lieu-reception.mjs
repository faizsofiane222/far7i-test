import pg from 'pg';
import fs from 'fs';

const { Client } = pg;

// Use standard local Supabase connection
const client = new Client({
    host: '127.0.0.1',
    port: 54322,
    database: 'postgres',
    user: 'postgres',
    password: 'postgres'
});

async function applyMigration() {
    try {
        console.log('🔌 Connecting to local database...');
        await client.connect();

        console.log('📝 Reading migration file...');
        const sql = fs.readFileSync('./supabase/migrations/20260309100000_lieu_reception_updates.sql', 'utf8');

        console.log('🚀 Applying acompte_montant column migration...');
        await client.query(sql);

        console.log('✅ Migration applied successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

applyMigration();
