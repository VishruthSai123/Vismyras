/**
 * Script to create Razorpay Subscription Plan
 * Run this once to set up the Premium Monthly plan
 * 
 * Usage: node scripts/create-razorpay-plan.js
 */

const Razorpay = require('razorpay');
require('dotenv').config({ path: '.env.local' });

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function createPlan() {
  try {
    console.log('🔄 Creating Razorpay Subscription Plan...');
    
    // Create Premium Monthly Plan
    const plan = await razorpay.plans.create({
      period: 'monthly',
      interval: 1,
      item: {
        name: 'Vismyras Premium Monthly',
        description: '50 AI outfit try-ons per month',
        amount: 19900, // ₹199 in paise
        currency: 'INR',
      },
      notes: {
        plan_type: 'premium',
        tryons_limit: 50,
      },
    });

    console.log('✅ Plan created successfully!');
    console.log('📋 Plan Details:');
    console.log(`   Plan ID: ${plan.id}`);
    console.log(`   Name: ${plan.item.name}`);
    console.log(`   Amount: ₹${plan.item.amount / 100}`);
    console.log(`   Period: ${plan.period} (${plan.interval} month)`);
    console.log('');
    console.log('📝 Add this to your .env.local:');
    console.log(`VITE_RAZORPAY_PLAN_ID=${plan.id}`);
    console.log('');
    console.log('⚠️  Important: Also set this in Vercel environment variables!');
    
  } catch (error) {
    console.error('❌ Error creating plan:', error.error || error.message);
    console.error('Full error:', error);
  }
}

createPlan();
