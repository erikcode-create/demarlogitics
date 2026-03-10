import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const { carrier_id, document_id } = await req.json()

    if (!carrier_id) {
      return new Response(JSON.stringify({ error: 'carrier_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Look up carrier email
    const { data: carrier, error: carrierErr } = await supabase
      .from('carriers')
      .select('email, company_name')
      .eq('id', carrier_id)
      .single()

    if (carrierErr || !carrier?.email) {
      return new Response(JSON.stringify({ error: 'Carrier not found or has no email' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Determine redirect URL
    const siteUrl = req.headers.get('origin') || Deno.env.get('SUPABASE_URL')!.replace('.supabase.co', '.lovable.app')
    const redirectTo = document_id
      ? `${siteUrl}/portal/documents/${document_id}`
      : `${siteUrl}/portal/documents`

    // Generate magic link
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: carrier.email,
      options: {
        redirectTo,
      },
    })

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({
      success: true,
      carrier_name: carrier.company_name,
      email: carrier.email,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
