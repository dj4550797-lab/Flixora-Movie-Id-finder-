/**
 * FLIXORA SUPER ADMIN AUTHENTICATION SERVICE (PRD v2.0 Section 13 & 22)
 * Security Hardened Implementation (Sprint 2.1 — Fixes BUG-P0-02)
 *
 * Rules:
 * - Single Super Admin account only. Public registration strictly prohibited.
 * - Server-side authorization enforced via Supabase Auth + admin_profiles table.
 * - Insecure offline arbitrary password bypass completely removed.
 * - Production deployments FAIL CLOSED if Supabase connection is unavailable.
 * - Explicit session expiration enforcement (checks token expiry timestamp).
 */

class AdminAuthService {
    constructor() {
        this.STORAGE_KEY = 'flixora_super_admin_session';
        this.currentSession = null;
        this.loadSession();
    }

    /**
     * Determines if current execution context is a local development environment.
     * Prevents any development-specific bypass from functioning on public hosts (e.g. GitHub Pages).
     */
    isLocalDevelopment() {
        const host = window.location.hostname;
        return host === 'localhost' || host === '127.0.0.1' || host === '::1';
    }

    loadSession() {
        const saved = sessionStorage.getItem(this.STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Check session expiration
                if (parsed.expiresAt && Date.now() >= parsed.expiresAt) {
                    console.warn('[AdminAuth] Stored session has expired. Clearing credentials.');
                    this.logout();
                    return;
                }
                this.currentSession = parsed;
            } catch (e) {
                this.currentSession = null;
                sessionStorage.removeItem(this.STORAGE_KEY);
            }
        }
    }

    /**
     * Checks if current user holds an active, non-expired Super Admin session.
     */
    isAuthenticated() {
        if (!this.currentSession) return false;
        if (this.currentSession.expiresAt && Date.now() >= this.currentSession.expiresAt) {
            this.logout();
            return false;
        }
        return this.currentSession.role === 'super_admin';
    }

    /**
     * Authenticates Super Admin credentials against Supabase Auth.
     * Fails closed if Supabase is offline or unconfigured.
     */
    async login(email, password) {
        if (!email || !password) {
            return { success: false, error: 'Email and password are required.' };
        }

        const cleanEmail = email.trim().toLowerCase();

        // 1. Production / Live Supabase Authentication Flow
        if (window.flixoraSupabase && !window.flixoraSupabase.isMock && window.flixoraSupabase.client) {
            try {
                const { data, error } = await window.flixoraSupabase.client.auth.signInWithPassword({
                    email: cleanEmail,
                    password: password
                });

                if (error) {
                    return { success: false, error: error.message || 'Invalid credentials.' };
                }

                if (!data || !data.user || !data.session) {
                    return { success: false, error: 'Authentication failed: No session returned from server.' };
                }

                // 2. Server-Side Super Admin Role Verification
                const { data: adminRecord, error: roleError } = await window.flixoraSupabase.client
                    .from('admin_profiles')
                    .select('role, is_active')
                    .eq('user_id', data.user.id)
                    .single();

                if (roleError || !adminRecord) {
                    await window.flixoraSupabase.client.auth.signOut();
                    return { success: false, error: 'Access Denied: Account lacks administrative privileges.' };
                }

                if (adminRecord.role !== 'super_admin' || !adminRecord.is_active) {
                    await window.flixoraSupabase.client.auth.signOut();
                    return { success: false, error: 'Unauthorized: Super Admin access is revoked or inactive.' };
                }

                // Calculate session expiration timestamp (Supabase provides expires_at in seconds)
                const expiresAt = data.session.expires_at 
                    ? data.session.expires_at * 1000 
                    : Date.now() + (4 * 60 * 60 * 1000); // 4-hour default fallback

                this.currentSession = {
                    email: data.user.email,
                    userId: data.user.id,
                    token: data.session.access_token,
                    role: 'super_admin',
                    expiresAt: expiresAt
                };

                sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.currentSession));
                return { success: true };
            } catch (err) {
                console.error('[AdminAuth] Live authentication exception:', err);
                return { success: false, error: err.message || 'Authentication service error.' };
            }
        }

        // 3. Local Development Mock Isolation (STRICTLY GATED TO LOCALHOST)
        // BUG-P0-02 FIX: Never allow arbitrary passwords or run on production hosts (GitHub Pages)
        if (this.isLocalDevelopment() && window.FLIXORA_DEV_MOCK_AUTH === true) {
            console.warn('[AdminAuth] Local development mock authentication active (localhost only).');
            // Gated test mock requiring deliberate developer configuration
            if (cleanEmail === 'admin@flixora.com' && password === 'FlixoraDevAdmin2026!') {
                this.currentSession = {
                    email: cleanEmail,
                    userId: '00000000-0000-0000-0000-000000000001',
                    token: 'mock-dev-token-' + Date.now(),
                    role: 'super_admin',
                    expiresAt: Date.now() + (2 * 60 * 60 * 1000) // 2 hours
                };
                sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.currentSession));
                return { success: true, devMode: true };
            }
            return { success: false, error: 'Invalid developer credentials for local mock mode.' };
        }

        // 4. FAIL-CLOSED DEFAULT
        // On production hosts or when local dev mock flag is unset, connection failure fails closed.
        return {
            success: false,
            error: 'Authentication Unavailable: Production Supabase backend is not configured or unreachable. Contact the system administrator.'
        };
    }

    /**
     * Terminates the active session and signs out from Supabase if connected.
     */
    async logout() {
        this.currentSession = null;
        sessionStorage.removeItem(this.STORAGE_KEY);

        if (window.flixoraSupabase && window.flixoraSupabase.client && !window.flixoraSupabase.isMock) {
            try {
                await window.flixoraSupabase.client.auth.signOut();
            } catch (e) {
                console.warn('[AdminAuth] SignOut notification error:', e);
            }
        }
    }
}

window.adminAuth = new AdminAuthService();
