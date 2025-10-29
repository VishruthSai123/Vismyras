import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

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
    // Get Razorpay credentials from environment FIRST
    const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID')
    const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')

    console.log('Environment check:', {
      hasKeyId: !!RAZORPAY_KEY_ID,
      hasKeySecret: !!RAZORPAY_KEY_SECRET,
      keyIdPrefix: RAZORPAY_KEY_ID?.substring(0, 10)
    })

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      console.error('Missing Razorpay credentials')
      return new Response(
        JSON.stringify({ error: 'Razorpay credentials not configured. Check Supabase secrets.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { amount, currency, notes } = await req.json()

    // Validate input
    if (!amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Razorpay order
    const auth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`)
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amount), // Amount in paise
        currency: currency || 'INR',
        notes: notes || {},
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Razorpay API error:', error)
      throw new Error('Failed to create Razorpay order')
    }

    const order = await response.json()

    return new Response(
      JSON.stringify({ orderId: order.id, amount: order.amount, currency: order.currency }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
