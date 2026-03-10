<script>
    import { onMount } from 'svelte';
    import { fade } from 'svelte/transition';
    import Sidebar from '$lib/components/layout/Sidebar.svelte';
    import Toast from '$lib/components/layout/Toast.svelte';
    import { initAuthStore, fetchWithAuth, login } from '$lib/stores/auth';
    import {
        selectedServer as selectedServerStore,
        availableServers as availableServersStore,
        selectServer as guildSelectServer,
        restoreLastServer,
    } from '$lib/stores/guild';
    import { activeDashboardView, activeBotTab } from '$lib/stores/ui';

    import BotConfigPanel from '$lib/components/bot_panel/BotConfigPanel.svelte';
    import MasterPanel from '$lib/components/master_panel/MasterPanel.svelte';
    import ChangelogPanel from '$lib/components/master_panel/ChangelogPanel.svelte';
    import HistoryPanel from '$lib/components/master_panel/HistoryPanel.svelte';

    const SUPER_ADMIN_ID = '285201373266575361';

    let user = null;
    let loading = true;
    let currentView = '';
    let currentBotTab = 'overview';
    let allowedViews = [];
    let servers = [];

    onMount(async () => {
        const authUser = await initAuthStore();
        if (authUser) {
            user = authUser;
            determineAccess(user);
            await fetchUserServers();
        }
        loading = false;

        // Listen for auth changes
        document.addEventListener('auth:loggedIn', (e) => {
            user = e.detail.user;
            determineAccess(user);
        });

        document.addEventListener('auth:loggedOut', () => {
            user = null;
            allowedViews = [];
        });
    });

    function determineAccess(userData) {
        allowedViews = [];
        if (userData.is_active_patron) {
            allowedViews.push({ id: 'config', label: 'Bot Config', icon: 'fa-robot' });
        }
        if (userData.is_master_admin) {
            allowedViews.push({ id: 'master', label: 'Master Panel', icon: 'fa-user-shield' });
            allowedViews.push({ id: 'changelog', label: 'Changelog', icon: 'fa-history' });
        }
        if (userData.id === SUPER_ADMIN_ID) {
            allowedViews.push({ id: 'recovery', label: 'Recovery', icon: 'fa-database' });
        }
        if (allowedViews.length > 0 && !currentView) {
            currentView = allowedViews[0].id;
            activeDashboardView.set(currentView);
        }
    }

    async function fetchUserServers() {
        try {
            const result = await fetchWithAuth('/api/users/guilds');
            if (Array.isArray(result)) {
                servers = result;
                availableServersStore.set(result);
                if (result.length > 0) {
                    restoreLastServer(result);
                } else {
                    guildSelectServer(null);
                }
            }
        } catch (e) {
            console.error('Failed to fetch user servers:', e);
            servers = [];
            availableServersStore.set([]);
        }
    }

    function handleNavigate(e) {
        const { view, tab } = e.detail;
        currentView = view;
        activeDashboardView.set(view);
        if (tab) {
            currentBotTab = tab;
            activeBotTab.set(tab);
        }
    }

    function handleSelectServer(e) {
        const server = e.detail;
        if (server) {
            guildSelectServer(server);
        } else {
            guildSelectServer(null);
        }
    }
</script>

<Toast />
<div class="page-bg"></div>

{#if loading}
    <div class="loading-screen">
        <i class="fas fa-circle-notch fa-spin loading-icon"></i>
    </div>
{:else if !user}
    <div class="auth-screen">
        <div class="auth-card">
            <img src="/logo.webp" alt="Codex Helper" class="auth-logo" />
            <h1>Codex Helper</h1>
            <p>Sign in with Discord to access the dashboard.</p>
            <button class="login-btn" on:click={login}>
                <i class="fa-brands fa-discord"></i>
                <span>Login with Discord</span>
            </button>
        </div>
    </div>
{:else if allowedViews.length === 0}
    <div class="auth-screen">
        <div class="auth-card">
            <i class="fas fa-lock lock-icon"></i>
            <h2>Access Restricted</h2>
            <p>You do not have the required permissions to view this dashboard.</p>
            <p class="sub-text">This area is restricted to active Patrons and Administrators.</p>
            <a
                href="https://www.patreon.com/c/kingscodex"
                target="_blank"
                class="patron-btn"
            >
                Subscribe on Patreon
            </a>
        </div>
    </div>
{:else}
    <div class="dashboard-layout">
        <Sidebar
            {user}
            {servers}
            selectedServer={$selectedServerStore}
            {currentView}
            activeBotTab={currentBotTab}
            {allowedViews}
            on:navigate={handleNavigate}
            on:selectServer={handleSelectServer}
        />

        <main class="content">
            {#key currentView}
                <div class="panel-wrapper" in:fade={{ duration: 150 }}>
                    {#if currentView === 'config'}
                        <BotConfigPanel {user} activeTab={currentBotTab} />
                    {:else if currentView === 'master'}
                        <MasterPanel {user} />
                    {:else if currentView === 'changelog'}
                        <ChangelogPanel {user} />
                    {:else if currentView === 'recovery'}
                        <HistoryPanel {user} />
                    {/if}
                </div>
            {/key}
        </main>
    </div>
{/if}

<style>
    /* Background */
    .page-bg {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: -1;
        pointer-events: none;
        background-image: url('/tool_bg1.webp');
        background-color: var(--bg-primary);
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
    }

    .page-bg::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(
            180deg,
            rgba(17, 24, 39, 0.92) 0%,
            rgba(17, 24, 39, 0.88) 30%,
            rgba(17, 24, 39, 0.95) 100%
        );
    }

    /* Loading & Auth screens */
    .loading-screen,
    .auth-screen {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        background: transparent;
    }

    .loading-icon {
        font-size: 3rem;
        color: var(--accent-blue);
    }

    .auth-card {
        text-align: center;
        padding: 48px 40px;
        background: var(--glass-bg);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid var(--glass-border);
        border-radius: var(--radius-xl);
        max-width: 420px;
        width: 100%;
        margin: 0 20px;
        box-shadow: var(--shadow-lg);
    }

    .auth-logo {
        width: 72px;
        height: 72px;
        margin: 0 auto 20px;
        display: block;
        object-fit: contain;
    }

    .auth-card h1, .auth-card h2 {
        font-size: 1.5rem;
        font-weight: 700;
        margin-bottom: 8px;
    }

    .auth-card p {
        color: var(--text-secondary);
        margin-bottom: 24px;
        font-size: 0.95rem;
    }

    .sub-text {
        font-size: 0.85rem !important;
        color: var(--text-muted) !important;
    }

    .lock-icon {
        font-size: 3rem;
        color: var(--text-muted);
        margin-bottom: 20px;
    }

    .login-btn {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 12px 28px;
        background: var(--accent-discord);
        color: white;
        border-radius: var(--radius-lg);
        font-weight: 600;
        font-size: 1rem;
        transition: all 0.2s;
    }

    .login-btn:hover {
        background: var(--accent-discord-hover);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(88, 101, 242, 0.4);
    }

    .patron-btn {
        display: inline-block;
        padding: 10px 24px;
        background: var(--accent-blue);
        color: white;
        border-radius: var(--radius-lg);
        font-weight: 600;
        font-size: 0.9rem;
        transition: all 0.2s;
    }

    .patron-btn:hover {
        background: var(--accent-blue-hover);
        color: white;
    }

    /* Dashboard layout */
    .dashboard-layout {
        display: flex;
        min-height: 100vh;
    }

    .content {
        flex: 1;
        margin-left: var(--sidebar-width);
        padding: 32px;
        min-height: 100vh;
        max-width: calc(100vw - var(--sidebar-width));
    }

    .panel-wrapper {
        max-width: 1200px;
        margin: 0 auto;
        width: 100%;
    }
</style>
