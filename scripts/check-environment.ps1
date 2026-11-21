# ==============================================================================
# Flixora - Environment Checker
# scripts/check-environment.ps1
# ==============================================================================

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
. "$ScriptDir\helpers\logging.ps1"

Write-FlixSection "Flixora Environment Check"

$results = @()

# ------------------------------------------------------------------------------
# 1. Check Node.js
# ------------------------------------------------------------------------------
Write-FlixLog "Checking Node.js installation..."
try {
    $nodeVersion = & node --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        # Strip the leading 'v' and compare
        $versionNumber = $nodeVersion -replace '^v', ''
        $major = [int]($versionNumber -split '\.')[0]
        if ($major -ge 16) {
            Write-FlixSuccess "Node.js $nodeVersion (>= 16 required)"
            $results += [PSCustomObject]@{ Check = "Node.js >= 16"; Status = "PASS"; Detail = $nodeVersion }
        } else {
            Write-FlixError "Node.js $nodeVersion is too old (need >= 16)"
            $results += [PSCustomObject]@{ Check = "Node.js >= 16"; Status = "FAIL"; Detail = "$nodeVersion — upgrade required" }
        }
    } else {
        Write-FlixError "Node.js not found"
        $results += [PSCustomObject]@{ Check = "Node.js >= 16"; Status = "FAIL"; Detail = "Not installed" }
    }
} catch {
    Write-FlixError "Node.js not found on PATH"
    $results += [PSCustomObject]@{ Check = "Node.js >= 16"; Status = "FAIL"; Detail = "Not installed" }
}

# ------------------------------------------------------------------------------
# 2. Check Supabase CLI
# ------------------------------------------------------------------------------
Write-FlixLog "Checking Supabase CLI..."
try {
    $supabaseVersion = & supabase --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-FlixSuccess "Supabase CLI found: $supabaseVersion"
        $results += [PSCustomObject]@{ Check = "Supabase CLI"; Status = "PASS"; Detail = $supabaseVersion }
    } else {
        Write-FlixWarn "Supabase CLI not found (optional — manual SQL deploy available)"
        $results += [PSCustomObject]@{ Check = "Supabase CLI"; Status = "WARN"; Detail = "Not installed (optional)" }
    }
} catch {
    Write-FlixWarn "Supabase CLI not found (optional — manual SQL deploy available)"
    $results += [PSCustomObject]@{ Check = "Supabase CLI"; Status = "WARN"; Detail = "Not installed (optional)" }
}

# ------------------------------------------------------------------------------
# 3. Check .env.example values
# ------------------------------------------------------------------------------
Write-FlixLog "Checking .env.example for required keys..."
$projectRoot = Split-Path -Parent $ScriptDir
$envExamplePath = Join-Path $projectRoot ".env.example"
$envPath        = Join-Path $projectRoot ".env"

if (Test-Path $envExamplePath) {
    $exampleKeys = Get-Content $envExamplePath |
        Where-Object { $_ -match '^\s*[A-Z_]+=?' } |
        ForEach-Object { ($_ -split '=')[0].Trim() }

    $envValues = @{}
    if (Test-Path $envPath) {
        Get-Content $envPath | Where-Object { $_ -match '=' } | ForEach-Object {
            $parts = $_ -split '=', 2
            $envValues[$parts[0].Trim()] = $parts[1].Trim()
        }
    }

    $missingKeys = @()
    foreach ($key in $exampleKeys) {
        if (-not $envValues.ContainsKey($key) -or [string]::IsNullOrWhiteSpace($envValues[$key])) {
            $missingKeys += $key
        }
    }

    if ($missingKeys.Count -eq 0) {
        Write-FlixSuccess "All .env keys are present"
        $results += [PSCustomObject]@{ Check = ".env configuration"; Status = "PASS"; Detail = "All keys present" }
    } else {
        Write-FlixWarn "Missing .env keys: $($missingKeys -join ', ')"
        $results += [PSCustomObject]@{ Check = ".env configuration"; Status = "WARN"; Detail = "Missing: $($missingKeys -join ', ')" }
    }
} else {
    Write-FlixWarn ".env.example not found — skipping key check"
    $results += [PSCustomObject]@{ Check = ".env configuration"; Status = "WARN"; Detail = ".env.example missing" }
}

# ------------------------------------------------------------------------------
# 4. Check Supabase CDN reachability
# ------------------------------------------------------------------------------
Write-FlixLog "Testing Supabase JS CDN reachability..."
$cdnUrl = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"
try {
    $resp = Invoke-WebRequest -Uri $cdnUrl -Method HEAD -TimeoutSec 10 -ErrorAction Stop
    if ($resp.StatusCode -lt 400) {
        Write-FlixSuccess "Supabase JS CDN is reachable (HTTP $($resp.StatusCode))"
        $results += [PSCustomObject]@{ Check = "Supabase CDN"; Status = "PASS"; Detail = "HTTP $($resp.StatusCode)" }
    } else {
        Write-FlixError "Supabase JS CDN returned HTTP $($resp.StatusCode)"
        $results += [PSCustomObject]@{ Check = "Supabase CDN"; Status = "FAIL"; Detail = "HTTP $($resp.StatusCode)" }
    }
} catch {
    Write-FlixError "Cannot reach Supabase JS CDN — check your internet connection"
    $results += [PSCustomObject]@{ Check = "Supabase CDN"; Status = "FAIL"; Detail = "Unreachable" }
}

# ------------------------------------------------------------------------------
# 5. Summary Table
# ------------------------------------------------------------------------------
Write-FlixSection "Summary"

$passCount = ($results | Where-Object { $_.Status -eq "PASS" }).Count
$warnCount = ($results | Where-Object { $_.Status -eq "WARN" }).Count
$failCount = ($results | Where-Object { $_.Status -eq "FAIL" }).Count

foreach ($r in $results) {
    $color = switch ($r.Status) {
        "PASS" { "Green" }
        "WARN" { "Yellow" }
        "FAIL" { "Red" }
    }
    $icon = switch ($r.Status) {
        "PASS" { "[+]" }
        "WARN" { "[!]" }
        "FAIL" { "[x]" }
    }
    Write-Host ("  {0,-6} {1,-30} {2}" -f $icon, $r.Check, $r.Detail) -ForegroundColor $color
}

Write-Host ""
Write-Host ("  Results: {0} passed, {1} warnings, {2} failed" -f $passCount, $warnCount, $failCount) -ForegroundColor White

if ($failCount -eq 0) {
    Write-FlixSuccess "Environment looks good! Run setup-supabase.ps1 to configure."
} else {
    Write-FlixError "Fix the failed checks before continuing."
}

Write-Host ""
