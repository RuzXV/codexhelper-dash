/**
 * Guild Store — shared state for the currently selected Discord server.
 */
import { writable, derived } from 'svelte/store';
import type { Writable, Readable } from 'svelte/store';

// ── Types ───────────────────────────────────────────────────────────

export interface DiscordServer {
    id: string;
    name: string;
    icon: string | null;
    [key: string]: unknown;
}

export interface DiscordChannel {
    id: string;
    name: string;
    type?: number;
    [key: string]: unknown;
}

export interface DiscordRole {
    id: string;
    name: string;
    color: number;
    [key: string]: unknown;
}

// ── Writable stores ────────────────────────────────────────────────

export const selectedServer: Writable<DiscordServer | null> = writable(null);
export const availableServers: Writable<DiscordServer[]> = writable([]);
export const guildChannels: Writable<DiscordChannel[]> = writable([]);
export const guildSettings: Writable<Record<string, unknown>> = writable({});
export const guildLoading: Writable<boolean> = writable(false);

// ── Derived ────────────────────────────────────────────────────────

export const guildId: Readable<string | null> = derived(selectedServer, ($s) => ($s ? $s.id : null));

// ── Actions ────────────────────────────────────────────────────────

const STORAGE_KEY = 'codex_last_server_id';

export function selectServer(server: DiscordServer | null): void {
    selectedServer.set(server);
    if (server) {
        localStorage.setItem(STORAGE_KEY, server.id);
    } else {
        localStorage.removeItem(STORAGE_KEY);
    }
}

export function restoreLastServer(servers: DiscordServer[]): void {
    const storedId = localStorage.getItem(STORAGE_KEY);
    if (!storedId) return;
    const match = servers.find((s) => s.id === storedId);
    if (match) selectServer(match);
}

type FetchFn = (endpoint: string, options?: RequestInit) => Promise<any>;

export async function loadGuildData(gId: string, fetchFn: FetchFn): Promise<void> {
    guildLoading.set(true);
    try {
        const [settingsRes, channelsRes] = await Promise.all([
            fetchFn(`/api/guilds/${gId}/settings/channels`),
            fetchFn(`/api/guilds/${gId}/channels`),
        ]);
        guildSettings.set(settingsRes?.settings || {});
        guildChannels.set(channelsRes?.channels || []);
    } catch (e) {
        console.error('Failed to load guild data', e);
        guildSettings.set({});
        guildChannels.set([]);
    } finally {
        guildLoading.set(false);
    }
}
