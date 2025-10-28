-- ============================================================================
-- Migration: User Billing (FIXED)
-- Description: Store user billing and subscription data with error handling
-- Date: 2025-10-28
-- Version: 2.0 (Complete Rewrite)
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- STEP 1: Drop existing objects (clean slate)
-- ============================================================================

-- Drop triggers first
DROP TRIGGER IF EXISTS create_user_billing ON auth.users;
DROP TRIGGER IF EXISTS update_user_billing_timestamp ON user_billing;

-- Drop functions
DROP FUNCTION IF EXISTS create_default_billing() CASCADE;
DROP FUNCTION IF EXISTS update_user_billing_updated_at() CASCADE;

-- Drop policies
DROP POLICY IF EXISTS "Users can view own billing" ON user_billing;
DROP POLICY IF EXISTS "Users can insert own billing" ON user_billing;
DROP POLICY IF EXISTS "Users can update own billing" ON user_billing;

-- Drop table
DROP TABLE IF EXISTS user_billing CASCADE;

-- ============================================================================
-- STEP 2: Create user_billing table
-- ============================================================================

CREATE TABLE user_billing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Billing data as JSONB for flexibility
    billing_data JSONB NOT NULL DEFAULT '{
        "subscription": {
            "tier": "FREE",
            "status": "active",
            "tryOnsRemaining": 10,
            "tryOnsTotal": 10,
            "resetDate": null,
            "razorpaySubscriptionId": null
        },
        "credits": {
            "balance": 0,
            "totalPurchased": 0
        },
        "usage": {
            "thisMonth": 0,
            "allTime": 0,
            "lastUsed": null
        }
    }'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Ensure one billing record per user
    CONSTRAINT unique_user_billing UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX idx_user_billing_user_id ON user_billing(user_id);
CREATE INDEX idx_user_billing_created_at ON user_billing(created_at DESC);

-- ============================================================================
-- STEP 3: Enable Row Level Security
-- ============================================================================

ALTER TABLE user_billing ENABLE ROW LEVEL SECURITY;

-- Users can only view their own billing data
CREATE POLICY "Users can view own billing"
    ON user_billing
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can only insert their own billing record
CREATE POLICY "Users can insert own billing"
    ON user_billing
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can only update their own billing data
CREATE POLICY "Users can update own billing"
    ON user_billing
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Force RLS for service role too
ALTER TABLE user_billing FORCE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 4: Create trigger function with error handling
-- ============================================================================

CREATE OR REPLACE FUNCTION create_default_billing()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_reset_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Calculate reset date (1 month from now)
    v_reset_date := NOW() + INTERVAL '1 month';
    
    -- Insert billing record with error handling
    BEGIN
        INSERT INTO public.user_billing (
            user_id,
            billing_data,
            created_at,
            updated_at
        ) VALUES (
            NEW.id,
            jsonb_build_object(
                'subscription', jsonb_build_object(
                    'tier', 'FREE',
                    'status', 'active',
                    'tryOnsRemaining', 10,
                    'tryOnsTotal', 10,
                    'resetDate', v_reset_date::text,
                    'razorpaySubscriptionId', NULL
                ),
                'credits', jsonb_build_object(
                    'balance', 0,
                    'totalPurchased', 0
                ),
                'usage', jsonb_build_object(
                    'thisMonth', 0,
                    'allTime', 0,
                    'lastUsed', NULL
                )
            ),
            NOW(),
            NOW()
        )
        ON CONFLICT (user_id) DO NOTHING;
        
    EXCEPTION WHEN OTHERS THEN
        -- Log error but don't fail the signup
        RAISE WARNING 'Failed to create billing for user %: %', NEW.id, SQLERRM;
    END;
    
    RETURN NEW;
END;
$$;

-- ============================================================================
-- STEP 5: Create updated_at trigger function
-- ============================================================================

CREATE OR REPLACE FUNCTION update_user_billing_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

-- ============================================================================
-- STEP 6: Create triggers
-- ============================================================================

-- Trigger to create billing record after user signup
CREATE TRIGGER create_user_billing
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_billing();

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_user_billing_timestamp
    BEFORE UPDATE ON user_billing
    FOR EACH ROW
    EXECUTE FUNCTION update_user_billing_updated_at();

-- ============================================================================
-- STEP 7: Helper functions for billing operations
-- ============================================================================

-- Function to get user's current subscription tier
CREATE OR REPLACE FUNCTION get_user_subscription_tier(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_tier TEXT;
BEGIN
    SELECT billing_data->'subscription'->>'tier'
    INTO v_tier
    FROM user_billing
    WHERE user_id = p_user_id;
    
    RETURN COALESCE(v_tier, 'FREE');
END;
$$;

-- Function to update try-ons remaining
CREATE OR REPLACE FUNCTION update_tryons_remaining(
    p_user_id UUID,
    p_amount INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE user_billing
    SET billing_data = jsonb_set(
        billing_data,
        '{subscription,tryOnsRemaining}',
        to_jsonb(GREATEST(0, (billing_data->'subscription'->>'tryOnsRemaining')::integer + p_amount))
    ),
    updated_at = NOW()
    WHERE user_id = p_user_id;
END;
$$;

-- ============================================================================
-- STEP 8: Add comments for documentation
-- ============================================================================

COMMENT ON TABLE user_billing IS 'User billing and subscription data';
COMMENT ON COLUMN user_billing.user_id IS 'References auth.users(id)';
COMMENT ON COLUMN user_billing.billing_data IS 'JSONB containing subscription, credits, and usage data';

-- ============================================================================
-- VERIFICATION QUERIES (Run these to verify)
-- ============================================================================

-- Check if table exists
-- SELECT * FROM user_billing LIMIT 1;

-- Check if triggers exist
-- SELECT tgname FROM pg_trigger WHERE tgrelid = 'user_billing'::regclass;

-- Check if RLS is enabled
-- SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'user_billing';

-- Test helper functions
-- SELECT get_user_subscription_tier('some-uuid');

-- ============================================================================
-- SUCCESS!
-- ============================================================================
-- This migration should now work without errors
-- Test by creating a new user account
-- ============================================================================
