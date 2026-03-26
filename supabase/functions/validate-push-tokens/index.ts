import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// If a token hasn't been refreshed in 7 days, the app is likely uninstalled.
// The app re-registers its push token every time it opens, so an active user
// will always have a recent updated_at timestamp.
const STALE_THRESHOLD_DAYS = 7

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
      .select('id, driver_phone, expo_push_token, platform, updated_at')

    if (fetchErr || !tokens?.length) {
      return new Response(JSON.stringify({ checked: 0, error: fetchErr?.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const now = Date.now()
    const staleMs = STALE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000
    const results: { phone: string; status: string; action: string; age_hours: number }[] = []

    for (const token of tokens) {
      const ageMs = now - new Date(token.updated_at).getTime()
      const ageHours = Math.round(ageMs / 3600000)

      // Method 1: Check with Expo API if token is dead
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
        const errorDetail = result?.data?.details?.error

        if (errorDetail === 'DeviceNotRegistered') {
          await supabase.from('driver_push_tokens').delete().eq('id', token.id)
          results.push({ phone: token.driver_phone, status: 'DeviceNotRegistered', action: 'deleted', age_hours: ageHours })
          continue
        }
      } catch {
        // Network error checking Expo — fall through to age check
      }

      // Method 2: If token is older than threshold, app likely uninstalled
      // The driver app re-registers the token every time it opens
      if (ageMs > staleMs) {
        await supabase.from('driver_push_tokens').delete().eq('id', token.id)
        results.push({ phone: token.driver_phone, status: 'stale', action: 'deleted', age_hours: ageHours })
      } else {
        results.push({ phone: token.driver_phone, status: 'fresh', action: 'kept', age_hours: ageHours })
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
