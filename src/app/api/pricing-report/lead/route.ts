import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { hashEmail, isValidEmail, normalizeEmail } from '@/lib/pricing-report/email'
import { isValidVariant } from '@/lib/pricing-report/pricing'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const { email, price, currency, utmSource, utmCampaign, demoMode } = body

  if (typeof email !== 'string' || !isValidEmail(email)) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 })
  }
  if (!isValidVariant(price)) {
    return NextResponse.json({ error: 'invalid_price' }, { status: 400 })
  }

  // Demo traffic must never create a real lead row. The checkout client already
  // skips this call for demo sessions; this is the server-side guarantee.
  if (demoMode === true) {
    return NextResponse.json({ ok: true, skipped: 'demo_mode' })
  }

  const url = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    return NextResponse.json({ error: 'not_configured' }, { status: 500 })
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false },
  })

  const { error } = await supabase.from('pricing_report_leads').insert({
    email: normalizeEmail(email),
    email_hash: await hashEmail(email),
    price_variant: price,
    currency: typeof currency === 'string' ? currency : 'PLN',
    utm_source: typeof utmSource === 'string' ? utmSource : null,
    utm_campaign: typeof utmCampaign === 'string' ? utmCampaign : null,
    demo_mode: demoMode === true,
  })

  if (error) {
    console.error('[pricing-report] lead insert failed:', error.message)
    return NextResponse.json({ error: 'insert_failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
