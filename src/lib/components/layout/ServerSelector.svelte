<script>
    import { createEventDispatcher } from 'svelte';

    export let servers = [];
    export let selectedServer = null;

    const dispatch = createEventDispatcher();

    let isOpen = false;
    let searchQuery = '';

    $: filteredServers = servers.filter((s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    function getServerIcon(server) {
        if (server.icon) {
            return `https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png?size=64`;
        }
        return null;
    }

    function getServerInitials(name) {
        return name
            .split(/\s+/)
            .map((w) => w[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();
    }

    function selectServer(server) {
        dispatch('select', server);
        isOpen = false;
        searchQuery = '';
    }

    function toggleDropdown(e) {
        e.stopPropagation();
        isOpen = !isOpen;
        if (!isOpen) searchQuery = '';
    }

    function handleWindowClick() {
        isOpen = false;
        searchQuery = '';
    }
</script>

<svelte:window on:click={handleWindowClick} />

<div class="server-selector">
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="selector-trigger" class:open={isOpen} on:click={toggleDropdown}>
        {#if selectedServer}
            <div class="server-avatar">
                {#if getServerIcon(selectedServer)}
                    <img src={getServerIcon(selectedServer)} alt="" />
                {:else}
                    <span class="initials">{getServerInitials(selectedServer.name)}</span>
                {/if}
            </div>
            <span class="server-name">{selectedServer.name}</span>
        {:else}
            <div class="server-avatar placeholder">
                <i class="fas fa-server"></i>
            </div>
            <span class="server-name muted">Select a server</span>
        {/if}
        <i class="fas fa-chevron-down arrow" class:rotated={isOpen}></i>
    </div>

    {#if isOpen}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="dropdown" on:click|stopPropagation>
            <div class="dropdown-search">
                <i class="fas fa-search"></i>
                <input
                    type="text"
                    placeholder="Search servers..."
                    bind:value={searchQuery}
                    autofocus
                />
            </div>
            <div class="dropdown-list">
                {#each filteredServers as server}
                    <button
                        class="dropdown-item"
                        class:active={selectedServer?.id === server.id}
                        on:click={() => selectServer(server)}
                        title="{server.name}{server.approximate_member_count ? ` • ${server.approximate_member_count.toLocaleString()} members` : ''}{server.approximate_presence_count ? ` • ${server.approximate_presence_count.toLocaleString()} online` : ''}"
                    >
                        <div class="server-avatar small">
                            {#if getServerIcon(server)}
                                <img src={getServerIcon(server)} alt="" />
                            {:else}
                                <span class="initials">{getServerInitials(server.name)}</span>
                            {/if}
                        </div>
                        <span class="item-name">{server.name}</span>
                    </button>
                {/each}
                {#if filteredServers.length === 0}
                    <div class="empty">No servers found</div>
                {/if}
            </div>
        </div>
    {/if}
</div>

<style>
    .server-selector {
        position: relative;
        padding: 12px 16px;
    }

    .selector-trigger {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
        cursor: pointer;
        transition: all 0.2s;
    }

    .selector-trigger:hover,
    .selector-trigger.open {
        background: rgba(255, 255, 255, 0.06);
        border-color: var(--border-hover);
    }

    .server-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        overflow: hidden;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--bg-tertiary);
    }

    .server-avatar.small {
        width: 28px;
        height: 28px;
    }

    .server-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .server-avatar .initials {
        font-size: 0.7rem;
        font-weight: 700;
        color: var(--text-secondary);
    }

    .server-avatar.small .initials {
        font-size: 0.6rem;
    }

    .server-avatar.placeholder {
        color: var(--text-muted);
        font-size: 0.85rem;
    }

    .server-name {
        flex: 1;
        font-weight: 600;
        font-size: 0.9rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .server-name.muted {
        color: var(--text-muted);
        font-weight: 500;
    }

    .arrow {
        font-size: 0.7rem;
        color: var(--text-muted);
        transition: transform 0.2s;
        flex-shrink: 0;
    }

    .arrow.rotated {
        transform: rotate(180deg);
    }

    .dropdown {
        position: absolute;
        top: calc(100% - 4px);
        left: 16px;
        right: 16px;
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
        z-index: 100;
        box-shadow: var(--shadow-lg);
        overflow: hidden;
    }

    .dropdown-search {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 12px;
        border-bottom: 1px solid var(--border-color);
    }

    .dropdown-search i {
        color: var(--text-muted);
        font-size: 0.8rem;
    }

    .dropdown-search input {
        flex: 1;
        background: none;
        border: none;
        color: var(--text-primary);
        font-size: 0.85rem;
        outline: none;
    }

    .dropdown-list {
        max-height: 260px;
        overflow-y: auto;
        padding: 4px;
    }

    .dropdown-item {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        padding: 8px 10px;
        border-radius: var(--radius-md);
        font-size: 0.85rem;
        color: var(--text-secondary);
        transition: all 0.15s;
        min-width: 0;
    }

    .item-name {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        min-width: 0;
    }

    .dropdown-item:hover {
        background: var(--nav-item-hover);
        color: var(--text-primary);
    }

    .dropdown-item.active {
        background: var(--nav-item-active);
        color: var(--accent-blue);
        font-weight: 600;
    }

    .empty {
        padding: 16px;
        text-align: center;
        color: var(--text-muted);
        font-size: 0.85rem;
    }
</style>
