# Razorpay Migration Guide

## Quick Start

### 1. Run the Migration
```sql
-- In Supabase Dashboard → SQL Editor → New Query
-- Copy and paste the entire 005_razorpay_webhook_integration.sql file
-- Click "Run"
```

### 2. Enable pg_cron (Optional but Recommended)
```sql
-- Run as superuser in Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule automatic expiry checks (every hour)
SELECT cron.schedule(
    'expire-subscriptions-hourly',
    '0 * * * *',
    'SELECT expire_subscriptions();'
);

-- Schedule cleanup (daily at 2 AM)
SELECT cron.schedule(
    'cleanup-purchases-daily',
    '0 2 * * *',
    'SELECT cleanup_expired_purchases();'
);
```

### 3. Verify Installation
```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('webhook_events', 'user_one_time_purchases');

-- Check all functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'expire_subscriptions',
    'cleanup_expired_purchases',
    'grant_premium_access',
    'revoke_premium_access',
    'add_one_time_purchase',
    'get_active_credits',
    'consume_credit'
);

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('webhook_events', 'user_one_time_purchases');
```

## What This Migration Provides

### Tables Created/Updated:
1. ✅ **webhook_events** - Complete audit trail of all Razorpay webhooks
2. ✅ **user_billing** - Enhanced with Razorpay subscription tracking
3. ✅ **razorpay_payments** - Enhanced with refund tracking
4. ✅ **user_one_time_purchases** - Credit purchases with automatic expiry

### Functions Created:
1. ✅ **expire_subscriptions()** - Auto-downgrade expired premium users
2. ✅ **cleanup_expired_purchases()** - Remove expired credits
3. ✅ **grant_premium_access()** - Grant premium (called by webhooks)
4. ✅ **revoke_premium_access()** - Revoke premium (called by webhooks)
5. ✅ **add_one_time_purchase()** - Add credits (called by webhooks)
6. ✅ **get_active_credits()** - Get user's active credits
7. ✅ **consume_credit()** - Race-condition safe credit consumption

### Views Created:
1. ✅ **active_subscriptions** - All active premium subscriptions
2. ✅ **subscriptions_expiring_soon** - Subs expiring within 7 days
3. ✅ **user_credit_summary** - User credit summary

### Security Features:
1. ✅ Row Level Security (RLS) on all tables
2. ✅ Service role access for webhooks
3. ✅ User access restricted to own data
4. ✅ Race-condition safe credit consumption (SKIP LOCKED)

## Common Queries

### Monitor Webhook Activity
```sql
-- Recent webhook events
SELECT 
    event_type,
    entity_type,
    processed,
    error,
    created_at
FROM webhook_events
ORDER BY created_at DESC
LIMIT 20;

-- Failed webhooks
SELECT * FROM webhook_events 
WHERE error IS NOT NULL 
ORDER BY created_at DESC;
```

### Check User Billing
```sql
-- User's current subscription
SELECT 
    subscription_tier,
    subscription_status,
    subscription_end_date,
    razorpay_subscription_id,
    subscription_auto_renew
FROM user_billing
WHERE user_id = 'YOUR_USER_ID';

-- User's active credits
SELECT * FROM get_active_credits('YOUR_USER_ID');
```

### Monitor Subscriptions
```sql
-- All active premium users
SELECT * FROM active_subscriptions;

-- Subscriptions expiring soon
SELECT * FROM subscriptions_expiring_soon;

-- Total active premium users
SELECT COUNT(*) FROM active_subscriptions;
```

### Credit Management
```sql
-- User's credit summary
SELECT * FROM user_credit_summary
WHERE user_id = 'YOUR_USER_ID';

-- All users with credits
SELECT * FROM user_credit_summary
ORDER BY total_credits_remaining DESC;
```

## Manual Operations

### Grant Premium Access (Testing)
```sql
SELECT grant_premium_access(
    'user-uuid-here',
    'razorpay_subscription_id',
    NOW() + INTERVAL '30 days'
);
```

### Revoke Premium Access
```sql
SELECT revoke_premium_access(
    'user-uuid-here',
    'Refund processed'
);
```

### Add Credits
```sql
SELECT add_one_time_purchase(
    'user-uuid-here',
    'razorpay_payment_id',
    50, -- credits
    299.00, -- price
    30 -- days until expiry
);
```

### Consume a Credit
```sql
-- Returns true if consumed, false if no credits available
SELECT consume_credit('user-uuid-here');
```

### Manual Expiry/Cleanup
```sql
-- Expire subscriptions now
SELECT expire_subscriptions();

-- Cleanup expired purchases now
SELECT cleanup_expired_purchases();
```

## Troubleshooting

### No Credits Available
```sql
-- Check if user has any purchases
SELECT * FROM user_one_time_purchases
WHERE user_id = 'user-uuid-here';

-- Check if purchases are expired
SELECT 
    *,
    CASE 
        WHEN expiry_date < NOW() THEN 'EXPIRED'
        ELSE 'ACTIVE'
    END as status
FROM user_one_time_purchases
WHERE user_id = 'user-uuid-here';
```

### Subscription Not Updating
```sql
-- Check last webhook sync
SELECT 
    user_id,
    last_webhook_sync,
    subscription_status,
    razorpay_subscription_id
FROM user_billing
WHERE user_id = 'user-uuid-here';

-- Check webhook events for this user
SELECT * FROM webhook_events
WHERE user_id = 'user-uuid-here'
ORDER BY created_at DESC;
```

### Webhooks Not Processing
```sql
-- Check unprocessed webhooks
SELECT * FROM webhook_events
WHERE processed = false
ORDER BY created_at ASC;

-- Mark webhook as processed manually (if needed)
UPDATE webhook_events
SET processed = true, processed_at = NOW()
WHERE id = 'webhook-event-id';
```

## Performance Tips

### Indexes are Automatically Created
- User ID indexes on all tables
- Expiry date indexes for fast cleanup
- Razorpay ID indexes for quick lookups
- Active purchase index (composite)

### Scheduled Jobs
- Expiry check runs hourly (lightweight)
- Cleanup runs daily at 2 AM
- Both use SECURITY DEFINER (elevated privileges)

### Race Condition Prevention
- `consume_credit()` uses `FOR UPDATE SKIP LOCKED`
- Ensures atomic credit consumption
- Safe for concurrent requests

## Migration Rollback (If Needed)

```sql
-- Drop all objects created by this migration
DROP VIEW IF EXISTS user_credit_summary;
DROP VIEW IF EXISTS subscriptions_expiring_soon;
DROP VIEW IF EXISTS active_subscriptions;

DROP FUNCTION IF EXISTS consume_credit(UUID);
DROP FUNCTION IF EXISTS get_active_credits(UUID);
DROP FUNCTION IF EXISTS add_one_time_purchase(UUID, VARCHAR, INTEGER, DECIMAL, INTEGER);
DROP FUNCTION IF EXISTS revoke_premium_access(UUID, TEXT);
DROP FUNCTION IF EXISTS grant_premium_access(UUID, VARCHAR, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS cleanup_expired_purchases();
DROP FUNCTION IF EXISTS expire_subscriptions();

DROP TABLE IF EXISTS user_one_time_purchases;
DROP TABLE IF EXISTS webhook_events;

ALTER TABLE public.razorpay_payments 
DROP COLUMN IF EXISTS webhook_event_id,
DROP COLUMN IF EXISTS notes,
DROP COLUMN IF EXISTS refunded_at,
DROP COLUMN IF EXISTS refund_amount;

ALTER TABLE public.user_billing 
DROP COLUMN IF EXISTS last_webhook_sync,
DROP COLUMN IF EXISTS subscription_paused_at,
DROP COLUMN IF EXISTS subscription_auto_renew,
DROP COLUMN IF EXISTS razorpay_customer_id,
DROP COLUMN IF EXISTS razorpay_subscription_id;
```

## Support

For issues or questions:
1. Check Supabase logs: Dashboard → Database → Logs
2. Check webhook events table for errors
3. Verify RLS policies are correctly set
4. Ensure service role has proper permissions

---

**Migration Status:** ✅ Production Ready
**Version:** 005
**Date:** 2025-10-29
