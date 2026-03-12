const API_BASE = import.meta.env.VITE_API_BASE || 'https://codexhelper.com';
const DEV_BYPASS = import.meta.env.VITE_DEV_BYPASS === 'true';

// ── Dev bypass mock data ─────────────────────────────────────────
const MOCK_GUILD_ID = '1473637583882948678';

const MOCK_CHANNELS = [
    { id: '1000000000000000001', name: 'general', type: 0 },
    { id: '1000000000000000002', name: 'bot-commands', type: 0 },
    { id: '1000000000000000003', name: 'reminders', type: 0 },
    { id: '1000000000000000004', name: 'test-commands', type: 0 },
    { id: '1000000000000000005', name: 'ark-signups', type: 0 },
    { id: '1000000000000000006', name: 'mge-info', type: 0 },
    { id: '1000000000000000007', name: 'calendar', type: 0 },
];

const MOCK_ROLES = [
    { id: '2000000000000000001', name: 'Admin', color: 0xff0000 },
    { id: '2000000000000000002', name: 'Moderator', color: 0x00ff00 },
    { id: '2000000000000000003', name: 'Member', color: 0x0000ff },
    { id: '2000000000000000004', name: 'Ruins Reminder', color: 0xffa500 },
    { id: '2000000000000000005', name: 'Altar Reminder', color: 0x800080 },
];

function getDevMockResponse(endpoint: string, options: RequestInit = {}): any | null {
    const path = endpoint.replace(/^\/api/, '');

    // User endpoints
    if (path === '/users/@me') {
        return {
            id: '285201373266575361',
            username: 'DevBypass',
            discriminator: '0',
            avatar: null,
            global_name: 'Dev Bypass',
            is_active_patron: true,
            is_master_admin: true,
        };
    }

    if (path === '/users/guilds') {
        return [
            {
                id: MOCK_GUILD_ID,
                name: "Ruz's Basement",
                icon: null,
                owner: true,
                permissions: 2147483647,
            },
        ];
    }

    // Guild-specific endpoints
    const guildMatch = path.match(/^\/guilds\/(\d+)\/(.*)/);
    if (guildMatch) {
        const subpath = guildMatch[2];

        if (subpath === 'channels') return { channels: MOCK_CHANNELS };
        if (subpath === 'roles') return { roles: MOCK_ROLES };

        if (subpath === 'settings/channels') {
            if (options.method === 'POST') {
                console.log('[DEV] Mock save channels:', options.body);
                return { success: true };
            }
            return { settings: { all_commands: '1000000000000000004' } };
        }

        if (subpath === 'features') {
            return {
                features: {
                    ark: { enabled: true, channel_id: '1000000000000000005' },
                    mge: { enabled: false, channel_id: null },
                    ruins: { enabled: true, channel_id: '1000000000000000003' },
                    altar: { enabled: false, channel_id: null },
                    calendar: { enabled: true, channel_id: '1000000000000000007' },
                },
                patron: {
                    id: '285201373266575361',
                    username: 'DevBypass',
                    avatar: null,
                    discriminator: '0',
                    is_bypass: false,
                },
            };
        }

        if (subpath === 'calendar') {
            return { config: { channel_id: '1000000000000000007' } };
        }

        if (subpath === 'reminders') {
            if (options.method === 'POST') {
                console.log('[DEV] Mock save reminders:', options.body);
                return { success: true };
            }
            const now = Math.floor(Date.now() / 1000);
            return {
                reminders: [
                    {
                        reminder_type: 'ruins',
                        channel_id: '1000000000000000003',
                        is_active: true,
                        create_discord_events: false,
                        role_id: '2000000000000000004',
                        role_menu_message_id: '3000000000000000001',
                        first_instance_ts: now - 50000,
                        last_instance_ts: now + 7776000,
                        reminder_intervals_seconds: '3600,14400',
                    },
                    {
                        reminder_type: 'altar',
                        channel_id: null,
                        is_active: false,
                        create_discord_events: false,
                        role_id: null,
                        role_menu_message_id: null,
                        first_instance_ts: 0,
                        last_instance_ts: 0,
                        reminder_intervals_seconds: '14400',
                    },
                ],
                customReminders: [
                    {
                        reminder_id: 1,
                        channel_id: '1000000000000000003',
                        title: 'Silk Trader',
                        message: 'Silk trader is open!',
                        role_id: null,
                        repeat_interval_seconds: 259200,
                        first_instance_ts: now - 10000,
                        reminder_intervals_seconds: '3600',
                        is_active: true,
                        create_discord_event: false,
                    },
                ],
            };
        }

        // Default mock for unknown guild endpoints
        if (options.method === 'POST' || options.method === 'PUT' || options.method === 'DELETE') {
            console.log(`[DEV] Mock ${options.method} ${endpoint}:`, options.body);
            return { success: true };
        }
        return {};
    }

    return null; // Not mocked — fall through to real API
}

// ── Core fetch logic ─────────────────────────────────────────────

async function doFetch(url: string, options: RequestInit): Promise<Response> {
    return fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
            ...options.headers,
            'Content-Type': 'application/json',
        },
    });
}

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}): Promise<any> {
    // Dev bypass — return mock data if available
    if (DEV_BYPASS) {
        const mock = getDevMockResponse(endpoint, options);
        if (mock !== null) return mock;
    }

    const url = endpoint.startsWith('/') ? `${API_BASE}${endpoint}` : endpoint;

    let response = await doFetch(url, options);

    // Retry once on 503 (transient/service unavailable) or 403 on GET (possible auth race condition)
    if (response.status === 503 || (response.status === 403 && (!options.method || options.method === 'GET'))) {
        await new Promise((r) => setTimeout(r, 1000));
        response = await doFetch(url, options);
    }

    if (!response.ok) {
        if (response.status === 401) {
            // Session expired — trigger logout
            document.dispatchEvent(new CustomEvent('auth:sessionExpired'));
            throw new Error('Session expired');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `API request failed with status ${response.status}`);
    }

    return response.json().catch(() => ({}));
}

export function getApiBase(): string {
    return API_BASE;
}
