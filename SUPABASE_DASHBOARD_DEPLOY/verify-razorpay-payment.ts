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
    // Get Razorpay secret from environment FIRST
    const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')

    console.log('Environment check:', {
      hasKeySecret: !!RAZORPAY_KEY_SECRET,
      keySecretLength: RAZORPAY_KEY_SECRET?.length
    })

    if (!RAZORPAY_KEY_SECRET) {
      console.error('Missing RAZORPAY_KEY_SECRET')
      return new Response(
        JSON.stringify({ error: 'Razorpay secret not configured. Check Supabase secrets.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json()
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body

    console.log('Verification request:', {
      hasOrderId: !!razorpay_order_id,
      hasPaymentId: !!razorpay_payment_id,
      hasSignature: !!razorpay_signature,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id
    })

    // Validate input
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.error('Missing parameters:', { razorpay_order_id, razorpay_payment_id, razorpay_signature })
      return new Response(
        JSON.stringify({ 
          error: 'Missing payment verification parameters',
          details: {
            hasOrderId: !!razorpay_order_id,
            hasPaymentId: !!razorpay_payment_id,
            hasSignature: !!razorpay_signature
          }
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify signature
    const expectedSignature = createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    const isValid = expectedSignature === razorpay_signature

    console.log('Signature verification:', {
      isValid,
      expectedSignaturePrefix: expectedSignature.substring(0, 10),
      receivedSignaturePrefix: razorpay_signature.substring(0, 10)
    })

    if (!isValid) {
      console.error('Invalid signature')
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid payment signature',
          message: 'Payment verification failed'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ Payment verified successfully')
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Payment verified successfully'
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Verification error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Payment verification failed',
        details: error.toString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
