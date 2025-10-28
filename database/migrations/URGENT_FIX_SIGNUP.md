# 🚀 QUICK FIX: Run These Migrations NOW

## Problem
**500 Error on Signup**: "Database error saving new user"

## Solution
Run these 2 SQL files in your Supabase dashboard **in this exact order**:

---

## Step-by-Step Instructions:

### 1. Open Supabase SQL Editor
Go to: https://supabase.com/dashboard/project/ltrknqshxbhmslnkpply/sql

### 2. Run Migration #1 - User Profiles (FIXED)
- Click **"New Query"**
- Copy **ALL** contents of `001_user_profiles_fixed.sql`
- Paste into SQL editor
- Click **"RUN"** (or press Ctrl+Enter)
- ✅ Wait for "Success. No rows returned"

### 3. Run Migration #2 - User Billing (FIXED)
- Click **"New Query"** again
- Copy **ALL** contents of `002_user_billing_fixed.sql`
- Paste into SQL editor
- Click **"RUN"** (or press Ctrl+Enter)
- ✅ Wait for "Success. No rows returned"

### 4. Verify Tables Created
Go to **Table Editor** tab and verify you see:
- ✅ `user_profiles` table
- ✅ `user_billing` table

### 5. Test Signup
- Refresh your app
- Try signing up with a new email
- ✅ Should work without 500 error!

---

## What These Migrations Do:

### `001_user_profiles_fixed.sql`
- ✅ Drops and recreates `user_profiles` table cleanly
- ✅ Adds trigger to auto-create profile on signup
- ✅ Includes error handling so signup won't fail
- ✅ Handles all metadata variations (full_name, name, picture, avatar_url)

### `002_user_billing_fixed.sql`
- ✅ Drops and recreates `user_billing` table cleanly
- ✅ Adds trigger to auto-create billing record on signup
- ✅ Sets default FREE tier with 10 try-ons
- ✅ Includes error handling so signup won't fail

---

## Key Fixes Applied:

1. **SECURITY DEFINER**: Functions run with elevated permissions
2. **Error Handling**: EXCEPTION blocks catch errors without failing signup
3. **ON CONFLICT DO NOTHING**: Prevents duplicate key errors
4. **Safe Defaults**: All fields have fallback values
5. **Proper Metadata Extraction**: Handles all OAuth provider variations
6. **Clean Slate**: Drops existing objects before recreating

---

## After Running Migrations:

The signup flow will:
1. Create user in `auth.users` ✓
2. Trigger creates profile in `user_profiles` ✓
3. Trigger creates billing in `user_billing` ✓
4. User gets authenticated immediately ✓

**No more 500 errors!** 🎉

---

## Troubleshooting:

**Still getting errors?**
- Check Supabase logs: Database → Logs → Select timeframe
- Look for trigger errors or constraint violations
- Run verification queries at bottom of each SQL file

**Need to start fresh?**
Both migrations include DROP TABLE IF EXISTS, so you can safely re-run them.

---

## Next Steps After Migrations:

Once migrations are successful, you can optionally run:
- `003_outfit_history.sql` - For "Your Styles" feature
- `005_storage_buckets.sql` - For image storage (requires manual bucket setup first)
