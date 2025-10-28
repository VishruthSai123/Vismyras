# How to Run Database Migrations

## ⚠️ CRITICAL: You MUST run these migrations for signup to work!

The 500 error on signup is happening because Supabase is trying to create user profile records via triggers, but the tables don't exist yet.

## Steps to Run Migrations:

### 1. Open Supabase Dashboard
Go to: https://supabase.com/dashboard

### 2. Select Your Project
Click on your project: **ltrknqshxbhmslnkpply**

### 3. Go to SQL Editor
- Click on the **SQL Editor** icon in the left sidebar
- Click **"New Query"**

### 4. Run Each Migration IN ORDER:

#### Step 1: User Profiles (REQUIRED FOR SIGNUP)
Copy and paste the entire contents of `002_user_profiles.sql` into the SQL editor and click **RUN**.

This creates:
- `user_profiles` table
- Trigger to auto-create profile when user signs up
- RLS policies

#### Step 2: User Billing (REQUIRED FOR SIGNUP)
Copy and paste the entire contents of `004_user_billing.sql` into the SQL editor and click **RUN**.

This creates:
- `user_billing` table
- Trigger to auto-create billing record when user signs up
- RLS policies
- Default free tier settings

#### Step 3: Outfit History (Required for "Your Styles")
Copy and paste the entire contents of `003_outfit_history.sql` into the SQL editor and click **RUN**.

This creates:
- `user_outfit_history` table
- `user_wardrobe_items` table
- `outfit_collections` tables
- RLS policies

#### Step 4: Storage Buckets (Optional for now)
Follow the guide in `STORAGE_SETUP_GUIDE.md` to create storage buckets.
Then run `005_storage_buckets.sql` for storage policies.

## Verify Migrations Worked:

After running migrations, go to **Table Editor** in Supabase and verify you see:
- ✅ `user_profiles` table
- ✅ `user_billing` table
- ✅ `user_outfit_history` table
- ✅ `user_wardrobe_items` table
- ✅ `outfit_collections` table

## Test Signup:

After migrations are complete:
1. Clear your browser cache/cookies
2. Try signing up with a new email
3. Should work without 500 error!

## Troubleshooting:

**Still getting 500 error?**
1. Check Supabase logs: Database → Logs
2. Look for trigger errors
3. Verify all tables have RLS enabled
4. Make sure triggers are created (Database → Database → Triggers)

**Need to reset?**
If you need to start fresh, you can drop tables:
```sql
DROP TABLE IF EXISTS outfit_collection_items CASCADE;
DROP TABLE IF EXISTS outfit_collections CASCADE;
DROP TABLE IF EXISTS user_wardrobe_items CASCADE;
DROP TABLE IF EXISTS user_outfit_history CASCADE;
DROP TABLE IF EXISTS user_billing CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
```

Then re-run all migrations in order.
