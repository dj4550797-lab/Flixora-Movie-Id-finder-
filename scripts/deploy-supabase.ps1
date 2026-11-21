# ==============================================================================
# Flixora - Database Deployment Helper
# scripts/deploy-supabase.ps1
# ==============================================================================

$ScriptDir      = Split-Path -Parent $MyInvocation.MyCommand.Definition
$ProjectRoot    = Split-Path -Parent $ScriptDir
$MigrationFile  = Join-Path $ProjectRoot "supabase\migrations\20261121_flixora_complete_one_click.sql"

. "$ScriptDir\helpers\logging.ps1"

Write-FlixSection "Flixora Database Deployment"

# Verify the migration file exists
if (-not (Test-Path $MigrationFile)) {
    Write-FlixError "Migration file not found:"
    Write-FlixError "  $MigrationFile"
    Write-FlixLog "Make sure you have the full project files. Check setup\SUPABASE_SETUP.md for details."
    exit 1
}

Write-FlixSuccess "Migration file found: 20261121_flixora_complete_one_click.sql"

# ==============================================================================
# Check if Supabase CLI is available
# ==============================================================================
$cliAvailable = $false
try {
    $ver = & supabase --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        $cliAvailable = $true
        Write-FlixSuccess "Supabase CLI detected: $ver"
    }
} catch {
    $cliAvailable = $false
}

# ==============================================================================
# PATH A — CLI available: run db push
# ==============================================================================
if ($cliAvailable) {
    Write-FlixLog "Running 'supabase db push' with the master migration..."
    Write-Host ""

    Push-Location $ProjectRoot
    try {
        & supabase db push --db-url (Get-Content (Join-Path $ProjectRoot ".env") | Where-Object { $_ -match '^DATABASE_URL=' } | ForEach-Object { ($_ -split '=', 2)[1] }) 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-FlixSuccess "Database schema deployed successfully!"
        } else {
            Write-FlixWarn "supabase db push returned a non-zero exit code."
            Write-FlixWarn "Falling back to manual instructions below."
            $cliAvailable = $false   # fall through to manual path
        }
    } catch {
        Write-FlixError "Error running supabase CLI: $_"
        $cliAvailable = $false
    } finally {
        Pop-Location
    }
}

# ==============================================================================
# PATH B — Manual fallback instructions
# ==============================================================================
if (-not $cliAvailable) {
    Write-Host ""
    Write-FlixSection "Manual Deployment Instructions"

    Write-Host "  The Supabase CLI is not installed (or db push failed)." -ForegroundColor Yellow
    Write-Host "  Follow these steps to deploy the database manually:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Step 1: Open your Supabase project dashboard" -ForegroundColor Cyan
    Write-Host "          https://app.supabase.com" -ForegroundColor White
    Write-Host ""
    Write-Host "  Step 2: Navigate to:" -ForegroundColor Cyan
    Write-Host "          SQL Editor  (left sidebar)" -ForegroundColor White
    Write-Host ""
    Write-Host "  Step 3: Click '+ New Query'" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Step 4: Paste the contents of this file into the SQL editor:" -ForegroundColor Cyan
    Write-Host "          $MigrationFile" -ForegroundColor White
    Write-Host ""
    Write-Host "  Step 5: Click 'Run' (or press Ctrl+Enter)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Step 6: Wait for the query to complete." -ForegroundColor Cyan
    Write-Host "          You should see 'Success. No rows returned.'" -ForegroundColor White
    Write-Host ""

    # Copy the SQL file to clipboard
    Write-FlixLog "Copying SQL migration to clipboard..."
    try {
        $sqlContent = Get-Content $MigrationFile -Raw
        Set-Clipboard -Value $sqlContent
        Write-FlixSuccess "SQL copied to clipboard! Paste it directly into the Supabase SQL Editor."
    } catch {
        Write-FlixWarn "Could not copy to clipboard automatically."
        Write-FlixWarn "Please open the file manually: $MigrationFile"
    }
}

# ==============================================================================
# Done
# ==============================================================================
Write-Host ""
Write-FlixSection "Next Steps"
Write-FlixLog "After the database is deployed:"
Write-Host "   1. Create an admin user via Supabase Auth dashboard (Authentication > Users > Invite)" -ForegroundColor White
Write-Host "   2. Update the user's role to 'admin' in the profiles table" -ForegroundColor White
Write-Host "   3. Open index.html in your browser to verify the setup" -ForegroundColor White
Write-Host ""
Write-FlixLog "Full setup guide: setup\SUPABASE_SETUP.md"
Write-Host ""
