# ==============================================================================
# Flixora - Logging Helpers
# scripts/helpers/logging.ps1
# ==============================================================================

function Write-FlixLog {
    param([string]$Message, [string]$Prefix = "INFO")
    Write-Host "  [$Prefix] $Message" -ForegroundColor Cyan
}

function Write-FlixSuccess {
    param([string]$Message, [string]$Prefix = "OK")
    Write-Host "  [$Prefix] $Message" -ForegroundColor Green
}

function Write-FlixWarn {
    param([string]$Message, [string]$Prefix = "WARN")
    Write-Host "  [$Prefix] $Message" -ForegroundColor Yellow
}

function Write-FlixError {
    param([string]$Message, [string]$Prefix = "FAIL")
    Write-Host "  [$Prefix] $Message" -ForegroundColor Red
}

function Write-FlixSection {
    param([string]$Title)
    $line = "=" * 60
    Write-Host ""
    Write-Host $line -ForegroundColor Blue
    Write-Host "  $Title" -ForegroundColor Blue
    Write-Host $line -ForegroundColor Blue
    Write-Host ""
}
