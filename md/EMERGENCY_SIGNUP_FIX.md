# EMERGENCY: Fix Signup 500 Error

## The Problem
Error: **"Database error saving new user"**

This means Supabase Auth is trying to run database triggers when creating a new user, but those triggers are failing.

## Solution: Disable Auto-Triggers Temporarily

### Option 1: Disable Email Confirmation + Remove Triggers

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard/project/ltrknqshxbhmslnkpply

2. **Go to Authentication → Settings**
   - Find "Enable email confirmations"
   - **Turn it OFF** (uncheck)
   - Save changes

3. **Go to Database → Triggers**
   - Look for these triggers:
     - `create_user_profile`
     - `create_user_billing`
   - **DELETE both triggers** (temporarily)

4. **Try signup again** - Should work now!

### Option 2: Check What Tables Exist

1. Go to **Table Editor**
2. Check if these tables exist:
   - `user_profiles` ❓
   - `user_billing` ❓

If they DON'T exist:
- The triggers are trying to insert into non-existent tables
- You MUST run the SQL migrations I provided

### Option 3: Run This Quick Fix SQL

Go to **SQL Editor** and run this:

```sql
-- Drop problematic triggers temporarily
DROP TRIGGER IF EXISTS create_user_profile ON auth.users;
DROP TRIGGER IF EXISTS create_user_billing ON auth.users;

-- Drop functions
DROP FUNCTION IF EXISTS create_default_profile();
DROP FUNCTION IF EXISTS create_default_billing();
```

This will let users sign up without database errors.

## After Signup Works

Once signup is working, you can:
1. Run the full migrations (002, 004, 003)
2. Re-enable the triggers
3. Manually create profile/billing records for existing users

## Test Command

After making changes, test signup with a fresh email address.

---

**CRITICAL**: The 500 error is NOT in your code - it's in the Supabase database configuration. You must fix it in the Supabase dashboard.
