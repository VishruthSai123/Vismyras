/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Razorpay Payment Verification API
 * This is a Vercel Serverless Function
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      orderId, 
      paymentId, 
      signature,
      userId // Optional: to update user billing in database
    } = req.body;

    // Validate input
    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify signature
    const keySecret = process.env.RAZORPAY_KEY_SECRET!;
    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const isValid = generatedSignature === signature;

    if (isValid) {
      // TODO: Update user's subscription/credits in Supabase database
      // Example:
      // await supabase
      //   .from('user_billing')
      //   .update({ subscription_tier: 'PREMIUM' })
      //   .eq('user_id', userId);

      res.status(200).json({
        success: true,
        verified: true,
        message: 'Payment verified successfully',
      });
    } else {
      res.status(400).json({
        success: false,
        verified: false,
        message: 'Invalid payment signature',
      });
    }
  } catch (error: any) {
    console.error('Payment verification error:', error);
    res.status(500).json({ 
      error: 'Failed to verify payment',
      message: error.message 
    });
  }
}
