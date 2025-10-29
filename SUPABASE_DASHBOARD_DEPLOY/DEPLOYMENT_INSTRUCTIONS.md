# Deploy Edge Functions via Supabase Dashboard

## Step 1: Set Environment Secrets FIRST

⚠️ **IMPORTANT: Set secrets BEFORE deploying functions!**

Go to: **Supabase Dashboard → Settings → Edge Functions → Manage secrets**

### For TEST Mode (Development):
```
RAZORPAY_KEY_ID = rzp_test_RZCalW8FnHhyFK
RAZORPAY_KEY_SECRET = xat1T5SykUzrUyJIaDYD1tBj
RAZORPAY_WEBHOOK_SECRET = <Vishruth2008>
SUPABASE_URL = https://ltrknqshxbhmslnkpply.supabase.co
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0cmtucXNoeGJobXNsbmtwcGx5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY0MDU1MSwiZXhwIjoyMDc3MjE2NTUxfQ.wWvlF7zfUfaBHMh0wUFhvsxkjspk2D9FA7lL4ZpXNQQ
```

Click **"Add secret"** for each one.

---

## Step 2: Deploy Function 1 - create-razorpay-order

1. Go to: **Supabase Dashboard → Edge Functions**
2. Click **"Create a new function"**
3. Function name: `create-razorpay-order`
4. Copy the contents of `create-razorpay-order.ts` file
5. Paste into the editor
6. Click **"Deploy function"**

---

## Step 3: Deploy Function 2 - verify-razorpay-payment

1. Click **"Create a new function"**
2. Function name: `verify-razorpay-payment`
3. Copy the contents of `verify-razorpay-payment.ts` file
4. Paste into the editor
5. Click **"Deploy function"**

---

## Step 4: Deploy Function 3 - razorpay-webhook

1. Click **"Create a new function"**
2. Function name: `razorpay-webhook`
3. Copy the contents of `razorpay-webhook.ts` file
4. Paste into the editor
5. Click **"Deploy function"**

---

## Step 5: Verify Deployment

Check that all three functions are listed:
- ✅ create-razorpay-order
- ✅ verify-razorpay-payment
- ✅ razorpay-webhook

Each should show status: **"Deployed"**

---

## Step 6: Test the Functions

### Test create-razorpay-order:

Go to the function's **Invoke** tab and test with:
```json
{
  "amount": 19900,
  "currency": "INR",
  "notes": {
    "plan": "premium_month"
  }
}
```

Should return:
```json
{
  "orderId": "order_xxxxx",
  "amount": 19900,
  "currency": "INR"
}
```

---

## Step 7: Configure Razorpay Webhook

1. **Go to Razorpay Dashboard:**
   - https://dashboard.razorpay.com/
   - Switch to **Test Mode**

2. **Settings → Webhooks → Create Webhook**
   
3. **Webhook URL:**
   ```
   https://ltrknqshxbhmslnkpply.supabase.co/functions/v1/razorpay-webhook
   ```

4. **Select Events:**
   - ✅ payment.captured
   - ✅ payment.failed
   - ✅ subscription.activated
   - ✅ subscription.charged
   - ✅ subscription.cancelled
   - ✅ subscription.expired
   - ✅ subscription.paused
   - ✅ subscription.resumed
   - ✅ refund.processed

5. **Save Webhook**

6. **Get Webhook Secret:**
   - After saving, Razorpay shows a webhook secret
   - Copy it and update in Supabase secrets if different from `<Vishruth2008>`

---

## Step 8: Test Your App

1. **Run your app:**
   ```bash
   npm run dev
   ```

2. **Try making a payment:**
   - Click Premium subscription button
   - Should open Razorpay checkout
   - Complete test payment
   - Should show success

3. **Check Supabase:**
   - Go to **Table Editor → webhook_events**
   - Should see webhook logs
   - Go to **Table Editor → user_billing**
   - User should be upgraded to PREMIUM

---

## Troubleshooting

### CORS Error Still Shows?
- Clear browser cache (Ctrl + Shift + R)
- Check function logs in Dashboard
- Verify secrets are set correctly

### Payment Fails?
- Check function logs for errors
- Verify `RAZORPAY_KEY_SECRET` is correct
- Ensure using TEST mode keys

### Webhook Not Working?
- Check webhook URL is correct
- Verify `RAZORPAY_WEBHOOK_SECRET` matches
- View webhook logs in Razorpay Dashboard

---

## Files to Copy-Paste:

1. ✅ `create-razorpay-order.ts` → Create function with this name
2. ✅ `verify-razorpay-payment.ts` → Create function with this name
3. ✅ `razorpay-webhook.ts` → Create function with this name

All files are in the `SUPABASE_DASHBOARD_DEPLOY` folder!

---

## Success Checklist:

- [ ] All 5 secrets added in Supabase
- [ ] Function 1: create-razorpay-order deployed
- [ ] Function 2: verify-razorpay-payment deployed
- [ ] Function 3: razorpay-webhook deployed
- [ ] Webhook URL configured in Razorpay
- [ ] Test payment successful
- [ ] User upgraded to PREMIUM in database

**Time needed:** 10-15 minutes

🚀 **You're ready to accept payments!**
