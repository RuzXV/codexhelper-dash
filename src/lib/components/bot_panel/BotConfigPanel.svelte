<script>
    import { fade } from 'svelte/transition';
    import EventCalendarConfig from './EventCalendarConfig.svelte';
    import OverviewConfig from './OverviewConfig.svelte';
    import ChannelConfig from './ChannelConfig.svelte';
    import RemindersConfig from './RemindersConfig.svelte';
    import ArkConfig from './ArkConfig.svelte';
    import MGEConfig from './MGEConfig.svelte';
    import { fetchWithAuth } from '$lib/stores/auth';
    import { selectedServer } from '$lib/stores/guild';

    export let user;
    export let activeTab = 'overview';

    let loading = false;
    let currentSettings = {};
    let guildChannels = [];
    let guildRoles = [];

    $: if ($selectedServer) {
        loadServerData($selectedServer.id);
    }

    async function loadServerData(guildId) {
        loading = true;
        try {
            const [settingsRes, channelsRes, rolesRes] = await Promise.all([
                fetchWithAuth(`/api/guilds/${guildId}/settings/channels`),
                fetchWithAuth(`/api/guilds/${guildId}/channels`),
                fetchWithAuth(`/api/guilds/${guildId}/roles`),
            ]);
            currentSettings = settingsRes?.settings || {};
            guildChannels = channelsRes?.channels || [];
            guildRoles = rolesRes?.roles || [];
        } catch (e) {
            console.error('Failed to load server data', e);
        } finally {
            loading = false;
        }
    }

    function handleSettingsUpdate(e) {
        currentSettings = e.detail.settings;
    }
</script>

<div class="bot-config">
    {#if !$selectedServer}
        <div class="no-server">
            <div class="no-server-icon">
                <i class="fas fa-server"></i>
            </div>
            <h2>No Server Selected</h2>
            <p>Select a server from the sidebar to configure the bot.</p>
        </div>
    {:else if loading}
        <div class="loading-state">
            <i class="fas fa-circle-notch fa-spin"></i>
            <span>Loading configuration...</span>
        </div>
    {:else}
        <div class="panel-header">
            <h1>{$selectedServer.name}</h1>
            <span class="tab-badge">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</span>
        </div>

        {#key activeTab}
            <div class="tab-content" in:fade={{ duration: 150 }}>
                {#if activeTab === 'overview'}
                    <OverviewConfig
                        selectedServer={$selectedServer}
                        {guildChannels}
                        channelSettings={currentSettings}
                    />
                {:else if activeTab === 'channels'}
                    <ChannelConfig
                        guildId={$selectedServer.id}
                        {guildChannels}
                        initialSettings={currentSettings}
                        on:settingsUpdated={handleSettingsUpdate}
                    />
                {:else if activeTab === 'calendar'}
                    <EventCalendarConfig guildId={$selectedServer.id} channels={guildChannels} />
                {:else if activeTab === 'reminders'}
                    <RemindersConfig guildId={$selectedServer.id} channels={guildChannels} roles={guildRoles} />
                {:else if activeTab === 'ark'}
                    <ArkConfig guildId={$selectedServer.id} channels={guildChannels} roles={guildRoles} />
                {:else if activeTab === 'mge'}
                    <MGEConfig guildId={$selectedServer.id} channels={guildChannels} roles={guildRoles} />
                {/if}
            </div>
        {/key}
    {/if}
</div>

<style>
    .bot-config {
        display: flex;
        flex-direction: column;
        gap: 24px;
    }

    .no-server {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 80px 20px;
        text-align: center;
    }

    .no-server-icon {
        width: 80px;
        height: 80px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--card-bg);
        border: 1px solid var(--card-border);
        border-radius: 50%;
        margin-bottom: 20px;
        font-size: 2rem;
        color: var(--text-muted);
        box-shadow: var(--card-shadow);
    }

    .no-server h2 {
        font-size: 1.3rem;
        font-weight: 700;
        margin-bottom: 8px;
    }

    .no-server p {
        color: var(--text-secondary);
        font-size: 0.95rem;
    }

    .loading-state {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        padding: 80px 20px;
        color: var(--text-secondary);
        font-size: 1.05rem;
    }

    .loading-state i {
        font-size: 1.3rem;
        color: var(--accent-blue);
    }

    .panel-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding-bottom: 16px;
        border-bottom: 1px solid var(--card-border);
    }

    .panel-header h1 {
        font-size: 1.3rem;
        font-weight: 700;
        margin: 0;
    }

    .tab-badge {
        background: var(--accent-blue-light);
        color: var(--accent-blue);
        padding: 3px 10px;
        border-radius: 12px;
        font-size: 0.8rem;
        font-weight: 600;
    }

    .tab-content {
        width: 100%;
    }
</style>
