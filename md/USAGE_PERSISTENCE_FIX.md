# Critical Fix: Usage Tracking Persistence

## Problem
Usage tracking was resetting after every logout because billing data was only stored in browser localStorage instead of the database. When users logged out and back in, they got a fresh localStorage with reset usage counts.

## Solution
Store all billing and usage data in Supabase database (`user_billing` table) and sync automatically on login/logout.

---

## Deployment Steps

### Step 1: Run Database Migration (REQUIRED)

Go to **Supabase Dashboard** → **SQL Editor** and run the migration:

```bash
File: supabase/migrations/007_user_billing_table.sql
```

This migration will:
- ✅ Create `user_billing` table with all subscription and usage fields
- ✅ Set up Row Level Security (RLS) policies
- ✅ Create trigger to auto-initialize billing for new users
- ✅ Create indexes for performance
- ✅ Add helpful comments

**What the migration creates:**

```sql
CREATE TABLE user_billing (
  user_id UUID UNIQUE -- Links to auth.users
  subscription_tier TEXT -- 'FREE' or 'PREMIUM'
  subscription_status TEXT -- 'active', 'cancelled', 'expired'
  usage_month TEXT -- 'YYYY-MM' format
  try_ons_used INTEGER -- Current month usage
  try_ons_limit INTEGER -- Based on tier
  usage_history JSONB -- Array of usage entries
  one_time_purchases JSONB -- Credit purchases
  transactions JSONB -- Payment history
  ... (and more fields)
)
```

### Step 2: Migrate Existing Users (IMPORTANT)

If you have existing users with localStorage data, you need to initialize their database records:

Run this SQL to create billing records for all existing users:

```sql
-- Initialize billing for all existing users who don't have billing records yet
INSERT INTO user_billing (
  user_id,
  subscription_tier,
  subscription_status,
  subscription_start_date,
  subscription_end_date,
  subscription_auto_renew,
  usage_month,
  try_ons_used,
  try_ons_limit,
  usage_last_updated
)
SELECT 
  id as user_id,
  'FREE' as subscription_tier,
  'active' as subscription_status,
  EXTRACT(EPOCH FROM NOW())::BIGINT * 1000 as subscription_start_date,
  EXTRACT(EPOCH FROM NOW() + INTERVAL '1 year')::BIGINT * 1000 as subscription_end_date,
  false as subscription_auto_renew,
  TO_CHAR(NOW(), 'YYYY-MM') as usage_month,
  0 as try_ons_used,
  5 as try_ons_limit,
  EXTRACT(EPOCH FROM NOW())::BIGINT * 1000 as usage_last_updated
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_billing);
```

### Step 3: Deploy Code

```bash
git add .
git commit -m "fix: persist usage tracking in database instead of localStorage"
git push origin main
```

Vercel will auto-deploy in 2-3 minutes.

### Step 4: Test the Fix

1. **Login with existing account**
   - Check usage stats display correctly
   - Note the current usage count

2. **Use some try-ons**
   - Add garments to model
   - Verify usage count increases

3. **Logout**
   - Usage should be saved to database

4. **Login again**
   - Usage count should be SAME as before logout ✅
   - Not reset to 0 ❌

5. **Test across devices/browsers**
   - Login on different browser
   - Usage should be consistent (loaded from database)

---

## How It Works Now

### Before (❌ Broken):
```
User Login → Load from localStorage (empty) → Usage: 0/5
Use 3 try-ons → localStorage: 3/5
Logout → (localStorage cleared)
Login again → Load from localStorage (empty) → Usage: 0/5 ❌ RESET!
```

### After (✅ Fixed):
```
User Login → Load from DATABASE → Usage: 0/5
Use 3 try-ons → Save to DATABASE → Usage: 3/5
Logout → (localStorage cleared, database kept)
Login again → Load from DATABASE → Usage: 3/5 ✅ PERSISTENT!
```

### Technical Flow:

1. **On Login:**
   - `billingService.setCurrentUser(userId)` called
   - Loads billing data from `user_billing` table
   - Stores in localStorage for fast access
   - Updates UI with correct usage stats

2. **On Usage:**
   - `billingService.consumeTryOn()` called
   - Updates localStorage immediately (fast)
   - Syncs to database in background (persistent)
   - Refreshes UI stats

3. **On Logout:**
   - `billingService.setCurrentUser(null)` called
   - Clears localStorage
   - Database keeps all data intact

4. **Cross-Device:**
   - User logs in on Phone → Loads from database
   - Uses 2 try-ons → Saves to database
   - Logs in on Laptop → Loads from database (2 used)
   - Perfect sync across devices!

---

## Database Schema

### user_billing Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Foreign key to auth.users (UNIQUE) |
| `subscription_tier` | TEXT | 'FREE' or 'PREMIUM' |
| `subscription_status` | TEXT | 'active', 'cancelled', 'expired', 'past_due' |
| `subscription_start_date` | BIGINT | Timestamp in milliseconds |
| `subscription_end_date` | BIGINT | Timestamp in milliseconds |
| `subscription_auto_renew` | BOOLEAN | Auto-renewal enabled |
| `razorpay_subscription_id` | TEXT | Razorpay subscription ID (nullable) |
| `usage_month` | TEXT | Current month ('YYYY-MM') |
| `try_ons_used` | INTEGER | Try-ons used this month |
| `try_ons_limit` | INTEGER | Monthly limit based on tier |
| `usage_last_updated` | BIGINT | Last update timestamp |
| `usage_history` | JSONB | Array of usage entries |
| `one_time_purchases` | JSONB | Array of credit purchases |
| `transactions` | JSONB | Array of payment transactions |
| `created_at` | TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMP | Last update time (auto) |

### Indexes

- `idx_user_billing_user_id` - Fast user lookups
- `idx_user_billing_usage_month` - Monthly usage queries

### RLS Policies

- ✅ Users can only read/update their own billing data
- ✅ Auto-inserts allowed for new users
- ✅ Secure by default

---

## Monitoring

### Check Current Usage (Per User)

```sql
SELECT 
  u.email,
  b.subscription_tier,
  b.try_ons_used,
  b.try_ons_limit,
  b.usage_month,
  b.updated_at
FROM user_billing b
JOIN auth.users u ON b.user_id = u.id
ORDER BY b.updated_at DESC;
```

### Check Total Usage (All Users)

```sql
SELECT 
  subscription_tier,
  COUNT(*) as user_count,
  SUM(try_ons_used) as total_try_ons,
  AVG(try_ons_used) as avg_try_ons_per_user
FROM user_billing
GROUP BY subscription_tier;
```

### Check Users Near Limit

```sql
SELECT 
  u.email,
  b.try_ons_used,
  b.try_ons_limit,
  b.subscription_tier
FROM user_billing b
JOIN auth.users u ON b.user_id = u.id
WHERE b.try_ons_used >= b.try_ons_limit * 0.8
ORDER BY (b.try_ons_used::FLOAT / b.try_ons_limit) DESC;
```

---

## Rollback Plan

If issues occur, you can rollback:

### Step 1: Revert Code
```bash
git revert HEAD
git push origin main
```

### Step 2: (Optional) Drop Table
```sql
-- CAUTION: This will delete all billing data!
DROP TABLE IF EXISTS user_billing CASCADE;
DROP FUNCTION IF EXISTS initialize_user_billing() CASCADE;
DROP FUNCTION IF EXISTS update_user_billing_updated_at() CASCADE;
```

---

## Benefits

1. ✅ **Persistent Usage** - Survives logout/login
2. ✅ **Cross-Device Sync** - Same data on all devices
3. ✅ **Database Backup** - Usage data backed up with database
4. ✅ **Admin Monitoring** - Can query usage in SQL
5. ✅ **Accurate Billing** - No lost usage data
6. ✅ **Better UX** - Users see consistent stats

---

## Testing Checklist

- [ ] Run database migration successfully
- [ ] Initialize billing for existing users
- [ ] Deploy code to production
- [ ] Test login → shows correct usage
- [ ] Test try-on → usage increments
- [ ] Test logout → data saved
- [ ] Test login again → usage persists ✅
- [ ] Test different browser → same usage
- [ ] Test month rollover → resets to 0
- [ ] Monitor Supabase logs for errors

---

## Support

If you encounter issues:

1. **Check Supabase Logs** - Look for table access errors
2. **Verify RLS Policies** - Ensure users can access their data
3. **Check Browser Console** - Look for API errors
4. **Test with New User** - Ensure trigger creates billing record
5. **Run SQL Queries** - Verify data exists in `user_billing` table

**Critical SQL to Check:**
```sql
-- Verify user has billing record
SELECT * FROM user_billing WHERE user_id = '<USER_ID>';

-- Check if trigger is working
SELECT count(*) FROM user_billing;
SELECT count(*) FROM auth.users;
-- Should be equal!
```

---

## Summary

The critical fix ensures usage tracking persists across login sessions by:
- Storing all billing data in `user_billing` database table
- Auto-syncing on every usage change
- Loading from database on login
- Maintaining localStorage cache for performance

Users will now see **consistent, accurate usage** regardless of logout/login cycles! 🎉
