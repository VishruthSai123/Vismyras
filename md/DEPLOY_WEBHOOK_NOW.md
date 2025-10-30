# 🎯 Deploy Webhook Function FIRST

## Step 1: Deploy razorpay-webhook Function

### Option A: Supabase Dashboard (Easiest)

1. **Go to**: https://supabase.com/dashboard/project/ltrknqshxbhmslnkpply/functions

2. **Click**: "Create a new function"

3. **Function name**: `razorpay-webhook`

4. **Copy the code from**: `SUPABASE_DASHBOARD_DEPLOY/razorpay-webhook.ts`

5. **Click**: Deploy

---

### Option B: CLI (If you prefer)

```bash
# In your project directory
cd C:\Users\VISHRUTH\Vismyras\Vismyras

# Deploy the function
npx supabase functions deploy razorpay-webhook
```

---

## Step 2: Set Environment Secrets (IMPORTANT!)

The webhook needs 3 secrets:

```bash
# Set these secrets
npx supabase secrets set RAZORPAY_WEBHOOK_SECRET=Vishruth2008
npx supabase secrets set SUPABASE_URL=https://ltrknqshxbhmslnkpply.supabase.co
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0cmtucXNoeGJobXNsbmtwcGx5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY0MDU1MSwiZXhwIjoyMDc3MjE2NTUxfQ.wWvlF7zfUfaBHMh0wUFhvsxkjspk2D9FA7lL4ZpXNQQ
```

**Verify secrets are set**:
```bash
npx supabase secrets list
```

Should show:
```
RAZORPAY_WEBHOOK_SECRET   ✅
SUPABASE_URL             ✅
SUPABASE_SERVICE_ROLE_KEY ✅
```

---

## Step 3: NOW Setup Razorpay Webhook

Go to: https://dashboard.razorpay.com/app/webhooks

### Fill in these values:

#### **Webhook URL**:
```
https://ltrknqshxbhmslnkpply.supabase.co/functions/v1/razorpay-webhook
```

#### **Secret**:
```
Vishruth2008
```

#### **Active Events** (Select these 9):
- ☑️ `payment.authorized`
- ☑️ `payment.captured` ← **Most important**
- ☑️ `payment.failed`
- ☑️ `subscription.activated` ← **For subscriptions**
- ☑️ `subscription.charged` ← **For renewals**
- ☑️ `subscription.cancelled`
- ☑️ `subscription.expired`
- ☑️ `subscription.paused`
- ☑️ `subscription.resumed`

**Then click**: "Create Webhook"

---

## Step 4: Test the Webhook

### Test from Razorpay Dashboard:
1. Go to: https://dashboard.razorpay.com/app/webhooks
2. Click on your webhook
3. Click "Send Test Webhook"
4. Select: `payment.captured`
5. Click "Send"

### Check if it worked:
1. Go to: https://supabase.com/dashboard/project/ltrknqshxbhmslnkpply/logs/edge-functions
2. Select: `razorpay-webhook`
3. Look for: `Webhook event received: payment.captured`

---

## Step 5: Test Real Payment

1. Open your app: http://localhost:5173
2. Make a test payment
3. Complete payment
4. Check Supabase logs for:
   ```
   Webhook event received: payment.captured
   Premium access granted to user [user_id]
   ```

---

## 📋 Quick Copy-Paste Values

**Webhook URL**:
```
https://ltrknqshxbhmslnkpply.supabase.co/functions/v1/razorpay-webhook
```

**Webhook Secret**:
```
Vishruth2008
```

**CLI Commands** (run all at once):
```bash
cd C:\Users\VISHRUTH\Vismyras\Vismyras
npx supabase functions deploy razorpay-webhook
npx supabase secrets set RAZORPAY_WEBHOOK_SECRET=Vishruth2008
npx supabase secrets set SUPABASE_URL=https://ltrknqshxbhmslnkpply.supabase.co
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0cmtucXNoeGJobXNsbmtwcGx5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY0MDU1MSwiZXhwIjoyMDc3MjE2NTUxfQ.wWvlF7zfUfaBHMh0wUFhvsxkjspk2D9FA7lL4ZpXNQQ
```

---

## ✅ Success Checklist

- [ ] Webhook function deployed
- [ ] Secrets configured
- [ ] Razorpay webhook created
- [ ] Test webhook sent (from Razorpay dashboard)
- [ ] Logs show webhook received
- [ ] Test payment completed
- [ ] User upgraded to PREMIUM

---

## 🚨 Important Notes

1. **Deploy function BEFORE** creating webhook in Razorpay
2. **Set all 3 secrets** or webhook will fail
3. **Select the right events** (especially `payment.captured`)
4. **Test webhook** from Razorpay dashboard first
5. **Check logs** after every test

---

## 🔐 Security Reminder

⚠️ After testing, remember to:
1. Rotate all keys (ACTION_PLAN_SECRETS.md)
2. Clean Git history (SECURITY_CLEANUP_URGENT.md)
3. Update webhook secret to something more secure
