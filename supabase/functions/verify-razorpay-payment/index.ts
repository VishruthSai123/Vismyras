import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { orderId, paymentId, signature } = await req.json()

    // Validate input
    if (!orderId || !paymentId || !signature) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get Razorpay secret from environment
    const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_LIVE_KEY_SECRET')

    if (!RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay secret not configured')
    }

    // Verify signature
    const body = `${orderId}|${paymentId}`
    const expectedSignature = createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex')

    const verified = expectedSignature === signature

    if (verified) {
      // Optionally store payment info in Supabase
      // const supabase = createClient(...)
      // await supabase.from('payments').insert({ ... })
    }

    return new Response(
      JSON.stringify({ verified }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message, verified: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
