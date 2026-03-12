import { fetchWithAuth, getApiBase } from '$lib/api/client';

const CACHE_KEY = 'codex-auth-user';
const CACHE_DURATION_MS = 5 * 60 * 1000;

export interface AuthUser {
    id: string;
    username: string;
    discriminator?: string;
    avatar: string | null;
    global_name?: string | null;
    display_name?: string | null;
    is_active_patron?: boolean;
    is_master_admin?: boolean;
    [key: string]: unknown;
}

let currentUser: AuthUser | null = null;

export function getLoggedInUser(): AuthUser | null {
    return currentUser;
}

function cacheUser(user: AuthUser): void {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), user }));
}

function clearUserCache(): void {
    localStorage.removeItem(CACHE_KEY);
}

function getCachedUser(): AuthUser | null {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (!cached) return null;
        const { timestamp, user } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION_MS) return user;
        clearUserCache();
        return null;
    } catch {
        clearUserCache();
        return null;
    }
}

export function login(): void {
    const returnTo = encodeURIComponent(window.location.origin);
    window.location.href = `${getApiBase()}/api/auth/login?return_to=${returnTo}`;
}

export async function logout(): Promise<void> {
    try {
        await fetch(`${getApiBase()}/api/auth/logout`, {
            method: 'POST',
            credentials: 'include',
        });
    } catch (e) {
        console.error('Logout request failed:', e);
    } finally {
        currentUser = null;
        clearUserCache();
        window.location.reload();
    }
}

/**
 * Initialize auth — checks cache, then validates with API.
 * Returns the user if authenticated, null otherwise.
 */
export async function init(): Promise<AuthUser | null> {
    // Dev bypass mode — skip Discord login entirely
    if (import.meta.env.VITE_DEV_BYPASS === 'true') {
        const devUser: AuthUser = {
            id: '285201373266575361',
            username: 'DevBypass',
            discriminator: '0',
            avatar: null,
            global_name: 'Dev Bypass',
            display_name: 'Dev Bypass',
            is_active_patron: true,
            is_master_admin: true,
        };
        currentUser = devUser;
        document.dispatchEvent(new CustomEvent('auth:loggedIn', { detail: { user: devUser } }));
        return devUser;
    }

    // Check cache for instant display
    const cached = getCachedUser();
    if (cached) {
        currentUser = cached;
        document.dispatchEvent(new CustomEvent('auth:loggedIn', { detail: { user: cached } }));
        // Refresh in background
        refreshAuth();
        return cached;
    }

    // No cache — fetch from API
    try {
        const user = await fetchWithAuth('/api/users/@me');
        currentUser = user;
        cacheUser(user);
        document.dispatchEvent(new CustomEvent('auth:loggedIn', { detail: { user } }));
        return user;
    } catch {
        currentUser = null;
        clearUserCache();
        return null;
    }
}

async function refreshAuth(): Promise<void> {
    try {
        const user = await fetchWithAuth('/api/users/@me');
        currentUser = user;
        cacheUser(user);
        document.dispatchEvent(new CustomEvent('auth:loggedIn', { detail: { user } }));
    } catch (e: any) {
        // Only clear session on actual auth failure (401), not network errors
        if (e?.message === 'Session expired') {
            currentUser = null;
            clearUserCache();
            document.dispatchEvent(new CustomEvent('auth:loggedOut'));
        }
        // Network errors silently ignored — keep using cached user
    }
}
