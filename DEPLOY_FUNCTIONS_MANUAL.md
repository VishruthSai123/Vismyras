# Deploy Supabase Edge Functions Manually (via Dashboard)

This guide shows you how to deploy Edge Functions directly through the Supabase Dashboard without using the CLI.

## Step 1: Access Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Login to your account
3. Select your project: `ltrknqshxbhmslnkpply`

## Step 2: Set Environment Variables (Secrets)

1. In your Supabase Dashboard, go to **Settings** (⚙️ icon in left sidebar)
2. Click on **Edge Functions**
3. Scroll to **Secrets** section
4. Add the following secrets:

### Required Secrets:

| Secret Name | Value | Where to Get |
|-------------|-------|--------------|
| `RAZORPAY_KEY_ID` | `rzp_test_RZCalW8FnHhyFK` | Already visible in your code |
| `RAZORPAY_KEY_SECRET` | Your secret key | Razorpay Dashboard → Settings → API Keys → Key Secret (click "Generate Test Key" if needed) |
| `RAZORPAY_WEBHOOK_SECRET` | Your webhook secret | Will get this after creating webhook (Step 4) |

**To add a secret:**
- Click **"Add Secret"**
- Enter the name (e.g., `RAZORPAY_KEY_ID`)
- Enter the value
- Click **"Save"**

## Step 3: Deploy Edge Functions

### Option A: Using Supabase Dashboard (Direct Upload)

Unfortunately, Supabase Dashboard doesn't support direct file uploads for Edge Functions. You'll need to use one of these alternatives:

### Option B: Using GitHub Integration (RECOMMENDED)

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Add Razorpay Edge Functions"
   git push origin main
   ```

2. **Connect GitHub to Supabase:**
   - Go to your Supabase Dashboard
   - Navigate to **Settings** → **Integrations**
   - Click **"Connect"** next to GitHub
   - Authorize Supabase to access your repository
   - Select repository: `VishruthSai123/Vismyras`
   - Select branch: `main`

3. **Enable Auto-Deploy:**
   - In **Settings** → **Edge Functions**
   - Enable **"Auto-deploy from GitHub"**
   - Supabase will automatically deploy functions from `supabase/functions/` directory

### Option C: Using Web-based CLI (Quickest)

1. **Go to SQL Editor:**
   - Open Supabase Dashboard → SQL Editor
   - This won't work for Edge Functions, skip to Option D

### Option D: Manual Deployment via API (Advanced)

You can deploy using the Supabase Management API, but this requires API tokens and is complex.

## Step 4: Alternative - Use Supabase CLI with npx (No Installation)

If you can't install CLI globally, use `npx`:

```bash
# Login (opens browser)
npx supabase login

# Link project
npx supabase link --project-ref ltrknqshxbhmslnkpply

# Set secrets
npx supabase secrets set RAZORPAY_KEY_ID=rzp_test_RZCalW8FnHhyFK
npx supabase secrets set RAZORPAY_KEY_SECRET=your_secret_here

# Deploy functions
npx supabase functions deploy create-razorpay-order
npx supabase functions deploy verify-razorpay-payment
npx supabase functions deploy razorpay-webhook
```

This runs the CLI without installing it permanently!

## Step 5: Verify Functions are Deployed

### Check via Dashboard:
1. Go to **Edge Functions** in left sidebar
2. You should see three functions listed:
   - `create-razorpay-order`
   - `verify-razorpay-payment`
   - `razorpay-webhook`

### Check via Browser:
Open these URLs (replace with your project ref):
- https://ltrknqshxbhmslnkpply.supabase.co/functions/v1/create-razorpay-order
- https://ltrknqshxbhmslnkpply.supabase.co/functions/v1/verify-razorpay-payment
- https://ltrknqshxbhmslnkpply.supabase.co/functions/v1/razorpay-webhook

You should get a response (not a 404 error).

## Step 6: Configure Razorpay Webhook

1. **Go to Razorpay Dashboard:**
   - Login at https://dashboard.razorpay.com/
   - Switch to **Test Mode** (toggle at top)

2. **Create Webhook:**
   - Go to **Settings** → **Webhooks**
   - Click **"+ Add Webhook"**
   - Enter webhook URL:
     ```
     https://ltrknqshxbhmslnkpply.supabase.co/functions/v1/razorpay-webhook
     ```
   - Select events to listen to:
     - ✅ `payment.authorized`
     - ✅ `payment.captured`
     - ✅ `payment.failed`
     - ✅ `subscription.activated`
     - ✅ `subscription.charged`
     - ✅ `subscription.cancelled`
     - ✅ `subscription.expired`
     - ✅ `subscription.paused`
     - ✅ `subscription.resumed`
     - ✅ `refund.processed`
   - Click **"Create Webhook"**

3. **Copy Webhook Secret:**
   - After creating, Razorpay shows a **Webhook Secret**
   - Copy this secret
   - Go back to Supabase Dashboard → Settings → Edge Functions → Secrets
   - Add new secret:
     - Name: `RAZORPAY_WEBHOOK_SECRET`
     - Value: (paste the secret from Razorpay)

## Step 7: Test the Integration

1. **Refresh your application:**
   ```bash
   # In your project directory
   npm run dev
   ```

2. **Try making a payment:**
   - Click on Premium subscription button
   - Should no longer show CORS error
   - Razorpay checkout should open

3. **Check Supabase Logs:**
   - Go to Supabase Dashboard → Edge Functions
   - Click on function name
   - View **Logs** tab to see any errors

## Troubleshooting

### Still Getting CORS Error?
- ✅ Verify functions are deployed (check Dashboard → Edge Functions)
- ✅ Clear browser cache and hard refresh (Ctrl+Shift+R)
- ✅ Check function logs in Supabase Dashboard

### Functions Not Showing in Dashboard?
- Use **npx supabase** method (Step 4) - it's the easiest
- Or push to GitHub and enable auto-deploy

### Razorpay Shows 400 Error?
- ✅ Verify `RAZORPAY_KEY_SECRET` is set correctly
- ✅ Check you're using TEST mode keys (start with `rzp_test_`)
- ✅ View Edge Function logs for detailed error

## Recommended: Use npx Method

The **easiest manual deployment** without permanent CLI installation:

```bash
# One-time setup
npx supabase login
npx supabase link --project-ref ltrknqshxbhmslnkpply

# Set secrets (get RAZORPAY_KEY_SECRET from Razorpay Dashboard)
npx supabase secrets set RAZORPAY_KEY_ID=rzp_test_RZCalW8FnHhyFK
npx supabase secrets set RAZORPAY_KEY_SECRET=your_actual_secret_key

# Deploy all functions
npx supabase functions deploy
```

That's it! 🚀

---

## Quick Summary

**Fastest Method:**
1. Use `npx supabase login` (no installation needed)
2. Use `npx supabase link --project-ref ltrknqshxbhmslnkpply`
3. Use `npx supabase secrets set` to add Razorpay keys
4. Use `npx supabase functions deploy` to deploy all functions
5. Configure Razorpay webhook URL in Razorpay Dashboard
6. Done!

**Time needed:** 5-10 minutes
