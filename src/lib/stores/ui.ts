/**
 * UI Store — shared state for common UI patterns.
 */
import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';

// ── Toast / notification ───────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'info';

export interface ToastState {
    message: string;
    type: ToastType;
    visible: boolean;
}

export const toastMessage: Writable<ToastState> = writable({ message: '', type: 'info', visible: false });

let _toastTimer: ReturnType<typeof setTimeout> | null = null;

export function showToast(message: string, type: ToastType = 'success', duration: number = 3000): void {
    if (_toastTimer) clearTimeout(_toastTimer);
    toastMessage.set({ message, type, visible: true });
    _toastTimer = setTimeout(() => {
        toastMessage.update((t) => ({ ...t, visible: false }));
    }, duration);
}

export function hideToast(): void {
    if (_toastTimer) clearTimeout(_toastTimer);
    toastMessage.set({ message: '', type: 'info', visible: false });
}

// ── Active dashboard tab ───────────────────────────────────────────

export const activeDashboardView: Writable<string> = writable('');
export const activeBotTab: Writable<string> = writable('overview');
