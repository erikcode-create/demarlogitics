// Rate limiting: max 10 requests per minute per IP (voice handler gets fewer calls)
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

Deno.serve(async (req) => {
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (!checkRateLimit(clientIp)) {
    return new Response('Too many requests', { status: 429, headers: { 'Retry-After': '60' } })
  }

  // Return TeXML that connects the inbound call to the AI Assistant
  const texml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Connect>
        <AIAssistant id="assistant-8daa8899-1e04-4372-8292-8536d464ea33">
        </AIAssistant>
    </Connect>
</Response>`

  return new Response(texml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
    },
  })
})
