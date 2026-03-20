import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

// Rate limiting: max 10 requests per minute per IP
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

// Input sanitization: validate UUID format
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
function isValidUuid(input: string): boolean {
  return uuidRegex.test(String(input).trim())
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
    const resendApiKey = Deno.env.get('RESEND_API_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const { shipper_id } = await req.json()

    if (!shipper_id || !isValidUuid(shipper_id)) {
      return new Response(JSON.stringify({ error: 'A valid shipper_id is required' }), {
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

    const siteUrl = req.headers.get('origin') || 'https://demarlogitics.lovable.app'
    const redirectTo = `${siteUrl}/shipper-portal/dashboard`

    // Generate magic link
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: shipper.email,
      options: { redirectTo },
    })

    if (linkError) {
      return new Response(JSON.stringify({ error: linkError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const actionLink = linkData?.properties?.action_link || redirectTo

    // Send email via Resend
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'DeMar Logistics <shippers@demartransportation.com>',
        to: [shipper.email],
        subject: 'Access Your Shipper Portal — DeMar Logistics',
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; background: #f4f4f5; padding: 40px 0;">
  <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e4e4e7;">
    <div style="background: #1a365d; padding: 24px 32px;">
      <h1 style="color: #ffffff; font-size: 20px; margin: 0;">DeMar Logistics</h1>
    </div>
    <div style="padding: 32px;">
      <p style="font-size: 16px; color: #1a1a1a; margin: 0 0 16px;">Hi ${shipper.company_name},</p>
      <p style="font-size: 14px; color: #3f3f46; line-height: 1.6; margin: 0 0 24px;">
        You've been invited to access your DeMar Logistics Shipper Portal. From there you can view your loads, track shipments, and manage contracts.
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${actionLink}" style="display: inline-block; background: #1a365d; color: #ffffff; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px;">
          Access Shipper Portal
        </a>
      </div>
      <p style="font-size: 12px; color: #71717a; line-height: 1.5; margin: 24px 0 0;">
        This link will log you in automatically. If you have any questions, reply to this email or contact us at dispatch@demartransportation.com.
      </p>
    </div>
    <div style="background: #f4f4f5; padding: 16px 32px; text-align: center;">
      <p style="font-size: 11px; color: #a1a1aa; margin: 0;">© ${new Date().getFullYear()} DeMar Logistics. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
      }),
    })

    if (!emailRes.ok) {
      const errBody = await emailRes.text()
      console.log('Resend error:', errBody)
      return new Response(JSON.stringify({ error: `Email send failed: ${errBody}` }), {
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
