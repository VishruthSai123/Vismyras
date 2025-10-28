-- Migration: User Billing Table
-- Description: Store user billing and subscription data
-- Date: 2025-10-28

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: user_billing
-- Stores user subscription and usage tracking data
CREATE TABLE IF NOT EXISTS user_billing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Billing data (JSONB for flexibility)
    billing_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- Example structure:
    -- {
    --   "subscription": {
    --     "tier": "FREE",
    --     "status": "active",
    --     "tryOnsRemaining": 10,
    --     "tryOnsTotal": 10,
    --     "resetDate": "2025-11-01T00:00:00Z",
    --     "razorpaySubscriptionId": null
    --   },
    --   "credits": {
    --     "balance": 0,
    --     "totalPurchased": 0
    --   },
    --   "usage": {
    --     "thisMonth": 0,
    --     "allTime": 0,
    --     "lastUsed": null
    --   }
    -- }
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one billing record per user
    UNIQUE(user_id)
);

-- Create index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_user_billing_user_id ON user_billing(user_id);

-- Function: Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_user_billing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS update_user_billing_timestamp ON user_billing;
CREATE TRIGGER update_user_billing_timestamp
    BEFORE UPDATE ON user_billing
    FOR EACH ROW
    EXECUTE FUNCTION update_user_billing_updated_at();

-- Row Level Security (RLS)
ALTER TABLE user_billing ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own billing data
DROP POLICY IF EXISTS "Users can view own billing" ON user_billing;
CREATE POLICY "Users can view own billing"
    ON user_billing FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own billing" ON user_billing;
CREATE POLICY "Users can insert own billing"
    ON user_billing FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own billing" ON user_billing;
CREATE POLICY "Users can update own billing"
    ON user_billing FOR UPDATE
    USING (auth.uid() = user_id);

-- Function: Create default billing record for new users
CREATE OR REPLACE FUNCTION create_default_billing()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_billing (user_id, billing_data)
    VALUES (
        NEW.id,
        jsonb_build_object(
            'subscription', jsonb_build_object(
                'tier', 'FREE',
                'status', 'active',
                'tryOnsRemaining', 10,
                'tryOnsTotal', 10,
                'resetDate', (NOW() + INTERVAL '1 month')::text,
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
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-create billing record when user signs up
DROP TRIGGER IF EXISTS create_user_billing ON auth.users;
CREATE TRIGGER create_user_billing
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_billing();

-- Comments for documentation
COMMENT ON TABLE user_billing IS 'Stores user subscription and billing data with JSONB for flexibility';
COMMENT ON COLUMN user_billing.billing_data IS 'JSONB containing subscription tier, credits, and usage tracking';
