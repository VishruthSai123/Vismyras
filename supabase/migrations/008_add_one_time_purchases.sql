-- ============================================================================
-- Migration: Add one-time purchases support to existing user_billing
-- Purpose: Add separate table for one-time credit purchases
-- Date: 2025-10-30
-- ============================================================================

-- Drop table if it exists (in case of retry)
DROP TABLE IF EXISTS public.user_one_time_purchases CASCADE;

-- Create one-time purchases table
CREATE TABLE public.user_one_time_purchases (
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

-- Create indexes
CREATE INDEX idx_one_time_purchases_user_id ON public.user_one_time_purchases(user_id);
CREATE INDEX idx_one_time_purchases_expiry ON public.user_one_time_purchases(expiry_date);
CREATE INDEX idx_one_time_purchases_payment ON public.user_one_time_purchases(razorpay_payment_id);

-- Enable RLS
ALTER TABLE public.user_one_time_purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own purchases"
    ON public.user_one_time_purchases FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage purchases"
    ON public.user_one_time_purchases FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- Auto-update trigger
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

-- Function: Add one-time credits
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
        NOW() + INTERVAL '30 days'
    )
    RETURNING id INTO purchase_id;
    
    RAISE NOTICE 'Added % credits to user % (expires in 30 days)', p_credits, p_user_id;
    RETURN purchase_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get available credits
CREATE OR REPLACE FUNCTION get_available_one_time_credits(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN COALESCE(
        (SELECT SUM(credits_remaining)
         FROM public.user_one_time_purchases
         WHERE user_id = p_user_id
         AND expiry_date > NOW()
         AND credits_remaining > 0),
        0
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Consume one credit (FIFO)
CREATE OR REPLACE FUNCTION consume_one_time_credit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    purchase_id UUID;
BEGIN
    -- Find first expiring credit
    SELECT id INTO purchase_id
    FROM public.user_one_time_purchases
    WHERE user_id = p_user_id
    AND expiry_date > NOW()
    AND credits_remaining > 0
    ORDER BY expiry_date ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;
    
    IF purchase_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- Consume credit
    UPDATE public.user_one_time_purchases
    SET credits_remaining = credits_remaining - 1
    WHERE id = purchase_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update increment_usage to use one-time credits
CREATE OR REPLACE FUNCTION increment_usage(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_used INTEGER;
    current_limit INTEGER;
    billing_exists BOOLEAN;
BEGIN
    -- Check if billing record exists
    SELECT EXISTS(SELECT 1 FROM public.user_billing WHERE user_id = p_user_id)
    INTO billing_exists;
    
    IF NOT billing_exists THEN
        RETURN false;
    END IF;
    
    -- Get current usage with lock
    SELECT monthly_used, monthly_limit 
    INTO current_used, current_limit
    FROM public.user_billing
    WHERE user_id = p_user_id
    FOR UPDATE;
    
    -- Use monthly credits first
    IF current_used < current_limit THEN
        UPDATE public.user_billing
        SET monthly_used = monthly_used + 1,
            updated_at = NOW()
        WHERE user_id = p_user_id;
        RETURN true;
    END IF;
    
    -- Try one-time credits
    RETURN consume_one_time_credit(p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT ON public.user_one_time_purchases TO authenticated;
GRANT ALL ON public.user_one_time_purchases TO service_role;

GRANT EXECUTE ON FUNCTION add_one_time_credits(UUID, INTEGER, VARCHAR, DECIMAL) TO service_role;
GRANT EXECUTE ON FUNCTION get_available_one_time_credits(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION consume_one_time_credit(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_usage(UUID) TO authenticated;

-- Comments
COMMENT ON TABLE public.user_one_time_purchases IS 'One-time credit purchases - expires in 30 days';
COMMENT ON COLUMN public.user_one_time_purchases.credits_purchased IS 'Total credits purchased';
COMMENT ON COLUMN public.user_one_time_purchases.credits_remaining IS 'Credits left (decrements on use)';
COMMENT ON COLUMN public.user_one_time_purchases.expiry_date IS 'Credits expire after 30 days';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ One-time purchases table created successfully!';
    RAISE NOTICE '✅ Functions: add_one_time_credits, get_available_one_time_credits, consume_one_time_credit';
    RAISE NOTICE '✅ increment_usage now uses one-time credits automatically';
END $$;
