import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 10
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

// In-memory conversation store (per edge function instance)
// Keyed by call_sid, stores message history for multi-turn conversations
const conversations = new Map<string, Array<{ role: string; content: string }>>()

const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions'
const NVIDIA_MODEL = 'nvidia/llama-3.1-nemotron-70b-instruct'

const SYSTEM_PROMPT = `You are a friendly, professional AI phone agent for DeMar Logistics, a freight brokerage company. You help carriers and shippers with load information over the phone.

You can perform these actions by responding with a JSON tool call in this exact format:
{"tool": "<action_name>", "params": {<parameters>}}

Available actions:
- lookup_load: Look up a specific load. Params: {"load_number": "string"}
- search_available_loads: Search for available loads. Params: {"origin": "string (optional)", "destination": "string (optional)", "equipment_type": "string (optional)"}
- negotiate_rate: Propose a rate for a load. Params: {"load_number": "string", "proposed_rate": number}
- accept_rate: Accept and book a negotiated rate. Params: {"load_number": "string", "proposed_rate": number}
- get_shipper_lanes: Look up shipper lanes. Params: {"origin": "string (optional)", "destination": "string (optional)"}
- update_load_number: Change a load number. Params: {"old_load_number": "string", "new_load_number": "string"}

When you need to perform an action, respond ONLY with the JSON tool call, nothing else.
When speaking to the caller, keep responses concise and natural for phone conversation. Avoid long lists — summarize and ask if they want details.
Always identify yourself as DeMar Logistics when greeting callers.
If the caller says goodbye or is done, respond with exactly: CALL_COMPLETE`

const BASE_URL = 'https://rlrgwiyhhnypislfolzd.supabase.co/functions/v1/telnyx-voice-handler'

Deno.serve(async (req) => {
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (!checkRateLimit(clientIp)) {
    return new Response('Too many requests', { status: 429, headers: { 'Retry-After': '60' } })
  }

  try {
    const url = new URL(req.url)
    const action = url.searchParams.get('action')

    // Parse form body (Telnyx sends form-encoded data for TeXML callbacks)
    let formData: Record<string, string> = {}
    const contentType = req.headers.get('content-type') || ''
    if (contentType.includes('form')) {
      const text = await req.text()
      for (const pair of text.split('&')) {
        const [k, v] = pair.split('=')
        if (k && v) formData[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, ' '))
      }
    } else if (contentType.includes('json')) {
      formData = await req.json()
    }

    const callSid = formData['CallSid'] || formData['call_sid'] || 'unknown'

    // Initial call — greet the caller and start gathering
    if (!action) {
      conversations.set(callSid, [])
      return texmlResponse(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice" language="en-US">Thank you for calling DeMar Logistics. How can I help you today?</Say>
    <Gather input="speech" speechTimeout="auto" action="${BASE_URL}?action=process&amp;call_sid=${callSid}" method="POST">
        <Say voice="alice" language="en-US"></Say>
    </Gather>
    <Say voice="alice" language="en-US">I didn't catch that. Goodbye.</Say>
    <Hangup/>
</Response>`)
    }

    // Process gathered speech
    if (action === 'process') {
      const speechResult = formData['SpeechResult'] || formData['speech_result'] || ''
      const sid = url.searchParams.get('call_sid') || callSid

      if (!speechResult) {
        return texmlResponse(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice" language="en-US">I didn't catch that. Could you please repeat?</Say>
    <Gather input="speech" speechTimeout="auto" action="${BASE_URL}?action=process&amp;call_sid=${sid}" method="POST">
        <Say voice="alice" language="en-US"></Say>
    </Gather>
    <Say voice="alice" language="en-US">I still couldn't hear you. Goodbye.</Say>
    <Hangup/>
</Response>`)
      }

      // Get or initialize conversation history
      const history = conversations.get(sid) || []
      history.push({ role: 'user', content: speechResult })

      // Send to NVIDIA NIM for processing
      const aiResponse = await callNvidia(history)

      // Check if it's a tool call
      let toolResult: string | null = null
      try {
        const parsed = JSON.parse(aiResponse)
        if (parsed.tool) {
          toolResult = await executeToolCall(parsed.tool, parsed.params || {})
          // Feed tool result back to NVIDIA for a natural response
          history.push({ role: 'assistant', content: aiResponse })
          history.push({ role: 'user', content: `Tool result: ${toolResult}` })
          const finalResponse = await callNvidia(history)
          history.push({ role: 'assistant', content: finalResponse })
          conversations.set(sid, history)
          return speakAndGather(finalResponse, sid)
        }
      } catch {
        // Not JSON, treat as regular speech response
      }

      // Check for call completion
      if (aiResponse.includes('CALL_COMPLETE')) {
        conversations.delete(sid)
        return texmlResponse(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice" language="en-US">Thank you for calling DeMar Logistics. Have a great day!</Say>
    <Hangup/>
</Response>`)
      }

      // Regular response — speak it and gather next input
      history.push({ role: 'assistant', content: aiResponse })
      conversations.set(sid, history)
      return speakAndGather(aiResponse, sid)
    }

    return texmlResponse(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice" language="en-US">Sorry, something went wrong. Please call back later.</Say>
    <Hangup/>
</Response>`)

  } catch (err: unknown) {
    console.error('Voice handler error:', err)
    return texmlResponse(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice" language="en-US">We're experiencing technical difficulties. Please try again later.</Say>
    <Hangup/>
</Response>`)
  }
})

async function callNvidia(messages: Array<{ role: string; content: string }>): Promise<string> {
  const apiKey = Deno.env.get('NVIDIA_API_KEY')
  if (!apiKey) throw new Error('NVIDIA_API_KEY not set')

  const response = await fetch(NVIDIA_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      model: NVIDIA_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 500,
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    console.error('NVIDIA API error:', response.status, errText)
    throw new Error(`NVIDIA API error: ${response.status}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content?.trim() || 'I apologize, I had trouble processing that. Could you repeat?'
}

async function executeToolCall(tool: string, params: Record<string, unknown>): Promise<string> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  function sanitize(input: unknown, maxLen = 200): string {
    if (typeof input !== 'string') return ''
    return input.replace(/[<>"';\\]/g, '').trim().slice(0, maxLen)
  }

  try {
    if (tool === 'lookup_load') {
      const loadNum = sanitize(params.load_number, 20)
      if (!loadNum) return JSON.stringify({ error: 'load_number required' })

      const { data: load, error } = await supabase
        .from('loads')
        .select(`*, shippers:shipper_id ( company_name, city, state ), carriers:carrier_id ( company_name, mc_number )`)
        .eq('load_number', loadNum)
        .single()

      if (error || !load) return JSON.stringify({ found: false, message: `No load found with number ${loadNum}` })

      return JSON.stringify({
        found: true,
        load_number: load.load_number,
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

    if (tool === 'search_available_loads') {
      let query = supabase
        .from('loads')
        .select('load_number, origin, destination, pickup_date, delivery_date, equipment_type, weight, carrier_rate, status')
        .in('status', ['available', 'booked'])
        .order('pickup_date', { ascending: true })
        .limit(10)

      const origin = sanitize(params.origin, 200)
      const destination = sanitize(params.destination, 200)
      const equipmentType = sanitize(params.equipment_type, 50)

      if (origin) query = query.ilike('origin', `%${origin}%`)
      if (destination) query = query.ilike('destination', `%${destination}%`)
      if (equipmentType) query = query.eq('equipment_type', equipmentType)

      const { data: loads, error } = await query
      if (error) return JSON.stringify({ error: error.message })

      return JSON.stringify({
        count: loads?.length || 0,
        loads: (loads || []).map(l => ({
          load_number: l.load_number,
          origin: l.origin,
          destination: l.destination,
          pickup_date: l.pickup_date,
          equipment_type: l.equipment_type,
          posted_rate: l.carrier_rate,
          status: l.status,
        })),
      })
    }

    if (tool === 'negotiate_rate') {
      const loadNum = sanitize(params.load_number, 20)
      const proposedRate = params.proposed_rate
      if (!loadNum || !proposedRate) return JSON.stringify({ error: 'load_number and proposed_rate required' })

      const { data: load, error: loadErr } = await supabase
        .from('loads')
        .select('*')
        .eq('load_number', loadNum)
        .single()

      if (loadErr || !load) return JSON.stringify({ found: false, message: `No load found with number ${loadNum}` })

      const shipperRate = load.shipper_rate || 0
      const currentCarrierRate = load.carrier_rate || 0
      const proposedNum = parseFloat(String(proposedRate))

      if (currentCarrierRate > 0 && proposedNum <= currentCarrierRate) {
        return JSON.stringify({ result: 'accepted', load_number: loadNum, agreed_rate: proposedNum, message: `Rate of $${proposedNum} accepted.` })
      }

      const minMargin = 0.12
      const maxAcceptable = shipperRate * (1 - minMargin)
      if (shipperRate > 0 && proposedNum <= maxAcceptable) {
        return JSON.stringify({ result: 'accepted', load_number: loadNum, agreed_rate: proposedNum, message: `Rate of $${proposedNum} accepted.` })
      }

      const counterRate = currentCarrierRate > 0 ? currentCarrierRate : Math.round(maxAcceptable * 100) / 100
      return JSON.stringify({ result: 'counter', load_number: loadNum, proposed_rate: proposedNum, counter_rate: counterRate, message: `We can offer $${counterRate}. Can you work with that?` })
    }

    if (tool === 'accept_rate') {
      const loadNum = sanitize(params.load_number, 20)
      const proposedRate = params.proposed_rate
      if (!loadNum || !proposedRate) return JSON.stringify({ error: 'load_number and proposed_rate required' })

      const { data: load, error: loadErr } = await supabase
        .from('loads')
        .select('*')
        .eq('load_number', loadNum)
        .single()

      if (loadErr || !load) return JSON.stringify({ found: false, message: `No load found with number ${loadNum}` })

      const { error: updateErr } = await supabase
        .from('loads')
        .update({
          carrier_rate: parseFloat(String(proposedRate)),
          status: 'booked',
          notes: `${load.notes || ''}\n[AI Phone] Rate negotiated to $${proposedRate} via phone on ${new Date().toISOString().split('T')[0]}`.trim(),
        })
        .eq('id', load.id)

      if (updateErr) return JSON.stringify({ error: updateErr.message })
      return JSON.stringify({ result: 'booked', load_number: loadNum, agreed_rate: parseFloat(String(proposedRate)), message: `Load ${loadNum} booked at $${proposedRate}. Rate confirmation will be sent.` })
    }

    if (tool === 'get_shipper_lanes') {
      let query = supabase
        .from('lanes')
        .select('origin, destination, rate, equipment_type, notes, shippers:shipper_id ( company_name )')
        .limit(20)

      const origin = sanitize(params.origin, 200)
      const destination = sanitize(params.destination, 200)
      if (origin) query = query.ilike('origin', `%${origin}%`)
      if (destination) query = query.ilike('destination', `%${destination}%`)

      const { data: lanes, error } = await query
      if (error) return JSON.stringify({ error: error.message })

      return JSON.stringify({
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

    if (tool === 'update_load_number') {
      const oldNum = sanitize(params.old_load_number, 20)
      const newNum = sanitize(params.new_load_number, 20)
      if (!oldNum || !newNum) return JSON.stringify({ error: 'old_load_number and new_load_number required' })

      const { error: updateErr } = await supabase
        .from('loads')
        .update({ load_number: newNum })
        .eq('load_number', oldNum)

      if (updateErr) return JSON.stringify({ error: updateErr.message })
      return JSON.stringify({ success: true, old: oldNum, new: newNum })
    }

    return JSON.stringify({ error: `Unknown tool: ${tool}` })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return JSON.stringify({ error: message })
  }
}

function speakAndGather(text: string, callSid: string): Response {
  // Escape XML special characters in the response text
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

  return texmlResponse(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice" language="en-US">${escaped}</Say>
    <Gather input="speech" speechTimeout="auto" action="${BASE_URL}?action=process&amp;call_sid=${callSid}" method="POST">
        <Say voice="alice" language="en-US"></Say>
    </Gather>
    <Say voice="alice" language="en-US">Are you still there? Goodbye.</Say>
    <Hangup/>
</Response>`)
}

function texmlResponse(xml: string): Response {
  return new Response(xml, {
    status: 200,
    headers: { 'Content-Type': 'application/xml' },
  })
}
