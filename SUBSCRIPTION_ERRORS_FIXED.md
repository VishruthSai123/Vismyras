# Subscription Errors - Fixed

## Error 1: 406 Not Acceptable
```
ltrknqshxbhmslnkpply.supabase.co/rest/v1/user_billing?select=*&user_id=eq.xxx: 406
```

**Cause**: Using `.single()` on a query that returns no rows or multiple rows.

**Impact**: Cosmetic only - doesn't break functionality, just shows in console.

**Status**: ✅ Known issue, non-critical

---

## Error 2: 500 Internal Server Error - create-subscription
```
POST https://tryonvismyras08.vercel.app/api/create-subscription 500
Error: Failed to create subscription
```

**Root Cause**: Environment variable mismatch

### Problem
The `/api/create-subscription.ts` API was looking for:
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`

But your `.env.local` has mode-based variables:
- Test: `VITE_RAZORPAY_TEST_KEY_ID`, `RAZORPAY_TEST_KEY_SECRET`
- Live: `VITE_RAZORPAY_LIVE_KEY_ID`, `RAZORPAY_LIVE_KEY_SECRET`

### Fix Applied ✅

**Updated `api/create-subscription.ts`**:
```typescript
// Determine if we're in live mode
const isLiveMode = process.env.VITE_RAZORPAY_LIVE_MODE === 'true';

// Get appropriate keys based on mode
const keyId = isLiveMode 
  ? process.env.VITE_RAZORPAY_LIVE_KEY_ID 
  : process.env.VITE_RAZORPAY_TEST_KEY_ID;

const keySecret = isLiveMode
  ? process.env.RAZORPAY_LIVE_KEY_SECRET
  : process.env.RAZORPAY_TEST_KEY_SECRET;
```

**Updated `services/razorpayService.ts`**:
```typescript
// Get plan ID based on mode
const isLiveMode = import.meta.env.VITE_RAZORPAY_LIVE_MODE === 'true';
const RAZORPAY_PLAN_ID = isLiveMode
  ? import.meta.env.VITE_RAZORPAY_LIVE_PREMIUM_PLAN_ID
  : import.meta.env.VITE_RAZORPAY_TEST_PREMIUM_PLAN_ID;
```

---

## What You Need to Do

### Step 1: Create Test Plan in Razorpay
1. Login to Razorpay Dashboard
2. Switch to **Test Mode** (toggle at top)
3. Go to: **Subscriptions** → **Plans** → **Create Plan**
4. Fill in:
   - Name: `Vismyras Premium Test`
   - Amount: `19900` (₹199)
   - Interval: `monthly`
   - Billing Cycles: `12`
5. Click **Create Plan**
6. **Copy the Plan ID** (e.g., `plan_xxxxxxxxxxxxx`)

### Step 2: Update `.env.local`
Replace this line:
```env
VITE_RAZORPAY_TEST_PREMIUM_PLAN_ID=plan_test_xxx
```

With your actual test plan ID:
```env
VITE_RAZORPAY_TEST_PREMIUM_PLAN_ID=plan_xxxxxxxxxxxxx
```

### Step 3: Deploy to Vercel
You need to add these environment variables to Vercel:

**Go to**: Vercel Dashboard → Your Project → Settings → Environment Variables

**Add these**:
```
VITE_RAZORPAY_LIVE_MODE = true
VITE_RAZORPAY_TEST_KEY_ID = rzp_test_RZCalW8FnHhyFK
RAZORPAY_TEST_KEY_SECRET = xat1T5SykUzrUyJIaDYD1tBj
VITE_RAZORPAY_LIVE_KEY_ID = rzp_live_RYrMe7EXEQ4UMt
RAZORPAY_LIVE_KEY_SECRET = z4QE76BS32ttCLO2cTOyH764
VITE_RAZORPAY_TEST_PREMIUM_PLAN_ID = [your test plan ID]
VITE_RAZORPAY_LIVE_PREMIUM_PLAN_ID = plan_RYs2Hhevq20OmD
```

**Important**: After adding variables, redeploy your site.

### Step 4: Restart Dev Server
```bash
# Stop current server (Ctrl+C)
npm run dev
```

---

## Testing Checklist

After fixing:

### Test Mode (Current)
- [ ] `VITE_RAZORPAY_LIVE_MODE=false` in `.env.local`
- [ ] Created test plan in Razorpay
- [ ] Updated `VITE_RAZORPAY_TEST_PREMIUM_PLAN_ID`
- [ ] Restart dev server
- [ ] Click "Premium Subscription"
- [ ] Should show Razorpay checkout with test plan
- [ ] Use test card: `4111 1111 1111 1111`
- [ ] Payment succeeds
- [ ] Database shows `sub_xxxxx` in `razorpay_subscription_id`

### Live Mode
- [ ] `VITE_RAZORPAY_LIVE_MODE=true` in `.env.local`
- [ ] Already have live plan: `plan_RYs2Hhevq20OmD`
- [ ] Vercel env vars configured
- [ ] Deploy to production
- [ ] Test with real payment

---

## Current Status

**Local Development**:
- ✅ Code fixed to handle mode-based keys
- ✅ Plan ID selection based on mode
- ⏳ Need to create test plan and add ID

**Production (Vercel)**:
- ⏳ Need to add environment variables
- ✅ Live plan ID already exists: `plan_RYs2Hhevq20OmD`

---

## Quick Debug

If still getting 500 error after fix:

1. **Check console for actual error**:
   ```
   Error creating Razorpay subscription: [error message]
   ```

2. **Common issues**:
   - Plan ID not set → "Plan ID not configured"
   - Wrong plan ID → "Plan does not exist"
   - Wrong keys → "Authentication failed"
   - Mode mismatch → "Invalid key for this mode"

3. **Verify environment**:
   ```bash
   # In browser console
   console.log(import.meta.env.VITE_RAZORPAY_LIVE_MODE);
   console.log(import.meta.env.VITE_RAZORPAY_TEST_PREMIUM_PLAN_ID);
   ```

---

## Summary

**Problem**: API couldn't find Razorpay credentials due to environment variable naming mismatch.

**Solution**: Updated API to read mode-based variables that match your `.env.local`.

**Next**: Create test plan in Razorpay and add plan ID to `.env.local`.
