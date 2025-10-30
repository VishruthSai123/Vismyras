# URGENT: Security - Exposed Secrets Cleanup

## ⚠️ CRITICAL: Secrets Have Been Exposed

The following secrets were accidentally committed to Git and documentation files:

1. **Razorpay Test Key Secret**: `xat1T5SykUzrUyJIaDYD1tBj`
2. **Razorpay Live Key Secret**: `z4QE76BS32ttCLO2cTOyH764`
3. **Supabase Service Role Key**: `eyJhbGci...XNQlQ`

## IMMEDIATE ACTIONS REQUIRED

### Step 1: Rotate ALL Secrets (DO THIS FIRST!)

#### 1.1 Rotate Razorpay Keys

1. **Go to Razorpay Dashboard**: https://dashboard.razorpay.com/
2. **Settings → API Keys**
3. **Regenerate Test Keys**:
   - Click "Regenerate Test Key"
   - Save new `Key ID` and `Key Secret`
4. **Regenerate Live Keys**:
   - Click "Regenerate Live Key"  
   - Save new `Key ID` and `Key Secret`

#### 1.2 Rotate Supabase Service Role Key

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Settings → API**
3. **Revoke and regenerate** Service Role key
4. **Copy new service_role key**

#### 1.3 Update .env.local

Replace with NEW keys:
```bash
# Test keys (NEW)
VITE_RAZORPAY_TEST_KEY_ID=rzp_test_XXXXXXXXXX
RAZORPAY_TEST_KEY_SECRET=NEW_TEST_SECRET_HERE

# Live keys (NEW)
VITE_RAZORPAY_LIVE_KEY_ID=rzp_live_XXXXXXXXXX
RAZORPAY_LIVE_KEY_SECRET=NEW_LIVE_SECRET_HERE

# Supabase (NEW)
SUPABASE_SERVICE_ROLE_KEY=NEW_SERVICE_ROLE_KEY_HERE
```

#### 1.4 Update Supabase Edge Function Secrets

```bash
npx supabase secrets set RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXX
npx supabase secrets set RAZORPAY_KEY_SECRET=NEW_TEST_SECRET_HERE
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=NEW_SERVICE_ROLE_KEY_HERE
```

---

### Step 2: Remove Secrets from Documentation Files

Run this PowerShell script to remove secrets from all files:

```powershell
# Navigate to project directory
cd C:\Users\VISHRUTH\Vismyras\Vismyras

# Replace secrets with placeholders in all files
$files = @(
    "RAZORPAY_COMPLETE_SETUP.md",
    "RAZORPAY_QUICK_START.md",
    "DEPLOYMENT_CHECKLIST.md",
    "RAZORPAY_DEPLOYMENT.md",
    "RAZORPAY_FIXES.md",
    "DEPLOY_FUNCTIONS_MANUAL.md",
    "SUPABASE_DASHBOARD_DEPLOY\DEPLOYMENT_INSTRUCTIONS.md",
    "SUPABASE_DASHBOARD_DEPLOY\TROUBLESHOOTING_CORS.md",
    "SUPABASE_DASHBOARD_DEPLOY\FIX_VERIFICATION_ERROR.md"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        
        # Replace Razorpay Test Secret
        $content = $content -replace 'xat1T5SykUzrUyJIaDYD1tBj', 'YOUR_RAZORPAY_TEST_SECRET'
        
        # Replace Razorpay Live Secret
        $content = $content -replace 'z4QE76BS32ttCLO2cTOyH764', 'YOUR_RAZORPAY_LIVE_SECRET'
        
        # Replace Supabase Service Role Key
        $content = $content -replace 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0cmtucXNoeGJobXNsbmtwcGx5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY0MDU1MSwiZXhwIjoyMDc3MjE2NTUxfQ\.wWvlF7zfUfaBHMh0wUFhvsxkjspk2D9FA7lL4ZpXNQQ', 'YOUR_SUPABASE_SERVICE_ROLE_KEY'
        
        Set-Content $file -Value $content
        Write-Host "✅ Cleaned: $file"
    }
}

Write-Host "`n✅ All documentation files cleaned!"
```

---

### Step 3: Clean Git History

⚠️ **WARNING**: This will rewrite Git history. Coordinate with team members!

#### Option A: Using BFG Repo-Cleaner (Recommended)

1. **Download BFG**: https://rtyley.github.io/bfg-repo-cleaner/
2. **Create secrets file** (`secrets.txt`):
```
xat1T5SykUzrUyJIaDYD1tBj
z4QE76BS32ttCLO2cTOyH764
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0cmtucXNoeGJobXNsbmtwcGx5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY0MDU1MSwiZXhwIjoyMDc3MjE2NTUxfQ.wWvlF7zfUfaBHMh0wUFhvsxkjspk2D9FA7lL4ZpXNQQ
```

3. **Run BFG**:
```powershell
# Clone a fresh copy
git clone --mirror https://github.com/VishruthSai123/Vismyras.git

# Run BFG to remove secrets
java -jar bfg.jar --replace-text secrets.txt Vismyras.git

# Cleanup and push
cd Vismyras.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```

#### Option B: Using git-filter-repo

1. **Install git-filter-repo**:
```powershell
pip install git-filter-repo
```

2. **Run cleanup**:
```powershell
cd C:\Users\VISHRUTH\Vismyras\Vismyras

# Backup first!
git clone . ../Vismyras-backup

# Remove secrets from history
git filter-repo --replace-text <(
  echo "xat1T5SykUzrUyJIaDYD1tBj==>YOUR_RAZORPAY_TEST_SECRET"
  echo "z4QE76BS32ttCLO2cTOyH764==>YOUR_RAZORPAY_LIVE_SECRET"
  echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0cmtucXNoeGJobXNsbmtwcGx5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY0MDU1MSwiZXhwIjoyMDc3MjE2NTUxfQ.wWvlF7zfUfaBHMh0wUFhvsxkjspk2D9FA7lL4ZpXNQQ==>YOUR_SUPABASE_SERVICE_ROLE_KEY"
)

# Force push
git push origin --force --all
```

#### Option C: Simpler Approach (If repo is new)

If the repo doesn't have much history, consider:

1. **Create new repository**
2. **Copy only necessary files** (without .env.local)
3. **Push to new repo**
4. **Delete old repo**

---

### Step 4: Update .gitignore

Ensure `.env.local` is in `.gitignore`:

```bash
# .gitignore
.env.local
.env.*.local
*.secret
*.key
```

---

### Step 5: Verify Cleanup

```powershell
# Search for any remaining secrets
git log -S "xat1T5SykUzrUyJIaDYD1tBj" --all
git log -S "z4QE76BS32ttCLO2cTOyH764" --all

# Should return nothing if successful
```

---

## Post-Cleanup Checklist

- [ ] ✅ Razorpay Test keys rotated
- [ ] ✅ Razorpay Live keys rotated
- [ ] ✅ Supabase Service Role key rotated
- [ ] ✅ .env.local updated with NEW keys
- [ ] ✅ Supabase Edge Function secrets updated
- [ ] ✅ Documentation files cleaned (secrets removed)
- [ ] ✅ Git history cleaned
- [ ] ✅ Force pushed to remote
- [ ] ✅ .gitignore updated
- [ ] ✅ Verified no secrets remain in history
- [ ] ✅ All team members notified

---

## Prevention for Future

### Use Environment Variables Pattern

```markdown
# ❌ BAD - Never do this:
RAZORPAY_KEY_SECRET=xat1T5SykUzrUyJIaDYD1tBj

# ✅ GOOD - Always use placeholders:
RAZORPAY_KEY_SECRET=your_secret_key_here
```

### Use Git Hooks

Create `.git/hooks/pre-commit`:
```bash
#!/bin/sh
if git diff --cached | grep -i "razorpay_key_secret.*xat1\|eyJhbGci"; then
    echo "ERROR: Secrets detected in commit!"
    exit 1
fi
```

---

## Need Help?

If you encounter issues:
1. Don't push any more commits until secrets are rotated
2. Contact GitHub support to request cache purge
3. Consider making repo private temporarily

**Time needed**: 30-60 minutes
**Priority**: 🔴 CRITICAL - Do this immediately!
