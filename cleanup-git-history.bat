@echo off
echo.
echo ===================================================
echo Git History Cleanup - Remove Secrets from History
echo ===================================================
echo.
echo WARNING: This will rewrite Git history!
echo Make sure you've:
echo  1. Rotated ALL secrets
echo  2. Updated .env.local
echo  3. Backed up your repository
echo.
set /p confirm="Type YES to continue: "
if /i not "%confirm%"=="YES" (
    echo Cancelled.
    exit /b
)

echo.
echo Step 1: Creating backup...
git clone . ../Vismyras-backup
if errorlevel 1 (
    echo ERROR: Failed to create backup
    exit /b 1
)
echo Backup created at ../Vismyras-backup

echo.
echo Step 2: Installing git-filter-repo (if needed)...
pip install git-filter-repo
if errorlevel 1 (
    echo WARNING: Could not install git-filter-repo
    echo You may need to install it manually
)

echo.
echo Step 3: Creating replacements file...
(
echo xat1T5SykUzrUyJIaDYD1tBj=^>YOUR_RAZORPAY_TEST_SECRET
echo z4QE76BS32ttCLO2cTOyH764=^>YOUR_RAZORPAY_LIVE_SECRET
echo eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0cmtucXNoeGJobXNsbmtwcGx5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY0MDU1MSwiZXhwIjoyMDc3MjE2NTUxfQ.wWvlF7zfUfaBHMh0wUFhvsxkjspk2D9FA7lL4ZpXNQQ=^>YOUR_SUPABASE_SERVICE_ROLE_KEY
) > replacements.txt

echo.
echo Step 4: Cleaning Git history...
git filter-repo --replace-text replacements.txt --force
if errorlevel 1 (
    echo ERROR: Git history cleanup failed
    echo.
    echo Alternative: Use BFG Repo-Cleaner
    echo 1. Download from: https://rtyley.github.io/bfg-repo-cleaner/
    echo 2. Create secrets.txt with exposed secrets
    echo 3. Run: java -jar bfg.jar --replace-text secrets.txt
    exit /b 1
)

echo.
echo Step 5: Cleaning up...
del replacements.txt

echo.
echo Step 6: Verifying cleanup...
git log -S "xat1T5SykUzrUyJIaDYD1tBj" --all > verify.txt
if exist verify.txt (
    for %%A in (verify.txt) do if %%~zA==0 (
        echo ✓ Verification passed - no secrets found in history
        del verify.txt
    ) else (
        echo WARNING: Secrets may still exist in history
        type verify.txt
    )
)

echo.
echo ===================================================
echo Git History Cleaned!
echo ===================================================
echo.
echo NEXT STEPS:
echo 1. Review changes: git log --oneline
echo 2. Force push: git push origin --force --all
echo 3. Force push tags: git push origin --force --tags
echo 4. Notify team members to re-clone repo
echo.
echo Your backup is in: ../Vismyras-backup
echo.
pause
