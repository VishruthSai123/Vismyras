# Fix Payment Verification Error (400)

## Problem
Payment completes but verification fails with 400 error. User not upgraded to PREMIUM.

## Solution

### Step 1: Update verify-razorpay-payment Function

1. Go to **Supabase Dashboard → Edge Functions**
2. Click on **verify-razorpay-payment**
3. **Delete all code** in the editor
4. **Copy the ENTIRE contents** of updated `verify-razorpay-payment.ts` file
5. **Paste** into editor
6. Click **Deploy**

### Step 2: Check Logs

After redeploying:

1. Go to **Edge Functions → verify-razorpay-payment**
2. Click **Logs** tab
3. Try making a test payment again
4. Watch the logs in real-time

### Step 3: What to Look For in Logs

**✅ Good logs:**
```
Environment check: { hasKeySecret: true, keySecretLength: 24 }
Verification request: { hasOrderId: true, hasPaymentId: true, hasSignature: true, ... }
Signature verification: { isValid: true, ... }
✅ Payment verified successfully
```

**❌ Bad logs - Missing secret:**
```
Environment check: { hasKeySecret: false, keySecretLength: undefined }
Missing RAZORPAY_KEY_SECRET
```

**Fix:** Add `RAZORPAY_KEY_SECRET` in Settings → Edge Functions → Manage secrets

**❌ Bad logs - Missing parameters:**
```
Verification request: { hasOrderId: false, hasPaymentId: true, ... }
Missing parameters: {...}
```

**Fix:** Check razorpayService.ts is sending all parameters correctly

**❌ Bad logs - Invalid signature:**
```
Signature verification: { isValid: false, ... }
Invalid signature
```

**Fix:** RAZORPAY_KEY_SECRET is wrong or doesn't match the key used to create order

### Step 4: Test Payment Flow

1. **Clear browser cache** (Ctrl + Shift + R)
2. **Try test payment:**
   - Click Premium button
   - Complete Razorpay checkout
   - Use test card: 4111 1111 1111 1111
   - Any CVV, future expiry date

3. **Check logs immediately** after payment

4. **Check database:**
   - Go to **Table Editor → user_billing**
   - Find your user
   - Should show:
     - `subscription_tier`: PREMIUM
     - `subscription_status`: ACTIVE
     - `usage_limit`: 1000

### Step 5: Common Issues

#### Issue 1: Still 400 Error

**Check:** Function logs show what's wrong

**Fix:** 
- If "Missing RAZORPAY_KEY_SECRET" → Add secret
- If "Missing parameters" → Check frontend code
- If "Invalid signature" → Verify secret matches

#### Issue 2: Payment Success but No Upgrade

**Check:** 
1. Webhook function deployed?
2. Payment recorded in `razorpay_payments` table?
3. Webhook events in `webhook_events` table?

**Fix:** Deploy `razorpay-webhook` function

#### Issue 3: Database Not Updated

**Check:** SQL migration ran successfully?

**Fix:**
1. Go to **SQL Editor**
2. Run: `SELECT * FROM user_billing WHERE user_id = auth.uid();`
3. If error → Migration didn't run
4. Run `005_razorpay_webhook_integration.sql` migration

### Step 6: Manual Test Verification

Test the function directly:

1. Go to **Edge Functions → verify-razorpay-payment**
2. Click **Invoke** tab
3. Paste test data:
```json
{
  "razorpay_order_id": "order_test123",
  "razorpay_payment_id": "pay_test456",
  "razorpay_signature": "test_signature"
}
```
4. Click **Invoke**

**Expected:** 
```json
{
  "success": false,
  "error": "Invalid payment signature"
}
```

This confirms function is working!

### Step 7: Next Steps After Fix

1. ✅ Updated verify-razorpay-payment deployed
2. ✅ Logs show verification working
3. ✅ Test payment successful
4. ✅ User upgraded to PREMIUM

**Now test webhooks:**
- Make another payment
- Check `webhook_events` table for logs
- Webhook should auto-upgrade user

---

## Quick Checklist

- [ ] Updated `verify-razorpay-payment.ts` deployed
- [ ] `RAZORPAY_KEY_SECRET` secret exists in Supabase
- [ ] Function logs show "✅ Payment verified successfully"
- [ ] Test payment completes without 400 error
- [ ] User upgraded to PREMIUM in database
- [ ] Webhook function deployed (for auto-upgrades)

**Time to fix:** 5 minutes

🎯 **After this fix, payments should work end-to-end!**
