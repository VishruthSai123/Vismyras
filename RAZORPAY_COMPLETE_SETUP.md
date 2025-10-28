# 🔐 Razorpay Backend & Product Setup Guide

## 📋 Overview

This guide covers the complete backend setup for Razorpay integration including:
- Backend API endpoints (Vercel Serverless Functions)
- Webhook configuration
- Product/Plan creation
- Testing and deployment

---

## 🏗️ Backend Architecture

```
api/
├── create-order.ts       # Creates Razorpay orders
├── verify-payment.ts     # Verifies payment signatures
└── webhook.ts            # Handles Razorpay webhooks

services/
└── razorpayService.ts    # Frontend payment service (already exists)
```

---

## ✅ Prerequisites Completed

- [x] Razorpay account created
- [x] API keys added to `.env.local`
- [x] Webhook configured in Razorpay Dashboard

---

## 🔧 Step 1: Environment Variables Setup

Add these to your `.env.local`:

```bash
# Razorpay Keys (Already Added)
RAZORPAY_KEY_ID=rzp_live_RYrMe7EXEQ4UMt
RAZORPAY_KEY_SECRET=z4QE76BS32ttCLO2cTOyH764

# Razorpay Webhook Secret (Get from Razorpay Dashboard)
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here

# Supabase Service Role Key (For webhook database updates)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### How to Get Webhook Secret:
1. Go to: https://dashboard.razorpay.com/app/webhooks
2. Click on your webhook
3. Copy the "Secret" value
4. Add to `.env.local` as `RAZORPAY_WEBHOOK_SECRET`

### How to Get Supabase Service Role Key:
1. Go to: https://supabase.com/dashboard/project/ltrknqshxbhmslnkpply/settings/api
2. Find "service_role" key under "Project API keys"
3. Copy and add to `.env.local` as `SUPABASE_SERVICE_ROLE_KEY`

---

## 📦 Step 2: Update Frontend Service

Update `services/razorpayService.ts` to use the backend API:

```typescript
/**
 * Create a payment order via backend API
 */
private async createOrder(amount: number, currency: string, notes: any): Promise<string> {
  try {
    const response = await fetch('/api/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: amount * 100, currency, notes })
    });
    
    if (!response.ok) {
      throw new Error('Failed to create order');
    }
    
    const data = await response.json();
    return data.orderId;
  } catch (error) {
    console.error('Order creation error:', error);
    throw error;
  }
}

/**
 * Verify payment signature via backend API
 */
private async verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): Promise<boolean> {
  try {
    const response = await fetch('/api/verify-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, paymentId, signature })
    });
    
    const data = await response.json();
    return data.verified;
  } catch (error) {
    console.error('Payment verification error:', error);
    return false;
  }
}
```

---

## 🎯 Step 3: Create Razorpay Products/Plans

### Option A: Using Razorpay Dashboard (Recommended)

#### 1. Create Premium Subscription Plan

1. Go to: https://dashboard.razorpay.com/app/subscriptions/plans
2. Click **"Create Plan"**
3. Fill in details:
   ```
   Plan Name: Vismyras Premium Monthly
   Plan ID: vismyras_premium_monthly
   Billing Amount: ₹199
   Billing Frequency: Monthly (Every 1 month)
   Description: 25 virtual try-ons per month
   ```
4. Click **"Create Plan"**
5. **Copy the Plan ID** (e.g., `plan_XXXXXXXXXXXXX`)

#### 2. Create One-Time Payment Items

Razorpay doesn't require separate "products" for one-time payments. Your order creation handles this dynamically.

---

### Option B: Using Razorpay API (Programmatic)

Create a script to generate plans:

```bash
# Create file: scripts/create-razorpay-plans.js
```

```javascript
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: 'rzp_live_RYrMe7EXEQ4UMt',
  key_secret: 'z4QE76BS32ttCLO2cTOyH764',
});

async function createPlans() {
  try {
    // Create Premium Monthly Plan
    const premiumPlan = await razorpay.plans.create({
      period: 'monthly',
      interval: 1,
      item: {
        name: 'Vismyras Premium Monthly',
        description: '25 virtual try-ons per month',
        amount: 19900, // ₹199 in paise
        currency: 'INR',
      },
    });

    console.log('✅ Premium Plan Created:');
    console.log('Plan ID:', premiumPlan.id);
    console.log('Amount:', premiumPlan.item.amount / 100, 'INR');
    console.log('Period:', premiumPlan.period);

    return {
      premium: premiumPlan.id,
    };
  } catch (error) {
    console.error('❌ Error creating plans:', error);
  }
}

createPlans().then((planIds) => {
  console.log('\n📋 Add these to your .env.local:');
  console.log(`RAZORPAY_PREMIUM_PLAN_ID=${planIds.premium}`);
});
```

Run the script:
```bash
node scripts/create-razorpay-plans.js
```

---

## 🔗 Step 4: Update Product IDs in Code

### Add Plan IDs to Environment Variables

```bash
# Add to .env.local
RAZORPAY_PREMIUM_PLAN_ID=plan_XXXXXXXXXXXXX
```

### Update Frontend to Use Plan IDs

Update `services/razorpayService.ts`:

```typescript
/**
 * Open Razorpay checkout for subscription using Plan ID
 */
public async subscribeTomonth(
  amount: number,
  onSuccess: (response: RazorpayPaymentResponse) => void,
  onFailure: (error: any) => void
): Promise<void> {
  const loaded = await this.loadRazorpayScript();
  if (!loaded) {
    onFailure(new Error('Failed to load Razorpay'));
    return;
  }

  try {
    // Get user info for prefill
    const user = supabaseService.getCurrentUser();
    
    // Create subscription (using backend API)
    const response = await fetch('/api/create-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planId: import.meta.env.VITE_RAZORPAY_PREMIUM_PLAN_ID,
        userId: user?.auth.id,
        totalCount: 12, // Number of billing cycles (12 months)
      })
    });

    const { subscriptionId } = await response.json();

    // Razorpay options for subscription
    const options = {
      key: this.razorpayKeyId,
      subscription_id: subscriptionId,
      name: 'Vismyras',
      description: 'Premium Subscription - ₹199/month',
      prefill: {
        name: user?.profile.full_name || '',
        email: user?.profile.email || '',
      },
      theme: {
        color: '#a855f7',
      },
      handler: async (response: RazorpayPaymentResponse) => {
        // Verify and activate subscription
        const verified = await this.verifyPaymentSignature(
          subscriptionId,
          response.razorpay_payment_id,
          response.razorpay_signature
        );

        if (verified) {
          billingService.upgradeToPremium(subscriptionId);
          onSuccess(response);
        } else {
          onFailure(new Error('Payment verification failed'));
        }
      },
      modal: {
        ondismiss: () => {
          onFailure(new Error('Payment cancelled by user'));
        },
      },
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  } catch (error) {
    onFailure(error);
  }
}
```

---

## 🔄 Step 5: Create Subscription API Endpoint

Create `api/create-subscription.ts`:

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { planId, userId, totalCount = 12 } = req.body;

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

    res.status(200).json({
      success: true,
      subscriptionId: subscription.id,
    });
  } catch (error: any) {
    console.error('Subscription creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create subscription',
      message: error.message 
    });
  }
}
```

---

## 🎨 Step 6: Product Configuration

### Current Products (Already Defined in Your App)

#### 1. **Free Tier**
- **Price**: ₹0
- **Try-ons**: 3 per month
- **No Razorpay setup needed** (handled client-side)

#### 2. **Premium Subscription**
- **Price**: ₹199/month
- **Try-ons**: 25 per month
- **Razorpay Plan ID**: `plan_XXXXXXXXXXXXX` (from Step 3)
- **Auto-renewal**: Yes

#### 3. **One-Time Credits**

| Package | Try-ons | Price | Price per Try-on |
|---------|---------|-------|------------------|
| Single  | 1       | ₹29   | ₹29.00          |
| Small   | 5       | ₹129  | ₹25.80          |
| Medium  | 10      | ₹249  | ₹24.90          |

**No Plan IDs needed** - handled dynamically via order creation

---

## 🧪 Step 7: Testing

### Test Mode Setup

1. Switch to **Test Mode** in Razorpay Dashboard:
   - Toggle at top right: "Live" → "Test"

2. Get Test API Keys:
   ```bash
   RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXX
   RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXXXXXXX
   ```

3. Use Test Card Details:
   ```
   Card Number: 4111 1111 1111 1111
   CVV: Any 3 digits
   Expiry: Any future date
   Name: Any name
   ```

### Test Scenarios

#### ✅ Test Subscription Payment
1. Click "Upgrade to Premium" in your app
2. Use test card details
3. Complete payment
4. Verify:
   - User upgraded to Premium in Supabase
   - Monthly limit changed to 25
   - Webhook received (check logs)

#### ✅ Test One-Time Purchase
1. Click "Buy 5 Try-ons" (₹129)
2. Use test card details
3. Complete payment
4. Verify:
   - Credits added to user account
   - one_time_credits increased by 5
   - Webhook received

#### ✅ Test Failed Payment
1. Use invalid test card: `4000 0000 0000 0002`
2. Verify:
   - Error message shown
   - No credits added
   - Transaction marked as failed

#### ✅ Test Webhook
1. Go to Razorpay Dashboard → Webhooks
2. Click "Send Test Webhook"
3. Select event type (e.g., `payment.captured`)
4. Verify your webhook endpoint received it

---

## 🚀 Step 8: Deploy to Production

### 1. Add Environment Variables to Vercel

```bash
vercel env add RAZORPAY_KEY_ID
vercel env add RAZORPAY_KEY_SECRET
vercel env add RAZORPAY_WEBHOOK_SECRET
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add RAZORPAY_PREMIUM_PLAN_ID
```

Or via Vercel Dashboard:
1. Go to: https://vercel.com/designvibes3366/vismyras/settings/environment-variables
2. Add each variable for **Production** environment

### 2. Deploy

```bash
git add .
git commit -m "Add Razorpay backend and webhook handlers"
git push origin main
```

Or:
```bash
vercel --prod
```

### 3. Update Webhook URL in Razorpay

1. Go to: https://dashboard.razorpay.com/app/webhooks
2. Edit your webhook
3. Update URL to: `https://tryonvismyras08.vercel.app/api/webhook`
4. Select events:
   - ✅ payment.captured
   - ✅ payment.failed
   - ✅ subscription.activated
   - ✅ subscription.cancelled
   - ✅ subscription.charged
   - ✅ subscription.paused
   - ✅ subscription.resumed
5. Save

### 4. Switch to Live Mode

1. Toggle to "Live" mode in Razorpay Dashboard
2. Use live API keys in Vercel environment variables
3. Test with small real payment

---

## 📊 Step 9: Monitoring & Analytics

### Razorpay Dashboard

Monitor payments at:
- **Payments**: https://dashboard.razorpay.com/app/payments
- **Subscriptions**: https://dashboard.razorpay.com/app/subscriptions
- **Webhooks**: https://dashboard.razorpay.com/app/webhooks

### Vercel Function Logs

View API logs:
```bash
vercel logs --follow
```

Or in dashboard:
https://vercel.com/designvibes3366/vismyras/logs

### Supabase Database

Check user billing:
```sql
SELECT 
  user_id,
  subscription_tier,
  subscription_status,
  monthly_used,
  monthly_limit,
  one_time_credits,
  razorpay_subscription_id
FROM user_billing
ORDER BY updated_at DESC
LIMIT 20;
```

---

## 🔐 Security Best Practices

### ✅ Implemented

- [x] API keys stored in environment variables
- [x] Webhook signature verification
- [x] Payment signature verification on backend
- [x] HTTPS only (Vercel default)
- [x] Supabase RLS policies

### 🚨 Important

1. **Never expose `RAZORPAY_KEY_SECRET`** in frontend code
2. **Always verify payments on backend** before granting access
3. **Use webhook secret** to verify Razorpay webhooks
4. **Use Supabase service role key** only in backend API routes
5. **Log all payment transactions** for audit trail

---

## 📝 Product ID Reference

Once you create plans in Step 3, document them here:

### Subscription Plans

```typescript
// Add to services/razorpayService.ts or a config file
export const RAZORPAY_PLANS = {
  PREMIUM_MONTHLY: {
    id: 'plan_XXXXXXXXXXXXX', // Replace with actual ID
    name: 'Premium Monthly',
    price: 199,
    tryOns: 25,
    period: 'monthly',
  },
  // Add more plans as needed
};
```

### One-Time Products

No Plan IDs needed - handled dynamically:

```typescript
export const CREDIT_PACKAGES = {
  SINGLE: { tryOns: 1, price: 29 },
  SMALL: { tryOns: 5, price: 129 },
  MEDIUM: { tryOns: 10, price: 249 },
};
```

---

## 🐛 Troubleshooting

### Issue: "Order creation failed"

**Cause**: Backend API not accessible or Razorpay credentials invalid

**Solution**:
1. Check `/api/create-order` is deployed
2. Verify `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in Vercel
3. Check Vercel function logs: `vercel logs`

### Issue: "Payment verification failed"

**Cause**: Signature mismatch or backend error

**Solution**:
1. Ensure `RAZORPAY_KEY_SECRET` is correct
2. Check `/api/verify-payment` logs
3. Verify order ID matches

### Issue: "Webhook not received"

**Cause**: Webhook URL incorrect or signature verification failing

**Solution**:
1. Verify webhook URL: `https://your-domain.vercel.app/api/webhook`
2. Check `RAZORPAY_WEBHOOK_SECRET` in Vercel
3. View webhook logs in Razorpay Dashboard
4. Send test webhook from dashboard

### Issue: "Payment succeeded but user not upgraded"

**Cause**: Webhook handler not updating database

**Solution**:
1. Check webhook handler logs
2. Verify `SUPABASE_SERVICE_ROLE_KEY` has permissions
3. Check Supabase database for RLS policies
4. Manually update user in Supabase:
   ```sql
   UPDATE user_billing
   SET subscription_tier = 'PREMIUM',
       monthly_limit = 25
   WHERE user_id = 'user_id_here';
   ```

---

## ✅ Final Checklist

Before going live:

- [ ] All environment variables added to Vercel
- [ ] Backend API endpoints deployed and tested
- [ ] Webhook URL configured in Razorpay Dashboard
- [ ] Webhook secret added to environment variables
- [ ] Premium plan created and ID documented
- [ ] Test payments completed successfully
- [ ] Webhook events received and processed
- [ ] User billing updated correctly in Supabase
- [ ] Switched to Live mode in Razorpay
- [ ] Live payment tested with small amount
- [ ] Monitoring and logging set up
- [ ] Error handling tested

---

## 📞 Support

**Razorpay Support:**
- Dashboard: https://dashboard.razorpay.com/
- Documentation: https://razorpay.com/docs/
- Support: https://razorpay.com/support/

**Vercel Support:**
- Documentation: https://vercel.com/docs
- Functions: https://vercel.com/docs/functions

---

## 🎉 You're Done!

Your Razorpay integration is complete with:
- ✅ Secure backend API endpoints
- ✅ Automated webhook handling
- ✅ Subscription and one-time payments
- ✅ Database synchronization
- ✅ Production-ready setup

**Next Steps:**
1. Create your Razorpay plan (Step 3)
2. Add the Plan ID to your environment variables
3. Test in Test mode
4. Deploy to production
5. Switch to Live mode and test with real payment

---

**Last Updated**: October 28, 2025  
**Version**: 1.0  
**Author**: Vismyras Team
