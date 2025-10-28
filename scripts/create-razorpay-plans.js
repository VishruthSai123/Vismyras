/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Razorpay Plan Creation Script
 * 
 * This script creates subscription plans in Razorpay
 * Run with: node scripts/create-razorpay-plans.js
 */

import Razorpay from 'razorpay';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function createPlans() {
  console.log('🚀 Creating Razorpay Plans...\n');

  try {
    // Create Premium Monthly Plan
    console.log('Creating Premium Monthly Plan...');
    const premiumPlan = await razorpay.plans.create({
      period: 'monthly',
      interval: 1,
      item: {
        name: 'Vismyras Premium Monthly',
        description: '25 virtual try-ons per month with premium features',
        amount: 19900, // ₹199 in paise
        currency: 'INR',
      },
    });

    console.log('✅ Premium Monthly Plan Created!');
    console.log('   Plan ID:', premiumPlan.id);
    console.log('   Amount:', premiumPlan.item.amount / 100, 'INR');
    console.log('   Period:', premiumPlan.period);
    console.log('   Interval:', premiumPlan.interval);
    console.log('');

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 PLAN IDs - ADD TO YOUR .env.local:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log(`VITE_RAZORPAY_PREMIUM_PLAN_ID=${premiumPlan.id}`);
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('📝 Next Steps:');
    console.log('   1. Copy the Plan ID above');
    console.log('   2. Add it to your .env.local file');
    console.log('   3. Redeploy to Vercel with: vercel --prod');
    console.log('   4. Add to Vercel env: vercel env add VITE_RAZORPAY_PREMIUM_PLAN_ID');
    console.log('');

    return {
      premium: premiumPlan.id,
    };
  } catch (error) {
    console.error('❌ Error creating plans:');
    console.error(error.error || error);
    process.exit(1);
  }
}

// Run the script
createPlans();
