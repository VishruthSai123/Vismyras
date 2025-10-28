# Database Migrations

## How to Run Migrations in Supabase

### Step 1: Access Supabase SQL Editor
1. Go to your Supabase project dashboard at https://app.supabase.com
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New query** to open a blank SQL editor

### Step 2: Run Migrations in Order

**IMPORTANT:** Run migrations in this exact order:

#### Migration 1: User Profiles (002_user_profiles.sql)
1. Open `002_user_profiles.sql`
2. Copy the entire contents
3. Paste into Supabase SQL Editor
4. Click **Run** or press Ctrl+Enter
5. Wait for "Success" message

#### Migration 2: User Billing (004_user_billing.sql)
1. Open `004_user_billing.sql`
2. Copy the entire contents
3. Paste into Supabase SQL Editor
4. Click **Run** or press Ctrl+Enter
5. Wait for "Success" message

#### Migration 3: Outfit History (003_outfit_history.sql)
1. Open `003_outfit_history.sql`
2. Copy the entire contents
3. Paste into Supabase SQL Editor
4. Click **Run** or press Ctrl+Enter
5. Wait for "Success" message

### Step 3: Verify Tables Created

After running all migrations, verify in Supabase:

1. Go to **Table Editor** in left sidebar
2. You should see these new tables:
   - `user_profiles`
   - `user_billing`
   - `user_outfit_history`
   - `user_wardrobe_items`
   - `outfit_collections`
   - `outfit_collection_items`

### Step 4: Test Authentication

1. Refresh your app
2. Sign in with your account
3. Profile and billing data should now persist properly
4. "Your Styles" feature will now save outfits to database

## What Each Migration Does

### 002_user_profiles.sql
- Creates `user_profiles` table to store user information
- Auto-creates profile when user signs up via trigger
- Enables Row Level Security (RLS)

### 004_user_billing.sql
- Creates `user_billing` table for subscription/usage data
- Auto-creates FREE tier (10 try-ons) for new users
- Stores billing data as JSONB for flexibility

### 003_outfit_history.sql
- Creates `user_outfit_history` table for saved outfits
- Creates `user_wardrobe_items` for custom garments
- Creates `outfit_collections` for organizing outfits
- All tables have RLS policies to protect user data

## Troubleshooting

### "relation already exists" error
- This is normal if you've already run a migration
- The migrations are idempotent (safe to run multiple times)
- They use `CREATE TABLE IF NOT EXISTS` and `DROP ... IF EXISTS`

### "permission denied" error
- Make sure you're signed in to Supabase
- Ensure you have admin access to the project

### Tables not appearing
1. Refresh the Table Editor page
2. Check SQL Editor for error messages
3. Make sure all three migrations completed successfully
