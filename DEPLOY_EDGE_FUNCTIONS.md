# Deploy Supabase Edge Functions

## Prerequisites
1. Install Supabase CLI: https://supabase.com/docs/guides/cli/getting-started
2. Login to Supabase CLI: `supabase login`
3. Link your project: `supabase link --project-ref <your-project-ref>`

## Step 1: Install Supabase CLI

### Windows (PowerShell)
```powershell
# Using Scoop
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# OR using npm
npm install -g supabase
```

## Step 2: Login to Supabase
```bash
supabase login
```

## Step 3: Link Your Project
```bash
# Get your project ref from: https://supabase.com/dashboard/project/<your-project>/settings/general
supabase link --project-ref ltrknqshxbhmslnkpply
```

## Step 4: Set Environment Secrets

### Required Secrets
```bash
# Razorpay API Keys (from Razorpay Dashboard)
supabase secrets set RAZORPAY_KEY_ID=rzp_test_RZCalW8FnHhyFK
supabase secrets set RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Razorpay Webhook Secret (from Razorpay Webhook Settings)
supabase secrets set RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

**Important:** Get your `RAZORPAY_KEY_SECRET` from:
- Razorpay Dashboard → Settings → API Keys → Key Secret

## Step 5: Deploy Edge Functions

### Deploy All Functions
```bash
# Navigate to project root
cd C:\Users\VISHRUTH\Vismyras\Vismyras

# Deploy create-razorpay-order function
supabase functions deploy create-razorpay-order

# Deploy verify-razorpay-payment function
supabase functions deploy verify-razorpay-payment

# Deploy razorpay-webhook function
supabase functions deploy razorpay-webhook
```

### Or Deploy All at Once
```bash
supabase functions deploy
```

## Step 6: Verify Deployment

### Check Function URLs
```bash
supabase functions list
```

Your functions will be available at:
- `https://ltrknqshxbhmslnkpply.supabase.co/functions/v1/create-razorpay-order`
- `https://ltrknqshxbhmslnkpply.supabase.co/functions/v1/verify-razorpay-payment`
- `https://ltrknqshxbhmslnkpply.supabase.co/functions/v1/razorpay-webhook`

## Step 7: Test the Functions

### Test create-razorpay-order
```bash
curl -i --location --request POST 'https://ltrknqshxbhmslnkpply.supabase.co/functions/v1/create-razorpay-order' \
  --header 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"amount":19900,"currency":"INR","notes":{"plan":"premium_month"}}'
```

## Troubleshooting

### CORS Error
- ✅ Functions have CORS headers configured
- ✅ Deploy the functions to make them available
- Check if functions are deployed: `supabase functions list`

### 500 Error
- Check environment secrets are set: `supabase secrets list`
- View function logs: `supabase functions logs create-razorpay-order`

### Razorpay 400 Error
- Verify `RAZORPAY_KEY_SECRET` is correct (not the Key ID)
- Check amount is in paise (multiply by 100)
- Verify API keys are from correct mode (Test/Live)

## Quick Fix for Current Error

The CORS error means the function isn't deployed yet. Run:

```bash
# 1. Install Supabase CLI
npm install -g supabase

# 2. Login
supabase login

# 3. Link project
supabase link --project-ref ltrknqshxbhmslnkpply

# 4. Set secrets (IMPORTANT!)
supabase secrets set RAZORPAY_KEY_ID=rzp_test_RZCalW8FnHhyFK
supabase secrets set RAZORPAY_KEY_SECRET=YOUR_SECRET_KEY_HERE

# 5. Deploy
supabase functions deploy create-razorpay-order
supabase functions deploy verify-razorpay-payment
```

After deployment, refresh your app and try the payment again!
