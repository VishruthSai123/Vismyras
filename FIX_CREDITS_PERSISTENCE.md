# Fix Credits Persistence - Deployment Guide

## 🔴 CRITICAL ISSUES IDENTIFIED

From your console logs:
1. **403 Forbidden Error**: `new row violates row-level security policy for table "user_billing"`
2. **Credits showing 0 after logout**: Despite being granted, credits not persisting
3. **Edge Function using old schema**: Webhook using `try_ons_count` instead of `credits_remaining`

---

## 🛠️ SOLUTION OVERVIEW

### Problem 1: RLS Policies Blocking User Inserts
**Issue**: User can SELECT and UPDATE billing data, but cannot INSERT (upsert fails on first-time users)

**Fix**: Migration 009 adds INSERT policy for authenticated users

### Problem 2: Edge Function Schema Mismatch
**Issue**: Edge function inserting with old column names (`try_ons_count`)

**Fix**: Updated webhook function to use `add_one_time_credits()` database function

### Problem 3: Credits Not Loading After Login
**Issue**: Database query working but UI showing 0

**Fix**: Already implemented - `loadBillingFromSupabase()` should work after RLS fix

---

## 📋 STEP-BY-STEP DEPLOYMENT

### Step 1: Run Migration 009 (Fix RLS Policies)

```bash
# In Supabase Dashboard > SQL Editor, run:
```

```sql
-- Copy contents from: supabase/migrations/009_fix_user_billing_rls_policies.sql

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can update own billing" ON public.user_billing;

-- Create comprehensive policies for authenticated users
CREATE POLICY "Users can insert own billing"
    ON public.user_billing FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own billing"
    ON public.user_billing FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
```

**Verify migration worked:**
```sql
-- Check policies are active
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'user_billing' AND schemaname = 'public';
```

Expected output:
- `Users can insert own billing` - INSERT
- `Users can update own billing` - UPDATE
- `Users can view own billing` - SELECT
- `Service role can manage billing` - ALL

---

### Step 2: Deploy Updated Edge Function

**Option A: Using Supabase CLI**
```bash
cd c:\Users\VISHRUTH\Vismyras\Vismyras

# Deploy the updated webhook function
supabase functions deploy razorpay-webhook
```

**Option B: Manual Deployment via Dashboard**
1. Go to Supabase Dashboard → Edge Functions
2. Find `razorpay-webhook`
3. Click "Deploy new version"
4. Copy contents from `supabase/functions/razorpay-webhook/index.ts`
5. Deploy

**Verify deployment:**
```bash
# Check function logs in Supabase Dashboard
# Look for: "✅ GRANTING X ONE-TIME CREDITS"
```

---

### Step 3: Test Credit Purchase Flow

1. **Login to your app**
2. **Open browser console** (F12)
3. **Buy credits** (try ₹39 for 5 credits)
4. **Check console logs** for:
   ```
   ✅ GRANTING ONE-TIME CREDITS (Manual - Testing Only)
   🎫 Credits: 5
   📅 Expires: [date]
   ```
5. **Verify no 403 errors** in console
6. **Logout and login again**
7. **Check if credits persist** in UsageScreen

---

### Step 4: Verify Database Records

In Supabase Dashboard → Table Editor:

**Check `user_billing` table:**
```sql
SELECT user_id, monthly_used, monthly_limit, created_at 
FROM user_billing 
WHERE user_id = 'YOUR_USER_ID';
```

**Check `user_one_time_purchases` table:**
```sql
SELECT 
  user_id,
  razorpay_payment_id,
  credits_purchased,
  credits_remaining,
  price,
  expiry_date
FROM user_one_time_purchases 
WHERE user_id = 'YOUR_USER_ID'
AND expiry_date > NOW();
```

---

## 🔍 DEBUGGING CHECKLIST

If credits still show 0 after logout/login:

### Check 1: RLS Policies
```sql
-- Verify policies exist
SELECT * FROM pg_policies WHERE tablename = 'user_billing';
```

### Check 2: Database Has Data
```sql
-- Check if purchases exist
SELECT COUNT(*) FROM user_one_time_purchases 
WHERE user_id = auth.uid();
```

### Check 3: Browser Console Logs
Look for these messages after login:
```
✅ Billing data loaded from database
Monthly: X/Y
One-time credits: Z purchase(s)
Total available credits: W
```

### Check 4: Network Tab
- Check for 403 errors on POST to `/rest/v1/user_billing`
- If present, RLS policies not deployed correctly

### Check 5: Edge Function Logs
In Supabase Dashboard → Edge Functions → razorpay-webhook:
```
✅ GRANTING X ONE-TIME CREDITS to user [user_id]
💰 Amount paid: ₹X
✅ Credits granted (purchase_id: [uuid]), expires in 30 days
```

---

## 🎯 EXPECTED BEHAVIOR AFTER FIX

### When Buying Credits:
1. Razorpay payment completes
2. Webhook receives `payment.captured` event
3. Edge function calls `add_one_time_credits()` database function
4. Record inserted into `user_one_time_purchases` table
5. Credits appear in UI immediately

### After Logout/Login:
1. User logs in
2. `billingService.setCurrentUser()` called
3. `loadBillingFromSupabase()` fetches from database
4. `getOneTimePurchases()` loads active credits
5. `dbBillingToUserBilling()` converts to app format
6. Credits appear in UsageScreen

### When Using Credits:
1. User clicks "Generate Outfit"
2. `consumeTryOn()` called
3. `incrementUsage()` database function called
4. Monthly credits used first, then one-time credits (FIFO)
5. `credits_remaining` decremented atomically
6. UI updates to show remaining credits

---

## 📊 MONITORING

### Check Credit Usage:
```sql
SELECT 
  u.email,
  b.monthly_used,
  b.monthly_limit,
  COALESCE(SUM(p.credits_remaining), 0) as one_time_credits
FROM auth.users u
LEFT JOIN user_billing b ON u.id = b.user_id
LEFT JOIN user_one_time_purchases p ON u.id = p.user_id 
  AND p.expiry_date > NOW()
GROUP BY u.id, u.email, b.monthly_used, b.monthly_limit;
```

### Check Expiring Credits:
```sql
SELECT 
  user_id,
  credits_remaining,
  expiry_date,
  EXTRACT(DAY FROM (expiry_date - NOW())) as days_remaining
FROM user_one_time_purchases
WHERE expiry_date > NOW()
AND expiry_date < NOW() + INTERVAL '7 days'
ORDER BY expiry_date ASC;
```

---

## 🚀 PRODUCTION CHECKLIST

Before going live:

- [ ] Migration 009 deployed successfully
- [ ] Edge function `razorpay-webhook` updated
- [ ] Test purchase with real Razorpay payment
- [ ] Verify credits persist after logout/login
- [ ] Check webhook logs in Supabase
- [ ] Monitor for 403 errors (should be zero)
- [ ] Test credit consumption (try-on usage)
- [ ] Verify FIFO credit consumption (oldest expires first)
- [ ] Test with multiple users
- [ ] Set up monitoring alerts

---

## 💡 TROUBLESHOOTING

### Issue: Still getting 403 errors
**Solution**: 
```sql
-- Re-run RLS policy fix
DROP POLICY IF EXISTS "Users can insert own billing" ON public.user_billing;
DROP POLICY IF EXISTS "Users can update own billing" ON public.user_billing;

CREATE POLICY "Users can insert own billing"
    ON public.user_billing FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own billing"
    ON public.user_billing FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
```

### Issue: Credits granted but not showing
**Solution**: Check database function exists
```sql
-- Verify function exists
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'add_one_time_credits';

-- If missing, re-run migration 008
```

### Issue: Webhook not triggering
**Solution**:
1. Check Razorpay Dashboard → Webhooks
2. Verify webhook URL: `https://[project-id].supabase.co/functions/v1/razorpay-webhook`
3. Check webhook secret in Supabase → Project Settings → Edge Functions
4. Test webhook with sample payload in Razorpay Dashboard

---

## 📞 NEXT STEPS

1. **Deploy migration 009** → Fix RLS policies
2. **Deploy updated Edge Function** → Fix schema mismatch
3. **Test purchase flow** → Verify credits granted
4. **Test persistence** → Logout/login and check credits
5. **Monitor logs** → Watch for errors
6. **Go live!** 🎉

---

## ✅ SUCCESS CRITERIA

You'll know it's working when:
- ✅ No 403 errors in console
- ✅ Credits appear immediately after purchase
- ✅ Credits persist after logout/login
- ✅ Database shows correct records
- ✅ Usage correctly decrements credits
- ✅ Expired credits automatically hidden

---

**Need help?** Check:
- Supabase Dashboard → Logs
- Browser Console → Network Tab
- Edge Function Logs → razorpay-webhook
- Database → user_one_time_purchases table
