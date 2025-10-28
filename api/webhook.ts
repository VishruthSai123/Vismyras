/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Razorpay Webhook Handler
 * This is a Vercel Serverless Function
 * 
 * Configure webhook URL in Razorpay Dashboard:
 * https://your-domain.vercel.app/api/webhook
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role key for admin operations
);

/**
 * Verify Razorpay webhook signature
 */
function verifyWebhookSignature(body: string, signature: string): boolean {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET!;
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex');
  return expectedSignature === signature;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify webhook signature
    const signature = req.headers['x-razorpay-signature'] as string;
    const body = JSON.stringify(req.body);
    
    if (!verifyWebhookSignature(body, signature)) {
      console.error('Invalid webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = req.body;
    const eventType = event.event;
    const payload = event.payload.payment.entity;

    console.log('Webhook event:', eventType);

    // Handle different webhook events
    switch (eventType) {
      case 'payment.captured':
        await handlePaymentCaptured(payload);
        break;

      case 'payment.failed':
        await handlePaymentFailed(payload);
        break;

      case 'subscription.activated':
        await handleSubscriptionActivated(payload);
        break;

      case 'subscription.cancelled':
        await handleSubscriptionCancelled(payload);
        break;

      case 'subscription.charged':
        await handleSubscriptionCharged(payload);
        break;

      case 'subscription.paused':
        await handleSubscriptionPaused(payload);
        break;

      case 'subscription.resumed':
        await handleSubscriptionResumed(payload);
        break;

      default:
        console.log('Unhandled event type:', eventType);
    }

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    res.status(500).json({ 
      error: 'Webhook processing failed',
      message: error.message 
    });
  }
}

/**
 * Handle successful payment capture
 */
async function handlePaymentCaptured(payment: any) {
  console.log('Payment captured:', payment.id);
  
  const { notes, amount } = payment;
  const userId = notes?.user_id;

  if (!userId) {
    console.error('No user_id in payment notes');
    return;
  }

  // Determine payment type from notes
  if (notes.type === 'subscription') {
    // Upgrade user to premium
    await supabase
      .from('user_billing')
      .update({
        subscription_tier: 'PREMIUM',
        subscription_status: 'active',
        monthly_limit: 25,
        monthly_used: 0,
        period_start: new Date(),
        period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        razorpay_subscription_id: payment.id,
        updated_at: new Date(),
      })
      .eq('user_id', userId);

  } else if (notes.type === 'credits') {
    // Add one-time credits
    const tryOnsCount = parseInt(notes.tryOnsCount || '1');
    
    await supabase.rpc('add_one_time_credits', {
      p_user_id: userId,
      p_credits: tryOnsCount,
    });
  }

  console.log('User billing updated for:', userId);
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(payment: any) {
  console.log('Payment failed:', payment.id);
  
  // TODO: Send notification to user
  // TODO: Log failed transaction
}

/**
 * Handle subscription activation
 */
async function handleSubscriptionActivated(subscription: any) {
  console.log('Subscription activated:', subscription.id);
  
  const userId = subscription.notes?.user_id;
  if (!userId) return;

  await supabase
    .from('user_billing')
    .update({
      subscription_tier: 'PREMIUM',
      subscription_status: 'active',
      monthly_limit: 25,
      razorpay_subscription_id: subscription.id,
      updated_at: new Date(),
    })
    .eq('user_id', userId);
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionCancelled(subscription: any) {
  console.log('Subscription cancelled:', subscription.id);
  
  await supabase
    .from('user_billing')
    .update({
      subscription_status: 'cancelled',
      updated_at: new Date(),
    })
    .eq('razorpay_subscription_id', subscription.id);
}

/**
 * Handle subscription renewal charge
 */
async function handleSubscriptionCharged(payment: any) {
  console.log('Subscription charged:', payment.id);
  
  // Reset monthly usage on renewal
  await supabase
    .from('user_billing')
    .update({
      monthly_used: 0,
      period_start: new Date(),
      period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      updated_at: new Date(),
    })
    .eq('razorpay_subscription_id', payment.subscription_id);
}

/**
 * Handle subscription pause
 */
async function handleSubscriptionPaused(subscription: any) {
  console.log('Subscription paused:', subscription.id);
  
  await supabase
    .from('user_billing')
    .update({
      subscription_status: 'paused',
      updated_at: new Date(),
    })
    .eq('razorpay_subscription_id', subscription.id);
}

/**
 * Handle subscription resume
 */
async function handleSubscriptionResumed(subscription: any) {
  console.log('Subscription resumed:', subscription.id);
  
  await supabase
    .from('user_billing')
    .update({
      subscription_status: 'active',
      updated_at: new Date(),
    })
    .eq('razorpay_subscription_id', subscription.id);
}
