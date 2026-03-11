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

    const { shipper_id } = await req.json()

    if (!shipper_id) {
      return new Response(JSON.stringify({ error: 'shipper_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Look up shipper email
    const { data: shipper, error: shipperErr } = await supabase
      .from('shippers')
      .select('email, company_name')
      .eq('id', shipper_id)
      .single()

    if (shipperErr || !shipper?.email) {
      return new Response(JSON.stringify({ error: 'Shipper not found or has no email' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const siteUrl = req.headers.get('origin') || Deno.env.get('SUPABASE_URL')!.replace('.supabase.co', '.lovable.app')
    const redirectTo = `${siteUrl}/shipper-portal/dashboard`

    // Generate magic link
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: shipper.email,
      options: { redirectTo },
    })

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({
      success: true,
      shipper_name: shipper.company_name,
      email: shipper.email,
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
