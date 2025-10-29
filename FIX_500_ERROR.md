# 🔍 TEST MODE vs LIVE MODE - Complete Diagnostic

## ❌ Current Problem: 500 Error from Razorpay

The 500 error is coming from:
```
POST https://api.razorpay.com/v1/standard_checkout/payments/validate/account 500
```

This is **Razorpay's API rejecting your account validation** - NOT your code!

---

## 🎯 Root Causes (In Order of Likelihood)

### 1. **Webhook Not Set Up** (90% likely - THIS IS IT!)
You MUST set up the webhook in Razorpay dashboard FIRST, or Razorpay will reject payments.

**Why**: Razorpay requires webhooks to be configured before processing payments in TEST mode.

**Fix**: Fill in the webhook form you have open:

#### Webhook URL:
```
https://ltrknqshxbhmslnkpply.supabase.co/functions/v1/razorpay-webhook
```

#### Secret:
```
Vishruth2008
```

#### Events (select these):
- ☑️ payment.captured
- ☑️ payment.authorized  
- ☑️ payment.failed
- ☑️ subscription.activated
- ☑️ subscription.charged
- ☑️ subscription.cancelled
- ☑️ subscription.expired

---

### 2. **TEST Keys Being Used?** (Check This)

Your Edge Functions use these environment variables:
- `RAZORPAY_KEY_ID` 
- `RAZORPAY_KEY_SECRET`

**Check what's set**:
```powershell
# This will show if TEST keys are configured
npx supabase secrets list
```

**What you NEED for TEST mode**:
```bash
RAZORPAY_KEY_ID=rzp_test_RZCalW8FnHhyFK
RAZORPAY_KEY_SECRET=xat1T5SykUzrUyJIaDYD1tBj
```

**If these are LIVE keys, that's your problem!**

Run this to SET TEST keys:
```powershell
npx supabase secrets set RAZORPAY_KEY_ID=rzp_test_RZCalW8FnHhyFK
npx supabase secrets set RAZORPAY_KEY_SECRET=xat1T5SykUzrUyJIaDYD1tBj
```

---

### 3. **Localhost Not Whitelisted** (Possible)

Razorpay might block localhost. But this shouldn't cause 500 error, just CORS issues.

**Check**: https://dashboard.razorpay.com/app/website-app-settings

**Add these domains**:
```
http://localhost:5173
http://127.0.0.1:5173
```

---

## 🔍 Check Your Current Configuration

### Step 1: Verify Supabase Secrets

Run this command and share output:
```powershell
# Show all secret names
npx supabase secrets list

# The KEY_ID should start with rzp_test_ for TEST mode
# But we can't see values, only digests
```

### Step 2: Check Frontend Config

Open: `C:\Users\VISHRUTH\Vismyras\Vismyras\.env.local`

**Verify these lines**:
```bash
# Should be FALSE for test mode
VITE_RAZORPAY_LIVE_MODE=false

# Should be TEST key (starts with rzp_test_)
VITE_RAZORPAY_TEST_KEY_ID=rzp_test_RZCalW8FnHhyFK
```

### Step 3: Check Which Mode Your Frontend Is Using

Open browser console and type:
```javascript
console.log(import.meta.env.VITE_RAZORPAY_LIVE_MODE)
console.log(import.meta.env.VITE_RAZORPAY_TEST_KEY_ID)
```

Should show:
```
false
rzp_test_RZCalW8FnHhyFK
```

---

## ✅ Quick Fix Steps (Do These NOW)

### Fix 1: Set TEST Secrets in Supabase

```powershell
cd C:\Users\VISHRUTH\Vismyras\Vismyras

npx supabase secrets set RAZORPAY_KEY_ID=rzp_test_RZCalW8FnHhyFK
npx supabase secrets set RAZORPAY_KEY_SECRET=xat1T5SykUzrUyJIaDYD1tBj
```

### Fix 2: Create Webhook in Razorpay Dashboard

Go to: https://dashboard.razorpay.com/app/webhooks

Fill in:
- **URL**: `https://ltrknqshxbhmslnkpply.supabase.co/functions/v1/razorpay-webhook`
- **Secret**: `Vishruth2008`
- **Events**: Select all payment and subscription events

### Fix 3: Restart Your Dev Server

```powershell
# Stop current server (Ctrl+C)
npm run dev
```

### Fix 4: Clear Browser Cache

1. Open DevTools (F12)
2. Right-click Reload button
3. Click "Empty Cache and Hard Reload"

### Fix 5: Test Payment Again

---

## 📋 Complete Checklist

### Frontend (.env.local):
- [ ] `VITE_RAZORPAY_LIVE_MODE=false`
- [ ] `VITE_RAZORPAY_TEST_KEY_ID=rzp_test_RZCalW8FnHhyFK`
- [ ] `RAZORPAY_TEST_KEY_SECRET=xat1T5SykUzrUyJIaDYD1tBj`

### Supabase Secrets:
- [ ] `RAZORPAY_KEY_ID` set to TEST key
- [ ] `RAZORPAY_KEY_SECRET` set to TEST secret
- [ ] `RAZORPAY_WEBHOOK_SECRET` set to `Vishruth2008`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set
- [ ] `SUPABASE_URL` set

### Razorpay Dashboard:
- [ ] Webhook created with correct URL
- [ ] Webhook secret matches `Vishruth2008`
- [ ] Events selected (especially `payment.captured`)
- [ ] Webhook is ACTIVE (green status)

### Functions Deployed:
- [ ] `create-razorpay-order` deployed
- [ ] `verify-razorpay-payment` deployed
- [ ] `razorpay-webhook` deployed

---

## 🔍 Debugging Commands

```powershell
# Check secrets
npx supabase secrets list

# Check function status
npx supabase functions list

# View function logs (run this WHILE testing payment)
npx supabase functions logs verify-razorpay-payment --follow

# Or check logs in browser:
# https://supabase.com/dashboard/project/ltrknqshxbhmslnkpply/logs/edge-functions
```

---

## 🎯 Most Likely Issue

Based on your 500 error, **you need to create the webhook in Razorpay FIRST**.

The webhook URL is correct:
```
https://ltrknqshxbhmslnkpply.supabase.co/functions/v1/razorpay-webhook
```

**Just fill in that form you have open and click "Create Webhook"!**

Then test payment again.

---

## 📞 If Still Getting 400 Error After Webhook Setup

Check Supabase logs:
```
https://supabase.com/dashboard/project/ltrknqshxbhmslnkpply/logs/edge-functions
```

Select: `verify-razorpay-payment`

Look for:
```
Environment check: { hasKeySecret: false }  ← Missing secret!
Missing parameters: { ... }  ← Frontend sending bad data
Signature verification: { isValid: false }  ← Wrong secret
```

Share the exact log message and I'll help debug further.
