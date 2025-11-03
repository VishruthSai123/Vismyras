// Supabase Edge Function for Razorpay Webhooks
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts';

const RAZORPAY_WEBHOOK_SECRET = Deno.env.get('RAZORPAY_WEBHOOK_SECRET') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Verify Razorpay webhook signature
function verifyWebhookSignature(body: string, signature: string): boolean {
  const expectedSignature = createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
    .update(body)
    .digest('hex');
  return expectedSignature === signature;
}

// Grant Premium access
async function grantPremiumAccess(userId: string, subscriptionId: string, endDate: Date) {
  console.log(`✅ GRANTING PREMIUM ACCESS to user ${userId}`);
  
  const { error } = await supabase
    .from('user_billing')
    .update({
      subscription_tier: 'PREMIUM',
      subscription_status: 'ACTIVE',
      subscription_start_date: new Date().toISOString(),
      subscription_end_date: endDate.toISOString(),
      subscription_auto_renew: true,
      razorpay_subscription_id: subscriptionId,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Error granting premium access:', error);
    throw error;
  }

  // Update usage limit (using monthly_limit for migration 007 schema)
  await supabase
    .from('user_billing')
    .update({
      monthly_limit: 50, // Premium limit - 50 try-ons per month
    })
    .eq('user_id', userId);

  console.log(`✅ Premium access granted until ${endDate.toISOString()}`);
}

// Revoke Premium access
async function revokePremiumAccess(userId: string, reason: string) {
  console.log(`🚫 REVOKING PREMIUM ACCESS for user ${userId}`);
  console.log(`📝 Reason: ${reason}`);
  
  const { error } = await supabase
    .from('user_billing')
    .update({
      subscription_tier: 'FREE',
      subscription_status: 'CANCELLED',
      subscription_auto_renew: false,
      subscription_end_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Error revoking premium access:', error);
    throw error;
  }

  // Update usage limit to free tier (using monthly_limit for migration 007 schema)
  await supabase
    .from('user_billing')
    .update({
      monthly_limit: 10, // Free limit
    })
    .eq('user_id', userId);

  console.log(`🚫 Premium access revoked`);
}

// Handle subscription events
async function handleSubscriptionEvent(event: any) {
  const entity = event.payload.subscription.entity;
  const subscriptionId = entity.id;
  const status = entity.status;
  const notes = entity.notes || {};
  const userId = notes.user_id;

  if (!userId) {
    console.error('No user_id found in subscription notes');
    return;
  }

  console.log(`📦 Subscription Event: ${event.event} for user ${userId}`);

  switch (event.event) {
    case 'subscription.activated':
    case 'subscription.charged':
      // Grant/extend premium access
      const periodEnd = new Date(entity.current_end * 1000);
      await grantPremiumAccess(userId, subscriptionId, periodEnd);
      break;

    case 'subscription.cancelled':
      // Mark as cancelled but keep access until period end
      await supabase
        .from('user_billing')
        .update({
          subscription_status: 'CANCELLED',
          subscription_auto_renew: false,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
      console.log(`⚠️ Subscription cancelled - access remains until ${new Date(entity.current_end * 1000).toISOString()}`);
      break;

    case 'subscription.completed':
    case 'subscription.expired':
      // Revoke access immediately
      await revokePremiumAccess(userId, 'Subscription expired');
      break;

    case 'subscription.paused':
    case 'subscription.halted':
      // Suspend access
      await supabase
        .from('user_billing')
        .update({
          subscription_status: 'PAUSED',
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
      console.log(`⏸️ Subscription paused for user ${userId}`);
      break;

    case 'subscription.resumed':
      // Resume access
      await supabase
        .from('user_billing')
        .update({
          subscription_status: 'ACTIVE',
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
      console.log(`▶️ Subscription resumed for user ${userId}`);
      break;
  }
}

// Handle payment events
async function handlePaymentEvent(event: any) {
  const entity = event.payload.payment.entity;
  const paymentId = entity.id;
  const amount = entity.amount / 100; // Convert from paise
  const status = entity.status;
  const notes = entity.notes || {};
  const userId = notes.user_id;
  const type = notes.type;

  if (!userId) {
    console.error('No user_id found in payment notes');
    return;
  }

  console.log(`💳 Payment Event: ${event.event} for user ${userId}`);

  // Log payment event in webhook_events table
  await supabase.from('webhook_events').insert({
    event_id: paymentId,
    event_type: event.event,
    entity_type: 'payment',
    entity_id: paymentId,
    user_id: userId,
    payload: event,
    processed: true,
    processed_at: new Date().toISOString(),
  });

  if (event.event === 'payment.captured') {
    // Payment successful
    if (type === 'credits') {
      // Grant one-time credits using the database function
      const creditsCount = parseInt(notes.creditsCount || '10');
      
      console.log(`✅ GRANTING ${creditsCount} ONE-TIME CREDITS to user ${userId}`);
      console.log(`💰 Amount paid: ₹${amount}`);

      // Use the database function add_one_time_credits()
      const { data, error } = await supabase.rpc('add_one_time_credits', {
        p_user_id: userId,
        p_credits: creditsCount,
        p_payment_id: paymentId,
        p_price: amount
      });

      if (error) {
        console.error('Error granting credits:', error);
        throw error;
      }

      console.log(`✅ Credits granted (purchase_id: ${data}), expires in 30 days`);
    }
  } else if (event.event === 'payment.failed') {
    console.log(`❌ Payment failed for user ${userId}`);
  }
}

// Handle refund events
async function handleRefundEvent(event: any) {
  const entity = event.payload.refund.entity;
  const paymentId = entity.payment_id;
  const amount = entity.amount / 100;

  console.log(`💰 Refund Event: ${event.event} for payment ${paymentId}`);

  // Get the payment from webhook_events to find user
  const { data: paymentEvent } = await supabase
    .from('webhook_events')
    .select('user_id, payload')
    .eq('entity_id', paymentId)
    .eq('entity_type', 'payment')
    .single();

  if (!paymentEvent) {
    console.error('Payment event not found for refund');
    return;
  }

  const userId = paymentEvent.user_id;
  const paymentData = paymentEvent.payload?.payload?.payment?.entity || {};
  const type = paymentData.notes?.type;

  // Log refund event
  await supabase.from('webhook_events').insert({
    event_id: entity.id,
    event_type: event.event,
    entity_type: 'refund',
    entity_id: entity.id,
    user_id: userId,
    payload: event,
    processed: true,
    processed_at: new Date().toISOString(),
  });

  if (type === 'credits') {
    // Revoke one-time credits by setting remaining to 0
    console.log(`🚫 REVOKING CREDITS for user ${userId} due to refund`);
    
    await supabase
      .from('user_one_time_purchases')
      .update({ 
        credits_remaining: 0,
        updated_at: new Date().toISOString() 
      })
      .eq('razorpay_payment_id', paymentId);
    
    console.log(`✅ Credits revoked (set to 0) for payment ${paymentId}`);
  } else if (type === 'subscription') {
    // Revoke premium access
    await revokePremiumAccess(userId, 'Refund processed');
  }

  console.log(`💰 Refund processed for user ${userId}`);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, X-Razorpay-Signature',
      },
    });
  }

  try {
    const signature = req.headers.get('X-Razorpay-Signature');
    const body = await req.text();

    // Log for debugging
    console.log('📨 Webhook request received');
    console.log('Signature present:', !!signature);
    console.log('Webhook secret configured:', !!RAZORPAY_WEBHOOK_SECRET);
    
    if (!signature) {
      console.warn('⚠️ Missing webhook signature - likely a test ping from Razorpay');
      try {
        const testEvent = JSON.parse(body);
        console.log('Test event type:', testEvent.event || 'unknown');
      } catch (e) {
        console.log('Non-JSON test request');
      }
      // Return 200 to stop retry loop
      return new Response(
        JSON.stringify({ received: true, message: 'Webhook endpoint active - test ping accepted' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!RAZORPAY_WEBHOOK_SECRET) {
      console.error('❌ RAZORPAY_WEBHOOK_SECRET not configured in Supabase');
      return new Response(
        JSON.stringify({ error: 'Webhook secret not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify signature
    if (!verifyWebhookSignature(body, signature)) {
      console.error('❌ Invalid webhook signature');
      console.error('Expected signature format check failed');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const event = JSON.parse(body);
    console.log(`📨 Webhook received: ${event.event}`);

    // Handle different event types
    if (event.event.startsWith('subscription.')) {
      await handleSubscriptionEvent(event);
    } else if (event.event.startsWith('payment.')) {
      await handlePaymentEvent(event);
    } else if (event.event.startsWith('refund.')) {
      await handleRefundEvent(event);
    }

    return new Response(
      JSON.stringify({ success: true, event: event.event }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
