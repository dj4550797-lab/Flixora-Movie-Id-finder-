# ==============================================================================
# Flixora - Supabase Configuration Setup
# scripts/setup-supabase.ps1
#
# Usage:
#   .\setup-supabase.ps1          # Interactive mode
#   .\setup-supabase.ps1 -Auto    # Read from .env file automatically
# ==============================================================================

param(
    [switch]$Auto
)

$ScriptDir   = Split-Path -Parent $MyInvocation.MyCommand.Definition
$ProjectRoot = Split-Path -Parent $ScriptDir

. "$ScriptDir\helpers\logging.ps1"
. "$ScriptDir\helpers\validation.ps1"

Write-FlixSection "Flixora Supabase Configuration"

$supabaseUrl  = ""
$supabaseKey  = ""
$envFilePath  = Join-Path $ProjectRoot ".env"

# ==============================================================================
# MODE B — Auto: read from existing .env
# ==============================================================================
if ($Auto) {
    Write-FlixLog "Auto mode: reading credentials from .env file..."

    if (-not (Test-Path $envFilePath)) {
        Write-FlixError ".env file not found at: $envFilePath"
        Write-FlixWarn "Run without -Auto to enter credentials interactively."
        exit 1
    }

    $envContent = Get-Content $envFilePath
    foreach ($line in $envContent) {
        if ($line -match '^SUPABASE_URL\s*=\s*(.+)$') {
            $supabaseUrl = $Matches[1].Trim()
        }
        if ($line -match '^SUPABASE_ANON_KEY\s*=\s*(.+)$') {
            $supabaseKey = $Matches[1].Trim()
        }
    }

    if ([string]::IsNullOrWhiteSpace($supabaseUrl) -or [string]::IsNullOrWhiteSpace($supabaseKey)) {
        Write-FlixError "SUPABASE_URL or SUPABASE_ANON_KEY is missing in .env"
        exit 1
    }

    Write-FlixSuccess "Loaded URL: $supabaseUrl"
    Write-FlixSuccess "Loaded Key: $($supabaseKey.Substring(0, [Math]::Min(20, $supabaseKey.Length)))..."
}
# ==============================================================================
# MODE A — Interactive: prompt the user
# ==============================================================================
else {
    Write-FlixLog "You will need your Supabase Project URL and anon key."
    Write-FlixLog "Find these at: https://app.supabase.com > Project Settings > API"
    Write-Host ""

    # --- URL ---
    do {
        Write-Host "  Enter Supabase Project URL (e.g. https://xyzxyz.supabase.co): " -ForegroundColor Cyan -NoNewline
        $supabaseUrl = Read-Host
        $supabaseUrl = $supabaseUrl.TrimEnd('/')
        if (-not (Test-SupabaseUrl $supabaseUrl)) {
            Write-FlixError "Invalid URL. Must be https://<project-ref>.supabase.co"
        }
    } while (-not (Test-SupabaseUrl $supabaseUrl))

    Write-FlixSuccess "URL looks valid."

    # --- Anon Key ---
    do {
        Write-Host "  Enter Supabase Anon Key: " -ForegroundColor Cyan -NoNewline
        $supabaseKey = Read-Host
        if (-not (Test-SupabaseAnonKey $supabaseKey)) {
            Write-FlixError "Invalid key. Must start with 'sb_publishable_' or be a JWT (eyJ...)."
        }
    } while (-not (Test-SupabaseAnonKey $supabaseKey))

    Write-FlixSuccess "Anon key looks valid."
}

# ==============================================================================
# Network connectivity test
# ==============================================================================
Write-Host ""
Write-FlixLog "Testing connection to Supabase project..."
$testUrl = "$supabaseUrl/rest/v1/"
if (Test-NetworkConnectivity $testUrl) {
    Write-FlixSuccess "Connection test PASSED — Supabase project is reachable."
} else {
    Write-FlixWarn "Connection test FAILED — project may not exist yet or network is blocked."
    Write-FlixWarn "Continuing anyway; you can re-run this script after the project is ready."
}

# ==============================================================================
# Write to js/supabase-client.js
# ==============================================================================
Write-Host ""
Write-FlixLog "Writing credentials to js/supabase-client.js..."

$clientJsPath = Join-Path $ProjectRoot "js\supabase-client.js"

if (Test-Path $clientJsPath) {
    $content = Get-Content $clientJsPath -Raw

    # Replace the URL constant line
    $content = $content -replace "(const\s+SUPABASE_URL\s*=\s*)['\`"][^'\`"]*['\`"]", "`$1'$supabaseUrl'"
    # Replace the anon key constant line
    $content = $content -replace "(const\s+SUPABASE_ANON_KEY\s*=\s*)['\`"][^'\`"]*['\`"]", "`$1'$supabaseKey'"

    Set-Content -Path $clientJsPath -Value $content -Encoding UTF8
    Write-FlixSuccess "Updated: js/supabase-client.js"
} else {
    # File doesn't exist yet — create a minimal one
    Write-FlixWarn "js/supabase-client.js not found — creating it from template..."
    New-Item -ItemType Directory -Path (Join-Path $ProjectRoot "js") -Force | Out-Null
    $template = @"
// ==============================================================================
// Flixora - Supabase Client Configuration
// Auto-generated by setup-supabase.ps1 — do not edit URL/key manually.
// ==============================================================================

const SUPABASE_URL = '$supabaseUrl';
const SUPABASE_ANON_KEY = '$supabaseKey';

// Initialize the Supabase client (CDN build)
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export { supabase, SUPABASE_URL, SUPABASE_ANON_KEY };
"@
    Set-Content -Path $clientJsPath -Value $template -Encoding UTF8
    Write-FlixSuccess "Created: js/supabase-client.js"
}

# ==============================================================================
# Write / update .env file
# ==============================================================================
Write-FlixLog "Writing .env file..."

$envLines = @(
    "# Flixora Environment Configuration",
    "# Generated by setup-supabase.ps1 on $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')",
    "",
    "SUPABASE_URL=$supabaseUrl",
    "SUPABASE_ANON_KEY=$supabaseKey"
)

Set-Content -Path $envFilePath -Value ($envLines -join "`n") -Encoding UTF8
Write-FlixSuccess "Created/updated: .env"

# ==============================================================================
# Done
# ==============================================================================
Write-Host ""
Write-FlixSection "Setup Complete"
Write-FlixSuccess "Supabase credentials have been saved."
Write-FlixLog "Next step: run scripts\deploy-supabase.ps1 to push the database schema."
Write-Host ""
