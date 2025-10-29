-- Razorpay Payments Tracking Table
-- Run this in Supabase SQL Editor

-- Create payments table
CREATE TABLE IF NOT EXISTS public.razorpay_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Razorpay IDs
    razorpay_order_id TEXT NOT NULL,
    razorpay_payment_id TEXT,
    razorpay_signature TEXT,
    
    -- Payment details
    amount INTEGER NOT NULL, -- in paise
    currency TEXT DEFAULT 'INR',
    status TEXT NOT NULL DEFAULT 'created', -- created, pending, authorized, captured, failed
    payment_type TEXT NOT NULL, -- subscription, one_time
    
    -- Metadata
    notes JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    
    -- Constraints
    CONSTRAINT valid_status CHECK (status IN ('created', 'pending', 'authorized', 'captured', 'failed', 'refunded')),
    CONSTRAINT valid_payment_type CHECK (payment_type IN ('subscription', 'one_time'))
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_razorpay_payments_user_id ON public.razorpay_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_razorpay_payments_order_id ON public.razorpay_payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_razorpay_payments_payment_id ON public.razorpay_payments(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_razorpay_payments_status ON public.razorpay_payments(status);
CREATE INDEX IF NOT EXISTS idx_razorpay_payments_created_at ON public.razorpay_payments(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.razorpay_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own payments
CREATE POLICY "Users can view own payments"
    ON public.razorpay_payments
    FOR SELECT
    USING (auth.uid() = user_id);

-- Only authenticated users can insert payments (through Edge Functions)
CREATE POLICY "Authenticated users can insert payments"
    ON public.razorpay_payments
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Only system/Edge Functions can update payments
CREATE POLICY "System can update payments"
    ON public.razorpay_payments
    FOR UPDATE
    USING (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_razorpay_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function
DROP TRIGGER IF EXISTS trigger_update_razorpay_payments_updated_at ON public.razorpay_payments;
CREATE TRIGGER trigger_update_razorpay_payments_updated_at
    BEFORE UPDATE ON public.razorpay_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_razorpay_payments_updated_at();

-- Function to get user's payment history
CREATE OR REPLACE FUNCTION get_user_payment_history(
    p_user_id UUID DEFAULT NULL,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    amount INTEGER,
    currency TEXT,
    status TEXT,
    payment_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rp.id,
        rp.razorpay_order_id,
        rp.razorpay_payment_id,
        rp.amount,
        rp.currency,
        rp.status,
        rp.payment_type,
        rp.created_at
    FROM public.razorpay_payments rp
    WHERE rp.user_id = COALESCE(p_user_id, auth.uid())
    ORDER BY rp.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT ON public.razorpay_payments TO authenticated;
GRANT INSERT ON public.razorpay_payments TO authenticated;
GRANT UPDATE ON public.razorpay_payments TO service_role;

-- Verify table creation
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'razorpay_payments') THEN
        RAISE NOTICE '✅ razorpay_payments table created successfully';
    ELSE
        RAISE EXCEPTION '❌ Failed to create razorpay_payments table';
    END IF;
END $$;
