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

    // Fetch all push tokens
    const { data: tokens, error: fetchErr } = await supabase
      .from('driver_push_tokens')
      .select('id, driver_phone, expo_push_token, platform, is_active')

    if (fetchErr || !tokens?.length) {
      return new Response(JSON.stringify({ checked: 0, error: fetchErr?.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const results: { phone: string; valid: boolean; error?: string }[] = []

    // Validate each token against Expo push API
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
            _displayInForeground: false,
          }),
        })

        const result = await resp.json()
        const status = result?.data?.status
        const errorDetail = result?.data?.details?.error

        // Token is only valid if Expo returns 'ok'
        // DeviceNotRegistered = app uninstalled or token expired
        // InvalidCredentials = APNs/FCM creds not configured, can't reach device
        const isValid = status === 'ok'

        results.push({
          phone: token.driver_phone,
          valid: isValid,
          error: status === 'error' ? errorDetail : undefined,
        })

        // Update the record
        await supabase
          .from('driver_push_tokens')
          .update({
            is_active: isValid,
            last_validated: new Date().toISOString(),
          })
          .eq('id', token.id)
      } catch (err) {
        results.push({ phone: token.driver_phone, valid: false, error: String(err) })
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
