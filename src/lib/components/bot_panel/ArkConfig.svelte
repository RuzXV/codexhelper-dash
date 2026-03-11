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
    {#if loading}
        <div class="header-loading"><i class="fas fa-spinner fa-spin"></i> Loading...</div>
    {:else}
        <div class="alliance-bar">
            <div class="alliance-selector">
                {#each Object.keys(alliances) as tag}
                    <button class="alliance-chip" class:active={activeTab === tag} on:click={() => (activeTab = tag)}>
                        {tag}
                    </button>
                {/each}
            </div>
            <button class="btn-new-alliance" on:click={() => (showCreateModal = true)}>
                <i class="fas fa-plus"></i> New Alliance
            </button>
        </div>

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
    {/if}
</div>

<style>
    .ark-container {
        display: flex;
        flex-direction: column;
        gap: 20px;
        animation: cardSlideUp var(--transition-smooth) both;
    }

    .header-loading {
        color: var(--text-secondary);
        padding: 12px;
        font-style: italic;
    }

    .alliance-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
    }
    .alliance-selector {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
    }
    .alliance-chip {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid var(--card-border);
        color: var(--text-secondary);
        padding: 8px 20px;
        border-radius: 20px;
        cursor: pointer;
        font-weight: 600;
        font-size: 0.95rem;
        transition: background var(--transition-base), color var(--transition-base), border-color var(--transition-base);
    }
    .alliance-chip:hover {
        color: var(--text-primary);
        border-color: var(--card-border-hover);
    }
    .alliance-chip.active {
        background: var(--accent-blue-light);
        color: var(--accent-blue);
        border-color: rgba(79, 140, 247, 0.3);
    }
    .btn-new-alliance {
        background: transparent;
        border: 1px dashed rgba(52, 211, 153, 0.3);
        color: var(--accent-green);
        padding: 8px 18px;
        border-radius: 20px;
        cursor: pointer;
        font-weight: 600;
        font-size: 0.85rem;
        display: flex;
        align-items: center;
        gap: 6px;
        transition: background var(--transition-base), border-color var(--transition-base);
    }
    .btn-new-alliance:hover {
        background: var(--accent-green-light);
        border-color: var(--accent-green);
    }

    .create-panel {
        background: var(--card-bg);
        border: 1px solid var(--card-border);
        padding: 24px;
        border-radius: 12px;
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
