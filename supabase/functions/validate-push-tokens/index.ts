import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const { data: tokens, error: fetchErr } = await supabase
      .from('driver_push_tokens')
      .select('id, driver_phone, expo_push_token, platform')

    if (fetchErr || !tokens?.length) {
      return new Response(JSON.stringify({ checked: 0, error: fetchErr?.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const results: { phone: string; status: string; action: string }[] = []

    for (const token of tokens) {
      try {
        const resp = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: token.expo_push_token,
            title: '',
            body: '',
            data: { _validate: true },
          }),
        })

        const result = await resp.json()
        const status = result?.data?.status
        const errorDetail = result?.data?.details?.error

        if (status === 'error' && errorDetail === 'DeviceNotRegistered') {
          // App was uninstalled — delete the stale record
          await supabase
            .from('driver_push_tokens')
            .delete()
            .eq('id', token.id)

          results.push({ phone: token.driver_phone, status: 'DeviceNotRegistered', action: 'deleted' })
        } else {
          // Token is valid OR has a config issue (InvalidCredentials) — keep it
          results.push({ phone: token.driver_phone, status: errorDetail || 'ok', action: 'kept' })
        }
      } catch (err) {
        results.push({ phone: token.driver_phone, status: String(err), action: 'error' })
      }
    }

    return new Response(JSON.stringify({ checked: tokens.length, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
