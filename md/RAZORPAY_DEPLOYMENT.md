# Razorpay Payment Integration - Deployment Guide

## Overview
This guide helps you deploy Razorpay payment integration with Supabase Edge Functions.

## Prerequisites
1. Razorpay Account with Live Keys
2. Supabase Project
3. Supabase CLI installed

## Step 1: Install Supabase CLI

```bash
# Windows (using Scoop)
scoop install supabase

# Or download from: https://github.com/supabase/cli/releases
```

## Step 2: Link Your Supabase Project

```bash
npx supabase login
npx supabase link --project-ref ltrknqshxbhmslnkpply
```

## Step 3: Set Supabase Secrets

Set your Razorpay credentials as Supabase secrets:

```bash
npx supabase secrets set RAZORPAY_KEY_ID=rzp_live_RYrMe7EXEQ4UMt
npx supabase secrets set RAZORPAY_KEY_SECRET=YOUR_RAZORPAY_LIVE_SECRET
npx supabase secrets set RAZORPAY_WEBHOOK_SECRET=<Vishruth2008>
```

## Step 4: Deploy Edge Functions

```bash
# Deploy create order function
npx supabase functions deploy create-razorpay-order

# Deploy verify payment function
npx supabase functions deploy verify-razorpay-payment
```

## Step 5: Run SQL Migration

Go to Supabase SQL Editor and run the migration in `database/migrations/004_razorpay_payments.sql`

## Step 6: Test Payment Flow

1. Restart your dev server: `npm run dev`
2. Try to upgrade to premium or buy credits
3. Complete a test payment
4. Verify in Razorpay Dashboard

## Troubleshooting

### Error: API key not configured
- Make sure `.env.local` has `VITE_RAZORPAY_KEY_ID` (with VITE_ prefix)
- Restart dev server after changing .env.local

### Error: 400 Bad Request from Razorpay
- Check that Edge Functions are deployed
- Verify secrets are set correctly: `npx supabase secrets list`
- Check Edge Function logs: `npx supabase functions logs create-razorpay-order`

### Payment verification failed
- Ensure `RAZORPAY_KEY_SECRET` is set in Supabase secrets
- Check verify-razorpay-payment function logs

## Security Notes

⚠️ **IMPORTANT:**
- Never commit `.env.local` to git
- Use TEST keys (`rzp_test_`) during development
- Only use LIVE keys (`rzp_live_`) in production
- Keep `RAZORPAY_KEY_SECRET` secure - only in backend/Edge Functions
- Enable webhook signature verification in production

## Alternative: Razorpay Payment Links (Easier)

If Edge Functions are complex, use Razorpay Payment Links:
1. Go to Razorpay Dashboard → Payment Links
2. Create payment links for each plan
3. Update `.env.local` with payment link IDs
4. Simpler but less customizable

## Production Checklist

- [ ] Edge Functions deployed
- [ ] Supabase secrets configured
- [ ] SQL migrations run
- [ ] Test payment completed successfully
- [ ] Webhook configured (optional but recommended)
- [ ] Error logging set up
- [ ] Payment confirmation emails configured

