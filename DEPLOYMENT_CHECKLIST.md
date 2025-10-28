# ✅ Razorpay Setup Complete - Final Deployment Checklist

## 🎉 What We've Accomplished

### ✅ Backend Created
- [x] `api/create-order.ts` - Order creation endpoint
- [x] `api/create-subscription.ts` - Subscription creation endpoint  
- [x] `api/verify-payment.ts` - Payment verification endpoint
- [x] `api/webhook.ts` - Webhook handler for automation

### ✅ Plan Created
- [x] Premium Monthly Plan created in Razorpay
- [x] **Plan ID**: `plan_RYs2Hhevq20OmD`
- [x] Added to `.env.local`

### ✅ Documentation Created
- [x] Complete setup guide (500+ lines)
- [x] Quick start guide
- [x] Setup summary

### ✅ Build Successful
- [x] Project builds without errors
- [x] All TypeScript types valid

---

## 🚀 Ready to Deploy!

### Step 1: Get Supabase Service Role Key (2 minutes)

**You need to add this to `.env.local`:**

1. Go to: https://supabase.com/dashboard/project/ltrknqshxbhmslnkpply/settings/api
2. Find **"service_role"** key (NOT anon key!)
3. Click "Reveal" and copy it
4. Open `.env.local` and replace:
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=ADD_YOUR_SERVICE_ROLE_KEY_HERE
   ```
   With:
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...your_key_here
   ```

### Step 2: Deploy to Vercel (3 minutes)

```bash
# Commit all changes
git add .
git commit -m "Add Razorpay backend integration with webhooks"
git push origin main
```

### Step 3: Add Environment Variables to Vercel (5 minutes)

Run these commands one by one:

```bash
# Razorpay Keys
vercel env add RAZORPAY_KEY_ID production
# When prompted, paste: rzp_live_RYrMe7EXEQ4UMt

vercel env add RAZORPAY_KEY_SECRET production
# When prompted, paste: z4QE76BS32ttCLO2cTOyH764

vercel env add RAZORPAY_WEBHOOK_SECRET production
# When prompted, paste: <Vishruth2008>

# Supabase Service Role Key
vercel env add SUPABASE_SERVICE_ROLE_KEY production
# When prompted, paste: YOUR_SERVICE_ROLE_KEY_FROM_STEP_1

# Razorpay Plan ID
vercel env add VITE_RAZORPAY_PREMIUM_PLAN_ID production
# When prompted, paste: plan_RYs2Hhevq20OmD
```

**Alternative: Add via Vercel Dashboard**

1. Go to: https://vercel.com/designvibes3366/vismyras/settings/environment-variables
2. Click "Add" for each variable
3. Select "Production" environment
4. Paste the values

### Step 4: Redeploy

After adding environment variables:

```bash
vercel --prod
```

Or wait for automatic deployment from GitHub push.

### Step 5: Verify Webhook URL (1 minute)

1. Go to: https://dashboard.razorpay.com/app/webhooks
2. Click on your webhook
3. Verify URL is: `https://tryonvismyras08.vercel.app/api/webhook`
4. Verify events are selected:
   - ✅ payment.captured
   - ✅ payment.failed
   - ✅ subscription.activated
   - ✅ subscription.cancelled
   - ✅ subscription.charged
   - ✅ subscription.paused
   - ✅ subscription.resumed

---

## 🧪 Test Your Integration

### Test Mode (Recommended First)

1. Switch Razorpay to **Test Mode**:
   - Dashboard top right: "Live" → "Test"
   
2. Get test keys and update Vercel env:
   ```bash
   vercel env add RAZORPAY_KEY_ID preview
   # Use: rzp_test_XXXXX
   ```

3. Test payment with test card:
   ```
   Card: 4111 1111 1111 1111
   CVV: 123
   Expiry: 12/25
   ```

4. Verify:
   - ✅ Payment shows in Razorpay test dashboard
   - ✅ User upgraded in Supabase
   - ✅ Webhook received (check Razorpay webhook logs)

### Live Mode (After Testing)

1. Switch to **Live Mode** in Razorpay
2. Make a small test purchase (₹29 for 1 credit)
3. Verify everything works
4. You're live! 🎉

---

## 📊 Your Products

### Free Tier
- **Price**: ₹0
- **Try-ons**: 3/month
- **Auto-resets**: 1st of each month

### Premium Subscription
- **Price**: ₹199/month
- **Try-ons**: 25/month  
- **Plan ID**: `plan_RYs2Hhevq20OmD`
- **Auto-renewal**: Yes
- **Billing**: Monthly

### One-Time Credits
| Package | Try-ons | Price | Per Try-on |
|---------|---------|-------|------------|
| Single  | 1       | ₹29   | ₹29.00     |
| Pack 5  | 5       | ₹129  | ₹25.80     |
| Pack 10 | 10      | ₹249  | ₹24.90     |

---

## 🔍 Monitoring

### Razorpay Dashboard

- **Payments**: https://dashboard.razorpay.com/app/payments
- **Subscriptions**: https://dashboard.razorpay.com/app/subscriptions  
- **Webhooks**: https://dashboard.razorpay.com/app/webhooks

### Vercel Logs

```bash
vercel logs --follow
```

Or: https://vercel.com/designvibes3366/vismyras/logs

### Supabase Database

Check `user_billing` table:
```sql
SELECT * FROM user_billing 
ORDER BY updated_at DESC 
LIMIT 10;
```

---

## 📋 Post-Deployment Checklist

After deployment, verify:

- [ ] All 5 environment variables added to Vercel
- [ ] Webhook URL updated in Razorpay Dashboard
- [ ] Test payment completed successfully
- [ ] User upgraded in Supabase database
- [ ] Webhook received (check Razorpay logs)
- [ ] One-time purchase tested
- [ ] Credits added correctly
- [ ] Subscription auto-renewal works (test after 1 month)

---

## 🆘 Troubleshooting

### Issue: Payment succeeds but user not upgraded

**Check:**
1. Webhook logs in Razorpay Dashboard
2. Vercel function logs: `vercel logs`
3. Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
4. Check webhook signature verification

**Quick Fix:**
Manually update in Supabase:
```sql
UPDATE user_billing
SET subscription_tier = 'PREMIUM',
    subscription_status = 'active',
    monthly_limit = 25,
    razorpay_subscription_id = 'sub_XXXXX'
WHERE user_id = 'user_id_here';
```

### Issue: Webhook 400 error

**Cause:** Invalid signature

**Fix:**
1. Verify `RAZORPAY_WEBHOOK_SECRET` matches Dashboard
2. Check webhook URL has no trailing slash
3. Resend test webhook from Dashboard

### Issue: API returns 500 error

**Check:**
1. Vercel function logs
2. All environment variables present
3. Razorpay credentials valid

---

## 📞 Support Resources

- **Razorpay Docs**: https://razorpay.com/docs/
- **Razorpay Support**: https://razorpay.com/support/
- **Vercel Docs**: https://vercel.com/docs
- **Full Setup Guide**: `RAZORPAY_COMPLETE_SETUP.md`

---

## 🎯 You're Almost There!

Just 3 more steps:

1. **Get Supabase Service Role Key** (from link above)
2. **Deploy to Vercel** (`git push` or `vercel --prod`)
3. **Add environment variables** to Vercel

Then you're **LIVE** with full payment processing! 🚀

---

**Current Status**: ✅ Backend Ready | ⏳ Awaiting Deployment

**Next Command**:
```bash
# After adding service role key to .env.local:
git add .
git commit -m "Complete Razorpay integration"
git push origin main
```
