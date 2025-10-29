import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts'

// Environment variables
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const RAZORPAY_WEBHOOK_SECRET = Deno.env.get('RAZORPAY_WEBHOOK_SECRET') || '';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-razorpay-signature',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify webhook signature
    const signature = req.headers.get('x-razorpay-signature');
    const body = await req.text();
    
    if (!signature) {
      console.error('Missing webhook signature');
      return new Response(JSON.stringify({ error: 'Missing signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verify signature
    const expectedSignature = createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('Invalid webhook signature');
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse webhook event
    const event = JSON.parse(body);
    console.log('Webhook event received:', event.event);

    // Log webhook event to database
    const { data: webhookLog, error: logError } = await supabase
      .from('webhook_events')
      .insert({
        event_id: event.event,
        event_type: event.event,
        entity_type: event.entity || event.payload?.subscription?.entity || 'unknown',
        entity_id: event.payload?.payment?.entity?.id || event.payload?.subscription?.entity?.id || 'unknown',
        payload: event,
        processed: false
      })
      .select()
      .single();

    if (logError) {
      console.error('Error logging webhook:', logError);
    }

    // Process webhook based on event type
    let processed = false;
    let errorMessage = null;

    try {
      switch (event.event) {
        // Payment events
        case 'payment.captured':
          await handlePaymentCaptured(event.payload.payment.entity);
          processed = true;
          break;

        case 'payment.failed':
          await handlePaymentFailed(event.payload.payment.entity);
          processed = true;
          break;

        // Subscription events
        case 'subscription.activated':
          await handleSubscriptionActivated(event.payload.subscription.entity);
          processed = true;
          break;

        case 'subscription.charged':
          await handleSubscriptionCharged(event.payload.subscription.entity, event.payload.payment.entity);
          processed = true;
          break;

        case 'subscription.cancelled':
          await handleSubscriptionCancelled(event.payload.subscription.entity);
          processed = true;
          break;

        case 'subscription.expired':
          await handleSubscriptionExpired(event.payload.subscription.entity);
          processed = true;
          break;

        case 'subscription.paused':
          await handleSubscriptionPaused(event.payload.subscription.entity);
          processed = true;
          break;

        case 'subscription.resumed':
          await handleSubscriptionResumed(event.payload.subscription.entity);
          processed = true;
          break;

        // Refund events
        case 'refund.processed':
          await handleRefundProcessed(event.payload.refund.entity);
          processed = true;
          break;

        default:
          console.log('Unhandled event type:', event.event);
          processed = true; // Mark as processed to avoid retries
      }
    } catch (error) {
      console.error('Error processing webhook:', error);
      errorMessage = error.message;
    }

    // Update webhook log
    if (webhookLog) {
      await supabase
        .from('webhook_events')
        .update({
          processed,
          processed_at: new Date().toISOString(),
          error: errorMessage
        })
        .eq('id', webhookLog.id);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook processed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})

// Handler functions
async function handlePaymentCaptured(payment: any) {
  console.log('Processing payment.captured:', payment.id);
  
  // Get user from payment notes
  const userId = payment.notes?.user_id;
  if (!userId) {
    console.error('No user_id in payment notes');
    return;
  }

  // Check if this is a subscription or one-time purchase
  if (payment.notes?.type === 'subscription') {
    // Handled by subscription.activated event
    console.log('Subscription payment - will be handled by subscription.activated');
  } else if (payment.notes?.type === 'credits') {
    // One-time credit purchase
    const tryOnsCount = parseInt(payment.notes?.try_ons_count || '0');
    const price = payment.amount / 100; // Convert paise to rupees
    
    await supabase.rpc('add_one_time_purchase', {
      p_user_id: userId,
      p_payment_id: payment.id,
      p_try_ons_count: tryOnsCount,
      p_price: price,
      p_expiry_days: 30
    });
    
    console.log(`Granted ${tryOnsCount} credits to user ${userId}`);
  }
}

async function handlePaymentFailed(payment: any) {
  console.log('Processing payment.failed:', payment.id);
  
  // Log failed payment
  const userId = payment.notes?.user_id;
  if (userId) {
    await supabase
      .from('razorpay_payments')
      .update({
        status: 'failed',
        error_description: payment.error_description
      })
      .eq('razorpay_payment_id', payment.id);
  }
}

async function handleSubscriptionActivated(subscription: any) {
  console.log('Processing subscription.activated:', subscription.id);
  
  // Get user from subscription notes
  const userId = subscription.notes?.user_id;
  if (!userId) {
    console.error('No user_id in subscription notes');
    return;
  }

  // Calculate end date (1 month from now)
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1);

  // Grant premium access
  await supabase.rpc('grant_premium_access', {
    p_user_id: userId,
    p_subscription_id: subscription.id,
    p_end_date: endDate.toISOString()
  });

  console.log(`Premium access granted to user ${userId} until ${endDate.toISOString()}`);
}

async function handleSubscriptionCharged(subscription: any, payment: any) {
  console.log('Processing subscription.charged:', subscription.id);
  
  // Subscription renewed - extend end date
  const userId = subscription.notes?.user_id;
  if (!userId) return;

  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1);

  await supabase.rpc('grant_premium_access', {
    p_user_id: userId,
    p_subscription_id: subscription.id,
    p_end_date: endDate.toISOString()
  });

  console.log(`Subscription renewed for user ${userId}`);
}

async function handleSubscriptionCancelled(subscription: any) {
  console.log('Processing subscription.cancelled:', subscription.id);
  
  const userId = subscription.notes?.user_id;
  if (!userId) return;

  // Don't immediately revoke - let it expire naturally
  await supabase
    .from('user_billing')
    .update({
      subscription_auto_renew: false,
      subscription_status: 'CANCELLED'
    })
    .eq('user_id', userId);

  console.log(`Subscription cancelled for user ${userId} - will expire naturally`);
}

async function handleSubscriptionExpired(subscription: any) {
  console.log('Processing subscription.expired:', subscription.id);
  
  const userId = subscription.notes?.user_id;
  if (!userId) return;

  // Revoke premium access
  await supabase.rpc('revoke_premium_access', {
    p_user_id: userId,
    p_reason: 'Subscription expired'
  });

  console.log(`Premium access revoked for user ${userId}`);
}

async function handleSubscriptionPaused(subscription: any) {
  console.log('Processing subscription.paused:', subscription.id);
  
  const userId = subscription.notes?.user_id;
  if (!userId) return;

  await supabase
    .from('user_billing')
    .update({
      subscription_status: 'PAUSED',
      subscription_paused_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  console.log(`Subscription paused for user ${userId}`);
}

async function handleSubscriptionResumed(subscription: any) {
  console.log('Processing subscription.resumed:', subscription.id);
  
  const userId = subscription.notes?.user_id;
  if (!userId) return;

  await supabase
    .from('user_billing')
    .update({
      subscription_status: 'ACTIVE',
      subscription_paused_at: null
    })
    .eq('user_id', userId);

  console.log(`Subscription resumed for user ${userId}`);
}

async function handleRefundProcessed(refund: any) {
  console.log('Processing refund.processed:', refund.id);
  
  // Log refund
  await supabase
    .from('razorpay_payments')
    .update({
      refund_amount: refund.amount / 100,
      refunded_at: new Date().toISOString()
    })
    .eq('razorpay_payment_id', refund.payment_id);

  console.log(`Refund processed for payment ${refund.payment_id}`);
}
