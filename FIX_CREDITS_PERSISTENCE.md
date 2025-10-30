# Fix Credits Persistence - COMPLETE SOLUTION

## 🔴 CRITICAL ISSUES IDENTIFIED

From your console logs:
1. **409 Conflict Error**: `duplicate key value violates unique constraint "user_billing_user_id_key"`
2. **Credits showing 0 after logout**: Credits only saved to localStorage, not database
3. **Upsert not working**: Missing `onConflict` parameter in Supabase upsert call

---

## 🛠️ ROOT CAUSES & SOLUTIONS

### Problem 1: Upsert Failing (409 Conflict)
**Issue**: Supabase `upsert()` needs explicit conflict column specification

**Fix**: Added `{ onConflict: 'user_id' }` parameter to upsert call in `supabaseService.ts`

### Problem 2: Credits Not Persisting to Database
**Issue**: `addOneTimePurchase()` only saved to localStorage, not database

**Fix**: Made method async and added database save via `add_one_time_credits()` function

### Problem 3: Missing Billing Records for Existing Users
**Issue**: Users created before trigger existed have no `user_billing` record

**Fix**: Migration 009 creates records for ALL existing users

### Problem 4: Edge Function Schema Mismatch
**Issue**: Webhook using old column names

**Fix**: Updated to use `add_one_time_credits()` database function

---

## 📋 STEP-BY-STEP DEPLOYMENT

### Step 1: Deploy Code Changes

The code has been fixed with these changes:

**File 1: `services/supabaseService.ts`**
- ✅ Added `onConflict: 'user_id'` to upsert call (fixes 409 error)
- ✅ Added `addOneTimePurchaseToDatabase()` method

**File 2: `services/billingService.ts`**
- ✅ Made `addOneTimePurchase()` async
- ✅ Now saves credits to database automatically

**File 3: `supabase/functions/razorpay-webhook/index.ts`**
- ✅ Updated to use `add_one_time_credits()` database function
- ✅ Proper schema alignment

Build and deploy your app:
```bash
npm run build
# Deploy to Vercel/your hosting
```

---

### Step 2: Run Migration 009 (CRITICAL - Must Run First!)

Go to **Supabase Dashboard → SQL Editor** and run:

```sql
-- This migration does 3 things:
-- 1. Creates billing records for ALL existing users (fixes 409)
-- 2. Updates RLS policies to allow INSERT
-- 3. Ensures trigger is active for new users

-- COPY ENTIRE CONTENTS FROM: 
-- supabase/migrations/009_fix_user_billing_rls_policies.sql
```

**Verify migration succeeded:**
```sql
-- Check all users have billing records
SELECT COUNT(*) as total_users FROM auth.users;
SELECT COUNT(*) as users_with_billing FROM user_billing;
-- Both numbers should match!

-- Check policies
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'user_billing';
```

Expected output:
- `Users can insert own billing` - INSERT
- `Users can update own billing` - UPDATE  
- `Users can view own billing` - SELECT
- `Service role can manage billing` - ALL

---

### Step 3: Deploy Updated Edge Function

```bash
# Using Supabase CLI
supabase functions deploy razorpay-webhook
```

**Verify deployment:**
- Check Supabase Dashboard → Edge Functions → razorpay-webhook
- Look for recent deployment timestamp

---

### Step 4: Test Complete Flow

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
