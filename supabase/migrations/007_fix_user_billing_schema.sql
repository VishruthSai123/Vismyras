-- ============================================================================
-- Migration: Fix user_billing schema to match webhook implementation
-- Purpose: Align database schema with current webhook code and fix localStorage issue
-- Date: 2025-10-30
-- 
-- This migration updates the user_billing table structure to match the
-- webhook implementation (monthly_limit, monthly_used, period_start, period_end)
-- and ensures all billing data is tied to user accounts in the database.
-- ============================================================================

-- Drop the old table if it exists (migration 005 had different schema)
DROP TABLE IF EXISTS public.user_billing CASCADE;

-- Create user_billing table with correct schema matching webhook code
CREATE TABLE public.user_billing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    
    -- Subscription fields (matching webhook updates)
    subscription_tier VARCHAR(20) DEFAULT 'FREE' CHECK (subscription_tier IN ('FREE', 'PREMIUM')),
    subscription_status VARCHAR(20) DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'expired', 'paused')),
    
    -- Usage tracking (matching webhook: monthly_limit, monthly_used)
    monthly_limit INTEGER DEFAULT 10 CHECK (monthly_limit >= 0),
    monthly_used INTEGER DEFAULT 0 CHECK (monthly_used >= 0),
    
    -- Billing period (matching webhook: period_start, period_end)
    period_start TIMESTAMPTZ DEFAULT NOW(),
    period_end TIMESTAMPTZ,
    
    -- Razorpay integration
    razorpay_subscription_id VARCHAR(255),
    razorpay_customer_id VARCHAR(255),
    subscription_auto_renew BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_billing_user_id ON public.user_billing(user_id);
CREATE INDEX IF NOT EXISTS idx_user_billing_subscription_tier ON public.user_billing(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_user_billing_razorpay_sub ON public.user_billing(razorpay_subscription_id) WHERE razorpay_subscription_id IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE public.user_billing ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own billing
DROP POLICY IF EXISTS "Users can view own billing" ON public.user_billing;
CREATE POLICY "Users can view own billing"
    ON public.user_billing FOR SELECT
    USING (auth.uid() = user_id);

-- RLS Policy: Users can update their own billing
DROP POLICY IF EXISTS "Users can update own billing" ON public.user_billing;
CREATE POLICY "Users can update own billing"
    ON public.user_billing FOR UPDATE
    USING (auth.uid() = user_id);

-- RLS Policy: Service role can manage all billing (for webhooks)
DROP POLICY IF EXISTS "Service role can manage billing" ON public.user_billing;
CREATE POLICY "Service role can manage billing"
    ON public.user_billing FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- Auto-update updated_at timestamp
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
        monthly_limit,
        monthly_used,
        period_start,
        period_end,
        subscription_auto_renew
    ) VALUES (
        NEW.id,
        'FREE',
        'active',
        10, -- FREE tier: 10 try-ons per month
        0,
        NOW(),
        NOW() + INTERVAL '1 month',
        false
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

-- Helper function: Check if usage should reset (new month)
CREATE OR REPLACE FUNCTION should_reset_monthly_usage(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    last_period_end TIMESTAMPTZ;
BEGIN
    SELECT period_end INTO last_period_end
    FROM public.user_billing
    WHERE user_id = p_user_id;
    
    -- Reset if period has ended
    RETURN (last_period_end IS NOT NULL AND NOW() > last_period_end);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Reset monthly usage
CREATE OR REPLACE FUNCTION reset_monthly_usage(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.user_billing
    SET 
        monthly_used = 0,
        period_start = NOW(),
        period_end = NOW() + INTERVAL '1 month',
        updated_at = NOW()
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Increment usage count (atomic operation)
CREATE OR REPLACE FUNCTION increment_usage(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_used INTEGER;
    current_limit INTEGER;
BEGIN
    -- Check if usage should reset first
    IF should_reset_monthly_usage(p_user_id) THEN
        PERFORM reset_monthly_usage(p_user_id);
    END IF;
    
    -- Get current usage
    SELECT monthly_used, monthly_limit 
    INTO current_used, current_limit
    FROM public.user_billing
    WHERE user_id = p_user_id
    FOR UPDATE; -- Lock row to prevent race conditions
    
    -- Check if user has reached limit
    IF current_used >= current_limit THEN
        RETURN false;
    END IF;
    
    -- Increment usage
    UPDATE public.user_billing
    SET 
        monthly_used = monthly_used + 1,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Table for one-time credit purchases (separate from subscriptions)
CREATE TABLE IF NOT EXISTS public.user_one_time_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    razorpay_payment_id VARCHAR(255) NOT NULL,
    credits_purchased INTEGER NOT NULL CHECK (credits_purchased > 0),
    credits_remaining INTEGER NOT NULL CHECK (credits_remaining >= 0),
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    purchase_date TIMESTAMPTZ DEFAULT NOW(),
    expiry_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for one-time purchases
CREATE INDEX IF NOT EXISTS idx_one_time_purchases_user_id ON public.user_one_time_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_one_time_purchases_expiry ON public.user_one_time_purchases(expiry_date);
CREATE INDEX IF NOT EXISTS idx_one_time_purchases_payment ON public.user_one_time_purchases(razorpay_payment_id);

-- Enable RLS on one-time purchases
ALTER TABLE public.user_one_time_purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own purchases
DROP POLICY IF EXISTS "Users can view own purchases" ON public.user_one_time_purchases;
CREATE POLICY "Users can view own purchases"
    ON public.user_one_time_purchases FOR SELECT
    USING (auth.uid() = user_id);

-- RLS Policy: Service role can manage purchases (for webhooks)
DROP POLICY IF EXISTS "Service role can manage purchases" ON public.user_one_time_purchases;
CREATE POLICY "Service role can manage purchases"
    ON public.user_one_time_purchases FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- Auto-update updated_at for one-time purchases
CREATE OR REPLACE FUNCTION update_one_time_purchases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS one_time_purchases_updated_at ON public.user_one_time_purchases;
CREATE TRIGGER one_time_purchases_updated_at
    BEFORE UPDATE ON public.user_one_time_purchases
    FOR EACH ROW
    EXECUTE FUNCTION update_one_time_purchases_updated_at();

-- Helper function: Add one-time credits (called by webhooks)
CREATE OR REPLACE FUNCTION add_one_time_credits(
    p_user_id UUID,
    p_credits INTEGER,
    p_payment_id VARCHAR(255) DEFAULT NULL,
    p_price DECIMAL(10, 2) DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
    purchase_id UUID;
BEGIN
    -- Insert into one_time_purchases table
    INSERT INTO public.user_one_time_purchases (
        user_id,
        razorpay_payment_id,
        credits_purchased,
        credits_remaining,
        price,
        purchase_date,
        expiry_date
    ) VALUES (
        p_user_id,
        COALESCE(p_payment_id, 'manual_' || extract(epoch from now())::text),
        p_credits,
        p_credits,
        p_price,
        NOW(),
        NOW() + INTERVAL '30 days' -- Credits expire in 30 days
    )
    RETURNING id INTO purchase_id;
    
    RAISE NOTICE 'Added % one-time credits to user % (expires in 30 days)', p_credits, p_user_id;
    RETURN purchase_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Get total available one-time credits for a user
CREATE OR REPLACE FUNCTION get_available_one_time_credits(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    total_credits INTEGER;
BEGIN
    SELECT COALESCE(SUM(credits_remaining), 0)
    INTO total_credits
    FROM public.user_one_time_purchases
    WHERE user_id = p_user_id
    AND expiry_date > NOW()
    AND credits_remaining > 0;
    
    RETURN total_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Consume one-time credit (FIFO - first to expire used first)
CREATE OR REPLACE FUNCTION consume_one_time_credit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    purchase_record RECORD;
BEGIN
    -- Find first available credit (FIFO - first to expire used first)
    SELECT id, credits_remaining
    INTO purchase_record
    FROM public.user_one_time_purchases
    WHERE user_id = p_user_id
    AND expiry_date > NOW()
    AND credits_remaining > 0
    ORDER BY expiry_date ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED; -- Prevent race conditions
    
    IF NOT FOUND THEN
        RETURN false; -- No credits available
    END IF;
    
    -- Consume one credit
    UPDATE public.user_one_time_purchases
    SET credits_remaining = credits_remaining - 1
    WHERE id = purchase_record.id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update increment_usage to use one-time credits if monthly limit reached
CREATE OR REPLACE FUNCTION increment_usage(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_used INTEGER;
    current_limit INTEGER;
    one_time_available BOOLEAN;
BEGIN
    -- Check if usage should reset first
    IF should_reset_monthly_usage(p_user_id) THEN
        PERFORM reset_monthly_usage(p_user_id);
    END IF;
    
    -- Get current usage
    SELECT monthly_used, monthly_limit 
    INTO current_used, current_limit
    FROM public.user_billing
    WHERE user_id = p_user_id
    FOR UPDATE; -- Lock row to prevent race conditions
    
    -- Try to use monthly subscription credits first
    IF current_used < current_limit THEN
        UPDATE public.user_billing
        SET 
            monthly_used = monthly_used + 1,
            updated_at = NOW()
        WHERE user_id = p_user_id;
        
        RETURN true;
    END IF;
    
    -- Monthly limit reached - try to use one-time credits
    one_time_available := consume_one_time_credit(p_user_id);
    
    RETURN one_time_available;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE public.user_billing IS 'User billing and subscription management - all data tied to user account';
COMMENT ON COLUMN public.user_billing.subscription_tier IS 'FREE or PREMIUM';
COMMENT ON COLUMN public.user_billing.subscription_status IS 'active, cancelled, expired, or paused';
COMMENT ON COLUMN public.user_billing.monthly_limit IS 'Maximum try-ons per month (10 for FREE, 50 for PREMIUM)';
COMMENT ON COLUMN public.user_billing.monthly_used IS 'Try-ons used in current billing period';
COMMENT ON COLUMN public.user_billing.period_start IS 'Start of current billing period';
COMMENT ON COLUMN public.user_billing.period_end IS 'End of current billing period (resets monthly_used when reached)';
COMMENT ON COLUMN public.user_billing.razorpay_subscription_id IS 'Razorpay subscription ID for recurring payments';

-- Grant permissions
GRANT SELECT ON public.user_billing TO authenticated;
GRANT ALL ON public.user_billing TO service_role;
GRANT SELECT ON public.user_one_time_purchases TO authenticated;
GRANT ALL ON public.user_one_time_purchases TO service_role;

-- Grant execute on helper functions
GRANT EXECUTE ON FUNCTION should_reset_monthly_usage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reset_monthly_usage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_usage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION add_one_time_credits(UUID, INTEGER, VARCHAR, DECIMAL) TO service_role;
GRANT EXECUTE ON FUNCTION get_available_one_time_credits(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION consume_one_time_credit(UUID) TO authenticated;

-- ============================================================================
-- IMPORTANT: Backfill existing users
-- Run this after migration to create billing records for existing users
-- ============================================================================

-- Backfill billing records for existing users who don't have one
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN 
        SELECT id FROM auth.users 
        WHERE id NOT IN (SELECT user_id FROM public.user_billing)
    LOOP
        INSERT INTO public.user_billing (
            user_id,
            subscription_tier,
            subscription_status,
            monthly_limit,
            monthly_used,
            period_start,
            period_end,
            subscription_auto_renew
        ) VALUES (
            user_record.id,
            'FREE',
            'active',
            10,
            0,
            NOW(),
            NOW() + INTERVAL '1 month',
            false
        );
        
        RAISE NOTICE 'Created billing record for existing user: %', user_record.id;
    END LOOP;
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Migration 007_fix_user_billing_schema.sql completed successfully!';
    RAISE NOTICE '✅ Schema now matches webhook implementation';
    RAISE NOTICE '✅ All billing data is now tied to user accounts in database';
    RAISE NOTICE '✅ localStorage issue fixed - data persists across sessions';
END $$;
