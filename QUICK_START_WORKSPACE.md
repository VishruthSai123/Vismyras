# Quick Start: Deploy Workspace System

## TL;DR
Your app now saves styles per workspace (one session = one style, no duplicates). Deploy in 3 steps:

## Step 1: Run Database Migration (5 minutes)

1. **Go to Supabase Dashboard**
   - Open: https://supabase.com/dashboard
   - Select your project
   - Click "SQL Editor" in left sidebar

2. **Run Migration**
   - Copy ALL content from `supabase/migrations/006_add_workspace_id.sql`
   - Paste into SQL Editor
   - Click "Run"
   - Wait for success message

3. **Backfill Existing Data** (Important!)
   - Copy and run this:
   ```sql
   UPDATE user_outfit_history 
   SET workspace_id = 'legacy_' || id::text
   WHERE workspace_id = '' OR workspace_id IS NULL;
   ```
   - This gives existing styles unique workspace IDs

## Step 2: Deploy Code (2 minutes)

```bash
# Commit changes
git add .
git commit -m "feat: workspace-based styling system"

# Push to GitHub (Vercel auto-deploys)
git push origin main
```

Wait 2-3 minutes for Vercel deployment to complete.

## Step 3: Test (3 minutes)

1. **Open your app**: https://tryonvismyras08.vercel.app
2. **Upload a model photo**
3. **Add 2-3 garments**
4. **Open "Your Styles"** → Should see ONE style (not 3!)
5. **Click "Start Over"**
6. **Upload new model and add items**
7. **Open "Your Styles"** → Should now see TWO styles

✅ If you see clean list with no duplicates, it's working!

## What Changed for Users

### Before
- Every garment = new duplicate style
- "Your Styles" cluttered with 10+ duplicates

### After
- One styling session = ONE unique style
- Clean organized gallery
- Updates automatically as you edit

## Troubleshooting

**Problem**: Migration fails
- **Solution**: Check if `user_outfit_history` table exists
- Run: `SELECT * FROM user_outfit_history LIMIT 1;`

**Problem**: Still seeing duplicates
- **Solution**: Clear browser cache and test with new model upload
- Check workspace_id is being generated in browser console

**Problem**: "Property workspace_id missing" error
- **Solution**: Migration didn't run. Go back to Step 1

## Need Help?

Check detailed docs:
- `WORKSPACE_IMPLEMENTATION_SUMMARY.md` - Full technical details
- `WORKSPACE_MIGRATION_GUIDE.md` - Deployment guide

---

**Time to deploy**: ~10 minutes total
**Risk level**: Low (non-breaking change)
**Rollback**: SQL commands in migration guide if needed
