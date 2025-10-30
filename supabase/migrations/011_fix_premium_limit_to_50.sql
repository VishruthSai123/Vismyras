-- ============================================================================
-- Migration 011: Fix Premium Try-On Limit from 1000/100 to 50
-- Purpose: Correct premium subscription limit to 50 try-ons per month
-- Date: 2025-10-30
-- Note: Since you're using migration 007 schema (monthly_limit), we update that
-- ============================================================================

-- STEP 1: Update the grant_premium_access function to use monthly_limit = 50
-- This function is used by webhooks when subscriptions are activated
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
        monthly_limit = 50,  -- Changed from 1000 to 50
        last_webhook_sync = NOW(),
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION grant_premium_access(UUID, VARCHAR, TIMESTAMPTZ) IS 'Grant premium access to user with 50 try-ons per month (called by webhooks)';

-- STEP 2: Update any existing premium users who have wrong limits (100 or 1000)
DO $$
DECLARE
    updated_users INTEGER := 0;
BEGIN
    -- Update premium users with wrong monthly_limit
    UPDATE public.user_billing
    SET 
        monthly_limit = 50,
        updated_at = NOW()
    WHERE subscription_tier = 'PREMIUM'
    AND monthly_limit != 50;
END $$;

-- STEP 3: Update comment to reflect correct limit
COMMENT ON COLUMN public.user_billing.monthly_limit IS 'Maximum try-ons allowed (10 for FREE, 50 for PREMIUM)';

-- STEP 4: Verification
DO $$
DECLARE
    free_users INTEGER;
    premium_users INTEGER;
    wrong_limit_users INTEGER;
BEGIN
    -- Count users with correct limits
    SELECT COUNT(*) INTO free_users 
    FROM user_billing 
    WHERE subscription_tier = 'FREE' AND monthly_limit = 10;
    
    SELECT COUNT(*) INTO premium_users 
    FROM user_billing 
    WHERE subscription_tier = 'PREMIUM' AND monthly_limit = 50;
    
    SELECT COUNT(*) INTO wrong_limit_users 
    FROM user_billing 
    WHERE (subscription_tier = 'FREE' AND monthly_limit != 10) 
       OR (subscription_tier = 'PREMIUM' AND monthly_limit != 50);
END $$;
