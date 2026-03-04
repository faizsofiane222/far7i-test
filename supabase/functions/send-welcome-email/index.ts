import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { record } = await req.json()
    const email = record.email
    const fullName = record.display_name ||
      record.raw_user_meta_data?.display_name ||
      record.raw_user_meta_data?.full_name ||
      'Partenaire'

    if (!email) {
      throw new Error('No email found in record')
    }

    console.log(`Sending welcome email to ${email}`)

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Far7i <no-reply@far7i.com>',
        to: [email],
        subject: 'Bienvenue dans le cercle Far7i ✨',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Lato', sans-serif; background-color: #F8F5F0; color: #1E1E1E; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border: 1px solid #D4D2CF; border-radius: 8px; overflow: hidden; }
              .header { background-color: #1E1E1E; padding: 30px; text-align: center; }
              .logo { color: #B79A63; font-size: 32px; font-weight: bold; text-decoration: none; }
              .content { padding: 40px; text-align: center; }
              h1 { color: #1E1E1E; font-size: 24px; margin-bottom: 20px; }
              p { font-size: 16px; line-height: 1.6; color: #555; margin-bottom: 20px; }
              .highlight { color: #B79A63; font-weight: bold; }
              .footer { background-color: #F8F5F0; padding: 20px; text-align: center; font-size: 12px; color: #999; }
              .btn { display: inline-block; background-color: #B79A63; color: #1E1E1E; padding: 14px 32px; text-decoration: none; border-radius: 4px; font-weight: bold; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <span class="logo">Far7i</span>
              </div>
              <div class="content">
                <h1>FÉLICITATIONS, ${fullName.toUpperCase()} !</h1>
                <p>Votre adresse email a été confirmée avec succès.</p>
                <p>Vous faites désormais partie de <span class="highlight">Far7i</span>, la plateforme de référence pour les événements d'exception.</p>
                <p>Votre profil est maintenant prêt à être complété. Une vitrine soignée est la clé pour attirer vos futurs clients.</p>
                <a href="https://far7i.com/partner/dashboard" class="btn">Accéder à mon tableau de bord</a>
                <p style="margin-top: 30px;">Nous sommes ravis de vous accompagner dans cette aventure.</p>
              </div>
              <div class="footer">
                &copy; 2026 Far7i. L'Excellence au service de vos événements.
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    })

    const data = await res.json()
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
