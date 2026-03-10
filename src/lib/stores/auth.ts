/**
 * Auth Store — reactive Svelte store wrapping the auth module.
 */
import { writable, derived } from 'svelte/store';
import type { Writable, Readable } from 'svelte/store';
import { init, getLoggedInUser, login, logout } from '$lib/auth/auth';
import type { AuthUser } from '$lib/auth/auth';
import { fetchWithAuth } from '$lib/api/client';

export type { AuthUser };

// ── Internal state ─────────────────────────────────────────────────
const _user: Writable<AuthUser | null> = writable(null);

// ── Public stores ──────────────────────────────────────────────────

/** Readable store: current logged-in user object or null */
export const authUser: { subscribe: Writable<AuthUser | null>['subscribe'] } = {
    subscribe: _user.subscribe,
};

/** Whether a user is currently authenticated */
export const isLoggedIn: Readable<boolean> = derived(_user, ($u) => $u !== null);

// ── Init ──────────────────────────────────────────────────────────

/**
 * Initialize the auth store. Call once on app mount.
 */
export async function initAuthStore(): Promise<AuthUser | null> {
    // Listen for auth events
    document.addEventListener('auth:loggedIn', ((e: CustomEvent) => {
        _user.set(e.detail.user);
    }) as EventListener);

    document.addEventListener('auth:loggedOut', () => {
        _user.set(null);
    });

    document.addEventListener('auth:sessionExpired', () => {
        _user.set(null);
    });

    const user = await init();
    if (user) _user.set(user);
    return user;
}

export function clearAuth(): void {
    _user.set(null);
}

// ── Re-exports ────────────────────────────────────────────────────
export { fetchWithAuth, login, logout, getLoggedInUser };
