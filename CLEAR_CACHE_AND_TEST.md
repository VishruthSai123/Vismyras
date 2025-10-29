# 🧹 Clear Cache & Test Payment

## The Real Problem

You're still getting the **Razorpay 500 error**:
```
POST https://api.razorpay.com/v1/standard_checkout/payments/validate/account 500
```

This is **NOT a cache issue** - it's a **Razorpay server-side validation error**.

However, let's rule out cache and test systematically.

---

## 🔧 Step 1: Clear Everything (2 min)

### Clear Browser Cache

**Chrome/Edge:**
1. Press: `Ctrl + Shift + Delete`
2. Select: **All time**
3. Check:
   - ✅ Cookies and other site data
   - ✅ Cached images and files
   - ✅ Hosted app data
4. Click: **Clear data**

**Firefox:**
1. Press: `Ctrl + Shift + Delete`
2. Select: **Everything**
3. Check all boxes
4. Click: **Clear Now**

### Clear Application Storage

1. Open DevTools: `F12`
2. Go to: **Application** tab
3. Click: **Clear storage** (left sidebar)
4. Click: **Clear site data**

### Restart Dev Server

```powershell
# Stop current server (Ctrl+C in terminal)
npm run dev
```

---

## 🎯 Step 2: Test in Incognito Mode (3 min)

Open a fresh incognito/private window:
```
Ctrl + Shift + N (Chrome/Edge)
Ctrl + Shift + P (Firefox)
```

Then:
1. Go to: `http://localhost:5173`
2. Try making a payment
3. Open DevTools → Console
4. Check if **500 error still appears**

### Expected Results:

**If 500 error is gone:**
→ It was a cache issue ✅

**If 500 error still there:**
→ Razorpay account problem ❌ (continue to Step 3)

---

## 🔍 Step 3: Check Razorpay Account Status (5 min)

The 500 error means Razorpay is rejecting your account validation. Check:

### A. Account Activation

1. Go to: https://dashboard.razorpay.com/app/dashboard
2. Look for **banner at top** saying:
   - "Activate your account"
   - "Complete KYC"
   - "Verify email"
3. If any banner exists → **Complete the required action**

### B. TEST Mode Status

1. Go to: https://dashboard.razorpay.com/app/keys
2. Check: **Test Mode** toggle (top-right)
3. Verify: Keys are visible (not hidden/disabled)

### C. API Keys Health

1. On the API Keys page, look for:
   - ✅ **Test Key ID**: `rzp_test_RZCalW8FnHhyFK`
   - ✅ **Test Key Secret**: (click "Show" to reveal)
2. Check: No "Expired" or "Disabled" labels

### D. Account Status

1. Go to: https://dashboard.razorpay.com/app/settings
2. Check: **Account Status** = Active
3. Check: No warnings/restrictions

---

## 🚨 Most Likely Issue: Razorpay Account Configuration

The `payments/validate/account` endpoint is returning 500, which suggests:

### Possible Causes:

1. **Account not fully activated** (most common)
   - Solution: Complete account activation in dashboard

2. **TEST mode not enabled properly**
   - Solution: Toggle TEST mode OFF then ON again

3. **API keys need regeneration**
   - Solution: Regenerate keys (see below)

4. **Account suspended/flagged**
   - Solution: Contact Razorpay support

5. **Business details incomplete**
   - Solution: Complete business settings

---

## 🔑 Step 4: Regenerate API Keys (If Needed)

If account looks fine but error persists:

### 1. Regenerate Keys

```
Dashboard → Settings → API Keys → Regenerate (TEST)
```

### 2. Update .env.local

```bash
RAZORPAY_TEST_KEY_ID=rzp_test_XXXXXXXXX
RAZORPAY_TEST_KEY_SECRET=xat1XXXXXXXXX
```

### 3. Update Supabase Secrets

```powershell
npx supabase secrets set RAZORPAY_KEY_ID=rzp_test_XXXXXXXXX
npx supabase secrets set RAZORPAY_KEY_SECRET=xat1XXXXXXXXX
```

### 4. Restart Dev Server

```powershell
npm run dev
```

---

## 📊 Step 5: Check Supabase Logs (Debug Verification)

Even if cache is clear, check if verification function is getting valid data:

1. Go to: https://supabase.com/dashboard/project/ltrknqshxbhmslnkpply/logs/edge-functions
2. Select: `verify-razorpay-payment`
3. Make a test payment
4. Look for logs like:

```
Environment check: { hasKeySecret: true, keySecretLength: 24 }  ← Good
Verification request: { hasOrderId: true, ... }  ← Good
Missing parameters: { ... }  ← Bad! Frontend issue
Signature verification: { isValid: false }  ← Bad! Wrong secret
✅ Payment verified successfully  ← Success!
```

---

## 🧪 Step 6: Alternative Test Methods

### Test with Different Browser

Try in a completely different browser:
- Chrome → Try Firefox
- Edge → Try Chrome

### Test with Network Tab Open

1. Open DevTools → **Network** tab
2. Make payment
3. Find the `validate/account` request
4. Click it → **Preview** tab
5. Look for error details in response

Example response:
```json
{
  "error": {
    "code": "BAD_REQUEST_ERROR",
    "description": "Account validation failed",
    "source": "business",
    "reason": "account_inactive"
  }
}
```

---

## ✅ Verification Checklist

Run through this checklist:

### Environment
- [ ] Cleared browser cache
- [ ] Tested in incognito mode
- [ ] Dev server restarted
- [ ] .env.local has correct keys

### Razorpay
- [ ] Account is Active
- [ ] TEST mode is enabled
- [ ] API keys are visible
- [ ] No warning banners
- [ ] Business details complete

### Supabase
- [ ] Secrets are set correctly
- [ ] Edge Functions are deployed
- [ ] Function logs show no errors

### Testing
- [ ] 500 error still appears in console
- [ ] Checked Network tab for details
- [ ] Tried different browser
- [ ] Tried incognito mode

---

## 🎯 Next Actions Based on Results

### If 500 error is GONE after cache clear:
```
✅ Continue testing payment flow
✅ Check if verification 400 error also gone
✅ If all working, close this issue
```

### If 500 error PERSISTS:
```
❌ Check Razorpay dashboard for account status
❌ Look for any activation/KYC requirements
❌ Try regenerating API keys
❌ Contact Razorpay support if account looks fine
```

### If verification 400 error persists (even without 500):
```
❌ Check Supabase Edge Function logs
❌ Verify RAZORPAY_KEY_SECRET matches in both places
❌ Check frontend is sending complete data
```

---

## 📞 Still Not Working?

If after all this the 500 error persists:

### Get Exact Error Details

1. Open DevTools → **Network** tab
2. Find the `validate/account` request (red, status 500)
3. Right-click → **Copy** → **Copy as cURL**
4. Share the response details

### Check Razorpay Status Page

Visit: https://status.razorpay.com/
- Check if Razorpay services are down
- Look for any ongoing incidents

### Contact Razorpay Support

If account looks fine but 500 persists:
1. Go to: https://dashboard.razorpay.com/app/support
2. Create ticket with:
   - Error: `payments/validate/account` returning 500
   - Account: Your merchant ID
   - Mode: TEST
   - Browser: Chrome/Firefox/etc.

---

## 🔐 Security Reminder

After everything works:
1. ✅ Rotate all keys (ACTION_PLAN_SECRETS.md)
2. ✅ Clean Git history (SECURITY_CLEANUP_URGENT.md)
3. ✅ Use NEW keys everywhere

---

## 📝 Quick Test Commands

```powershell
# Clear npm cache
npm cache clean --force

# Restart dev server
npm run dev

# Check Supabase secrets
npx supabase secrets list

# Set new secrets (if regenerated)
npx supabase secrets set RAZORPAY_KEY_SECRET=NEW_SECRET_HERE
```

---

**Start with Step 1 (clear cache in incognito), then work through the checklist systematically.**
