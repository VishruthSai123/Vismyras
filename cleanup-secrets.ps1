# Security Cleanup Script - Remove Exposed Secrets
# Run this in PowerShell: .\cleanup-secrets.ps1

Write-Host "`n🔒 Security Cleanup: Removing Exposed Secrets" -ForegroundColor Red
Write-Host "=========================================`n" -ForegroundColor Red

$projectRoot = "C:\Users\VISHRUTH\Vismyras\Vismyras"
cd $projectRoot

# Files to clean (excluding .env.local)
$filesToClean = @(
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

$secretsToReplace = @{
    'xat1T5SykUzrUyJIaDYD1tBj' = 'YOUR_RAZORPAY_TEST_SECRET'
    'z4QE76BS32ttCLO2cTOyH764' = 'YOUR_RAZORPAY_LIVE_SECRET'
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0cmtucXNoeGJobXNsbmtwcGx5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY0MDU1MSwiZXhwIjoyMDc3MjE2NTUxfQ\.wWvlF7zfUfaBHMh0wUFhvsxkjspk2D9FA7lL4ZpXNQQ' = 'YOUR_SUPABASE_SERVICE_ROLE_KEY'
}

Write-Host "Files to clean:" -ForegroundColor Yellow
$filesToClean | ForEach-Object { Write-Host "  - $_" }
Write-Host ""

$cleanedCount = 0
$errorCount = 0

foreach ($file in $filesToClean) {
    $filePath = Join-Path $projectRoot $file
    
    if (Test-Path $filePath) {
        try {
            Write-Host "Cleaning: $file" -ForegroundColor Cyan
            
            $content = Get-Content $filePath -Raw -Encoding UTF8
            $originalContent = $content
            
            foreach ($secret in $secretsToReplace.Keys) {
                $replacement = $secretsToReplace[$secret]
                $content = $content -replace $secret, $replacement
            }
            
            if ($content -ne $originalContent) {
                Set-Content $filePath -Value $content -Encoding UTF8
                Write-Host "  ✅ Cleaned!" -ForegroundColor Green
                $cleanedCount++
            } else {
                Write-Host "  ℹ️  No secrets found" -ForegroundColor Gray
            }
        }
        catch {
            Write-Host "  ❌ Error: $_" -ForegroundColor Red
            $errorCount++
        }
    } else {
        Write-Host "  ⚠️  File not found: $file" -ForegroundColor Yellow
    }
}

Write-Host "`n=========================================`n" -ForegroundColor Green
Write-Host "Summary:" -ForegroundColor Green
Write-Host "  Files cleaned: $cleanedCount" -ForegroundColor Green
Write-Host "  Errors: $errorCount" -ForegroundColor $(if ($errorCount -gt 0) { "Red" } else { "Green" })

if ($cleanedCount -gt 0) {
    Write-Host "`n✅ Secrets removed from documentation files!" -ForegroundColor Green
    Write-Host "`n⚠️  NEXT STEPS (CRITICAL):" -ForegroundColor Yellow
    Write-Host "1. 🔑 Rotate ALL secrets in Razorpay and Supabase dashboards" -ForegroundColor Yellow
    Write-Host "2. 📝 Update .env.local with NEW secrets" -ForegroundColor Yellow
    Write-Host "3. 🔄 Update Supabase Edge Function secrets" -ForegroundColor Yellow
    Write-Host "4. 🗂️  Commit these changes: git add -A && git commit -m 'security: remove exposed secrets'" -ForegroundColor Yellow
    Write-Host "5. 🧹 Clean Git history (see SECURITY_CLEANUP_URGENT.md)" -ForegroundColor Yellow
    Write-Host "`nRead SECURITY_CLEANUP_URGENT.md for detailed instructions!" -ForegroundColor Red
}

Write-Host ""
