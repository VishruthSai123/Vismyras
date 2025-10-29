-- Migration: Add workspace_id to user_outfit_history table
-- Purpose: Enable one workspace = one unique style (no duplicates per styling session)
-- Date: 2025-10-29

-- Step 1: Add workspace_id column (nullable first to avoid constraint issues)
ALTER TABLE user_outfit_history 
ADD COLUMN IF NOT EXISTS workspace_id TEXT;

-- Step 2: Backfill existing rows with unique workspace IDs
-- Use 'legacy_' + UUID to ensure each existing style gets unique workspace
UPDATE user_outfit_history 
SET workspace_id = 'legacy_' || id::text
WHERE workspace_id IS NULL OR workspace_id = '';

-- Step 3: Now make the column NOT NULL (all rows have values)
ALTER TABLE user_outfit_history 
ALTER COLUMN workspace_id SET NOT NULL;

-- Step 4: Create unique constraint on (user_id, workspace_id)
-- This allows upserts to update the same workspace instead of creating new rows
ALTER TABLE user_outfit_history 
DROP CONSTRAINT IF EXISTS unique_user_workspace;

ALTER TABLE user_outfit_history 
ADD CONSTRAINT unique_user_workspace UNIQUE (user_id, workspace_id);

-- Step 5: Create index for faster workspace lookups
CREATE INDEX IF NOT EXISTS idx_user_outfit_history_workspace_id 
ON user_outfit_history(workspace_id);

-- Step 6: Add comment
COMMENT ON COLUMN user_outfit_history.workspace_id IS 
'Unique identifier for a styling session/workspace. All edits in one session share the same workspace_id and update the same style record.';
