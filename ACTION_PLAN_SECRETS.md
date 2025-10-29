# 🚨 IMMEDIATE ACTION REQUIRED - Secrets Exposed

## Status: ✅ Phase 1 Complete

### What's Been Done:
1. ✅ **Secrets removed from 9 documentation files**
2. ✅ **.gitignore updated** to prevent future leaks
3. ✅ **Cleanup scripts created**

### What You MUST Do Now (In Order):

---

## 🔴 PHASE 2: Rotate Secrets (DO THIS FIRST - 15 min)

### 1. Razorpay Keys (CRITICAL!)

**Test Mode:**
```
Current (EXPOSED): rzp_test_RZCalW8FnHhyFK / xat1T5SykUzrUyJIaDYD1tBj
Action: Go to https://dashboard.razorpay.com/app/keys → Regenerate Test Key
```

**Live Mode:**
```
Current (EXPOSED): rzp_live_RYrMe7EXEQ4UMt / z4QE76BS32ttCLO2cTOyH764
Action: Go to https://dashboard.razorpay.com/app/keys → Regenerate Live Key
```

### 2. Supabase Service Role Key (CRITICAL!)

```
Current (EXPOSED): eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Action: Go to https://supabase.com/dashboard/project/ltrknqshxbhmslnkpply/settings/api
Click "Reset" on Service Role Key
```

### 3. Update .env.local

Replace with NEW keys:
```bash
# Open .env.local and update:
RAZORPAY_TEST_KEY_SECRET=<paste_new_test_secret>
RAZORPAY_LIVE_KEY_SECRET=<paste_new_live_secret>
SUPABASE_SERVICE_ROLE_KEY=<paste_new_service_role_key>
```

### 4. Update Supabase Edge Functions

```bash
npx supabase secrets set RAZORPAY_KEY_SECRET=<new_test_secret>
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<new_service_role_key>
```

---

## 🟡 PHASE 3: Clean Git History (DO AFTER PHASE 2 - 15 min)

### Option 1: Automated Script (Recommended)
```bash
# Run this:
cleanup-git-history.bat
```

### Option 2: Manual Commands
```bash
# 1. Create backup
git clone . ../Vismyras-backup

# 2. Install tool
pip install git-filter-repo

# 3. Create replacements file
echo xat1T5SykUzrUyJIaDYD1tBj==>REDACTED > replacements.txt
echo z4QE76BS32ttCLO2cTOyH764==>REDACTED >> replacements.txt
echo eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0cmtucXNoeGJobXNsbmtwcGx5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY0MDU1MSwiZXhwIjoyMDc3MjE2NTUxfQ.wWvlF7zfUfaBHMh0wUFhvsxkjspk2D9FA7lL4ZpXNQQ==>REDACTED >> replacements.txt

# 4. Clean history
git filter-repo --replace-text replacements.txt --force

# 5. Verify
git log -S "xat1T5SykUzrUyJIaDYD1tBj" --all
# (Should return nothing)
```

---

## 🟢 PHASE 4: Push and Verify (DO AFTER PHASE 3 - 10 min)

### 1. Commit Documentation Changes
```bash
git add .gitignore
git add *.md
git add SUPABASE_DASHBOARD_DEPLOY/*.md
git commit -m "security: remove exposed secrets and update gitignore"
```

### 2. Force Push (Rewrites History!)
```bash
git push origin --force --all
git push origin --force --tags
```

### 3. Verify on GitHub
- Go to: https://github.com/VishruthSai123/Vismyras
- Search for: `xat1T5SykUzrUyJIaDYD1tBj`
- Should show: No results

### 4. Test Application
```bash
npm run dev
# Try making a test payment - should work with NEW keys
```

---

## 📋 Complete Checklist

### Secrets Rotation:
- [ ] Razorpay Test keys regenerated
- [ ] Razorpay Live keys regenerated
- [ ] Supabase Service Role key regenerated
- [ ] .env.local updated with NEW keys
- [ ] Supabase Edge Function secrets updated
- [ ] Tested payment with NEW keys

### Git Cleanup:
- [ ] Backup created
- [ ] Git history cleaned
- [ ] Documentation committed
- [ ] Force pushed to GitHub
- [ ] Verified secrets removed from GitHub
- [ ] No secrets found in `git log -S` search

### Prevention:
- [ ] .gitignore updated
- [ ] Cleanup scripts saved
- [ ] Team notified (if applicable)

---

## Estimated Timeline

| Phase | Task | Time | Priority |
|-------|------|------|----------|
| 1 | Remove from docs | ✅ DONE | - |
| 2 | Rotate secrets | 15 min | 🔴 URGENT |
| 3 | Clean Git history | 15 min | 🟡 HIGH |
| 4 | Push & verify | 10 min | 🟢 MEDIUM |
| **Total** | | **40 min** | |

---

## Files Created for You

1. ✅ **cleanup-secrets.bat** - Removes secrets from docs (already run)
2. ✅ **cleanup-git-history.bat** - Cleans Git history
3. ✅ **SECURITY_CLEANUP_URGENT.md** - Detailed instructions
4. ✅ **SECRETS_CLEANUP_SUMMARY.md** - Complete guide
5. ✅ **THIS FILE** - Quick action plan

---

## Quick Commands Reference

```bash
# Rotate secrets (use dashboards - links above)

# Clean Git history
cleanup-git-history.bat

# Commit and push
git add -A
git commit -m "security: remove exposed secrets"
git push origin --force --all

# Verify cleanup
git log -S "xat1T5SykUzrUyJIaDYD1tBj" --all

# Test application
npm run dev
```

---

## ⚠️ Important Notes

1. **DO NOT skip Phase 2** - Rotating secrets is CRITICAL
2. **DO NOT push before** cleaning Git history
3. **DO backup** your repository first
4. **DO test** application after rotating keys
5. **DO notify** team members to re-clone repo

---

## Success = All Checkboxes ✅

When all boxes are checked, you're secure again! 🎉

**Current Status:** Phase 1 Complete ✅  
**Next Action:** Phase 2 - Rotate Secrets 🔴

**Start here:** https://dashboard.razorpay.com/app/keys
