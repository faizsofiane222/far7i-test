import nodemailer from 'nodemailer';

// Test both Inbucket and Mailpit
async function testBothServers() {
    console.log('🧪 Testing Email Servers...\n');

    // Test Inbucket (Supabase default)
    console.log('1️⃣ Testing Inbucket (port 54325)...');
    const inbucket = nodemailer.createTransport({
        host: '127.0.0.1',
        port: 54325,
        secure: false,
        tls: { rejectUnauthorized: false }
    });

    try {
        await inbucket.verify();
        console.log('   ✅ Inbucket is running');
        console.log('   📧 Web UI: http://localhost:54324\n');
    } catch (error) {
        console.log('   ❌ Inbucket not available:', error.message, '\n');
    }

    // Test Mailpit (common alternative)
    console.log('2️⃣ Testing Mailpit (port 1025)...');
    const mailpit = nodemailer.createTransport({
        host: '127.0.0.1',
        port: 1025,
        secure: false,
        tls: { rejectUnauthorized: false }
    });

    try {
        await mailpit.verify();
        console.log('   ✅ Mailpit is running');
        console.log('   📧 Web UI: http://localhost:8025\n');

        // Send test email to Mailpit
        console.log('   Sending test email to Mailpit...');
        await mailpit.sendMail({
            from: '"Far7i Test" <test@far7i.com>',
            to: 'test@example.com',
            subject: 'Test from Far7i Newsletter',
            html: '<h1>Hello from Far7i!</h1><p>This email was sent to Mailpit.</p>'
        });
        console.log('   ✅ Email sent to Mailpit!\n');

    } catch (error) {
        console.log('   ❌ Mailpit not available:', error.message, '\n');
    }

    console.log('📋 Summary:');
    console.log('   • If using Supabase local: check http://localhost:54324 (Inbucket)');
    console.log('   • If using Mailpit: check http://localhost:8025');
}

testBothServers();
