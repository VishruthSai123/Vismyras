# Razorpay Webhook Integration Guide

## Overview
This system automatically handles subscription lifecycle (granting, revoking, expiring) through Razorpay webhooks. No manual intervention needed!

## Architecture

```
Razorpay → Webhook → Supabase Edge Function → Database Update → Realtime → Frontend
```

### What Gets Automated:
- ✅ **Premium Access Granting**: Automatic when subscription activated/charged
- ✅ **Access Revoking**: Automatic on subscription cancellation/expiry
- ✅ **Access Expiring**: Automatic when subscription period ends
- ✅ **One-Time Credits**: Automatic granting when payment captured
- ✅ **Refunds**: Automatic revocation when refund processed

## Setup Instructions

### 1. Deploy Supabase Edge Function

```bash
# Navigate to your project
cd c:\Users\VISHRUTH\Vismyras\Vismyras

# Install Supabase CLI if not installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Deploy the webhook function
supabase functions deploy razorpay-webhook

# Set environment variables
supabase secrets set RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_from_razorpay
supabase secrets set SUPABASE_URL=your_supabase_url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Run Database Migration

```sql
-- Go to Supabase Dashboard → SQL Editor → New Query
-- Paste the contents of: supabase/migrations/005_razorpay_webhook_integration.sql
-- Click Run
```

This creates:
- `webhook_events` table - Audit trail of all webhooks
- `user_one_time_purchases` table - One-time credit purchases
- Updates to `user_billing` table - Subscription tracking fields
- Updates to `razorpay_payments` table - Refund tracking
- Automatic expiry functions - Background cleanup jobs

### 3. Configure Razorpay Webhook

1. Go to Razorpay Dashboard → Settings → Webhooks
2. Click "Create New Webhook"
3. Enter your webhook URL:
   ```
   https://your-project-ref.supabase.co/functions/v1/razorpay-webhook
   ```
4. Select Events to Subscribe:
   - ☑️ `subscription.activated`
   - ☑️ `subscription.charged`
   - ☑️ `subscription.cancelled`
   - ☑️ `subscription.completed`
   - ☑️ `subscription.expired`
   - ☑️ `subscription.paused`
   - ☑️ `subscription.halted`
   - ☑️ `subscription.resumed`
   - ☑️ `payment.captured`
   - ☑️ `payment.failed`
   - ☑️ `refund.created`
   - ☑️ `refund.processed`
5. Generate webhook secret and save it
6. Update your environment:
   ```bash
   supabase secrets set RAZORPAY_WEBHOOK_SECRET=whsec_your_secret_here
   ```

### 4. Update Environment Variables

Add to `.env.local`:
```bash
# Test Mode Webhook (for testing)
VITE_RAZORPAY_TEST_WEBHOOK_SECRET=whsec_test_your_secret

# Live Mode Webhook (for production)
VITE_RAZORPAY_LIVE_WEBHOOK_SECRET=whsec_live_your_secret
```

### 5. Test the Webhook

#### Using Razorpay Test Mode:
```bash
# Set test mode
VITE_RAZORPAY_LIVE_MODE=false

# Make a test subscription purchase
# Razorpay will send webhook → Edge Function → Database updated
```

#### Manual Testing:
```bash
# Send test webhook from Razorpay Dashboard
# Go to: Settings → Webhooks → Your Webhook → Send Test Webhook
```

## Webhook Events Flow

### 🎉 Subscription Activated
```
Event: subscription.activated
→ Edge Function: grantPremiumAccess()
→ Database: SET tier=PREMIUM, status=ACTIVE, end_date=period_end
→ Frontend: User sees "Premium Access Activated! 🎉"
```

### 💳 Payment Captured
```
Event: payment.captured (type=credits)
→ Edge Function: handlePaymentEvent()
→ Database: INSERT into user_one_time_purchases
→ Frontend: User sees "Credits Added! 🎁"
```

### ⚠️ Subscription Cancelled
```
Event: subscription.cancelled
→ Edge Function: Mark as CANCELLED
→ Database: SET status=CANCELLED, auto_renew=false
→ User keeps access until end_date
→ Frontend: User sees "Subscription cancelled, access until [date]"
```

### 🚫 Subscription Expired
```
Event: subscription.expired
→ Edge Function: revokePremiumAccess()
→ Database: SET tier=FREE, status=EXPIRED, limit=10
→ Frontend: User sees "Premium expired, now on FREE tier"
```

### 💰 Refund Processed
```
Event: refund.processed
→ Edge Function: handleRefundEvent()
→ Database: DELETE purchase OR revoke premium
→ Frontend: User sees "Refund processed"
```

## Database Schema

### webhook_events
```sql
id UUID PRIMARY KEY
event_id VARCHAR(255) UNIQUE -- Razorpay event ID
event_type VARCHAR(100)       -- e.g., subscription.activated
entity_type VARCHAR(50)       -- subscription, payment, refund
entity_id VARCHAR(255)        -- Razorpay entity ID
user_id UUID
payload JSONB                 -- Full webhook payload
processed BOOLEAN
processed_at TIMESTAMPTZ
error TEXT
created_at TIMESTAMPTZ
```

### user_billing (updated)
```sql
-- New fields:
razorpay_subscription_id VARCHAR(255)
razorpay_customer_id VARCHAR(255)
subscription_auto_renew BOOLEAN
subscription_paused_at TIMESTAMPTZ
last_webhook_sync TIMESTAMPTZ
```

### user_one_time_purchases
```sql
id UUID PRIMARY KEY
user_id UUID
razorpay_payment_id VARCHAR(255)
try_ons_count INTEGER
price DECIMAL(10, 2)
purchase_date TIMESTAMPTZ
expiry_date TIMESTAMPTZ
is_used BOOLEAN
created_at TIMESTAMPTZ
```

## Automatic Cleanup

### Subscription Expiry Check
Runs every hour via pg_cron:
```sql
SELECT expire_subscriptions();
```
- Finds PREMIUM subscriptions past end_date
- Downgrades to FREE tier
- Logs: "⚠️ Expired N premium subscriptions"

### Purchase Cleanup
Runs daily at midnight:
```sql
SELECT cleanup_expired_purchases();
```
- Deletes expired one-time purchases
- Logs: "🧹 Cleaned up N expired purchase(s)"

## Testing Checklist

- [ ] Edge function deployed
- [ ] Database migration run successfully
- [ ] Razorpay webhook configured
- [ ] Webhook secret set in Supabase
- [ ] Test subscription purchase
- [ ] Verify premium access granted (check console logs)
- [ ] Test subscription cancellation
- [ ] Verify access maintained until end date
- [ ] Wait for expiry (or modify end_date for testing)
- [ ] Verify automatic downgrade to FREE
- [ ] Test one-time credit purchase
- [ ] Verify credits added
- [ ] Test refund
- [ ] Verify credits/premium revoked

## Monitoring & Debugging

### View Webhook Logs
```sql
-- All webhook events
SELECT * FROM webhook_events 
ORDER BY created_at DESC 
LIMIT 50;

-- Failed webhooks
SELECT * FROM webhook_events 
WHERE error IS NOT NULL 
ORDER BY created_at DESC;

-- User's webhook history
SELECT * FROM webhook_events 
WHERE user_id = 'user-uuid-here' 
ORDER BY created_at DESC;
```

### View Billing History
```sql
-- User's billing status
SELECT * FROM user_billing 
WHERE user_id = 'user-uuid-here';

-- User's one-time purchases
SELECT * FROM user_one_time_purchases 
WHERE user_id = 'user-uuid-here' 
ORDER BY purchase_date DESC;

-- User's payments
SELECT * FROM razorpay_payments 
WHERE user_id = 'user-uuid-here' 
ORDER BY created_at DESC;
```

### Edge Function Logs
```bash
# View realtime logs
supabase functions logs razorpay-webhook --tail

# View specific time range
supabase functions logs razorpay-webhook --since 1h
```

## Console Logs

The webhook system logs everything for transparency:

### Granting Access
```
✅ GRANTING PREMIUM ACCESS to user abc-123
✅ Premium access granted until 2025-11-29T10:30:00Z
```

### Revoking Access
```
🚫 REVOKING PREMIUM ACCESS for user abc-123
📝 Reason: Subscription expired
🚫 Premium access revoked
```

### Credits
```
✅ GRANTING 50 ONE-TIME CREDITS to user abc-123
✅ Credits granted, expires: 2025-11-29T10:30:00Z
```

```
🚫 REVOKING CREDITS for user abc-123 due to refund
```

## Security

- ✅ Webhook signature verification (HMAC SHA256)
- ✅ Supabase RLS policies (row-level security)
- ✅ Service role key for database writes
- ✅ CORS configured for webhook endpoint
- ✅ Audit trail in webhook_events table

## Support

If webhooks aren't working:

1. Check Edge Function logs: `supabase functions logs razorpay-webhook`
2. Verify webhook secret matches Razorpay
3. Check database for failed events: `SELECT * FROM webhook_events WHERE error IS NOT NULL`
4. Verify Razorpay webhook status in dashboard (should show 2xx responses)
5. Test with Razorpay's "Send Test Webhook" feature

## Production Checklist

- [ ] Switch to live mode: `VITE_RAZORPAY_LIVE_MODE=true`
- [ ] Use live webhook secret
- [ ] Set up monitoring/alerts for failed webhooks
- [ ] Configure pg_cron for automatic cleanup
- [ ] Set up backup strategy for billing data
- [ ] Document incident response procedures
