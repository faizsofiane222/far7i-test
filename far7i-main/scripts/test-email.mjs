import nodemailer from 'nodemailer';

// Test SMTP connection to Inbucket
const transporter = nodemailer.createTransport({
    host: '127.0.0.1',
    port: 54325,
    secure: false,
    tls: {
        rejectUnauthorized: false
    }
});

async function testEmail() {
    try {
        console.log('🧪 Testing SMTP connection to Inbucket...\n');

        // Verify connection
        await transporter.verify();
        console.log('✅ SMTP connection successful!\n');

        // Send test email
        console.log('📧 Sending test email...');
        const info = await transporter.sendMail({
            from: '"Far7i Test" <test@far7i.com>',
            to: 'test@example.com',
            subject: 'Test Email from Far7i',
            html: '<h1>Hello from Far7i!</h1><p>This is a test email.</p>'
        });

        console.log('✅ Email sent successfully!');
        console.log('   Message ID:', info.messageId);
        console.log('\n🌐 Check Inbucket: http://localhost:54324');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('\n💡 Troubleshooting:');
        console.error('   1. Check if Supabase is running: npx supabase status');
        console.error('   2. Check if Inbucket is enabled in config.toml');
        console.error('   3. Try restarting Supabase: npx supabase stop && npx supabase start');
    }
}

testEmail();
