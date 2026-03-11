<script>
    import { onMount } from 'svelte';
    import { fade, slide } from 'svelte/transition';
    import ArkAlliancePanel from './ArkAlliancePanel.svelte';
    import { fetchWithAuth } from '$lib/stores/auth';

    export let guildId;
    export let channels = [];
    export let roles = [];

    let loading = true;
    let alliances = {};
    let activeTab = null;

    let showCreateModal = false;
    let newAllianceTag = '';
    let creating = false;

    onMount(async () => {
        await loadData();
    });

    async function loadData() {
        loading = true;
        try {
            const arkRes = await fetchWithAuth(`/api/guilds/${guildId}/ark/all`);
            alliances = arkRes.alliances || {};

            const tags = Object.keys(alliances);
            if (tags.length > 0 && !activeTab) {
                activeTab = tags[0];
            }
        } catch (e) {
            console.error('Failed to load Ark data', e);
        } finally {
            loading = false;
        }
    }

    async function createAlliance() {
        if (!newAllianceTag.trim()) return alert('Please enter an alliance tag.');
        creating = true;
        try {
            await fetchWithAuth(`/api/guilds/${guildId}/ark/alliance`, {
                method: 'POST',
                body: JSON.stringify({
                    alliance_tag: newAllianceTag.trim(),
                    reminder_interval: 3600,
                }),
            });
            await loadData();
            activeTab = newAllianceTag.trim();
            showCreateModal = false;
            newAllianceTag = '';
        } catch (e) {
            alert('Failed to create alliance. Tag might already exist.');
        } finally {
            creating = false;
        }
    }

    function handleAllianceDeleted(e) {
        const deletedTag = e.detail.tag;
        delete alliances[deletedTag];
        alliances = { ...alliances };

        const tags = Object.keys(alliances);
        activeTab = tags.length > 0 ? tags[0] : null;
    }

    function refreshData() {
        loadData();
    }
</script>

<div class="ark-container" transition:fade={{ duration: 200 }}>
    <div class="section-header">
        {#if loading}
            <div class="header-loading"><i class="fas fa-spinner fa-spin"></i> Loading...</div>
        {:else}
            <div class="tabs-container">
                {#each Object.keys(alliances) as tag}
                    <button class="tab-btn" class:active={activeTab === tag} on:click={() => (activeTab = tag)}>
                        {tag}
                    </button>
                {/each}

                <button class="tab-btn add-btn" on:click={() => (showCreateModal = true)}>
                    <i class="fas fa-plus"></i> <span>New Alliance</span>
                </button>
            </div>
        {/if}
    </div>

    {#if !loading}
        {#if showCreateModal}
            <div class="create-panel" transition:slide>
                <h4>Setup New Alliance</h4>
                <div class="create-row">
                    <input type="text" placeholder="Alliance Tag (e.g. 60GT)" bind:value={newAllianceTag} />
                    <button class="btn-confirm" on:click={createAlliance} disabled={creating}>
                        {creating ? 'Creating...' : 'Create Setup'}
                    </button>
                    <button class="btn-cancel" on:click={() => (showCreateModal = false)}>Cancel</button>
                </div>
            </div>
        {/if}

        <div class="tab-content">
            {#if activeTab && alliances[activeTab]}
                {#key activeTab}
                    <ArkAlliancePanel
                        {guildId}
                        allianceTag={activeTab}
                        data={alliances[activeTab]}
                        {channels}
                        {roles}
                        on:deleted={handleAllianceDeleted}
                        on:updated={refreshData}
                    />
                {/key}
            {:else if Object.keys(alliances).length === 0 && !showCreateModal}
                <div class="empty-state">
                    <i class="fas fa-scroll"></i>
                    <h4>No Active Setups</h4>
                    <p>Click <strong>+ New Alliance</strong> above to get started.</p>
                </div>
            {/if}
        </div>
    {/if}
</div>

<style>
    .ark-container {
        display: flex;
        flex-direction: column;
        gap: 0;
        animation: cardSlideUp var(--transition-smooth) both;
    }

    .section-header {
        display: flex;
        align-items: center;
        padding-bottom: 0;
        border-bottom: 1px solid var(--card-border);
        min-height: 48px;
    }

    .header-loading {
        color: var(--text-secondary);
        padding: 12px;
        font-style: italic;
    }

    .tabs-container {
        display: flex;
        gap: 2px;
        overflow-x: auto;
        width: 100%;
        scrollbar-width: none;
        -ms-overflow-style: none;
        padding-top: 1px;
        align-self: flex-end;
    }

    .tab-btn {
        position: relative;
        background: transparent;
        border: 1px solid transparent;
        border-bottom: none;
        padding: 14px 24px;
        color: var(--text-secondary);
        cursor: pointer;
        font-weight: 600;
        border-radius: 10px 10px 0 0;
        transition: background var(--transition-base), color var(--transition-base), border-color var(--transition-base);
        font-size: 1.05rem;
        white-space: nowrap;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        flex-shrink: 0;
        min-width: 33%;
    }

    .tab-btn.add-btn {
        min-width: auto;
        width: auto;
    }

    .tab-btn:hover {
        background: rgba(255, 255, 255, 0.03);
        color: var(--text-primary);
    }

    .tab-btn.active {
        background: var(--card-bg);
        color: var(--accent-blue);
        border: 1px solid var(--card-border);
        border-bottom: 1px solid transparent;
        margin-bottom: -1px;
        z-index: 10;
        backdrop-filter: blur(12px);
    }
    .tab-content {
        background: var(--card-bg);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid var(--card-border);
        border-top: none;
        border-radius: 0 0 12px 12px;
        padding: 24px;
        box-shadow: var(--card-shadow);
    }

    .tab-btn.add-btn {
        color: var(--accent-green);
        opacity: 0.8;
    }
    .tab-btn.add-btn:hover {
        opacity: 1;
        background: var(--accent-green-light);
    }

    .create-panel {
        background: var(--card-bg);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid var(--card-border);
        padding: 24px;
        border-radius: 12px;
        margin-bottom: 20px;
        box-shadow: var(--card-shadow), var(--card-highlight);
    }
    .create-panel h4 {
        margin: 0 0 16px 0;
        color: var(--text-primary);
    }
    .create-row {
        display: flex;
        gap: 10px;
    }
    .create-row input {
        flex: 1;
        padding: 12px 14px;
        background: var(--bg-input);
        border: 1px solid var(--card-border);
        border-radius: 8px;
        color: var(--text-primary);
        transition: border-color var(--transition-base), box-shadow var(--transition-base);
    }
    .create-row input:focus {
        border-color: var(--accent-blue);
        box-shadow: var(--focus-ring);
        outline: none;
    }
    .btn-confirm {
        background: var(--accent-blue);
        color: white;
        border: none;
        padding: 0 24px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        transition: transform var(--transition-base), box-shadow var(--transition-base);
    }
    .btn-confirm:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(79, 140, 247, 0.25);
    }
    .btn-cancel {
        background: transparent;
        color: var(--text-secondary);
        border: 1px solid var(--card-border);
        padding: 0 18px;
        border-radius: 8px;
        cursor: pointer;
        transition: color var(--transition-base), background var(--transition-base);
    }
    .btn-cancel:hover {
        color: var(--text-primary);
        background: var(--bg-tertiary);
    }

    .empty-state {
        text-align: center;
        padding: 48px;
        color: var(--text-secondary);
        background: rgba(255, 255, 255, 0.02);
        border-radius: 12px;
        border: 1px dashed var(--card-border);
    }
    .empty-state i {
        font-size: 2rem;
        margin-bottom: 15px;
        opacity: 0.5;
    }
</style>
