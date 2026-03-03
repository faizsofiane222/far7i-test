import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import nodemailer from 'nodemailer';

// Read .env.local
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(
    envFile.split('\n')
        .filter(line => line.includes('='))
        .map(line => line.split('=').map(s => s.trim()))
);

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

// Configure nodemailer to use Inbucket (local SMTP server)
const transporter = nodemailer.createTransport({
    host: '127.0.0.1',
    port: 54325, // Inbucket SMTP port from config.toml
    secure: false,
    tls: {
        rejectUnauthorized: false
    }
});

async function sendNewsletters() {
    try {
        console.log('📧 Newsletter Sender Started...\n');

        // 1. Get all pending recipients
        const { data: recipients, error: fetchError } = await supabase
            .from('newsletter_recipients')
            .select(`
                id,
                email,
                campaign_id,
                newsletter_campaigns (
                    subject,
                    content
                )
            `)
            .eq('status', 'pending')
            .limit(50); // Process in batches

        if (fetchError) throw fetchError;

        if (!recipients || recipients.length === 0) {
            console.log('✅ No pending newsletters to send.');
            return;
        }

        console.log(`📬 Found ${recipients.length} pending emails to send\n`);

        // 2. Send each email
        let sentCount = 0;
        let failedCount = 0;

        for (const recipient of recipients) {
            try {
                const campaign = recipient.newsletter_campaigns;

                console.log(`   Sending to: ${recipient.email}...`);

                // Send email via Inbucket
                await transporter.sendMail({
                    from: '"Far7i Events" <noreply@far7i.com>',
                    to: recipient.email,
                    subject: campaign.subject,
                    html: campaign.content
                });

                // Update status to sent
                await supabase
                    .from('newsletter_recipients')
                    .update({
                        status: 'sent',
                        sent_at: new Date().toISOString()
                    })
                    .eq('id', recipient.id);

                sentCount++;
                console.log(`   ✅ Sent successfully\n`);

            } catch (error) {
                console.error(`   ❌ Failed: ${error.message}\n`);

                // Update status to failed
                await supabase
                    .from('newsletter_recipients')
                    .update({
                        status: 'failed',
                        error_message: error.message
                    })
                    .eq('id', recipient.id);

                failedCount++;
            }
        }

        console.log('\n📊 Summary:');
        console.log(`   ✅ Sent: ${sentCount}`);
        console.log(`   ❌ Failed: ${failedCount}`);
        console.log(`\n🌐 Check Inbucket: http://localhost:54324`);

    } catch (error) {
        console.error('❌ Newsletter sender error:', error);
        process.exit(1);
    }
}

// Run immediately
sendNewsletters();

// Optional: Run every 30 seconds for continuous processing
// setInterval(sendNewsletters, 30000);
