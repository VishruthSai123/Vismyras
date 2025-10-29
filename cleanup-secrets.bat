@echo off
echo.
echo ============================================
echo Security Cleanup: Removing Exposed Secrets
echo ============================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
"$files = @('RAZORPAY_COMPLETE_SETUP.md','RAZORPAY_QUICK_START.md','DEPLOYMENT_CHECKLIST.md','RAZORPAY_DEPLOYMENT.md','RAZORPAY_FIXES.md','DEPLOY_FUNCTIONS_MANUAL.md','SUPABASE_DASHBOARD_DEPLOY\DEPLOYMENT_INSTRUCTIONS.md','SUPABASE_DASHBOARD_DEPLOY\TROUBLESHOOTING_CORS.md','SUPABASE_DASHBOARD_DEPLOY\FIX_VERIFICATION_ERROR.md'); ^
$cleaned = 0; ^
foreach ($file in $files) { ^
    if (Test-Path $file) { ^
        $content = Get-Content $file -Raw; ^
        $content = $content -replace 'xat1T5SykUzrUyJIaDYD1tBj', 'YOUR_RAZORPAY_TEST_SECRET'; ^
        $content = $content -replace 'z4QE76BS32ttCLO2cTOyH764', 'YOUR_RAZORPAY_LIVE_SECRET'; ^
        $content = $content -replace 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\\.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0cmtucXNoeGJobXNsbmtwcGx5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY0MDU1MSwiZXhwIjoyMDc3MjE2NTUxfQ\\.wWvlF7zfUfaBHMh0wUFhvsxkjspk2D9FA7lL4ZpXNQQ', 'YOUR_SUPABASE_SERVICE_ROLE_KEY'; ^
        Set-Content $file -Value $content; ^
        Write-Host \"Cleaned: $file\" -ForegroundColor Green; ^
        $cleaned++; ^
    } ^
}; ^
Write-Host \"`nCleaned $cleaned files!\" -ForegroundColor Green"

echo.
echo ============================================
echo CRITICAL NEXT STEPS:
echo ============================================
echo 1. Rotate ALL secrets in Razorpay Dashboard
echo 2. Rotate Supabase Service Role Key
echo 3. Update .env.local with NEW secrets
echo 4. Update Supabase Edge Function secrets
echo 5. Commit: git add -A ^&^& git commit -m "security: remove exposed secrets"
echo 6. Clean Git history (see SECURITY_CLEANUP_URGENT.md)
echo.
echo Read SECURITY_CLEANUP_URGENT.md for details!
echo.
pause
