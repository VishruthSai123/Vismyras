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

**For TEST Mode (Development):**

| Secret Name | Value | Notes |
|-------------|-------|-------|
| `RAZORPAY_KEY_ID` | `rzp_test_RZCalW8FnHhyFK` | From your .env.local |
| `RAZORPAY_KEY_SECRET` | `xat1T5SykUzrUyJIaDYD1tBj` | TEST secret key from .env.local |
| `RAZORPAY_WEBHOOK_SECRET` | `<Vishruth2008>` | From your .env.local |
| `SUPABASE_URL` | `https://ltrknqshxbhmslnkpply.supabase.co` | From your .env.local |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...XNQQ` | Service role key from .env.local (full key needed) |

**For LIVE Mode (Production):**

| Secret Name | Value | Notes |
|-------------|-------|-------|
| `RAZORPAY_KEY_ID` | `rzp_live_RYrMe7EXEQ4UMt` | LIVE mode - from .env.local |
| `RAZORPAY_KEY_SECRET` | `z4QE76BS32ttCLO2cTOyH764` | LIVE secret key from .env.local |
| `RAZORPAY_WEBHOOK_SECRET` | Get from Razorpay after webhook setup | Will be different for live mode |
| `SUPABASE_URL` | `https://ltrknqshxbhmslnkpply.supabase.co` | Same as test |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...XNQlQ` | Same as test |

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

# Set secrets for TEST mode
npx supabase secrets set RAZORPAY_KEY_ID=rzp_test_RZCalW8FnHhyFK
npx supabase secrets set RAZORPAY_KEY_SECRET=xat1T5SykUzrUyJIaDYD1tBj
npx supabase secrets set RAZORPAY_WEBHOOK_SECRET="<Vishruth2008>"
npx supabase secrets set SUPABASE_URL=https://ltrknqshxbhmslnkpply.supabase.co
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0cmtucXNoeGJobXNsbmtwcGx5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY0MDU1MSwiZXhwIjoyMDc3MjE2NTUxfQ.wWvlF7zfUfaBHMh0wUFhvsxkjspk2D9FA7lL4ZpXNQQ

# Deploy functions
npx supabase functions deploy create-razorpay-order
npx supabase functions deploy verify-razorpay-payment
npx supabase functions deploy razorpay-webhook
```

**For LIVE mode, change to:**
```bash
npx supabase secrets set RAZORPAY_KEY_ID=rzp_live_RYrMe7EXEQ4UMt
npx supabase secrets set RAZORPAY_KEY_SECRET=z4QE76BS32ttCLO2cTOyH764
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

# Set secrets (TEST MODE - from your .env.local)
npx supabase secrets set RAZORPAY_KEY_ID=rzp_test_RZCalW8FnHhyFK
npx supabase secrets set RAZORPAY_KEY_SECRET=xat1T5SykUzrUyJIaDYD1tBj
npx supabase secrets set RAZORPAY_WEBHOOK_SECRET="<Vishruth2008>"
npx supabase secrets set SUPABASE_URL=https://ltrknqshxbhmslnkpply.supabase.co
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0cmtucXNoeGJobXNsbmtwcGx5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY0MDU1MSwiZXhwIjoyMDc3MjE2NTUxfQ.wWvlF7zfUfaBHMh0wUFhvsxkjspk2D9FA7lL4ZpXNQQ

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
