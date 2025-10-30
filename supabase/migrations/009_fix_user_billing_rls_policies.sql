-- ============================================================================
-- Migration: Fix RLS policies and ensure all users have billing records
-- Purpose: Fix upsert conflicts and ensure database consistency
-- Date: 2025-10-30
-- Issue: 409 Conflict - upsert failing due to missing initial records
-- ============================================================================

-- PART 1: Create billing records for ALL existing users who don't have one
-- This ensures no 409 conflicts when users try to buy credits
INSERT INTO public.user_billing (
    user_id,
    subscription_tier,
    subscription_status,
    monthly_limit,
    monthly_used,
    period_start,
    period_end,
    created_at,
    updated_at
)
SELECT 
    id,
    'FREE',
    'ACTIVE',
    10,
    0,
    NOW(),
    NOW() + INTERVAL '30 days',
    NOW(),
    NOW()
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_billing)
ON CONFLICT (user_id) DO NOTHING;

-- Get count of records created
DO $$
DECLARE
    records_created INTEGER;
BEGIN
    SELECT COUNT(*) INTO records_created
    FROM auth.users
    WHERE id IN (SELECT user_id FROM public.user_billing);
    
    RAISE NOTICE '✅ Ensured billing records for % users', records_created;
END $$;

-- PART 2: Fix RLS policies to allow INSERT and UPDATE
DROP POLICY IF EXISTS "Users can update own billing" ON public.user_billing;
DROP POLICY IF EXISTS "Users can insert own billing" ON public.user_billing;

-- Create comprehensive policies for authenticated users
CREATE POLICY "Users can insert own billing"
    ON public.user_billing FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own billing"
    ON public.user_billing FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- PART 3: Verify trigger exists for auto-creating records on signup
-- This prevents future conflicts for new users
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
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate trigger to ensure it's active
DROP TRIGGER IF EXISTS create_user_billing ON auth.users;
CREATE TRIGGER create_user_billing
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_billing();

-- Verify setup
DO $$
BEGIN
    RAISE NOTICE '✅ RLS policies updated for user_billing table';
    RAISE NOTICE '✅ Users can now INSERT and UPDATE their own billing records';
    RAISE NOTICE '✅ Trigger active for auto-creating billing records';
    RAISE NOTICE '✅ Service role retains full access';
    RAISE NOTICE '';
    RAISE NOTICE '🔍 Verifying policies:';
END $$;

-- Display active policies for verification
SELECT 
    policyname,
    cmd AS operation,
    CASE 
        WHEN qual IS NOT NULL THEN 'Has USING clause'
        ELSE 'No USING clause'
    END AS using_check,
    CASE 
        WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
        ELSE 'No WITH CHECK clause'
    END AS with_check_status
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'user_billing'
ORDER BY policyname;
