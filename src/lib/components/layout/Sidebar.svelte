<script>
    import { createEventDispatcher } from 'svelte';
    import ServerSelector from './ServerSelector.svelte';
    import UserProfile from './UserProfile.svelte';

    const dispatch = createEventDispatcher();

    export let user;
    export let servers = [];
    export let selectedServer = null;
    export let currentView = '';
    export let activeBotTab = 'overview';
    export let allowedViews = [];

    let botConfigExpanded = true;

    const BOT_TABS = [
        { id: 'overview', label: 'Overview', icon: 'fa-gauge-high' },
        { id: 'channels', label: 'Channels', icon: 'fa-hashtag' },
        { id: 'calendar', label: 'Event Calendar', icon: 'fa-calendar-alt' },
        { id: 'reminders', label: 'Reminders', icon: 'fa-bell' },
        { id: 'mge', label: 'MGE', icon: 'fa-trophy' },
        { id: 'ark', label: 'Ark of Osiris', icon: 'fa-shield-alt' },
    ];

    function hasView(id) {
        return allowedViews.some((v) => v.id === id);
    }

    function handleNavClick(viewId, tabId = null) {
        dispatch('navigate', { view: viewId, tab: tabId });
    }

    function handleSelectServer(e) {
        dispatch('selectServer', e.detail);
    }

    function toggleBotConfig() {
        if (currentView !== 'config') {
            handleNavClick('config', 'overview');
            botConfigExpanded = true;
        } else {
            botConfigExpanded = !botConfigExpanded;
        }
    }
</script>

<aside class="sidebar">
    <div class="sidebar-top">
        <!-- Brand -->
        <div class="brand">
            <img src="/logo.webp" alt="Codex Helper" class="brand-logo" />
            <span class="brand-text">Codex Helper</span>
        </div>

        <!-- Server Selector -->
        <ServerSelector
            {servers}
            {selectedServer}
            on:select={handleSelectServer}
        />

        <!-- Navigation -->
        <nav class="nav">
            {#if hasView('config')}
                <div class="nav-section">
                    <button
                        class="nav-item parent"
                        class:active={currentView === 'config'}
                        on:click={toggleBotConfig}
                    >
                        <i class="fas fa-robot"></i>
                        <span>Bot Config</span>
                        <i
                            class="fas fa-chevron-right expand-icon"
                            class:expanded={currentView === 'config' && botConfigExpanded}
                        ></i>
                    </button>

                    {#if currentView === 'config' && botConfigExpanded}
                        <div class="sub-nav">
                            {#each BOT_TABS as tab}
                                <button
                                    class="nav-item sub"
                                    class:active={activeBotTab === tab.id}
                                    on:click={() => handleNavClick('config', tab.id)}
                                >
                                    <i class="fas {tab.icon}"></i>
                                    <span>{tab.label}</span>
                                </button>
                            {/each}
                        </div>
                    {/if}
                </div>
            {/if}

            {#if hasView('master')}
                <button
                    class="nav-item"
                    class:active={currentView === 'master'}
                    on:click={() => handleNavClick('master')}
                >
                    <i class="fas fa-user-shield"></i>
                    <span>Master Panel</span>
                </button>
            {/if}

            {#if hasView('changelog')}
                <button
                    class="nav-item"
                    class:active={currentView === 'changelog'}
                    on:click={() => handleNavClick('changelog')}
                >
                    <i class="fas fa-history"></i>
                    <span>Changelog</span>
                </button>
            {/if}

            {#if hasView('recovery')}
                <button
                    class="nav-item"
                    class:active={currentView === 'recovery'}
                    on:click={() => handleNavClick('recovery')}
                >
                    <i class="fas fa-database"></i>
                    <span>Recovery</span>
                </button>
            {/if}
        </nav>
    </div>

    <!-- User Profile (pinned to bottom) -->
    <UserProfile {user} />
</aside>

<style>
    .sidebar {
        width: var(--sidebar-width);
        height: 100vh;
        position: fixed;
        top: 0;
        left: 0;
        background: var(--bg-sidebar);
        border-right: 1px solid var(--border-color);
        display: flex;
        flex-direction: column;
        z-index: 100;
        overflow: hidden;
    }

    .sidebar-top {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow-y: auto;
        overflow-x: hidden;
    }

    /* Brand */
    .brand {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 18px 20px 8px;
    }

    .brand-logo {
        width: 32px;
        height: 32px;
        border-radius: var(--radius-md);
        flex-shrink: 0;
        object-fit: contain;
    }

    .brand-text {
        font-weight: 700;
        font-size: 1rem;
        color: var(--text-primary);
    }

    /* Navigation */
    .nav {
        padding: 8px 12px;
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .nav-section {
        display: flex;
        flex-direction: column;
    }

    .nav-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 9px 12px;
        border-radius: var(--radius-md);
        color: var(--text-secondary);
        font-size: 0.875rem;
        font-weight: 500;
        transition: all 0.15s;
        width: 100%;
        text-align: left;
        position: relative;
    }

    .nav-item:hover {
        background: var(--nav-item-hover);
        color: var(--text-primary);
    }

    .nav-item.active {
        background: var(--nav-item-active);
        color: var(--accent-blue);
        border-left: 3px solid var(--accent-blue);
        padding-left: 9px;
    }

    .nav-item i:first-child {
        width: 18px;
        text-align: center;
        font-size: 0.85rem;
        flex-shrink: 0;
    }

    .nav-item.parent {
        font-weight: 600;
    }

    .expand-icon {
        margin-left: auto;
        font-size: 0.65rem;
        transition: transform 0.2s;
        color: var(--text-muted);
    }

    .expand-icon.expanded {
        transform: rotate(90deg);
    }

    .sub-nav {
        padding-left: 12px;
        margin-top: 2px;
        display: flex;
        flex-direction: column;
        gap: 1px;
    }

    .nav-item.sub {
        padding: 7px 12px;
        font-size: 0.825rem;
        font-weight: 400;
        color: var(--text-muted);
    }

    .nav-item.sub:hover {
        color: var(--text-secondary);
    }

    .nav-item.sub.active {
        color: var(--accent-blue);
        background: var(--nav-item-active);
        border-left: 3px solid var(--accent-blue);
        padding-left: 9px;
    }

    .nav-item.sub i:first-child {
        font-size: 0.75rem;
    }
</style>
