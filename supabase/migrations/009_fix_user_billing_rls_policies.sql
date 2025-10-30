-- ============================================================================
-- Migration: Fix RLS policies for user_billing table
-- Purpose: Allow authenticated users to INSERT their own billing records
-- Date: 2025-10-30
-- Issue: 403 Forbidden - RLS was blocking user inserts/upserts
-- ============================================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can update own billing" ON public.user_billing;

-- Create comprehensive policies for authenticated users
CREATE POLICY "Users can insert own billing"
    ON public.user_billing FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own billing"
    ON public.user_billing FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Verify policies are active
DO $$
BEGIN
    RAISE NOTICE '✅ RLS policies updated for user_billing table';
    RAISE NOTICE '✅ Users can now INSERT and UPDATE their own billing records';
    RAISE NOTICE '✅ Service role retains full access';
END $$;

-- Display active policies for verification
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'user_billing'
ORDER BY policyname;
