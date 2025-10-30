# Razorpay Subscription Setup Guide

## Problem Fixed
Previously, the "Premium Subscription" feature was creating **one-time payments** instead of **recurring subscriptions**. This caused:
- ❌ Payment IDs (`pay_xxxxx`) stored instead of Subscription IDs (`sub_xxxxx`)
- ❌ Unable to cancel subscriptions (can't cancel a one-time payment)
- ❌ No automatic recurring billing

## Solution Implemented
Changed `subscribeTomonth()` to use proper Razorpay subscriptions with recurring billing.

---

## Step 1: Create Razorpay Subscription Plan

### Login to Razorpay Dashboard
1. Go to: https://dashboard.razorpay.com/
2. Make sure you're in **Test Mode** for testing (toggle at top)
3. Navigate to: **Subscriptions** → **Plans**

### Create Monthly Plan
Click **Create Plan** and fill in:

**Plan Details:**
- **Plan Name**: `Vismyras Premium Monthly`
- **Amount**: `19900` (₹199.00 in paise)
- **Currency**: `INR`
- **Billing Interval**: `monthly`
- **Billing Cycles**: `12` (or leave blank for unlimited)
- **Description**: `Premium membership with 50 try-ons/month`

**Additional Settings:**
- **Setup Fee**: `0` (no setup fee)
- **Trial Period**: `0` days (no trial)
- **Auto-collect**: ✅ Enabled

Click **Create Plan**

### Get Plan ID
After creation, you'll see a Plan ID like: `plan_xxxxxxxxxxxxx`

**Copy this Plan ID** - you'll need it for the environment variable.

---

## Step 2: Configure Environment Variables

Add to your `.env` file:

```env
# Razorpay Subscription Plan
VITE_RAZORPAY_PLAN_ID=plan_xxxxxxxxxxxxx
```

Replace `plan_xxxxxxxxxxxxx` with your actual Plan ID from Step 1.

---

## Step 3: How It Works

### One-Time Credits (Working)
```
User clicks "Buy 10 Credits"
  → Frontend calls createOrder()
  → Edge function: create-razorpay-order
  → Razorpay creates order_id
  → User pays
  → Webhook: order.paid event
  → Database: Add credits to user
```

### Subscriptions (Now Fixed)
```
User clicks "Premium Subscription"
  → Frontend calls createSubscription(PLAN_ID, USER_ID)
  → Edge function: create-razorpay-subscription (via /api/create-subscription)
  → Razorpay creates subscription_id
  → User pays first billing cycle
  → Webhook: subscription.activated event
  → Database: Grant 50 try-ons, set tier to PREMIUM
  → Monthly: subscription.charged event
  → Database: Reset try-ons to 50, extend period
```

### Cancellation (Now Works)
```
User clicks "Cancel Subscription"
  → Frontend calls cancelSubscription(subscription_id)
  → Edge function: cancel-razorpay-subscription
  → Razorpay cancels subscription
  → Webhook: subscription.cancelled event
  → Database: Keep premium until period_end
  → After period_end: Downgrade to FREE tier
```

---

## Step 4: Testing

### Test Subscription Flow
1. **Start subscription**:
   - Click "Premium Subscription" button
   - Use test card: `4111 1111 1111 1111`
   - CVV: any 3 digits, Date: future date
   - Complete payment

2. **Verify database**:
   ```sql
   SELECT 
     tier,
     monthly_limit,
     monthly_used,
     razorpay_subscription_id,
     period_start,
     period_end
   FROM user_billing
   WHERE user_id = 'your-user-id';
   ```
   
   Should show:
   - `tier`: `PREMIUM`
   - `monthly_limit`: `50`
   - `razorpay_subscription_id`: `sub_xxxxx` (starts with `sub_`, not `pay_`)

3. **Test cancellation**:
   - Open user menu → "Manage Subscription"
   - Click "Cancel Subscription"
   - Should succeed (no "id does not exist" error)
   - Verify webhook received `subscription.cancelled` event

### Check Webhook Events
In Razorpay Dashboard:
- Go to: **Webhooks** → **Logs**
- Look for:
  - `subscription.activated` - When user subscribes
  - `subscription.charged` - Monthly billing
  - `subscription.cancelled` - When user cancels

---

## Step 5: Production Deployment

### Switch to Live Mode
1. **Razorpay Dashboard**: Toggle to **Live Mode**
2. **Create production plan** with same details as test plan
3. **Get production Plan ID**: `plan_xxxxxxxxxxxxx`
4. **Update environment variables**:
   ```env
   # Production
   VITE_RAZORPAY_KEY_ID=rzp_live_xxxxx
   VITE_RAZORPAY_PLAN_ID=plan_xxxxxxxxxxxxx
   ```

### Verify Webhook
- Ensure webhook URL is set: `https://your-domain.com/api/webhook`
- Events enabled: `subscription.activated`, `subscription.charged`, `subscription.cancelled`
- Webhook secret is configured in Supabase

---

## Code Changes Summary

### Fixed Files

**`services/razorpayService.ts`**:
- ✅ Removed duplicate `createSubscription()` methods
- ✅ Changed `subscribeTomonth()` to use `createSubscription()` instead of `createOrder()`
- ✅ Now uses `subscription_id` instead of `order_id` in Razorpay options
- ✅ Handler saves `razorpay_subscription_id` instead of `razorpay_payment_id`
- ✅ Uses `VITE_RAZORPAY_PLAN_ID` environment variable

**Key Change**:
```typescript
// BEFORE (WRONG):
const orderId = await this.createOrder(amount, 'INR', {...});
options.order_id = orderId;
await billingService.upgradeToPremium(response.razorpay_payment_id);

// AFTER (CORRECT):
const subscriptionId = await this.createSubscription(PLAN_ID, userId);
options.subscription_id = subscriptionId;
await billingService.upgradeToPremium(response.razorpay_subscription_id);
```

---

## Differences: Orders vs Subscriptions

| Feature | Orders (One-Time) | Subscriptions (Recurring) |
|---------|------------------|---------------------------|
| **ID Format** | `order_xxxxx` | `sub_xxxxx` |
| **Payment** | One-time | Recurring monthly |
| **Razorpay Method** | `orders.create()` | `subscriptions.create()` |
| **Webhook Events** | `order.paid` | `subscription.activated`, `subscription.charged` |
| **Cancellation** | N/A (already paid) | Can be cancelled anytime |
| **Use Case** | Credits (10, 25, 50) | Premium membership |

---

## Troubleshooting

### "Plan ID does not exist"
- **Cause**: Wrong plan ID or using test plan ID in live mode
- **Fix**: Verify plan ID in Razorpay Dashboard, ensure mode matches

### "subscription_id is required"
- **Cause**: Environment variable not set
- **Fix**: Add `VITE_RAZORPAY_PLAN_ID` to `.env`

### Subscription not activated after payment
- **Cause**: Webhook not firing or plan_id mismatch
- **Fix**: 
  1. Check webhook logs in Razorpay Dashboard
  2. Verify webhook URL is correct
  3. Check Supabase edge function logs

### Can't cancel subscription
- **Cause**: Subscription ID stored incorrectly (payment ID instead)
- **Fix**: This is now fixed - new subscriptions will store correct ID

---

## Support

Need help? Check:
1. **Razorpay Docs**: https://razorpay.com/docs/subscriptions/
2. **Webhook Logs**: Razorpay Dashboard → Webhooks → Logs
3. **Edge Function Logs**: Supabase Dashboard → Edge Functions
4. **Database State**: Check `user_billing` table

---

## Next Steps

1. ✅ Create Razorpay subscription plan (Test Mode)
2. ✅ Copy plan ID
3. ✅ Add `VITE_RAZORPAY_PLAN_ID` to `.env`
4. ✅ Test subscription flow
5. ✅ Verify cancellation works
6. ✅ Create production plan
7. ✅ Deploy to production

**Status**: Frontend is ready! Just add the plan ID to your environment variables.
