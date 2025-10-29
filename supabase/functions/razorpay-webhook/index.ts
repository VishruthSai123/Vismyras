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

  // Update usage limit
  await supabase
    .from('user_billing')
    .update({
      usage_limit: 1000, // Premium limit
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

  // Update usage limit to free tier
  await supabase
    .from('user_billing')
    .update({
      usage_limit: 10, // Free limit
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

  // Record payment in database
  await supabase.from('razorpay_payments').insert({
    user_id: userId,
    razorpay_payment_id: paymentId,
    razorpay_order_id: entity.order_id,
    amount,
    currency: entity.currency,
    status,
    payment_method: entity.method,
    type: type || 'subscription',
    notes: notes,
    created_at: new Date(entity.created_at * 1000).toISOString(),
  });

  if (event.event === 'payment.captured') {
    // Payment successful
    if (type === 'credits') {
      // Grant one-time credits
      const tryOnsCount = parseInt(notes.tryOnsCount || '50');
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30); // 30 days from now

      console.log(`✅ GRANTING ${tryOnsCount} ONE-TIME CREDITS to user ${userId}`);

      await supabase.from('user_one_time_purchases').insert({
        user_id: userId,
        razorpay_payment_id: paymentId,
        try_ons_count: tryOnsCount,
        price: amount,
        purchase_date: new Date().toISOString(),
        expiry_date: expiryDate.toISOString(),
      });

      console.log(`✅ Credits granted, expires: ${expiryDate.toISOString()}`);
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

  // Get the payment to find user
  const { data: payment } = await supabase
    .from('razorpay_payments')
    .select('user_id, type, notes')
    .eq('razorpay_payment_id', paymentId)
    .single();

  if (!payment) {
    console.error('Payment not found for refund');
    return;
  }

  const userId = payment.user_id;

  // Update payment status
  await supabase
    .from('razorpay_payments')
    .update({
      status: 'refunded',
      refund_amount: amount,
      refunded_at: new Date().toISOString(),
    })
    .eq('razorpay_payment_id', paymentId);

  if (payment.type === 'credits') {
    // Revoke one-time credits
    console.log(`🚫 REVOKING CREDITS for user ${userId} due to refund`);
    
    await supabase
      .from('user_one_time_purchases')
      .delete()
      .eq('razorpay_payment_id', paymentId);
  } else if (payment.type === 'subscription') {
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

    if (!signature) {
      console.error('Missing webhook signature');
      return new Response(
        JSON.stringify({ error: 'Missing signature' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify signature
    if (!verifyWebhookSignature(body, signature)) {
      console.error('Invalid webhook signature');
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
