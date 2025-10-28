-- Migration: Storage Buckets Setup
-- Description: Create storage buckets for images
-- Date: 2025-10-28

-- NOTE: Storage buckets in Supabase are created via Dashboard, not SQL
-- This file documents the required bucket configurations

-- ========================================
-- REQUIRED STORAGE BUCKETS
-- ========================================

-- Bucket 1: model-images
-- Purpose: Store user-uploaded model photos
-- Public: Yes (publicly accessible)
-- File Size Limit: 10 MB
-- Allowed MIME Types: image/jpeg, image/png, image/webp
-- Path: model-images/{user_id}/{timestamp}-{filename}

-- Bucket 2: garment-images  
-- Purpose: Store garment/clothing item images
-- Public: Yes (publicly accessible)
-- File Size Limit: 5 MB
-- Allowed MIME Types: image/jpeg, image/png, image/webp
-- Path: garment-images/{user_id}/{timestamp}-{filename}

-- Bucket 3: final-outputs
-- Purpose: Store final virtual try-on result images
-- Public: Yes (publicly accessible)
-- File Size Limit: 10 MB
-- Allowed MIME Types: image/jpeg, image/png, image/webp
-- Path: final-outputs/{user_id}/{timestamp}-{filename}

-- ========================================
-- STORAGE POLICIES (Run these after creating buckets)
-- ========================================

-- Policy: Users can upload to their own folders
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id IN ('model-images', 'garment-images', 'final-outputs') 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own files
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
USING (
  bucket_id IN ('model-images', 'garment-images', 'final-outputs')
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (
  bucket_id IN ('model-images', 'garment-images', 'final-outputs')
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Everyone can view public files
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (
  bucket_id IN ('model-images', 'garment-images', 'final-outputs')
);

-- ========================================
-- UPDATE OUTFIT HISTORY TABLE
-- ========================================

-- Add storage_paths column to track file paths for cleanup
ALTER TABLE user_outfit_history 
ADD COLUMN IF NOT EXISTS model_image_path TEXT,
ADD COLUMN IF NOT EXISTS final_image_path TEXT;

-- Add comment
COMMENT ON COLUMN user_outfit_history.model_image_path IS 'Storage path for model image (for deletion)';
COMMENT ON COLUMN user_outfit_history.final_image_path IS 'Storage path for final output image (for deletion)';

-- ========================================
-- CLEANUP FUNCTION
-- ========================================

-- Function to clean up storage when outfit is deleted
CREATE OR REPLACE FUNCTION cleanup_outfit_images()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete model image if exists
  IF OLD.model_image_path IS NOT NULL THEN
    PERFORM storage.delete('model-images', OLD.model_image_path);
  END IF;
  
  -- Delete final image if exists  
  IF OLD.final_image_path IS NOT NULL THEN
    PERFORM storage.delete('final-outputs', OLD.final_image_path);
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-cleanup images on outfit deletion
DROP TRIGGER IF EXISTS cleanup_outfit_images_trigger ON user_outfit_history;
CREATE TRIGGER cleanup_outfit_images_trigger
  BEFORE DELETE ON user_outfit_history
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_outfit_images();

COMMENT ON FUNCTION cleanup_outfit_images() IS 'Automatically delete associated images when outfit is deleted';
