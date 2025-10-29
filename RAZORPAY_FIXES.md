# Razorpay Payment Integration - Complete Fix

## ✅ Issues Fixed

### 1. **400 Bad Request Errors**
- **Root Cause**: Using live Razorpay keys without proper backend order creation
- **Solution**: Implemented Supabase Edge Functions for secure order creation and verification

### 2. **Environment Variable Access**
- **Root Cause**: Using `process.env.RAZORPAY_KEY_ID` instead of Vite's `import.meta.env`
- **Solution**: Updated to use `VITE_RAZORPAY_KEY_ID` prefix for client-side access

### 3. **Missing Backend Integration**
- **Root Cause**: No secure backend to create orders and verify payments
- **Solution**: Created two Supabase Edge Functions:
  - `create-razorpay-order`: Creates secure Razorpay orders
  - `verify-razorpay-payment`: Verifies payment signatures

## 📁 Files Created/Modified

### Created Files:
1. **`supabase/functions/create-razorpay-order/index.ts`**
   - Securely creates Razorpay orders using server-side credentials
   - Prevents key exposure in client code

2. **`supabase/functions/verify-razorpay-payment/index.ts`**
   - Verifies payment signatures using HMAC SHA256
   - Ensures payment authenticity

3. **`database/migrations/004_razorpay_payments.sql`**
   - Creates `razorpay_payments` table
   - Tracks all payment transactions
   - RLS policies for security
   - Indexes for performance

4. **`RAZORPAY_DEPLOYMENT.md`**
   - Complete deployment guide
   - Step-by-step instructions
   - Troubleshooting tips

### Modified Files:
1. **`.env.local`**
   - Changed `RAZORPAY_KEY_ID` → `VITE_RAZORPAY_KEY_ID`
   - Separated client (VITE_) and server variables

2. **`services/razorpayService.ts`**
   - Updated to use `import.meta.env.VITE_RAZORPAY_KEY_ID`
   - Integrated with Supabase Edge Functions
   - Proper error handling

## 🚀 Deployment Steps

### Prerequisites
```bash
# Install Supabase CLI
scoop install supabase
# or download from: https://github.com/supabase/cli/releases
```

### Step 1: Link Supabase Project
```bash
npx supabase login
npx supabase link --project-ref ltrknqshxbhmslnkpply
```

### Step 2: Set Secrets
```bash
npx supabase secrets set RAZORPAY_KEY_ID=rzp_live_RYrMe7EXEQ4UMt
npx supabase secrets set RAZORPAY_KEY_SECRET=z4QE76BS32ttCLO2cTOyH764
npx supabase secrets set RAZORPAY_WEBHOOK_SECRET="<Vishruth2008>"
```

### Step 3: Deploy Edge Functions
```bash
# Deploy create order function
npx supabase functions deploy create-razorpay-order

# Deploy verify payment function
npx supabase functions deploy verify-razorpay-payment
```

### Step 4: Run SQL Migration
Go to Supabase Dashboard → SQL Editor:
```
https://supabase.com/dashboard/project/ltrknqshxbhmslnkpply/sql/new
```

Copy and run the contents of `database/migrations/004_razorpay_payments.sql`

### Step 5: Restart Dev Server
```bash
npm run dev
```

## 🧪 Testing

### Test Payment Flow:
1. Go to http://localhost:3000
2. Sign in
3. Click "Upgrade to Premium" or "Buy Credits"
4. Complete payment with test card:
   - Card: 4111 1111 1111 1111
   - CVV: Any 3 digits
   - Expiry: Any future date

### Verify in Razorpay Dashboard:
```
https://dashboard.razorpay.com/app/payments
```

### Check Edge Function Logs:
```bash
npx supabase functions logs create-razorpay-order --follow
npx supabase functions logs verify-razorpay-payment --follow
```

## 🔒 Security Best Practices

### ✅ DO:
- Use `VITE_` prefix for client-side variables only
- Keep `RAZORPAY_KEY_SECRET` in Supabase secrets (server-side only)
- Verify payment signatures on backend
- Use RLS policies on payment tables
- Enable webhooks for payment notifications

### ❌ DON'T:
- Never expose `RAZORPAY_KEY_SECRET` in client code
- Don't commit `.env.local` to git
- Don't skip signature verification
- Don't create orders client-side with live keys
- Don't trust client-side payment status

## 📊 Database Schema

```sql
razorpay_payments
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── razorpay_order_id (TEXT)
├── razorpay_payment_id (TEXT)
├── razorpay_signature (TEXT)
├── amount (INTEGER, in paise)
├── currency (TEXT, default 'INR')
├── status (TEXT, enum)
├── payment_type (TEXT, 'subscription' | 'one_time')
├── notes (JSONB)
├── error_message (TEXT)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)
```

## 🐛 Troubleshooting

### Error: "Razorpay Key ID not found"
**Solution**: Add to `.env.local`:
```bash
VITE_RAZORPAY_KEY_ID=rzp_live_RYrMe7EXEQ4UMt
```
Then restart dev server.

### Error: "Failed to create order"
**Check**:
1. Edge Function deployed: `npx supabase functions list`
2. Secrets set: `npx supabase secrets list`
3. Function logs: `npx supabase functions logs create-razorpay-order`

### Error: "Payment verification failed"
**Check**:
1. `RAZORPAY_KEY_SECRET` set in Supabase secrets
2. Signature format matches Razorpay docs
3. Function logs: `npx supabase functions logs verify-razorpay-payment`

### Error: 400 Bad Request (still happening)
**Possible causes**:
1. Edge Functions not deployed
2. Secrets not set correctly
3. Using wrong Supabase URL
4. CORS issues (check Edge Function CORS headers)

## 🔄 Migration Checklist

- [ ] `.env.local` updated with `VITE_RAZORPAY_KEY_ID`
- [ ] Supabase CLI installed
- [ ] Supabase project linked
- [ ] Razorpay secrets set in Supabase
- [ ] Edge Functions deployed
- [ ] SQL migration 004 executed
- [ ] Dev server restarted
- [ ] Test payment completed
- [ ] Payment visible in Razorpay Dashboard
- [ ] Payment record in `razorpay_payments` table

## 📞 Support

If issues persist:
1. Check Edge Function logs
2. Verify Razorpay Dashboard for errors
3. Check Supabase logs
4. Ensure live keys are activated in Razorpay

## 🎯 Next Steps (Optional)

1. **Enable Webhooks**: 
   - Receive real-time payment notifications
   - Auto-update user subscriptions
   
2. **Add Refund Support**:
   - Handle refunds programmatically
   - Update payment status

3. **Email Notifications**:
   - Send payment confirmations
   - Send payment failure alerts

4. **Payment Analytics**:
   - Track conversion rates
   - Monitor failed payments
   - Revenue reporting
