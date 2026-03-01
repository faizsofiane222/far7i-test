import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
        const { email, token, origin } = await req.json()

        if (!email || !token || !origin) {
            throw new Error('Missing parameters')
        }

        const deletionLink = `${origin}/auth/callback?type=delete_account&token=${token}`

        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: 'Far7i <no-reply@far7i.com>',
                to: [email],
                subject: 'Confirmation de suppression de compte',
                html: `
          <h1>Confirmation de suppression de compte</h1>
          <p>Vous avez demandé la suppression de votre compte Far7i.</p>
          <p>Pour confirmer cette action, veuillez cliquer sur le lien ci-dessous :</p>
          <a href="${deletionLink}" style="background-color: #B79A63; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Confirmer la suppression définitive
          </a>
          <p>Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.</p>
          <p>Le lien expirera dans 24 heures.</p>
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
