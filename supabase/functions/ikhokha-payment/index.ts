// supabase/functions/ikhokha-payment/index.ts
// Creates a signed iKhokha payment link for hotel bookings.
// APP_SECRET and SERVICE_ROLE_KEY never touch the browser.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const IKHOKHA_BASE = 'https://api.ikhokha.com'
const PAYMENT_PATH = '/public-api/v1/api/payment'
const APP_ID       = Deno.env.get('IKHOKHA_APP_ID')!
const ENTITY_ID    = Deno.env.get('IKHOKHA_ENTITY_ID')!   // numeric merchant entity ID (e.g. 585144)
const APP_SECRET   = Deno.env.get('IKHOKHA_APP_SECRET')!
const SITE_URL     = Deno.env.get('SITE_URL') ?? 'https://blytravel.co.za'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ── Signing ───────────────────────────────────────────────────────────────────
// iKhokha: HMAC-SHA256( jsStringEscape(path + JSON.stringify(body)), APP_SECRET )
function jsStringEscape(str: string): string {
  return JSON.stringify(str).slice(1, -1)
}

async function sign(path: string, body: Record<string, unknown>): Promise<string> {
  const toSign  = jsStringEscape(path + JSON.stringify(body))
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(APP_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(toSign))
  return Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// ── Handler ───────────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Authenticate caller — must be a logged-in Bly user
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } },
    )
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { bookingId } = await req.json()
    if (!bookingId) {
      return new Response(JSON.stringify({ error: 'bookingId is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Look up the booking (RLS ensures it belongs to this user)
    const { data: booking, error: bookingError } = await supabase
      .from('hg_bookings')
      .select('id, agency_reference, total_price_zar, meta')
      .eq('id', bookingId)
      .maybeSingle()

    if (bookingError || !booking) {
      console.error('Booking lookup failed:', bookingError)
      return new Response(JSON.stringify({ error: 'Booking not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // total_price_zar stored in rands → iKhokha expects integer cents
    const amountCents = Math.round(Number(booking.total_price_zar) * 100)

    // ── iKhokha payment body (field names must match exactly) ─────────────────
    const body: Record<string, unknown> = {
      entityID:             ENTITY_ID,
      amount:               amountCents,           // integer, not string
      currency:             'ZAR',
      requesterUrl:         SITE_URL,
      mode:                 'live',
      externalTransactionID: booking.agency_reference,
      description:          `BLY Travel Booking ${booking.agency_reference}`,
      urls: {
        callbackUrl:    `${SITE_URL}/api/payment/ikhokha-webhook`,
        successPageUrl: `${SITE_URL}/booking/success?id=${booking.id}`,
        failurePageUrl: `${SITE_URL}/checkout?payment=failed`,
        cancelUrl:      `${SITE_URL}/checkout`,
      },
    }

    console.log('[iKhokha] payloadToSign:', PAYMENT_PATH + JSON.stringify(body))

    const signature  = await sign(PAYMENT_PATH, body)
    const ikResponse = await fetch(`${IKHOKHA_BASE}${PAYMENT_PATH}`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'ApplicationId': APP_ID,
        'Signature':     signature,
      },
      body: JSON.stringify(body),
    })

    const ikData = await ikResponse.json()
    console.log('[iKhokha] Response:', JSON.stringify(ikData))

    if (!ikResponse.ok) {
      return new Response(JSON.stringify({ error: 'Payment provider error', detail: ikData }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Persist iKhokha payment reference
    const ikPaymentId = ikData.id ?? ikData.paymentId ?? ikData.paylinkID
    if (ikPaymentId) {
      await supabase
        .from('hg_bookings')
        .update({ payment_ref: ikPaymentId })
        .eq('id', booking.id)
    }

    const redirectUrl = ikData.url ?? ikData.checkoutUrl ?? ikData.redirectUrl ?? ikData.paymentUrl
    if (!redirectUrl) {
      console.error('[iKhokha] No redirect URL in response:', ikData)
      return new Response(JSON.stringify({ error: 'No payment URL returned by provider', detail: ikData }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ redirectUrl }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('[iKhokha] Unhandled error:', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
