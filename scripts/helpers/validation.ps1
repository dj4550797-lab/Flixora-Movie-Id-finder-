# ==============================================================================
# Flixora - Validation Helpers
# scripts/helpers/validation.ps1
# ==============================================================================

function Test-SupabaseUrl {
    param([string]$url)
    if ([string]::IsNullOrWhiteSpace($url)) { return $false }
    # Must be a valid HTTPS URL pointing to supabase.co
    if ($url -match '^https://[a-zA-Z0-9]+\.supabase\.co/?$') {
        return $true
    }
    return $false
}

function Test-SupabaseAnonKey {
    param([string]$key)
    if ([string]::IsNullOrWhiteSpace($key)) { return $false }
    # Anon keys start with sb_publishable_ (new format) or eyJ (legacy JWT format)
    if ($key -match '^sb_publishable_' -or $key -match '^eyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$') {
        return $true
    }
    return $false
}

function Test-NetworkConnectivity {
    param([string]$url)
    try {
        $response = Invoke-WebRequest -Uri $url -Method GET -TimeoutSec 10 -ErrorAction Stop
        # 200 OK means reachable
        if ($response.StatusCode -eq 200) { return $true }
        return $false
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        # 401 Unauthorized still means the server is reachable
        if ($statusCode -eq 401) { return $true }
        return $false
    }
}
