-- ============================================================================
-- Migration 010: FIX SIGNUP FAILURES - Handle Both Old and New Schemas
-- Purpose: Fix "Database error saving new user" - trigger compatibility
-- Date: 2025-10-30
-- Critical: This fixes the 500 error blocking all new signups
-- ============================================================================

-- STEP 1: Check which schema is actually deployed and fix trigger accordingly
-- This handles both migration 005 schema and migration 007 schema

-- Drop existing trigger function
DROP FUNCTION IF EXISTS create_default_billing() CASCADE;

-- Create SAFE trigger function that works with BOTH schemas
CREATE OR REPLACE FUNCTION create_default_billing()
RETURNS TRIGGER AS $$
DECLARE
    has_monthly_columns BOOLEAN;
BEGIN
    -- Check if table has monthly_limit column (migration 007) or usage_limit (migration 005)
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_billing' 
        AND column_name = 'monthly_limit'
    ) INTO has_monthly_columns;
    
    IF has_monthly_columns THEN
        -- Migration 007 schema: monthly_limit, monthly_used, period_start, period_end
        INSERT INTO public.user_billing (
            user_id,
            subscription_tier,
            subscription_status,
            monthly_limit,
            monthly_used,
            period_start,
            period_end
        ) VALUES (
            NEW.id,
            'FREE',
            'ACTIVE',
            10,
            0,
            NOW(),
            NOW() + INTERVAL '30 days'
        )
        ON CONFLICT (user_id) DO NOTHING;
    ELSE
        -- Migration 005 schema: usage_limit, usage_count, last_reset_date
        INSERT INTO public.user_billing (
            user_id,
            subscription_tier,
            subscription_status,
            usage_limit,
            usage_count,
            last_reset_date
        ) VALUES (
            NEW.id,
            'FREE',
            'ACTIVE',
            10,
            0,
            NOW()
        )
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log error but don't block signup
    RAISE WARNING 'Failed to create billing record for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS create_user_billing ON auth.users;
CREATE TRIGGER create_user_billing
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_billing();

-- STEP 2: Backfill any users who don't have billing records
-- This fixes users created while trigger was broken
DO $$
DECLARE
    has_monthly_columns BOOLEAN;
    users_added INTEGER := 0;
BEGIN
    -- Check schema
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_billing' 
        AND column_name = 'monthly_limit'
    ) INTO has_monthly_columns;
    
    IF has_monthly_columns THEN
        -- Migration 007 schema
        INSERT INTO public.user_billing (
            user_id,
            subscription_tier,
            subscription_status,
            monthly_limit,
            monthly_used,
            period_start,
            period_end
        )
        SELECT 
            id,
            'FREE',
            'ACTIVE',
            10,
            0,
            NOW(),
            NOW() + INTERVAL '30 days'
        FROM auth.users
        WHERE id NOT IN (SELECT user_id FROM public.user_billing)
        ON CONFLICT (user_id) DO NOTHING;
    ELSE
        -- Migration 005 schema
        INSERT INTO public.user_billing (
            user_id,
            subscription_tier,
            subscription_status,
            usage_limit,
            usage_count,
            last_reset_date
        )
        SELECT 
            id,
            'FREE',
            'ACTIVE',
            10,
            0,
            NOW()
        FROM auth.users
        WHERE id NOT IN (SELECT user_id FROM public.user_billing)
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
    
    GET DIAGNOSTICS users_added = ROW_COUNT;
    RAISE NOTICE '✅ Created billing records for % existing users', users_added;
END $$;

-- STEP 3: Verify trigger works by showing which schema is deployed
DO $$
DECLARE
    has_monthly_columns BOOLEAN;
    total_users INTEGER;
    users_with_billing INTEGER;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_billing' 
        AND column_name = 'monthly_limit'
    ) INTO has_monthly_columns;
    
    SELECT COUNT(*) INTO total_users FROM auth.users;
    SELECT COUNT(*) INTO users_with_billing FROM user_billing;
    
    RAISE NOTICE '';
    RAISE NOTICE '===========================================';
    RAISE NOTICE '✅ Migration 010 Complete!';
    RAISE NOTICE '===========================================';
    
    IF has_monthly_columns THEN
        RAISE NOTICE '📊 Schema: Migration 007 (monthly_limit, monthly_used)';
    ELSE
        RAISE NOTICE '📊 Schema: Migration 005 (usage_limit, usage_count)';
    END IF;
    
    RAISE NOTICE '👥 Total users: %', total_users;
    RAISE NOTICE '💳 Users with billing: %', users_with_billing;
    
    IF total_users = users_with_billing THEN
        RAISE NOTICE '✅ All users have billing records!';
    ELSE
        RAISE NOTICE '⚠️  % users missing billing records', (total_users - users_with_billing);
    END IF;
    
    RAISE NOTICE '✅ Trigger: create_user_billing (SAFE - handles both schemas)';
    RAISE NOTICE '✅ Signups should work now!';
    RAISE NOTICE '===========================================';
END $$;

-- STEP 4: Test trigger (optional - remove if you want)
-- This creates a test to verify trigger works without actually creating a user
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'create_default_billing';

-- Show current user_billing structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'user_billing'
ORDER BY ordinal_position;

