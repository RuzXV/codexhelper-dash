<script>
    import { fade } from 'svelte/transition';
    import { createEventDispatcher } from 'svelte';
    import { fetchWithAuth } from '$lib/stores/auth';

    const dispatch = createEventDispatcher();

    export let selectedServer;
    export let guildChannels = [];
    export let channelSettings = {};

    const GROUP_LABELS = {
        all_commands: 'All Commands',
        commands_commanders: 'Commander Info',
        commands_meta_lineups: 'Meta Lineups',
        commands_kvk: 'KvK Commands',
        commands_event_info: 'Event Info',
        commands_bundle_info: 'Bundle Info',
    };

    let loading = true;
    let patron = null;
    let showDeauthConfirm = false;
    let deauthorizing = false;
    let features = {
        ark: { enabled: false, channel_id: null },
        mge: { enabled: false, channel_id: null },
        ruins: { enabled: false, channel_id: null },
        altar: { enabled: false, channel_id: null },
        calendar: { enabled: false, channel_id: null },
    };

    $: if (selectedServer) {
        loadFeatureStatus(selectedServer.id);
    }

    async function loadFeatureStatus(guildId) {
        loading = true;
        try {
            const [featureRes, calendarRes] = await Promise.all([
                fetchWithAuth(`/api/guilds/${guildId}/features`),
                fetchWithAuth(`/api/guilds/${guildId}/calendar`),
            ]);

            features = {
                ...featureRes.features,
                calendar: {
                    enabled: calendarRes.config?.channel_id && calendarRes.config?.channel_id !== 'none',
                    channel_id: calendarRes.config?.channel_id,
                },
            };

            patron = featureRes.patron || null;
        } catch (e) {
            console.error('Failed to load overview data', e);
        } finally {
            loading = false;
        }
    }

    function getChannelMention(id) {
        if (!id || id === 'none') return 'Not Set';
        const ch = guildChannels.find((c) => c.id === id);
        return ch ? `#${ch.name}` : `#unknown-channel`;
    }

    function getAvatarUrl(user) {
        if (user.avatar) {
            return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
        }
        return `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discriminator || 0) % 5}.png`;
    }

    async function deauthorizeServer() {
        deauthorizing = true;
        try {
            await fetchWithAuth(`/api/guilds/${selectedServer.id}/authorization`, {
                method: 'DELETE',
            });
            showDeauthConfirm = false;
            dispatch('deauthorized');
        } catch (e) {
            console.error('Failed to deauthorize:', e);
            alert('Failed to deauthorize server. Please try again.');
        } finally {
            deauthorizing = false;
        }
    }
</script>

<div class="overview-container" transition:fade={{ duration: 200 }}>
    <div class="overview-header">
        <div class="header-left">
            <div class="server-identity">
                {#if selectedServer.icon}
                    <img
                        src={`https://cdn.discordapp.com/icons/${selectedServer.id}/${selectedServer.icon}.png`}
                        alt="{selectedServer.name} server icon"
                        class="server-icon-lg"
                    />
                {:else}
                    <div class="server-icon-placeholder">{selectedServer.name.substring(0, 2)}</div>
                {/if}
                <div class="server-text">
                    <h2>{selectedServer.name}</h2>
                    <span class="server-id">ID: {selectedServer.id}</span>
                </div>
            </div>
        </div>

        <div class="header-right">
            {#if patron}
                <div class="patron-badge" class:bypass={patron.is_bypass}>
                    <div class="patron-label">
                        {patron.is_bypass ? 'Granted Access By' : 'Authorized By'}
                    </div>
                    <div class="patron-info">
                        <img src={getAvatarUrl(patron)} alt="{patron.username} avatar" class="patron-avatar" />
                        <span class="patron-name">
                            {patron.is_bypass ? 'Ruz' : patron.username}
                        </span>
                    </div>
                </div>
                {#if !patron.is_bypass}
                    <button
                        class="btn-deauth"
                        on:click={() => (showDeauthConfirm = true)}
                        title="Deauthorize this server"
                    >
                        <i class="fas fa-unlink"></i>
                    </button>
                {/if}
            {:else if !loading}
                <div class="patron-badge warning">
                    <span class="patron-label">Authorization Unknown</span>
                </div>
            {/if}
        </div>
    </div>

    {#if loading}
        <div class="loading-state">
            <i class="fas fa-circle-notch fa-spin"></i> Loading Overview...
        </div>
    {:else}
        <div class="features-strip">
            <span class="strip-label"><i class="fas fa-cogs"></i> Features</span>
            <div class="feature-pills">
                {#each [
                    { key: 'calendar', label: 'Calendar', icon: 'fa-calendar-alt' },
                    { key: 'ark', label: 'Ark', icon: 'fa-chess-rook' },
                    { key: 'mge', label: 'MGE', icon: 'fa-trophy' },
                    { key: 'ruins', label: 'Ruins', icon: 'fa-landmark' },
                    { key: 'altar', label: 'Altar', icon: 'fa-moon' },
                ] as feat}
                    <div class="feature-pill" class:active={features[feat.key]?.enabled} title={features[feat.key]?.enabled ? getChannelMention(features[feat.key].channel_id) : 'Not Configured'}>
                        <i class="fas {feat.icon}"></i>
                        <span>{feat.label}</span>
                        {#if features[feat.key]?.enabled}
                            <i class="fas fa-check pill-status"></i>
                        {:else}
                            <i class="fas fa-minus pill-status inactive"></i>
                        {/if}
                    </div>
                {/each}
            </div>
        </div>

        <div class="channels-section">
            <div class="section-title">
                <i class="fas fa-network-wired"></i>
                <span>Command Channels</span>
            </div>
            <div class="channels-grid">
                {#each Object.entries(GROUP_LABELS) as [key, label]}
                    <div class="channel-tile" class:configured={channelSettings[key] && channelSettings[key] !== 'none'}>
                        <div class="tile-indicator" class:active={channelSettings[key] && channelSettings[key] !== 'none'}></div>
                        <div class="tile-content">
                            <span class="tile-label">{label}</span>
                            <span class="tile-value" class:dimmed={!channelSettings[key] || channelSettings[key] === 'none'}>
                                {#if channelSettings[key] && channelSettings[key] !== 'none'}
                                    {getChannelMention(channelSettings[key])}
                                {:else}
                                    Not Set
                                {/if}
                            </span>
                        </div>
                    </div>
                {/each}
            </div>
        </div>
    {/if}

    {#if showDeauthConfirm}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="modal-overlay" on:click={() => (showDeauthConfirm = false)} transition:fade={{ duration: 150 }}>
            <div class="modal-card" on:click|stopPropagation>
                <div class="modal-header">
                    <i class="fas fa-exclamation-triangle" style="color: var(--accent-red);"></i>
                    <h3>Deauthorize Server</h3>
                </div>
                <div class="modal-body">
                    <p>Are you sure you want to deauthorize <strong>{selectedServer.name}</strong>?</p>
                    <p class="modal-note">
                        This will remove your Patreon authorization from this server. The bot's existing configuration
                        (calendar, reminders, etc.) will be preserved, but the dashboard will no longer be accessible
                        for this server until it is re-authorized.
                    </p>
                </div>
                <div class="modal-actions">
                    <button
                        class="btn-modal-cancel"
                        on:click={() => (showDeauthConfirm = false)}
                        disabled={deauthorizing}>Cancel</button
                    >
                    <button class="btn-modal-confirm" on:click={deauthorizeServer} disabled={deauthorizing}>
                        {#if deauthorizing}<i class="fas fa-spinner fa-spin"></i>{:else}Deauthorize{/if}
                    </button>
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    .overview-container {
        display: flex;
        flex-direction: column;
        gap: 24px;
        animation: cardSlideUp var(--transition-smooth) both;
    }

    .overview-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: var(--card-bg);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        padding: 24px;
        border-radius: 12px;
        border: 1px solid var(--card-border);
        box-shadow: var(--card-shadow), var(--card-highlight);
        flex-wrap: wrap;
        gap: 20px;
    }

    .header-left {
        display: flex;
        align-items: center;
    }
    .server-identity {
        display: flex;
        align-items: center;
        gap: 16px;
    }
    .server-icon-lg {
        width: 52px;
        height: 52px;
        border-radius: 14px;
        object-fit: cover;
        border: 2px solid var(--card-border);
    }
    .server-icon-placeholder {
        width: 52px;
        height: 52px;
        border-radius: 14px;
        background: var(--bg-tertiary);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        color: var(--text-secondary);
        border: 2px solid var(--card-border);
    }
    .server-text h2 {
        margin: 0;
        font-size: 1.4rem;
        color: var(--text-primary);
        letter-spacing: -0.01em;
    }
    .server-id {
        font-size: 0.8rem;
        color: var(--text-secondary);
        font-family: monospace;
        margin-top: 2px;
    }

    .patron-badge {
        background: rgba(255, 255, 255, 0.03);
        padding: 10px 18px;
        border-radius: 10px;
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 12px;
        border: 1px solid rgba(79, 140, 247, 0.25);
        transition: border-color var(--transition-base), box-shadow var(--transition-base);
    }

    .patron-badge.bypass {
        border-color: rgba(167, 139, 250, 0.3);
        background: var(--accent-purple-light);
    }

    .patron-badge.warning {
        border-color: rgba(251, 191, 36, 0.3);
        color: var(--accent-yellow);
    }

    .patron-label {
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--text-secondary);
        margin-bottom: 0;
        white-space: nowrap;
        font-weight: 600;
    }

    .patron-info {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .patron-avatar {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 1px solid var(--card-border);
    }

    .patron-badge.bypass .patron-avatar {
        border-color: var(--accent-purple);
    }

    .patron-name {
        font-weight: 600;
        color: var(--text-primary);
        font-size: 0.95rem;
    }

    .features-strip {
        display: flex;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
    }
    .strip-label {
        font-size: 0.8rem;
        font-weight: 600;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        display: flex;
        align-items: center;
        gap: 6px;
        white-space: nowrap;
    }
    .feature-pills {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
    }
    .feature-pill {
        display: flex;
        align-items: center;
        gap: 7px;
        padding: 8px 14px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid var(--card-border);
        border-radius: 20px;
        font-size: 0.85rem;
        color: var(--text-muted);
        cursor: default;
        transition: border-color var(--transition-base), background var(--transition-base), color var(--transition-base);
    }
    .feature-pill.active {
        background: var(--accent-green-light);
        border-color: rgba(34, 197, 94, 0.2);
        color: var(--accent-green);
    }
    .feature-pill i:first-child {
        font-size: 0.75rem;
    }
    .pill-status {
        font-size: 0.65rem;
        margin-left: 2px;
    }
    .pill-status.inactive {
        opacity: 0.4;
    }

    .channels-section {
        background: var(--card-bg);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid var(--card-border);
        border-radius: 12px;
        padding: 24px;
        box-shadow: var(--card-shadow), var(--card-highlight);
    }
    .section-title {
        font-size: 0.9rem;
        font-weight: 600;
        color: var(--text-primary);
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;
    }
    .section-title i {
        color: var(--accent-blue);
        font-size: 0.85rem;
    }
    .channels-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 10px;
    }
    .channel-tile {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 16px;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.04);
        border-radius: 10px;
        transition: background var(--transition-fast), border-color var(--transition-fast);
    }
    .channel-tile:hover {
        background: var(--row-hover);
        border-color: var(--card-border-hover);
    }
    .tile-indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--text-muted);
        opacity: 0.3;
        flex-shrink: 0;
    }
    .tile-indicator.active {
        background: var(--accent-green);
        opacity: 1;
        box-shadow: 0 0 8px rgba(34, 197, 94, 0.3);
    }
    .tile-content {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
    }
    .tile-label {
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--text-primary);
    }
    .tile-value {
        font-size: 0.78rem;
        color: var(--text-secondary);
        font-family: monospace;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .tile-value.dimmed {
        color: var(--text-muted);
        font-style: italic;
        font-family: inherit;
    }

    .loading-state {
        padding: 48px;
        text-align: center;
        color: var(--text-secondary);
        font-size: 1.1rem;
    }

    .header-right {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    .btn-deauth {
        background: transparent;
        border: 1px solid var(--card-border);
        color: var(--text-muted);
        width: 38px;
        height: 38px;
        border-radius: 10px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: border-color var(--transition-base), color var(--transition-base), background var(--transition-base);
        font-size: 0.85rem;
    }
    .btn-deauth:hover {
        border-color: var(--accent-red);
        color: var(--accent-red);
        background: var(--accent-red-light);
    }

    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: var(--overlay-bg);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
        backdrop-filter: blur(8px);
    }
    .modal-card {
        background: var(--card-bg);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid var(--card-border);
        border-radius: 16px;
        width: 100%;
        max-width: 440px;
        box-shadow: 0 24px 64px rgba(0, 0, 0, 0.4);
        animation: cardSlideUp var(--transition-smooth) both;
    }
    .modal-header {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 20px 24px;
        border-bottom: 1px solid var(--card-border);
    }
    .modal-header h3 {
        margin: 0;
        font-size: 1.1rem;
        color: var(--text-primary);
    }
    .modal-body {
        padding: 20px 24px;
    }
    .modal-body p {
        margin: 0 0 10px 0;
        color: var(--text-primary);
        font-size: 0.95rem;
    }
    .modal-body p:last-child {
        margin-bottom: 0;
    }
    .modal-note {
        color: var(--text-secondary);
        font-size: 0.85rem;
        line-height: 1.5;
    }
    .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        padding: 16px 24px;
        border-top: 1px solid var(--card-border);
    }
    .btn-modal-cancel {
        background: transparent;
        border: 1px solid var(--card-border);
        color: var(--text-secondary);
        padding: 10px 20px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 500;
        transition: color var(--transition-base), background var(--transition-base);
    }
    .btn-modal-cancel:hover {
        background: var(--bg-tertiary);
        color: var(--text-primary);
    }
    .btn-modal-confirm {
        background: var(--accent-red);
        border: none;
        color: white;
        padding: 10px 20px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        transition: background var(--transition-base), transform var(--transition-base);
    }
    .btn-modal-confirm:hover {
        background: var(--accent-red-hover);
        transform: translateY(-1px);
    }
    .btn-modal-confirm:disabled,
    .btn-modal-cancel:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    @media (max-width: 768px) {
        .overview-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
        }
        .patron-badge {
            align-items: flex-start;
            width: 100%;
        }
        .channels-grid {
            grid-template-columns: 1fr;
        }
    }
</style>
