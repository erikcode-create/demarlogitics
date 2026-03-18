import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Rate limiting: max 30 requests per minute per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 30
const RATE_WINDOW_MS = 60_000

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (!checkRateLimit(clientIp)) {
    return new Response(JSON.stringify({ error: 'Too many requests. Please try again later.' }), {
      status: 429,
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' },
    })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const body = await req.json()
    const { action, load_number, origin, destination, equipment_type, proposed_rate } = body

    // Action: lookup_load — find a specific load by load number
    if (action === 'lookup_load') {
      if (!load_number) {
        return jsonResponse({ error: 'load_number is required' }, 400)
      }

      const { data: load, error } = await supabase
        .from('loads')
        .select(`
          *,
          shippers:shipper_id ( company_name, city, state ),
          carriers:carrier_id ( company_name, mc_number )
        `)
        .eq('load_number', load_number)
        .single()

      if (error || !load) {
        return jsonResponse({ found: false, message: `No load found with number ${load_number}` })
      }

      return jsonResponse({
        found: true,
        load_number: load.load_number,
        reference_number: load.reference_number,
        status: load.status,
        origin: load.origin,
        destination: load.destination,
        pickup_date: load.pickup_date,
        delivery_date: load.delivery_date,
        equipment_type: load.equipment_type,
        weight: load.weight,
        shipper_rate: load.shipper_rate,
        carrier_rate: load.carrier_rate,
        shipper_name: load.shippers?.company_name,
        carrier_name: load.carriers?.company_name,
        carrier_mc: load.carriers?.mc_number,
        payment_status: load.payment_status,
        notes: load.notes,
      })
    }

    // Action: search_available_loads — find loads matching criteria
    if (action === 'search_available_loads') {
      let query = supabase
        .from('loads')
        .select(`
          load_number, origin, destination, pickup_date, delivery_date,
          equipment_type, weight, carrier_rate, status
        `)
        .in('status', ['available', 'booked'])
        .order('pickup_date', { ascending: true })
        .limit(10)

      if (origin) {
        query = query.ilike('origin', `%${origin}%`)
      }
      if (destination) {
        query = query.ilike('destination', `%${destination}%`)
      }
      if (equipment_type) {
        query = query.eq('equipment_type', equipment_type)
      }

      const { data: loads, error } = await query

      if (error) {
        return jsonResponse({ error: error.message }, 500)
      }

      return jsonResponse({
        count: loads?.length || 0,
        loads: (loads || []).map(l => ({
          load_number: l.load_number,
          origin: l.origin,
          destination: l.destination,
          pickup_date: l.pickup_date,
          delivery_date: l.delivery_date,
          equipment_type: l.equipment_type,
          weight: l.weight,
          posted_rate: l.carrier_rate,
          status: l.status,
        })),
      })
    }

    // Action: negotiate_rate — carrier proposes a rate for a load
    if (action === 'negotiate_rate') {
      if (!load_number || !proposed_rate) {
        return jsonResponse({ error: 'load_number and proposed_rate are required' }, 400)
      }

      const { data: load, error: loadErr } = await supabase
        .from('loads')
        .select('*')
        .eq('load_number', load_number)
        .single()

      if (loadErr || !load) {
        return jsonResponse({ found: false, message: `No load found with number ${load_number}` })
      }

      const shipperRate = load.shipper_rate || 0
      const currentCarrierRate = load.carrier_rate || 0
      const proposedNum = parseFloat(proposed_rate)

      // Auto-accept if proposed rate is at or below the posted carrier rate
      if (currentCarrierRate > 0 && proposedNum <= currentCarrierRate) {
        return jsonResponse({
          result: 'accepted',
          load_number,
          agreed_rate: proposedNum,
          message: `Rate of $${proposedNum} accepted for load ${load_number}.`,
        })
      }

      // Auto-accept if proposed rate still leaves at least 12% margin on shipper rate
      const minMargin = 0.12
      const maxAcceptable = shipperRate * (1 - minMargin)
      if (shipperRate > 0 && proposedNum <= maxAcceptable) {
        return jsonResponse({
          result: 'accepted',
          load_number,
          agreed_rate: proposedNum,
          message: `Rate of $${proposedNum} accepted for load ${load_number}.`,
        })
      }

      // Counter-offer: suggest the posted carrier rate or a rate that keeps margin
      const counterRate = currentCarrierRate > 0
        ? currentCarrierRate
        : Math.round(maxAcceptable * 100) / 100

      return jsonResponse({
        result: 'counter',
        load_number,
        proposed_rate: proposedNum,
        counter_rate: counterRate,
        message: `We can offer $${counterRate} for load ${load_number}. Can you work with that?`,
      })
    }

    // Action: accept_rate — finalize and book a negotiated rate
    if (action === 'accept_rate') {
      if (!load_number || !proposed_rate) {
        return jsonResponse({ error: 'load_number and proposed_rate are required' }, 400)
      }

      const { data: load, error: loadErr } = await supabase
        .from('loads')
        .select('*')
        .eq('load_number', load_number)
        .single()

      if (loadErr || !load) {
        return jsonResponse({ found: false, message: `No load found with number ${load_number}` })
      }

      // Update the load with the agreed carrier rate and mark as booked
      const { error: updateErr } = await supabase
        .from('loads')
        .update({
          carrier_rate: parseFloat(proposed_rate),
          status: 'booked',
          notes: `${load.notes || ''}\n[AI Phone] Rate negotiated to $${proposed_rate} via phone on ${new Date().toISOString().split('T')[0]}`.trim(),
        })
        .eq('id', load.id)

      if (updateErr) {
        return jsonResponse({ error: updateErr.message }, 500)
      }

      return jsonResponse({
        result: 'booked',
        load_number,
        agreed_rate: parseFloat(proposed_rate),
        message: `Load ${load_number} is now booked at $${proposed_rate}. A rate confirmation will be sent.`,
      })
    }

    // Action: get_shipper_lanes — look up pre-negotiated lanes for a shipper
    if (action === 'get_shipper_lanes') {
      let query = supabase
        .from('lanes')
        .select(`
          origin, destination, rate, equipment_type, notes,
          shippers:shipper_id ( company_name )
        `)
        .limit(20)

      if (origin) {
        query = query.ilike('origin', `%${origin}%`)
      }
      if (destination) {
        query = query.ilike('destination', `%${destination}%`)
      }

      const { data: lanes, error } = await query

      if (error) {
        return jsonResponse({ error: error.message }, 500)
      }

      return jsonResponse({
        count: lanes?.length || 0,
        lanes: (lanes || []).map(l => ({
          origin: l.origin,
          destination: l.destination,
          rate: l.rate,
          equipment_type: l.equipment_type,
          shipper: (l.shippers as any)?.company_name,
          notes: l.notes,
        })),
      })
    }

    // Action: update_load_number — change a load's load number
    if (action === 'update_load_number') {
      const { old_load_number, new_load_number } = body
      if (!old_load_number || !new_load_number) {
        return jsonResponse({ error: 'old_load_number and new_load_number are required' }, 400)
      }
      const { error: updateErr } = await supabase
        .from('loads')
        .update({ load_number: new_load_number })
        .eq('load_number', old_load_number)
      if (updateErr) {
        return jsonResponse({ error: updateErr.message }, 500)
      }
      return jsonResponse({ success: true, old: old_load_number, new: new_load_number })
    }

    return jsonResponse({ error: `Unknown action: ${action}` }, 400)

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonResponse({ error: message }, 500)
  }
})

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}
