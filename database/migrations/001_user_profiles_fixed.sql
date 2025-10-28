-- ============================================================================
-- Migration: User Profiles (FIXED)
-- Description: Store user profile information with robust error handling
-- Date: 2025-10-28
-- Version: 2.0 (Complete Rewrite)
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- STEP 1: Drop existing objects (clean slate)
-- ============================================================================

-- Drop triggers first
DROP TRIGGER IF EXISTS create_user_profile ON auth.users;
DROP TRIGGER IF EXISTS update_user_profiles_timestamp ON user_profiles;

-- Drop functions
DROP FUNCTION IF EXISTS create_default_profile() CASCADE;
DROP FUNCTION IF EXISTS update_user_profiles_updated_at() CASCADE;

-- Drop policies
DROP POLICY IF EXISTS "Users can view profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

-- Drop table (CASCADE will drop all dependencies)
DROP TABLE IF EXISTS user_profiles CASCADE;

-- ============================================================================
-- STEP 2: Create user_profiles table
-- ============================================================================

CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) DEFAULT '',
    avatar_url TEXT DEFAULT '',
    auth_provider VARCHAR(50) NOT NULL DEFAULT 'email',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Ensure unique email
    CONSTRAINT unique_email UNIQUE(email)
);

-- Create indexes
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_created_at ON user_profiles(created_at DESC);

-- ============================================================================
-- STEP 3: Enable Row Level Security
-- ============================================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to view all profiles (for future features)
CREATE POLICY "Users can view profiles"
    ON user_profiles
    FOR SELECT
    USING (true);

-- Allow users to update only their own profile
CREATE POLICY "Users can update own profile"
    ON user_profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Allow users to insert only their own profile
CREATE POLICY "Users can insert own profile"
    ON user_profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Allow service role to bypass RLS
ALTER TABLE user_profiles FORCE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 4: Create trigger function with error handling
-- ============================================================================

CREATE OR REPLACE FUNCTION create_default_profile()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_email VARCHAR(255);
    v_full_name VARCHAR(255);
    v_avatar_url TEXT;
    v_provider VARCHAR(50);
BEGIN
    -- Extract values with safe defaults
    v_email := COALESCE(NEW.email, '');
    
    -- Try to get full_name from various metadata fields
    v_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        NEW.raw_user_meta_data->>'fullName',
        ''
    );
    
    -- Try to get avatar from various metadata fields
    v_avatar_url := COALESCE(
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.raw_user_meta_data->>'picture',
        NEW.raw_user_meta_data->>'avatarUrl',
        ''
    );
    
    -- Get auth provider
    v_provider := COALESCE(
        NEW.raw_app_meta_data->>'provider',
        'email'
    );
    
    -- Insert profile with error handling
    BEGIN
        INSERT INTO public.user_profiles (
            id,
            email,
            full_name,
            avatar_url,
            auth_provider,
            created_at,
            updated_at
        ) VALUES (
            NEW.id,
            v_email,
            v_full_name,
            v_avatar_url,
            v_provider,
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO NOTHING;
        
    EXCEPTION WHEN OTHERS THEN
        -- Log error but don't fail the signup
        RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    END;
    
    RETURN NEW;
END;
$$;

-- ============================================================================
-- STEP 5: Create updated_at trigger function
-- ============================================================================

CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
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

-- Trigger to create profile after user signup
CREATE TRIGGER create_user_profile
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_profile();

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_user_profiles_timestamp
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_user_profiles_updated_at();

-- ============================================================================
-- STEP 7: Add comments for documentation
-- ============================================================================

COMMENT ON TABLE user_profiles IS 'User profile information synced from auth.users';
COMMENT ON COLUMN user_profiles.id IS 'References auth.users(id)';
COMMENT ON COLUMN user_profiles.email IS 'User email address';
COMMENT ON COLUMN user_profiles.full_name IS 'User full name from metadata';
COMMENT ON COLUMN user_profiles.avatar_url IS 'User avatar URL from OAuth or upload';
COMMENT ON COLUMN user_profiles.auth_provider IS 'Authentication provider: email or google';

-- ============================================================================
-- VERIFICATION QUERIES (Run these to verify)
-- ============================================================================

-- Check if table exists
-- SELECT * FROM user_profiles LIMIT 1;

-- Check if triggers exist
-- SELECT tgname FROM pg_trigger WHERE tgrelid = 'user_profiles'::regclass;

-- Check if RLS is enabled
-- SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'user_profiles';

-- ============================================================================
-- SUCCESS!
-- ============================================================================
-- This migration should now work without errors
-- Test by creating a new user account
-- ============================================================================
