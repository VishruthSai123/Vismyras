-- ============================================================================
-- Migration: 005_razorpay_webhook_integration.sql
-- Purpose: Complete Razorpay payment gateway integration with webhook automation
-- Date: 2025-10-29
-- Description: Automatic subscription lifecycle management (grant, revoke, expire)
-- ============================================================================

-- ============================================================================
-- PART 1: WEBHOOK EVENTS TABLE (Audit Trail)
-- ============================================================================

-- Track all Razorpay webhook events for complete audit trail
CREATE TABLE IF NOT EXISTS public.webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id VARCHAR(255) UNIQUE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMPTZ,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_webhook_events_user_id ON public.webhook_events(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON public.webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_entity_id ON public.webhook_events(entity_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON public.webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON public.webhook_events(created_at DESC);

COMMENT ON TABLE public.webhook_events IS 'Audit trail of all Razorpay webhook events';
COMMENT ON COLUMN public.webhook_events.event_id IS 'Razorpay event ID (unique)';
COMMENT ON COLUMN public.webhook_events.event_type IS 'Event type (e.g., subscription.activated)';
COMMENT ON COLUMN public.webhook_events.entity_type IS 'Entity type (subscription, payment, refund)';
COMMENT ON COLUMN public.webhook_events.entity_id IS 'Razorpay entity ID';
COMMENT ON COLUMN public.webhook_events.payload IS 'Full webhook payload from Razorpay';
COMMENT ON COLUMN public.webhook_events.processed IS 'Whether webhook has been processed';

-- ============================================================================
-- PART 2: USER BILLING TABLE (Drop and Recreate with Structured Schema)
-- ============================================================================

-- Drop existing table and recreate with proper structure
DROP TABLE IF EXISTS public.user_billing CASCADE;

-- Create user_billing with structured columns (not JSONB)
CREATE TABLE public.user_billing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    
    -- Subscription fields
    subscription_tier VARCHAR(20) DEFAULT 'FREE' CHECK (subscription_tier IN ('FREE', 'PREMIUM')),
    subscription_status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (subscription_status IN ('ACTIVE', 'CANCELLED', 'EXPIRED', 'PAUSED')),
    subscription_start_date TIMESTAMPTZ,
    subscription_end_date TIMESTAMPTZ,
    
    -- Usage tracking
    usage_count INTEGER DEFAULT 0 CHECK (usage_count >= 0),
    usage_limit INTEGER DEFAULT 10 CHECK (usage_limit >= 0),
    last_reset_date TIMESTAMPTZ DEFAULT NOW(),
    
    -- Razorpay integration
    razorpay_subscription_id VARCHAR(255),
    razorpay_customer_id VARCHAR(255),
    subscription_auto_renew BOOLEAN DEFAULT true,
    subscription_paused_at TIMESTAMPTZ,
    last_webhook_sync TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_billing_user_id ON public.user_billing(user_id);
CREATE INDEX IF NOT EXISTS idx_user_billing_subscription_tier ON public.user_billing(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_user_billing_subscription_status ON public.user_billing(subscription_status);
CREATE INDEX IF NOT EXISTS idx_user_billing_razorpay_sub ON public.user_billing(razorpay_subscription_id) WHERE razorpay_subscription_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_billing_razorpay_customer ON public.user_billing(razorpay_customer_id) WHERE razorpay_customer_id IS NOT NULL;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_user_billing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_billing_updated_at ON public.user_billing;
CREATE TRIGGER user_billing_updated_at
    BEFORE UPDATE ON public.user_billing
    FOR EACH ROW
    EXECUTE FUNCTION update_user_billing_updated_at();

-- Function: Create default billing record for new users
CREATE OR REPLACE FUNCTION create_default_billing()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_billing (
        user_id,
        subscription_tier,
        subscription_status,
        usage_count,
        usage_limit,
        last_reset_date
    ) VALUES (
        NEW.id,
        'FREE',
        'ACTIVE',
        0,
        10,
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Auto-create billing record when user signs up
DROP TRIGGER IF EXISTS create_user_billing ON auth.users;
CREATE TRIGGER create_user_billing
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_billing();

-- Row Level Security
ALTER TABLE public.user_billing ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own billing" ON public.user_billing;
CREATE POLICY "Users can view own billing"
    ON public.user_billing FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own billing" ON public.user_billing;
CREATE POLICY "Users can update own billing"
    ON public.user_billing FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage billing" ON public.user_billing;
CREATE POLICY "Service role can manage billing"
    ON public.user_billing FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- Comments
COMMENT ON TABLE public.user_billing IS 'User billing and subscription management with structured columns';
COMMENT ON COLUMN public.user_billing.subscription_tier IS 'Subscription tier: FREE or PREMIUM';
COMMENT ON COLUMN public.user_billing.subscription_status IS 'Subscription status: ACTIVE, CANCELLED, EXPIRED, or PAUSED';
COMMENT ON COLUMN public.user_billing.usage_count IS 'Number of try-ons used in current period';
COMMENT ON COLUMN public.user_billing.usage_limit IS 'Maximum try-ons allowed (10 for FREE, 50 for PREMIUM)';
COMMENT ON COLUMN public.user_billing.razorpay_subscription_id IS 'Razorpay subscription ID for recurring payments';
COMMENT ON COLUMN public.user_billing.razorpay_customer_id IS 'Razorpay customer ID';
COMMENT ON COLUMN public.user_billing.subscription_auto_renew IS 'Whether subscription auto-renews';
COMMENT ON COLUMN public.user_billing.subscription_paused_at IS 'When subscription was paused';
COMMENT ON COLUMN public.user_billing.last_webhook_sync IS 'Last webhook sync timestamp';

-- ============================================================================
-- PART 3: RAZORPAY PAYMENTS TABLE (Enhanced)
-- ============================================================================

-- Add refund tracking to payments table
ALTER TABLE public.razorpay_payments
ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS notes JSONB,
ADD COLUMN IF NOT EXISTS webhook_event_id UUID REFERENCES public.webhook_events(id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_razorpay_payments_webhook ON public.razorpay_payments(webhook_event_id) WHERE webhook_event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_razorpay_payments_refunded ON public.razorpay_payments(refunded_at) WHERE refunded_at IS NOT NULL;

COMMENT ON COLUMN public.razorpay_payments.refund_amount IS 'Amount refunded (if any)';
COMMENT ON COLUMN public.razorpay_payments.refunded_at IS 'When refund was processed';
COMMENT ON COLUMN public.razorpay_payments.notes IS 'Payment notes from Razorpay';
COMMENT ON COLUMN public.razorpay_payments.webhook_event_id IS 'Link to webhook event that created this payment';

-- ============================================================================
-- PART 4: ONE-TIME PURCHASES TABLE
-- ============================================================================

-- Drop existing table if structure has changed
DROP TABLE IF EXISTS public.user_one_time_purchases CASCADE;

-- Track one-time credit purchases with expiry
CREATE TABLE public.user_one_time_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    razorpay_payment_id VARCHAR(255) NOT NULL,
    try_ons_count INTEGER NOT NULL CHECK (try_ons_count > 0),
    try_ons_remaining INTEGER NOT NULL CHECK (try_ons_remaining >= 0),
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    purchase_date TIMESTAMPTZ DEFAULT NOW(),
    expiry_date TIMESTAMPTZ NOT NULL,
    webhook_event_id UUID REFERENCES public.webhook_events(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_one_time_purchases_user_id ON public.user_one_time_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_one_time_purchases_expiry ON public.user_one_time_purchases(expiry_date);
CREATE INDEX IF NOT EXISTS idx_one_time_purchases_payment ON public.user_one_time_purchases(razorpay_payment_id);

COMMENT ON TABLE public.user_one_time_purchases IS 'One-time credit purchases with automatic expiry';
COMMENT ON COLUMN public.user_one_time_purchases.try_ons_count IS 'Total credits purchased';
COMMENT ON COLUMN public.user_one_time_purchases.try_ons_remaining IS 'Credits remaining (updated on each use)';

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_one_time_purchases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER one_time_purchases_updated_at
    BEFORE UPDATE ON public.user_one_time_purchases
    FOR EACH ROW
    EXECUTE FUNCTION update_one_time_purchases_updated_at();

-- ============================================================================
-- PART 5: SUBSCRIPTION MANAGEMENT FUNCTIONS
-- ============================================================================

-- Drop existing functions if they exist (signature may have changed)
DROP FUNCTION IF EXISTS expire_subscriptions();
DROP FUNCTION IF EXISTS cleanup_expired_purchases();
DROP FUNCTION IF EXISTS get_active_credits(UUID);
DROP FUNCTION IF EXISTS consume_credit(UUID);

-- Function to automatically expire subscriptions
CREATE OR REPLACE FUNCTION expire_subscriptions()
RETURNS TABLE(expired_count INTEGER) AS $$
DECLARE
    affected_rows INTEGER;
BEGIN
    -- Update expired premium subscriptions to FREE
    WITH updated AS (
        UPDATE public.user_billing
        SET 
            subscription_tier = 'FREE',
            subscription_status = 'EXPIRED',
            usage_limit = 10,
            subscription_auto_renew = false,
            updated_at = NOW()
        WHERE 
            subscription_tier = 'PREMIUM'
            AND subscription_status = 'ACTIVE'
            AND subscription_end_date < NOW()
        RETURNING user_id
    )
    SELECT COUNT(*)::INTEGER INTO affected_rows FROM updated;
    
    -- Log the operation
    RAISE NOTICE '⚠️ Expired % premium subscription(s)', affected_rows;
    
    RETURN QUERY SELECT affected_rows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION expire_subscriptions() IS 'Automatically expires premium subscriptions past their end date';

-- Function to cleanup expired one-time purchases
CREATE OR REPLACE FUNCTION cleanup_expired_purchases()
RETURNS TABLE(cleaned_count INTEGER) AS $$
DECLARE
    affected_rows INTEGER;
BEGIN
    -- Delete expired one-time purchases with no remaining credits
    WITH deleted AS (
        DELETE FROM public.user_one_time_purchases
        WHERE expiry_date < NOW()
        AND try_ons_remaining = 0
        RETURNING id
    )
    SELECT COUNT(*)::INTEGER INTO affected_rows FROM deleted;
    
    -- Log the operation
    RAISE NOTICE '🧹 Cleaned up % expired purchase(s)', affected_rows;
    
    RETURN QUERY SELECT affected_rows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_expired_purchases() IS 'Removes expired one-time purchases with no remaining credits';

-- Function to get active credits for a user
CREATE OR REPLACE FUNCTION get_active_credits(p_user_id UUID)
RETURNS TABLE(
    purchase_id UUID,
    try_ons_remaining INTEGER,
    expiry_date TIMESTAMPTZ,
    days_remaining INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        id,
        try_ons_remaining,
        expiry_date,
        EXTRACT(DAY FROM (expiry_date - NOW()))::INTEGER as days_remaining
    FROM public.user_one_time_purchases
    WHERE user_id = p_user_id
    AND expiry_date > NOW()
    AND try_ons_remaining > 0
    ORDER BY expiry_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_active_credits(UUID) IS 'Get all active (non-expired) credits for a user';

-- Function to consume a credit
CREATE OR REPLACE FUNCTION consume_credit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    purchase_record RECORD;
BEGIN
    -- Find first available credit (FIFO - first to expire used first)
    SELECT id, try_ons_remaining
    INTO purchase_record
    FROM public.user_one_time_purchases
    WHERE user_id = p_user_id
    AND expiry_date > NOW()
    AND try_ons_remaining > 0
    ORDER BY expiry_date ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED; -- Prevent race conditions
    
    IF NOT FOUND THEN
        RETURN false; -- No credits available
    END IF;
    
    -- Consume one credit
    UPDATE public.user_one_time_purchases
    SET try_ons_remaining = try_ons_remaining - 1
    WHERE id = purchase_record.id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION consume_credit(UUID) IS 'Atomically consume one credit (FIFO, race-condition safe)';

-- ============================================================================
-- PART 6: WEBHOOK PROCESSING HELPERS
-- ============================================================================

-- Function to grant premium access
CREATE OR REPLACE FUNCTION grant_premium_access(
    p_user_id UUID,
    p_subscription_id VARCHAR(255),
    p_end_date TIMESTAMPTZ
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.user_billing
    SET 
        subscription_tier = 'PREMIUM',
        subscription_status = 'ACTIVE',
        subscription_start_date = NOW(),
        subscription_end_date = p_end_date,
        subscription_auto_renew = true,
        razorpay_subscription_id = p_subscription_id,
        usage_limit = 50,
        last_webhook_sync = NOW(),
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    RAISE NOTICE '✅ Premium access granted to user % until %', p_user_id, p_end_date;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION grant_premium_access(UUID, VARCHAR, TIMESTAMPTZ) IS 'Grant premium access to user (called by webhooks)';

-- Function to revoke premium access
CREATE OR REPLACE FUNCTION revoke_premium_access(
    p_user_id UUID,
    p_reason TEXT DEFAULT 'Subscription expired'
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.user_billing
    SET 
        subscription_tier = 'FREE',
        subscription_status = 'EXPIRED',
        subscription_auto_renew = false,
        usage_limit = 10,
        last_webhook_sync = NOW(),
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    RAISE NOTICE '🚫 Premium access revoked for user %: %', p_user_id, p_reason;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION revoke_premium_access(UUID, TEXT) IS 'Revoke premium access (called by webhooks)';

-- Function to add one-time purchase
CREATE OR REPLACE FUNCTION add_one_time_purchase(
    p_user_id UUID,
    p_payment_id VARCHAR(255),
    p_try_ons_count INTEGER,
    p_price DECIMAL(10, 2),
    p_expiry_days INTEGER DEFAULT 30
)
RETURNS UUID AS $$
DECLARE
    purchase_id UUID;
BEGIN
    INSERT INTO public.user_one_time_purchases (
        user_id,
        razorpay_payment_id,
        try_ons_count,
        try_ons_remaining,
        price,
        purchase_date,
        expiry_date
    ) VALUES (
        p_user_id,
        p_payment_id,
        p_try_ons_count,
        p_try_ons_count,
        p_price,
        NOW(),
        NOW() + (p_expiry_days || ' days')::INTERVAL
    )
    RETURNING id INTO purchase_id;
    
    RAISE NOTICE '✅ Granted % credits to user % (expires in % days)', p_try_ons_count, p_user_id, p_expiry_days;
    RETURN purchase_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION add_one_time_purchase(UUID, VARCHAR, INTEGER, DECIMAL, INTEGER) IS 'Add one-time credit purchase (called by webhooks)';

-- ============================================================================
-- PART 7: ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_one_time_purchases ENABLE ROW LEVEL SECURITY;

-- Webhook events policies
DROP POLICY IF EXISTS "Users can view their own webhook events" ON public.webhook_events;
CREATE POLICY "Users can view their own webhook events"
    ON public.webhook_events FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage webhook events" ON public.webhook_events;
CREATE POLICY "Service role can manage webhook events"
    ON public.webhook_events FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- One-time purchases policies
DROP POLICY IF EXISTS "Users can view their own purchases" ON public.user_one_time_purchases;
CREATE POLICY "Users can view their own purchases"
    ON public.user_one_time_purchases FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage purchases" ON public.user_one_time_purchases;
CREATE POLICY "Service role can manage purchases"
    ON public.user_one_time_purchases FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- PART 8: SCHEDULED JOBS (pg_cron)
-- ============================================================================

-- Note: Requires pg_cron extension to be enabled
-- Run these commands in Supabase Dashboard SQL Editor:

-- Enable pg_cron extension (run as superuser)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule subscription expiry check (every hour)
-- SELECT cron.schedule(
--     'expire-subscriptions-hourly',
--     '0 * * * *',
--     'SELECT expire_subscriptions();'
-- );

-- Schedule purchase cleanup (daily at 2 AM)
-- SELECT cron.schedule(
--     'cleanup-purchases-daily',
--     '0 2 * * *',
--     'SELECT cleanup_expired_purchases();'
-- );

-- To unschedule (if needed):
-- SELECT cron.unschedule('expire-subscriptions-hourly');
-- SELECT cron.unschedule('cleanup-purchases-daily');

-- ============================================================================
-- PART 9: UTILITY VIEWS
-- ============================================================================

-- View: Active subscriptions
CREATE OR REPLACE VIEW public.active_subscriptions AS
SELECT 
    user_id,
    subscription_tier,
    subscription_status,
    subscription_start_date,
    subscription_end_date,
    razorpay_subscription_id,
    EXTRACT(DAY FROM (subscription_end_date - NOW()))::INTEGER as days_remaining,
    subscription_auto_renew
FROM public.user_billing
WHERE subscription_tier = 'PREMIUM'
AND subscription_status = 'ACTIVE'
AND subscription_end_date > NOW();

COMMENT ON VIEW public.active_subscriptions IS 'All currently active premium subscriptions';

-- View: Expiring soon subscriptions (within 7 days)
CREATE OR REPLACE VIEW public.subscriptions_expiring_soon AS
SELECT 
    user_id,
    subscription_end_date,
    EXTRACT(DAY FROM (subscription_end_date - NOW()))::INTEGER as days_remaining,
    subscription_auto_renew,
    razorpay_subscription_id
FROM public.user_billing
WHERE subscription_tier = 'PREMIUM'
AND subscription_status = 'ACTIVE'
AND subscription_end_date > NOW()
AND subscription_end_date < NOW() + INTERVAL '7 days'
ORDER BY subscription_end_date ASC;

COMMENT ON VIEW public.subscriptions_expiring_soon IS 'Subscriptions expiring within 7 days';

-- View: User credit summary
CREATE OR REPLACE VIEW public.user_credit_summary AS
SELECT 
    user_id,
    COUNT(*) as total_purchases,
    SUM(try_ons_remaining) as total_credits_remaining,
    MIN(expiry_date) as next_expiry_date,
    SUM(price) as total_spent
FROM public.user_one_time_purchases
WHERE expiry_date > NOW()
AND try_ons_remaining > 0
GROUP BY user_id;

COMMENT ON VIEW public.user_credit_summary IS 'Summary of user credits across all active purchases';

-- ============================================================================
-- PART 10: GRANTS & PERMISSIONS
-- ============================================================================

-- Grant necessary permissions to authenticated users
GRANT SELECT ON public.webhook_events TO authenticated;
GRANT SELECT ON public.user_one_time_purchases TO authenticated;
GRANT SELECT ON public.active_subscriptions TO authenticated;
GRANT SELECT ON public.subscriptions_expiring_soon TO authenticated;
GRANT SELECT ON public.user_credit_summary TO authenticated;

-- Grant permissions to service role (for webhooks)
GRANT ALL ON public.webhook_events TO service_role;
GRANT ALL ON public.user_billing TO service_role;
GRANT ALL ON public.razorpay_payments TO service_role;
GRANT ALL ON public.user_one_time_purchases TO service_role;

-- Grant execute on functions to service role
GRANT EXECUTE ON FUNCTION expire_subscriptions() TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_expired_purchases() TO service_role;
GRANT EXECUTE ON FUNCTION grant_premium_access(UUID, VARCHAR, TIMESTAMPTZ) TO service_role;
GRANT EXECUTE ON FUNCTION revoke_premium_access(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION add_one_time_purchase(UUID, VARCHAR, INTEGER, DECIMAL, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION get_active_credits(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION consume_credit(UUID) TO authenticated;

-- ============================================================================
-- PART 11: VERIFICATION QUERIES
-- ============================================================================

-- Run these after migration to verify:

-- Check tables exist
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('webhook_events', 'user_one_time_purchases');

-- Check functions exist
-- SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name IN ('expire_subscriptions', 'cleanup_expired_purchases', 'grant_premium_access', 'revoke_premium_access');

-- Check indexes
-- SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND tablename IN ('webhook_events', 'user_one_time_purchases');

-- Check RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('webhook_events', 'user_one_time_purchases');

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Summary:
-- ✅ Webhook events tracking with full audit trail
-- ✅ Enhanced user billing with Razorpay fields
-- ✅ One-time purchases with automatic expiry
-- ✅ Race-condition safe credit consumption
-- ✅ Automatic subscription expiry handling
-- ✅ Helper functions for webhook processing
-- ✅ Row Level Security policies
-- ✅ Utility views for monitoring
-- ✅ Comprehensive indexing for performance
-- ✅ Ready for pg_cron scheduled jobs

-- Migration completed successfully
DO $$
BEGIN
    RAISE NOTICE '✅ Migration 005_razorpay_webhook_integration.sql completed successfully!';
END $$;

