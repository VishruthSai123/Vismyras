// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RAZORPAY_KEY_ID = Deno.env.get('VITE_RAZORPAY_LIVE_KEY_ID')
const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_LIVE_KEY_SECRET')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CancelSubscriptionRequest {
  subscriptionId: string
  userId: string
  cancelAtCycleEnd?: boolean // Default: true (no refund, cancel at period end)
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      throw new Error('Unauthorized')
    }

    const { subscriptionId, userId, cancelAtCycleEnd = true } = await req.json() as CancelSubscriptionRequest

    // Verify user is cancelling their own subscription
    if (user.id !== userId) {
      throw new Error('Unauthorized: Cannot cancel another user\'s subscription')
    }

    console.log('📝 Cancelling subscription:', subscriptionId)
    console.log('👤 User ID:', userId)
    console.log('⏰ Cancel at cycle end:', cancelAtCycleEnd)

    // Create Basic Auth header for Razorpay API
    const authHeader = `Basic ${btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`)}`

    // Cancel subscription via Razorpay API
    // https://razorpay.com/docs/api/subscriptions/#cancel-a-subscription
    const razorpayResponse = await fetch(
      `https://api.razorpay.com/v1/subscriptions/${subscriptionId}/cancel`,
      {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cancel_at_cycle_end: cancelAtCycleEnd ? 1 : 0
        })
      }
    )

    if (!razorpayResponse.ok) {
      const errorText = await razorpayResponse.text()
      console.error('❌ Razorpay API error:', errorText)
      throw new Error(`Razorpay API error: ${razorpayResponse.status} - ${errorText}`)
    }

    const cancelledSubscription = await razorpayResponse.json()
    console.log('✅ Subscription cancelled:', cancelledSubscription)

    // Update user_billing in Supabase
    const { error: updateError } = await supabaseClient
      .from('user_billing')
      .update({
        subscription_status: cancelAtCycleEnd ? 'CANCELLED' : 'CANCELLED',
        auto_renew: false,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('razorpay_subscription_id', subscriptionId)

    if (updateError) {
      console.error('⚠️ Failed to update database:', updateError)
      // Don't throw - subscription is cancelled in Razorpay, DB sync can happen via webhook
    }

    // Log webhook event for audit trail
    await supabaseClient
      .from('webhook_events')
      .insert({
        event_type: 'subscription.cancelled_manual',
        event_id: `cancel_${Date.now()}`,
        payload: {
          subscription_id: subscriptionId,
          user_id: userId,
          cancel_at_cycle_end: cancelAtCycleEnd,
          cancelled_at: new Date().toISOString(),
          razorpay_response: cancelledSubscription,
        },
        processed: true,
        created_at: new Date().toISOString(),
      })

    return new Response(
      JSON.stringify({
        success: true,
        message: cancelAtCycleEnd 
          ? 'Subscription will be cancelled at the end of the billing cycle'
          : 'Subscription cancelled immediately',
        subscription: cancelledSubscription,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('❌ Error cancelling subscription:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/cancel-razorpay-subscription' \
    --header 'Authorization: Bearer YOUR_ANON_KEY' \
    --header 'Content-Type: application/json' \
    --data '{"subscriptionId":"sub_xxxxx","userId":"user-uuid","cancelAtCycleEnd":true}'

*/
