/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Razorpay Subscription Creation API
 * This is a Vercel Serverless Function
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import Razorpay from 'razorpay';

// Determine if we're in live mode
const isLiveMode = process.env.VITE_RAZORPAY_LIVE_MODE === 'true';

// Get appropriate keys based on mode
const keyId = isLiveMode 
  ? process.env.VITE_RAZORPAY_LIVE_KEY_ID 
  : process.env.VITE_RAZORPAY_TEST_KEY_ID;

const keySecret = isLiveMode
  ? process.env.RAZORPAY_LIVE_KEY_SECRET
  : process.env.RAZORPAY_TEST_KEY_SECRET;

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: keyId!,
  key_secret: keySecret!,
});

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { planId, userId, totalCount = 12 } = req.body;

    // Validate input
    if (!planId || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create subscription
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: totalCount,
      quantity: 1,
      customer_notify: 1,
      notes: {
        user_id: userId,
        type: 'subscription',
      },
    });

    // Return subscription details
    res.status(200).json({
      success: true,
      subscriptionId: subscription.id,
      planId: subscription.plan_id,
      status: subscription.status,
    });
  } catch (error: any) {
    console.error('Subscription creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create subscription',
      message: error.message 
    });
  }
}
