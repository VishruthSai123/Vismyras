# Deploy Edge Functions - Quick Guide

## What Changed

Updated these edge functions to support **test/live mode**:
1. ✅ `create-razorpay-order` - Now uses test/live keys based on mode
2. ✅ `cancel-razorpay-subscription` - Now uses test/live keys based on mode
3. ✅ `verify-razorpay-payment` - Now uses test/live keys based on mode
4. ✅ `razorpay-webhook` - Already correct, no changes

---

## Step 1: Add Missing Secrets

You need to add these secrets to Supabase:

```bash
# Set mode (true = live, false = test)
supabase secrets set VITE_RAZORPAY_LIVE_MODE=true

# Live plan ID (already created)
supabase secrets set VITE_RAZORPAY_LIVE_PREMIUM_PLAN_ID=plan_RYs2Hhevq20OmD
```

After creating your test plan, add:
```bash
# Replace with your actual test plan ID
supabase secrets set VITE_RAZORPAY_TEST_PREMIUM_PLAN_ID=plan_xxxxxxxxxxxxx
```

---

## Step 2: Deploy Edge Functions

Deploy all updated functions:

```bash
# Deploy create-razorpay-order
supabase functions deploy create-razorpay-order

# Deploy cancel-razorpay-subscription
supabase functions deploy cancel-razorpay-subscription

# Deploy verify-razorpay-payment
supabase functions deploy verify-razorpay-payment
```

Or deploy all at once:
```bash
supabase functions deploy create-razorpay-order cancel-razorpay-subscription verify-razorpay-payment
```

---

## Step 3: Verify Deployment

Check function status:
```bash
supabase functions list
```

Should show updated timestamps for all three functions.

---

## Current Secrets Status

### ✅ Already Configured:
- `RAZORPAY_KEY_ID` (old, can keep)
- `RAZORPAY_KEY_SECRET` (old, can keep)
- `RAZORPAY_LIVE_KEY_SECRET`
- `RAZORPAY_TEST_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `SUPABASE_ANON_KEY`
- `SUPABASE_DB_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_URL`
- `VITE_RAZORPAY_LIVE_KEY_ID`
- `VITE_RAZORPAY_TEST_KEY_ID`
- `VITE_RAZORPAY_TEST_PREMIUM_PLAN_ID` (exists but needs correct value)

### ⏳ Need to Add:
- `VITE_RAZORPAY_LIVE_MODE` - Set to `true` or `false`
- `VITE_RAZORPAY_LIVE_PREMIUM_PLAN_ID` - Your live plan ID
- `VITE_RAZORPAY_TEST_PREMIUM_PLAN_ID` - Need to update with real test plan

---

## What Each Function Does

### `create-razorpay-order`
- **Purpose**: Creates one-time payment orders (for credits)
- **Used by**: Frontend `razorpayService.createOrder()`
- **Change**: Now selects test/live keys based on mode
- **Must Deploy**: ✅ YES

### `cancel-razorpay-subscription`
- **Purpose**: Cancels recurring subscriptions
- **Used by**: Frontend `razorpayService.cancelSubscription()`
- **Change**: Now selects test/live keys based on mode
- **Must Deploy**: ✅ YES

### `verify-razorpay-payment`
- **Purpose**: Verifies payment signatures
- **Used by**: Frontend payment verification
- **Change**: Now selects test/live secret based on mode
- **Must Deploy**: ✅ YES

### `razorpay-webhook`
- **Purpose**: Handles all Razorpay webhook events
- **Used by**: Razorpay → sends events to this endpoint
- **Change**: None needed, already correct
- **Must Deploy**: ❌ NO (but won't hurt to redeploy)

---

## Testing After Deployment

### Test Mode
1. Set in `.env.local`:
   ```env
   VITE_RAZORPAY_LIVE_MODE=false
   ```

2. Restart dev server:
   ```bash
   npm run dev
   ```

3. Try subscription:
   - Should use test keys
   - Should use test plan ID
   - Test card: `4111 1111 1111 1111`

### Live Mode
1. Set in `.env.local`:
   ```env
   VITE_RAZORPAY_LIVE_MODE=true
   ```

2. Deploy to Vercel with live env vars

3. Real payments:
   - Uses live keys
   - Uses live plan ID
   - Real payment cards

---

## Quick Deploy Commands

Run these in order:

```bash
# 1. Add mode secret
supabase secrets set VITE_RAZORPAY_LIVE_MODE=true

# 2. Add live plan ID
supabase secrets set VITE_RAZORPAY_LIVE_PREMIUM_PLAN_ID=plan_RYs2Hhevq20OmD

# 3. Deploy all updated functions
supabase functions deploy create-razorpay-order cancel-razorpay-subscription verify-razorpay-payment

# 4. Verify
supabase functions list
```

After creating test plan:
```bash
# Add test plan ID (replace with your actual plan ID)
supabase secrets set VITE_RAZORPAY_TEST_PREMIUM_PLAN_ID=plan_xxxxxxxxxxxxx
```

---

## Troubleshooting

### "Razorpay credentials not configured"
- **Cause**: Missing mode secret or wrong mode keys
- **Fix**: Check `VITE_RAZORPAY_LIVE_MODE` is set
- **Verify**: `supabase secrets list` shows all required keys

### "Plan ID not configured"
- **Cause**: Missing plan ID for current mode
- **Fix**: Add test/live plan ID based on mode
- **Verify**: `.env.local` and Supabase secrets both set

### Function not using new code
- **Cause**: Old function version still deployed
- **Fix**: Redeploy function: `supabase functions deploy <function-name>`
- **Verify**: Check version number increased in `supabase functions list`

---

## Summary

**Changes Made**:
- ✅ Updated 3 edge functions to support test/live mode
- ✅ Functions now select correct keys based on `VITE_RAZORPAY_LIVE_MODE`

**You Need To**:
1. Add missing secrets (mode + live plan ID)
2. Deploy updated functions
3. Create test plan and add its ID

**After Deploy**:
- One-time credits: ✅ Works in test/live mode
- Subscriptions: ✅ Works in test/live mode (after adding plan ID)
- Cancellations: ✅ Works in test/live mode
- Webhooks: ✅ Already working

Status: **Ready to deploy!** Just run the commands above.
