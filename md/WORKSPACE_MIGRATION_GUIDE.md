# Workspace ID Migration Guide

## Overview
This migration adds workspace tracking to prevent duplicate styles. Each styling session (from model upload to completion) now has a unique `workspace_id`, ensuring all edits in one session update the same style record instead of creating duplicates.

## What Changed

### Database Schema
- Added `workspace_id` column to `user_outfit_history` table
- Added unique constraint on `(user_id, workspace_id)`
- Added index for performance

### Application Logic
- **New Workspace Creation**: When user uploads a model and clicks "Proceed to styling", a unique workspace_id is generated
- **Auto-Save Behavior**: All edits in one workspace now UPDATE the same style record (upsert)
- **Start Over**: Creates a NEW workspace_id, so the next styling session saves as a separate style
- **Restore Workspace**: When opening a saved style, the workspace_id is restored so further edits continue updating that same style

## Deployment Steps

### 1. Run Database Migration

**Option A: Supabase Dashboard (Recommended)**
1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `006_add_workspace_id.sql`
3. Run the migration
4. Verify: Check `user_outfit_history` table has `workspace_id` column

**Option B: Supabase CLI**
```bash
supabase db push
```

### 2. Handle Existing Data (Important!)

Existing outfit records won't have a workspace_id. You need to backfill them:

```sql
-- Option 1: Set unique workspace_id for each existing outfit
UPDATE user_outfit_history 
SET workspace_id = 'legacy_' || id::text
WHERE workspace_id = '' OR workspace_id IS NULL;

-- Option 2: Group by model_image_id (same model = same workspace)
UPDATE user_outfit_history 
SET workspace_id = 'model_' || COALESCE(model_image_id, id::text)
WHERE workspace_id = '' OR workspace_id IS NULL;
```

Run ONE of these in Supabase SQL Editor.

### 3. Deploy Application Code

```bash
git add .
git commit -m "feat: workspace-based styling system - one workspace = one unique style"
git push origin main
```

Vercel will auto-deploy.

### 4. Test the Flow

1. **Upload New Model** → Should create new workspace_id
2. **Add Garments** → Should auto-save, updating same record
3. **Check Your Styles** → Should see ONE style for that session
4. **Add More Items** → Should still update same style (no duplicates)
5. **Start Over** → Should create NEW workspace
6. **Restore Style** → Should restore workspace_id, further edits update same style

## Expected Behavior

### Before (Old System)
- Every garment change created a NEW outfit record
- User sees 10+ duplicate styles for one session
- Your Styles page cluttered with duplicates

### After (New System)
- One styling session = ONE workspace_id
- All edits UPDATE the same outfit record
- Your Styles page shows clean list of unique styles
- Each style card represents one complete styling session

## Rollback (If Needed)

```sql
-- Remove unique constraint
ALTER TABLE user_outfit_history 
DROP CONSTRAINT IF EXISTS unique_user_workspace;

-- Remove index
DROP INDEX IF EXISTS idx_user_outfit_history_workspace_id;

-- Remove column (optional - will lose workspace tracking)
ALTER TABLE user_outfit_history 
DROP COLUMN IF EXISTS workspace_id;
```

## Notes

- The `workspace_id` is client-generated for instant feedback
- Format: `workspace_${timestamp}_${random}`
- Unique constraint ensures no duplicates per workspace
- Upsert behavior: INSERT if new, UPDATE if workspace exists
