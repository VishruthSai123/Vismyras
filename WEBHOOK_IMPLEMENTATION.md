# 🎉 Razorpay Webhook Automation - Complete Implementation

## What Changed

### ✅ **AUTOMATIC ACCESS MANAGEMENT**
The system now **automatically** handles:
- **Granting Premium Access** - When subscription activated/charged
- **Revoking Premium Access** - When subscription expires/cancelled
- **Expiring Subscriptions** - Automatic downgrade when period ends
- **One-Time Credits** - Auto-grant when payment captured
- **Refunds** - Auto-revoke credits/premium when refund processed

### ⚡ **NO MANUAL INTERVENTION NEEDED**
All billing operations are now webhook-driven:

```
User Subscribes → Razorpay → Webhook → Database → User Gets Access
                                ↓
                         Logged for audit
```

## Files Created

### 1. **Webhook Edge Function**
📁 `supabase/functions/razorpay-webhook/index.ts`
- Receives webhooks from Razorpay
- Verifies signature for security
- Handles all subscription/payment/refund events
- Updates database automatically
- Full audit logging

**Events Handled:**
- ✅ `subscription.activated` - Grant premium
- ✅ `subscription.charged` - Extend premium
- ✅ `subscription.cancelled` - Mark cancelled (keep access until end)
- ✅ `subscription.expired` - Revoke premium immediately
- ✅ `subscription.paused/halted` - Suspend access
- ✅ `subscription.resumed` - Restore access
- ✅ `payment.captured` - Grant credits
- ✅ `payment.failed` - Log failure
- ✅ `refund.processed` - Revoke credits/premium

### 2. **Database Migration**
📁 `supabase/migrations/005_razorpay_webhook_integration.sql`

**New Tables:**
- `webhook_events` - Audit trail of all webhooks
- `user_one_time_purchases` - One-time credit tracking with expiry

**Updated Tables:**
- `user_billing` - Added webhook sync fields
- `razorpay_payments` - Added refund tracking

**New Functions:**
- `expire_subscriptions()` - Auto-expires premium subscriptions
- `cleanup_expired_purchases()` - Removes expired credits

### 3. **Setup Guide**
📁 `WEBHOOK_SETUP.md`
- Complete deployment instructions
- Razorpay webhook configuration
- Testing procedures
- Monitoring & debugging
- Production checklist

## How It Works

### 🎯 Subscription Flow

```
1. User clicks "Subscribe to Premium"
   ↓
2. Razorpay payment modal opens
   ↓
3. User completes payment
   ↓
4. Razorpay sends `subscription.activated` webhook
   ↓
5. Edge Function receives webhook
   ↓
6. Verifies signature
   ↓
7. Updates database:
   - SET tier = 'PREMIUM'
   - SET status = 'ACTIVE'
   - SET end_date = period_end
   - SET usage_limit = 1000
   ↓
8. Logs to webhook_events table
   ↓
9. User immediately has premium access ✅
```

### 🚫 Cancellation Flow

```
1. User clicks "Cancel Subscription"
   ↓
2. Razorpay API called
   ↓
3. Razorpay sends `subscription.cancelled` webhook
   ↓
4. Edge Function updates database:
   - SET status = 'CANCELLED'
   - SET auto_renew = false
   - KEEP end_date (access until period end)
   ↓
5. User notified: "Cancelled, access until [date]"
   ↓
6. On end_date, Razorpay sends `subscription.expired`
   ↓
7. Edge Function downgrades:
   - SET tier = 'FREE'
   - SET usage_limit = 10
   ↓
8. User downgraded to FREE tier ✅
```

### 💰 Credits Flow

```
1. User buys 50 try-ons
   ↓
2. Razorpay payment modal
   ↓
3. Payment captured
   ↓
4. Razorpay sends `payment.captured` webhook
   ↓
5. Edge Function:
   - INSERT into user_one_time_purchases
   - try_ons_count = 50
   - expiry_date = now + 30 days
   ↓
6. User immediately has 50 credits ✅
   ↓
7. After 30 days:
   - Automatic cleanup job runs
   - DELETE expired purchases
   ↓
8. Credits automatically removed ✅
```

## Code Changes

### billingService.ts
Updated all manual methods with webhook notes:

```typescript
/**
 * NOTE: In production, access is granted automatically by Razorpay webhooks
 * This method is for local testing only. See WEBHOOK_SETUP.md
 */
public upgradeToPremium() {
  console.log('⚠️ In production, this is handled automatically by webhooks');
  // ... manual upgrade code for testing
}
```

**All methods now log:**
- `(Manual - Testing Only)` indicator
- Warning about webhook automation
- Reference to WEBHOOK_SETUP.md

### .env.local Structure
```bash
# Test/Live Mode Switch
VITE_RAZORPAY_LIVE_MODE=false

# Test Keys (for development)
VITE_RAZORPAY_TEST_KEY_ID=your_test_key
RAZORPAY_TEST_KEY_SECRET=your_test_secret
VITE_RAZORPAY_TEST_PREMIUM_PLAN_ID=plan_test_xxx

# Live Keys (for production)
VITE_RAZORPAY_LIVE_KEY_ID=rzp_live_xxx
RAZORPAY_LIVE_KEY_SECRET=xxx
VITE_RAZORPAY_LIVE_PREMIUM_PLAN_ID=plan_live_xxx

# Webhook Secrets
VITE_RAZORPAY_TEST_WEBHOOK_SECRET=whsec_test_xxx
VITE_RAZORPAY_LIVE_WEBHOOK_SECRET=whsec_live_xxx
```

## Security

✅ **Webhook Signature Verification**
- Every webhook verified with HMAC SHA256
- Invalid signatures rejected immediately

✅ **Database RLS Policies**
- Users can only read their own data
- Service role required for writes
- Webhook function uses service role key

✅ **Audit Trail**
- Every webhook logged in `webhook_events`
- Full payload stored for debugging
- Error tracking for failed webhooks

## Testing

### Manual Testing Flow:
```bash
# 1. Deploy edge function
supabase functions deploy razorpay-webhook

# 2. Set test mode
VITE_RAZORPAY_LIVE_MODE=false

# 3. Configure webhook in Razorpay (test mode)
URL: https://your-project.supabase.co/functions/v1/razorpay-webhook

# 4. Make test purchase
# → Check database:
SELECT * FROM user_billing WHERE user_id = 'your-user-id';
# → Should see tier=PREMIUM

# 5. Check webhook logs:
SELECT * FROM webhook_events ORDER BY created_at DESC LIMIT 10;

# 6. Check function logs:
supabase functions logs razorpay-webhook --tail
```

## Monitoring

### Check Webhook Health:
```sql
-- Failed webhooks (last 24h)
SELECT * FROM webhook_events 
WHERE error IS NOT NULL 
AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Webhook processing time
SELECT 
  event_type,
  AVG(EXTRACT(EPOCH FROM (processed_at - created_at))) as avg_processing_seconds
FROM webhook_events 
WHERE processed = true
GROUP BY event_type;

-- Today's webhook activity
SELECT 
  event_type,
  COUNT(*) as count,
  COUNT(CASE WHEN error IS NULL THEN 1 END) as successful,
  COUNT(CASE WHEN error IS NOT NULL THEN 1 END) as failed
FROM webhook_events 
WHERE created_at > CURRENT_DATE
GROUP BY event_type;
```

## Production Deployment

### Checklist:
- [ ] Deploy edge function: `supabase functions deploy razorpay-webhook`
- [ ] Run migration: `005_razorpay_webhook_integration.sql`
- [ ] Set webhook secret: `supabase secrets set RAZORPAY_WEBHOOK_SECRET=xxx`
- [ ] Configure Razorpay webhook (live mode)
- [ ] Switch to live mode: `VITE_RAZORPAY_LIVE_MODE=true`
- [ ] Test with small amount
- [ ] Verify webhook logs
- [ ] Set up monitoring alerts
- [ ] Configure backup strategy
- [ ] Enable pg_cron for auto-cleanup

### Maintenance:
```bash
# View function logs
supabase functions logs razorpay-webhook --tail

# Check webhook health
supabase psql -c "SELECT * FROM webhook_events WHERE error IS NOT NULL LIMIT 20"

# Manual cleanup (if needed)
supabase psql -c "SELECT expire_subscriptions()"
supabase psql -c "SELECT cleanup_expired_purchases()"
```

## Benefits

### Before (Manual):
```
❌ Developer manually calls upgradeToPremium()
❌ Risk of missing cancellations
❌ No automatic expiry handling
❌ No audit trail
❌ Inconsistent access management
```

### After (Automated):
```
✅ Razorpay automatically grants access via webhooks
✅ Cancellations handled immediately
✅ Expiry automatic with background jobs
✅ Complete audit trail in database
✅ Consistent, reliable access management
✅ Real-time updates
✅ Production-ready security
```

## Next Steps

1. **Deploy to Supabase**
   ```bash
   supabase functions deploy razorpay-webhook
   ```

2. **Run Migration**
   - Open Supabase Dashboard → SQL Editor
   - Run `005_razorpay_webhook_integration.sql`

3. **Configure Razorpay**
   - Add webhook URL
   - Subscribe to all events
   - Get webhook secret

4. **Test End-to-End**
   - Make test purchase
   - Verify access granted
   - Test cancellation
   - Verify access revoked

5. **Go Live**
   - Switch `VITE_RAZORPAY_LIVE_MODE=true`
   - Update webhook to live mode
   - Monitor logs

---

**All access management is now fully automated! 🎉**

For detailed setup instructions, see: `WEBHOOK_SETUP.md`
