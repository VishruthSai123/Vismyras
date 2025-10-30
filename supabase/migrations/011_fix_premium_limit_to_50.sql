-- ============================================================================
-- Migration 011: Fix Premium Try-On Limit from 1000/100 to 50
-- Purpose: Correct premium subscription limit to 50 try-ons per month
-- Date: 2025-10-30
-- Note: Handles both migration 005 schema (usage_limit) and 007 schema (monthly_limit)
-- ============================================================================

-- STEP 1: Detect which schema is deployed and update function accordingly
DO $$
DECLARE
    has_monthly_limit BOOLEAN;
BEGIN
    -- Check if table has monthly_limit column (migration 007) or usage_limit (migration 005)
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_billing' 
        AND column_name = 'monthly_limit'
    ) INTO has_monthly_limit;
    
    IF has_monthly_limit THEN
        -- Migration 007 schema: Use monthly_limit
        RAISE NOTICE '📊 Detected Schema: Migration 007 (monthly_limit column)';
        
        -- Update the grant_premium_access function for migration 007 schema
        -- Note: This function may not exist in migration 007, so we create it
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
                monthly_limit = 50,
                last_webhook_sync = NOW(),
                updated_at = NOW()
            WHERE user_id = p_user_id;
            
            RAISE NOTICE '✅ Premium access granted to user % until % (50 try-ons/month)', p_user_id, p_end_date;
            RETURN FOUND;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
        
        RAISE NOTICE '✅ Updated grant_premium_access function for monthly_limit schema';
        
    ELSE
        -- Migration 005 schema: Use usage_limit
        RAISE NOTICE '📊 Detected Schema: Migration 005 (usage_limit column)';
        
        -- Update the grant_premium_access function for migration 005 schema
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
            
            RAISE NOTICE '✅ Premium access granted to user % until % (50 try-ons/month)', p_user_id, p_end_date;
            RETURN FOUND;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
        
        RAISE NOTICE '✅ Updated grant_premium_access function for usage_limit schema';
    END IF;
END $$;

COMMENT ON FUNCTION grant_premium_access(UUID, VARCHAR, TIMESTAMPTZ) IS 'Grant premium access to user with 50 try-ons per month (called by webhooks)';

-- STEP 2: Update any existing premium users who have wrong limits
DO $$
DECLARE
    updated_users INTEGER := 0;
    has_monthly_limit BOOLEAN;
BEGIN
    -- Check which schema is deployed
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_billing' 
        AND column_name = 'monthly_limit'
    ) INTO has_monthly_limit;
    
    IF has_monthly_limit THEN
        -- Migration 007 schema: Update monthly_limit
        UPDATE public.user_billing
        SET 
            monthly_limit = 50,
            updated_at = NOW()
        WHERE subscription_tier = 'PREMIUM'
        AND monthly_limit != 50;
        
    ELSE
        -- Migration 005 schema: Update usage_limit
        UPDATE public.user_billing
        SET 
            usage_limit = 50,
            updated_at = NOW()
        WHERE subscription_tier = 'PREMIUM'
        AND usage_limit != 50;
    END IF;
    
    GET DIAGNOSTICS updated_users = ROW_COUNT;
    
    IF updated_users > 0 THEN
        RAISE NOTICE '✅ Updated % premium users to correct limit of 50 try-ons/month', updated_users;
    ELSE
        RAISE NOTICE '✅ No premium users needed limit correction';
    END IF;
END $$;

-- STEP 3: Update comment to reflect correct limit (handles both schemas)
DO $$
DECLARE
    has_monthly_limit BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_billing' 
        AND column_name = 'monthly_limit'
    ) INTO has_monthly_limit;
    
    IF has_monthly_limit THEN
        COMMENT ON COLUMN public.user_billing.monthly_limit IS 'Maximum try-ons allowed (10 for FREE, 50 for PREMIUM)';
    ELSE
        COMMENT ON COLUMN public.user_billing.usage_limit IS 'Maximum try-ons allowed (10 for FREE, 50 for PREMIUM)';
    END IF;
END $$;

-- STEP 4: Verification
DO $$
DECLARE
    free_users INTEGER;
    premium_users INTEGER;
    wrong_limit_users INTEGER;
    has_monthly_limit BOOLEAN;
BEGIN
    -- Check which schema is deployed
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_billing' 
        AND column_name = 'monthly_limit'
    ) INTO has_monthly_limit;
    
    IF has_monthly_limit THEN
        -- Migration 007 schema
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
    ELSE
        -- Migration 005 schema
        SELECT COUNT(*) INTO free_users 
        FROM user_billing 
        WHERE subscription_tier = 'FREE' AND usage_limit = 10;
        
        SELECT COUNT(*) INTO premium_users 
        FROM user_billing 
        WHERE subscription_tier = 'PREMIUM' AND usage_limit = 50;
        
        SELECT COUNT(*) INTO wrong_limit_users 
        FROM user_billing 
        WHERE (subscription_tier = 'FREE' AND usage_limit != 10) 
           OR (subscription_tier = 'PREMIUM' AND usage_limit != 50);
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '===========================================';
    RAISE NOTICE '✅ Migration 011 Complete!';
    RAISE NOTICE '===========================================';
    
    IF has_monthly_limit THEN
        RAISE NOTICE '📊 Schema: Migration 007 (monthly_limit column)';
    ELSE
        RAISE NOTICE '📊 Schema: Migration 005 (usage_limit column)';
    END IF;
    
    RAISE NOTICE '👥 FREE tier users with correct limit (10): %', free_users;
    RAISE NOTICE '⭐ PREMIUM tier users with correct limit (50): %', premium_users;
    
    IF wrong_limit_users > 0 THEN
        RAISE NOTICE '⚠️  Users with incorrect limits: %', wrong_limit_users;
    ELSE
        RAISE NOTICE '✅ All users have correct limits!';
    END IF;
    
    RAISE NOTICE '===========================================';
END $$;
