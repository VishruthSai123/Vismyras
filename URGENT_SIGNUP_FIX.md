# 🔴 CRITICAL: Signup Failure Analysis & Fix

## **ERROR SUMMARY**

```
AuthApiError: Database error saving new user
500 Internal Server Error on /auth/v1/signup
```

**Impact**: **ALL NEW USER SIGNUPS ARE FAILING** ❌

---

## **ROOT CAUSE ANALYSIS**

### Problem Chain:
```
1. User tries to sign up
   ↓
2. Supabase Auth creates user in auth.users table
   ↓
3. Trigger "create_user_billing" fires
   ↓
4. Trigger tries to INSERT into user_billing table
   ↓
5. ❌ INSERT FAILS due to column name mismatch
   ↓
6. Transaction rolls back
   ↓
7. User signup fails with 500 error
```

### The Schema Conflict:

**Migration 005 Schema** (OLD - probably what's deployed):
```sql
CREATE TABLE user_billing (
    usage_count INTEGER,      -- OLD COLUMN NAME
    usage_limit INTEGER,      -- OLD COLUMN NAME
    last_reset_date TIMESTAMPTZ
);
```

**Migration 007 Schema** (NEW - not deployed):
```sql
CREATE TABLE user_billing (
    monthly_used INTEGER,     -- NEW COLUMN NAME
    monthly_limit INTEGER,    -- NEW COLUMN NAME  
    period_start TIMESTAMPTZ, -- NEW COLUMN NAME
    period_end TIMESTAMPTZ    -- NEW COLUMN NAME
);
```

**Migration 009 Trigger** (BROKEN):
```sql
CREATE FUNCTION create_default_billing() AS $$
BEGIN
    INSERT INTO public.user_billing (
        monthly_limit,    -- ❌ Column doesn't exist in migration 005 schema!
        monthly_used,     -- ❌ Column doesn't exist in migration 005 schema!
        period_start,     -- ❌ Column doesn't exist in migration 005 schema!
        period_end        -- ❌ Column doesn't exist in migration 005 schema!
    ) VALUES (...);
END;
$$;
```

**Result**: Trigger fails → Signup fails → 500 error

---

## **MIGRATION HISTORY**

Let me trace what happened:

### Migration 005 (Original):
- Created `user_billing` table with `usage_count` / `usage_limit`
- Created trigger `create_user_billing`
- ✅ Deployed to production

### Migration 007 (Schema Change):
- **Attempted** to change columns to `monthly_used` / `monthly_limit`
- Updated all database functions to use new names
- ❌ **LIKELY NOT DEPLOYED** to production

### Migration 008 (One-Time Purchases):
- Created `user_one_time_purchases` table
- Created functions: `add_one_time_credits()`, `consume_one_time_credit()`
- Uses new schema (`credits_remaining` not `try_ons_remaining`)
- ✅ Probably deployed

### Migration 009 (RLS Fix - THIS BROKE SIGNUPS):
- Fixed RLS policies ✅
- **Recreated trigger with NEW column names** ❌
- Assumed migration 007 was deployed
- Trigger now references columns that don't exist
- **Result: All signups broken**

---

## **CODEBASE ANALYSIS**

### Current State:

**Frontend Code** (`billingService.ts`):
```typescript
// Uses OLD column names in localStorage cache
billing.usage.tryOnsUsed  // Maps to usage_count
billing.usage.tryOnsLimit // Maps to usage_limit
```

**Frontend Code** (`supabaseService.ts`):
```typescript
// Tries to save with NEW column names
.upsert({
  monthly_limit: billingData.usage.tryOnsLimit,  // NEW
  monthly_used: billingData.usage.tryOnsUsed,    // NEW
  period_start: periodStart,                      // NEW
  period_end: periodEnd                           // NEW
})
```

**Database Trigger** (Migration 009):
```sql
-- Uses NEW column names
INSERT INTO user_billing (
    monthly_limit,   -- Doesn't exist if migration 007 not run
    monthly_used,    -- Doesn't exist if migration 007 not run
    period_start,    // Doesn't exist if migration 007 not run
    period_end       -- Doesn't exist if migration 007 not run
)
```

**Diagnosis**: 
- Frontend code inconsistent (uses old names internally, sends new names to DB)
- Database still has old schema
- Trigger tries to use new schema
- **MISMATCH = FAILURE**

---

## **SOLUTION: Migration 010**

Created **`010_fix_signup_trigger.sql`** which:

### 1. Smart Trigger Function
```sql
-- Checks which schema is actually deployed
-- Works with BOTH old and new schemas
-- Has error handling to prevent blocking signups
```

### 2. Backfill Missing Records
```sql
-- Creates billing records for users who signed up while trigger was broken
-- Adapts to whatever schema is deployed
```

### 3. Verification
```sql
-- Shows which schema is deployed
-- Shows how many users have billing records
-- Confirms trigger is working
```

---

## **DEPLOYMENT STEPS - URGENT**

### ⚡ **IMMEDIATE FIX** (Run NOW):

**Go to Supabase Dashboard → SQL Editor**

**Run this migration:**
```bash
Copy entire contents of: supabase/migrations/010_fix_signup_trigger.sql
```

**Expected output:**
```
✅ Created billing records for X existing users
===========================================
✅ Migration 010 Complete!
===========================================
📊 Schema: Migration 005 (usage_limit, usage_count)  <-- Or 007
👥 Total users: X
💳 Users with billing: X
✅ All users have billing records!
✅ Trigger: create_user_billing (SAFE - handles both schemas)
✅ Signups should work now!
===========================================
```

### ✅ **Verify Fix**:

1. **Test signup immediately**:
   - Go to your app
   - Try signing up with new email
   - Should work without 500 error ✅

2. **Check console**:
   - Should NOT see "Database error saving new user"
   - User should be created successfully

3. **Check database**:
```sql
-- Verify new user has billing record
SELECT 
    u.email,
    b.subscription_tier,
    b.monthly_used,  -- Or usage_count depending on schema
    b.monthly_limit   -- Or usage_limit depending on schema
FROM auth.users u
LEFT JOIN user_billing b ON u.id = b.user_id
ORDER BY u.created_at DESC
LIMIT 5;
```

---

## **LONG-TERM FIX** (After Emergency)

Once signups are working, you need to:

### Option A: Standardize on Migration 007 Schema (Recommended)
```sql
-- Run migration 007 to update schema
-- Then update migration 010 trigger to only use new schema
```

### Option B: Standardize on Migration 005 Schema
```sql
-- Revert all code to use old column names
-- Keep migration 010 trigger
```

**Recommendation**: Go with Option A (migration 007 schema) because:
- More descriptive column names (`monthly_limit` vs `usage_limit`)
- Matches webhook implementation
- Better aligned with business logic

---

## **PREVENTION FOR FUTURE**

### 1. Migration Testing Checklist:
```
[ ] Run migration on local Supabase first
[ ] Test trigger by creating test user
[ ] Verify all columns exist before using them
[ ] Test signup flow after migration
[ ] Deploy to staging before production
```

### 2. Schema Change Protocol:
```
When changing column names:
1. Create migration to ADD new columns (keep old ones)
2. Update code to write to BOTH columns
3. Backfill data from old to new columns
4. Update code to read from NEW columns only
5. Remove OLD columns in separate migration
```

### 3. Trigger Safety:
```sql
-- Always include error handling in triggers
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error: %', SQLERRM;
    RETURN NEW;  -- Don't block the operation
```

---

## **SUMMARY**

| Issue | Status | Action |
|-------|--------|--------|
| Signups failing with 500 | 🔴 CRITICAL | Run migration 010 NOW |
| Schema mismatch | 🟡 WARNING | Plan schema standardization |
| Trigger broken | 🔴 CRITICAL | Fixed by migration 010 |
| Missing billing records | 🟡 WARNING | Backfilled by migration 010 |
| RLS policies | ✅ FIXED | Migration 009 |
| One-time credits persist | ✅ FIXED | Migration 008 |
| Upsert conflicts | ✅ FIXED | Migration 009 |

---

## **NEXT STEPS**

1. **RUN MIGRATION 010 IMMEDIATELY** ⚡
2. Test signup works
3. Monitor for any other errors
4. Plan schema standardization (migration 007)
5. Update frontend code to match final schema
6. Deploy frontend with consistent naming

---

**CRITICAL**: Run migration 010 in the next 5 minutes to restore signups! 🚨
