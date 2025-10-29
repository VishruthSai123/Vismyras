# Quick Fix for CORS Error

## The Problem
CORS error means the Edge Function is failing **before** sending back CORS headers. This usually means:
1. ❌ Secrets are not set correctly in Supabase
2. ❌ Function has a runtime error

## Solution: Check Function Logs

### Step 1: View Logs in Supabase Dashboard

1. Go to **Supabase Dashboard**
2. Click **Edge Functions** in left sidebar
3. Click on **create-razorpay-order**
4. Click **Logs** tab
5. Look for errors

### Step 2: Common Issues

#### Issue 1: "Razorpay credentials not configured"
**Fix:** Secrets are missing or misspelled

Go to: **Settings → Edge Functions → Manage secrets**

Make sure these EXACT names exist:
```
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
```

**NOT:**
- ~~VITE_RAZORPAY_KEY_ID~~ (wrong - that's for frontend)
- ~~razorpay_key_id~~ (wrong - case sensitive)

#### Issue 2: Function not deployed
**Fix:** Redeploy the function

1. Copy the updated `create-razorpay-order.ts` content
2. Go to Edge Functions → create-razorpay-order
3. Paste new code
4. Click **Deploy**

## Quick Test

### Test in Supabase Dashboard:

1. Go to **Edge Functions → create-razorpay-order**
2. Click **Invoke** tab
3. Paste this JSON:
```json
{
  "amount": 19900,
  "currency": "INR",
  "notes": {
    "plan": "premium_month"
  }
}
```
4. Click **Invoke**

### Expected Response:
```json
{
  "orderId": "order_xxxxx",
  "amount": 19900,
  "currency": "INR"
}
```

### If Error Response:
```json
{
  "error": "Razorpay credentials not configured. Check Supabase secrets."
}
```

**This means:** Secrets are not set!

## Fix: Re-add Secrets

Go to: **Settings → Edge Functions → Manage secrets**

Delete and re-add each secret:

1. **Delete old secret** (if exists)
2. **Add new secret**:
   - Name: `RAZORPAY_KEY_ID`
   - Value: `rzp_test_RZCalW8FnHhyFK`
   - Click Save

3. **Add second secret**:
   - Name: `RAZORPAY_KEY_SECRET`
   - Value: `xat1T5SykUzrUyJIaDYD1tBj`
   - Click Save

4. **Restart function** (sometimes needed):
   - Go to function
   - Click **Settings**
   - Click **Restart**

## Updated Code

I've updated `create-razorpay-order.ts` with better error handling. 

**Copy the new version and redeploy!**

The new version:
- ✅ Checks secrets FIRST
- ✅ Returns proper error messages
- ✅ Always includes CORS headers
- ✅ Logs environment status

## After Redeploying

1. Clear browser cache (Ctrl + Shift + R)
2. Try payment again
3. Check function logs for any errors

## Still Not Working?

### Check these in order:

1. **Secrets exist?**
   - Settings → Edge Functions → Manage secrets
   - Should see RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET

2. **Function deployed?**
   - Edge Functions → create-razorpay-order
   - Should say "Deployed" with recent timestamp

3. **Test function works?**
   - Use Invoke tab with test JSON
   - Should return orderId

4. **Clear browser cache?**
   - Hard refresh: Ctrl + Shift + R

5. **Check logs?**
   - Edge Functions → Logs tab
   - Look for error messages

## Expected Flow

✅ **Correct:**
1. User clicks Premium button
2. Frontend calls create-razorpay-order
3. Function creates order with Razorpay
4. Returns orderId
5. Razorpay checkout opens

❌ **CORS Error:**
1. User clicks Premium button  
2. Frontend calls create-razorpay-order
3. Function fails (missing secrets)
4. No CORS headers returned
5. Browser blocks response

The updated code fixes this by ALWAYS returning CORS headers, even on error!
