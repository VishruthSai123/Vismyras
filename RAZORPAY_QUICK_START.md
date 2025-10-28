# 🚀 Razorpay Quick Start - Create Plans & Deploy

## ⚡ Quick Steps (5 minutes)

### Step 1: Install dotenv (if not already installed)
```bash
npm install dotenv
```

### Step 2: Create Your Razorpay Plan

Run the automated script:
```bash
node scripts/create-razorpay-plans.js
```

**Expected Output:**
```
🚀 Creating Razorpay Plans...

Creating Premium Monthly Plan...
✅ Premium Monthly Plan Created!
   Plan ID: plan_XXXXXXXXXXXXX
   Amount: 199 INR
   Period: monthly
   Interval: 1

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 PLAN IDs - ADD TO YOUR .env.local:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

VITE_RAZORPAY_PREMIUM_PLAN_ID=plan_XXXXXXXXXXXXX

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Step 3: Copy the Plan ID

Copy the line that looks like:
```bash
VITE_RAZORPAY_PREMIUM_PLAN_ID=plan_XXXXXXXXXXXXX
```

### Step 4: Update .env.local

Replace this line in your `.env.local`:
```bash
# BEFORE:
VITE_RAZORPAY_PREMIUM_PLAN_ID=ADD_YOUR_PLAN_ID_HERE

# AFTER:
VITE_RAZORPAY_PREMIUM_PLAN_ID=plan_XXXXXXXXXXXXX
```

### Step 5: Get Supabase Service Role Key

1. Go to: https://supabase.com/dashboard/project/ltrknqshxbhmslnkpply/settings/api
2. Find **"service_role"** key under "Project API keys"
3. Click "Reveal" and copy the key
4. Update `.env.local`:
```bash
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Step 6: Test Locally

```bash
npm run dev
```

1. Sign in to your app
2. Click "Upgrade to Premium"
3. Use test card: `4111 1111 1111 1111`
4. Verify payment works

### Step 7: Deploy to Vercel

```bash
# Commit changes
git add .
git commit -m "Add Razorpay backend integration"
git push origin main

# Or deploy directly
vercel --prod
```

### Step 8: Add Environment Variables to Vercel

```bash
vercel env add RAZORPAY_KEY_ID production
# Paste: rzp_live_RYrMe7EXEQ4UMt

vercel env add RAZORPAY_KEY_SECRET production
# Paste: z4QE76BS32ttCLO2cTOyH764

vercel env add RAZORPAY_WEBHOOK_SECRET production
# Paste: <Vishruth2008>

vercel env add SUPABASE_SERVICE_ROLE_KEY production
# Paste: your_service_role_key

vercel env add VITE_RAZORPAY_PREMIUM_PLAN_ID production
# Paste: plan_XXXXXXXXXXXXX
```

### Step 9: Update Webhook URL in Razorpay

1. Go to: https://dashboard.razorpay.com/app/webhooks
2. Click your webhook
3. Update URL to: `https://tryonvismyras08.vercel.app/api/webhook`
4. Make sure these events are selected:
   - ✅ payment.captured
   - ✅ payment.failed
   - ✅ subscription.activated
   - ✅ subscription.cancelled
   - ✅ subscription.charged

---

## ✅ You're Done!

Your backend is now live with:
- ✅ Secure order creation
- ✅ Payment verification
- ✅ Webhook handling
- ✅ Database synchronization

---

## 🧪 Testing Production

1. Visit: https://tryonvismyras08.vercel.app
2. Sign in
3. Click "Upgrade to Premium"
4. Complete payment (use real card for live mode)
5. Verify:
   - Payment appears in Razorpay Dashboard
   - User upgraded in Supabase
   - Webhook received

---

## 📊 Monitor

- **Payments**: https://dashboard.razorpay.com/app/payments
- **Webhooks**: https://dashboard.razorpay.com/app/webhooks
- **Vercel Logs**: `vercel logs --follow`
- **Supabase Database**: Check `user_billing` table

---

## 🆘 Troubleshooting

### Plan creation fails
- Check your Razorpay API keys in `.env.local`
- Make sure you're in Live mode (or Test mode for testing)

### Webhook not working
- Verify webhook URL: `https://tryonvismyras08.vercel.app/api/webhook`
- Check `RAZORPAY_WEBHOOK_SECRET` matches Dashboard
- Send test webhook from Razorpay Dashboard

### Payment succeeds but user not upgraded
- Check Vercel function logs: `vercel logs`
- Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
- Check webhook received: Razorpay Dashboard → Webhooks → Logs

---

## 📞 Need Help?

See the full guide: `RAZORPAY_COMPLETE_SETUP.md`
