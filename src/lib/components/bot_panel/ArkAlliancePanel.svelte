<script>
    import { createEventDispatcher, tick } from 'svelte';
    import { slide, fade } from 'svelte/transition';
    // xlsx is dynamically imported in exportToExcel() to avoid 880KB in the initial bundle
    import ArkTeamCard from './ArkTeamCard.svelte';
    import SaveBar from '$lib/components/shared/SaveBar.svelte';
    import { fetchWithAuth } from '$lib/stores/auth';

    export let guildId;
    export let allianceTag;
    export let data;
    export let channels = [];
    export let roles = [];

    const dispatch = createEventDispatcher();

    let currentConfig = { ...data.config };
    let originalConfig = JSON.parse(JSON.stringify(data.config));
    let hasUnsavedChanges = false;
    let saving = false;
    let openDropdownId = null;
    let dropdownSearch = '';
    let refreshingEmbed = false;
    let postingSignup = false;

    function secondsToTime(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
    function timeToSeconds(timeStr) {
        if (!timeStr) return 3600;
        const [h, m] = timeStr.split(':').map(Number);
        return h * 3600 + m * 60;
    }

    let reminderTime = secondsToTime(currentConfig.reminder_interval || 3600);
    $: {
        const timeSec = timeToSeconds(reminderTime);
        const configChanged =
            JSON.stringify({ ...currentConfig, reminder_interval: timeSec }) !== JSON.stringify(originalConfig);
        hasUnsavedChanges = configChanged;
    }

    async function saveAllSettings() {
        saving = true;
        try {
            await fetchWithAuth(`/api/guilds/${guildId}/ark/alliance`, {
                method: 'POST',
                body: JSON.stringify({
                    alliance_tag: allianceTag,
                    channel_id: currentConfig.channel_id,
                    admin_role_id: currentConfig.admin_role_id,
                    notification_role_id: currentConfig.notification_role_id,
                    reminder_interval: timeToSeconds(reminderTime),
                }),
            });
            originalConfig = JSON.parse(
                JSON.stringify({ ...currentConfig, reminder_interval: timeToSeconds(reminderTime) }),
            );
            hasUnsavedChanges = false;
            dispatch('updated');
        } catch (e) {
            alert('Failed to save settings.');
            console.error(e);
        } finally {
            saving = false;
        }
    }

    function discardChanges() {
        currentConfig = JSON.parse(JSON.stringify(originalConfig));
        reminderTime = secondsToTime(currentConfig.reminder_interval);
    }

    async function deleteAlliance() {
        if (
            !confirm(
                `Are you sure you want to delete the ENTIRE setup for [${allianceTag}]?\n\nThis will remove all teams and signups.`,
            )
        )
            return;
        try {
            await fetchWithAuth(`/api/guilds/${guildId}/ark/alliance/${allianceTag}`, { method: 'DELETE' });
            dispatch('deleted', { tag: allianceTag });
        } catch (e) {
            alert('Failed to delete alliance.');
        }
    }

    async function refreshEmbed() {
        refreshingEmbed = true;
        try {
            await fetchWithAuth(`/api/guilds/${guildId}/ark/refresh-embed`, {
                method: 'POST',
                body: JSON.stringify({ alliance_tag: allianceTag }),
            });
        } catch (e) {
            alert('Failed to refresh embed.');
            console.error(e);
        } finally {
            refreshingEmbed = false;
        }
    }

    async function postNewSignup() {
        if (!confirm(`Post a new signup embed for [${allianceTag}] to the configured channel?`)) return;
        postingSignup = true;
        try {
            await fetchWithAuth(`/api/guilds/${guildId}/ark/post-signup`, {
                method: 'POST',
                body: JSON.stringify({ alliance_tag: allianceTag }),
            });
            dispatch('updated');
        } catch (e) {
            alert('Failed to post signup.');
            console.error(e);
        } finally {
            postingSignup = false;
        }
    }

    async function addTeam() {
        const existingNums = Object.keys(data.teams).map(Number);
        if (existingNums.length >= 3) {
            alert('Maximum of 3 teams allowed per alliance.');
            return;
        }
        const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1;
        try {
            await fetchWithAuth(`/api/guilds/${guildId}/ark/team`, {
                method: 'POST',
                body: JSON.stringify({
                    alliance_tag: allianceTag,
                    team_number: nextNum,
                    team_name: `Team ${nextNum}`,
                    match_timestamp: Math.floor(Date.now() / 1000) + 86400,
                    signup_cap: 30,
                }),
            });
            dispatch('updated');
        } catch (e) {
            alert('Failed to add team.');
        }
    }

    async function exportToExcel() {
        const teamNums = Object.keys(data.teams).sort();
        const rows = [];
        teamNums.forEach((num) => {
            const team = data.teams[num];
            const teamSignups = data.signups.filter((s) => s.team_number == num);
            rows.push([`${team.name} (${allianceTag})`]);
            rows.push(['Match Time (UTC)', new Date(team.match_timestamp * 1000).toUTCString()]);
            rows.push(['In-Game Name', 'Signup Time (UTC)']);
            teamSignups.forEach((s) => {
                rows.push([
                    s.in_game_name,
                    new Date(s.signup_timestamp * 1000).toISOString().replace('T', ' ').substring(0, 19),
                ]);
            });
            rows.push(['']);
        });
        const XLSX = await import('xlsx');
        const ws = XLSX.utils.aoa_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Signups');
        XLSX.writeFile(wb, `Ark_${allianceTag}.xlsx`);
    }

    function toggleDropdown(id, event) {
        event.stopPropagation();
        dropdownSearch = '';
        openDropdownId = openDropdownId === id ? null : id;
        if (openDropdownId) {
            tick().then(() => document.getElementById(`search-${id}`)?.focus());
        }
    }

    function getName(id, type) {
        if (!id || id === 'none') return 'Not Set';
        if (type === 'channel') {
            const ch = channels.find((c) => c.id === id);
            return ch ? `# ${ch.name}` : 'Unknown Channel';
        }
        const r = roles.find((r) => r.id === id);
        return r ? `@${r.name}` : 'Unknown Role';
    }

    function selectItem(key, val) {
        currentConfig[key] = val;
        openDropdownId = null;
    }
</script>

<svelte:window on:click={() => (openDropdownId = null)} on:keydown={(e) => { if (e.key === 'Escape') openDropdownId = null; }} />

<div class="alliance-panel" transition:fade>
    <div class="panel-header">
        <div class="header-info">
            <h2 class="tag-title">Alliance: <span class="highlight">{allianceTag}</span></h2>
            <span class="status-badge" class:active={currentConfig.is_active}>
                {currentConfig.is_active ? 'Active' : 'Inactive'}
            </span>
        </div>
        <div class="header-actions">
            <button class="btn-action" on:click={refreshEmbed} disabled={refreshingEmbed} title="Refresh Discord Embed">
                <i class="fas fa-sync-alt" class:fa-spin={refreshingEmbed}></i>
                <span>{refreshingEmbed ? 'Refreshing...' : 'Refresh Embed'}</span>
            </button>
            <button
                class="btn-action primary"
                on:click={postNewSignup}
                disabled={postingSignup}
                title="Post New Signup Embed"
            >
                <i class="fas fa-paper-plane"></i> <span>{postingSignup ? 'Posting...' : 'Post Signup'}</span>
            </button>
            <button class="btn-action success" on:click={exportToExcel} title="Download Excel">
                <i class="fas fa-file-excel"></i> <span>Export Signup List</span>
            </button>
            <button class="btn-action danger" on:click={deleteAlliance} title="Delete Alliance">
                <i class="fas fa-trash-alt"></i> <span>Delete Setup</span>
            </button>
        </div>
    </div>

    <div class="panel-content-split">
        <div class="config-column">
            <div class="config-section sticky-card">
                <div class="config-title"><i class="fas fa-cogs"></i> Configuration</div>
                    <div class="settings-list">
                        <div class="setting-group">
                            <label for="ch-{allianceTag}"><i class="fas fa-hashtag"></i> Signup Channel</label>
                            <div class="custom-select-container">
                                <button
                                    type="button"
                                    class="custom-select-trigger"
                                    aria-haspopup="listbox"
                                    aria-expanded={openDropdownId === 'channel'}
                                    on:click={(e) => toggleDropdown('channel', e)}
                                >
                                    <span
                                        class:placeholder={!currentConfig.channel_id ||
                                            currentConfig.channel_id === 'none'}
                                    >
                                        {getName(currentConfig.channel_id, 'channel')}
                                    </span>
                                    <i class="fas fa-chevron-down arrow"></i>
                                </button>
                                {#if openDropdownId === 'channel'}
                                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                                    <div class="custom-dropdown-menu" on:click|stopPropagation>
                                        <input
                                            id="search-channel"
                                            class="dropdown-search"
                                            bind:value={dropdownSearch}
                                            placeholder="Search channels..."
                                        />
                                        <div class="options-list">
                                            <button
                                                class="dropdown-option danger"
                                                on:click={() => selectItem('channel_id', 'none')}>⛔ Disabled</button
                                            >
                                            {#each channels.filter((c) => c.name
                                                    .toLowerCase()
                                                    .includes(dropdownSearch.toLowerCase())) as ch}
                                                <button
                                                    class="dropdown-option"
                                                    on:click={() => selectItem('channel_id', ch.id)}
                                                >
                                                    <i class="fas fa-hashtag text-muted"></i>
                                                    {ch.name}
                                                </button>
                                            {/each}
                                        </div>
                                    </div>
                                {/if}
                            </div>
                        </div>

                        <div class="setting-group">
                            <label for="rem-{allianceTag}"
                                ><i class="fas fa-hourglass-half"></i> Reminder Interval</label
                            >
                            <input id="rem-{allianceTag}" type="time" class="modern-input" bind:value={reminderTime} />
                        </div>

                        <div class="setting-group">
                            <label for="admin-{allianceTag}"><i class="fas fa-user-shield"></i> Admin Role</label>
                            <div class="custom-select-container">
                                <button
                                    type="button"
                                    class="custom-select-trigger"
                                    aria-haspopup="listbox"
                                    aria-expanded={openDropdownId === 'admin'}
                                    on:click={(e) => toggleDropdown('admin', e)}
                                >
                                    <span class:placeholder={!currentConfig.admin_role_id}>
                                        {getName(currentConfig.admin_role_id, 'role')}
                                    </span>
                                    <i class="fas fa-chevron-down arrow"></i>
                                </button>
                                {#if openDropdownId === 'admin'}
                                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                                    <div class="custom-dropdown-menu" on:click|stopPropagation>
                                        <input
                                            id="search-admin"
                                            class="dropdown-search"
                                            bind:value={dropdownSearch}
                                            placeholder="Search roles..."
                                        />
                                        <div class="options-list">
                                            <button
                                                class="dropdown-option danger"
                                                on:click={() => selectItem('admin_role_id', null)}>None</button
                                            >
                                            {#each roles.filter((r) => r.name
                                                    .toLowerCase()
                                                    .includes(dropdownSearch.toLowerCase())) as r}
                                                <button
                                                    class="dropdown-option"
                                                    on:click={() => selectItem('admin_role_id', r.id)}
                                                >
                                                    <span
                                                        class="role-dot"
                                                        style="background-color: #{r.color?.toString(16) || '999'}"
                                                    ></span>
                                                    {r.name}
                                                </button>
                                            {/each}
                                        </div>
                                    </div>
                                {/if}
                            </div>
                        </div>

                        <div class="setting-group">
                            <label for="not-{allianceTag}"><i class="fas fa-bell"></i> Notification Role</label>
                            <div class="custom-select-container">
                                <button
                                    type="button"
                                    class="custom-select-trigger"
                                    aria-haspopup="listbox"
                                    aria-expanded={openDropdownId === 'notify'}
                                    on:click={(e) => toggleDropdown('notify', e)}
                                >
                                    <span class:placeholder={!currentConfig.notification_role_id}>
                                        {getName(currentConfig.notification_role_id, 'role')}
                                    </span>
                                    <i class="fas fa-chevron-down arrow"></i>
                                </button>
                                {#if openDropdownId === 'notify'}
                                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                                    <div class="custom-dropdown-menu" on:click|stopPropagation>
                                        <input
                                            id="search-notify"
                                            class="dropdown-search"
                                            bind:value={dropdownSearch}
                                            placeholder="Search roles..."
                                        />
                                        <div class="options-list">
                                            <button
                                                class="dropdown-option danger"
                                                on:click={() => selectItem('notification_role_id', null)}>None</button
                                            >
                                            {#each roles.filter((r) => r.name
                                                    .toLowerCase()
                                                    .includes(dropdownSearch.toLowerCase())) as r}
                                                <button
                                                    class="dropdown-option"
                                                    on:click={() => selectItem('notification_role_id', r.id)}
                                                >
                                                    <span
                                                        class="role-dot"
                                                        style="background-color: #{r.color?.toString(16) || '999'}"
                                                    ></span>
                                                    {r.name}
                                                </button>
                                            {/each}
                                        </div>
                                    </div>
                                {/if}
                            </div>
                        </div>
                    </div>
            </div>
        </div>

        <div class="teams-column">
            <div class="teams-section">
                <div class="teams-title"><i class="fas fa-users"></i> Signups & Teams</div>
                    <div class="teams-grid">
                        {#each Object.keys(data.teams).sort() as num}
                            <ArkTeamCard
                                {guildId}
                                {allianceTag}
                                teamNumber={num}
                                teamData={data.teams[num]}
                                signups={data.signups.filter((s) => s.team_number == num)}
                                {roles}
                                on:updated={() => dispatch('updated')}
                            />
                        {/each}

                        {#if Object.keys(data.teams).length < 3}
                            <button class="add-team-card" on:click={addTeam}>
                                <div class="add-icon-circle">
                                    <i class="fas fa-plus"></i>
                                </div>
                                <span>Create New Team</span>
                            </button>
                        {/if}
                    </div>
            </div>
        </div>
    </div>

    <SaveBar {hasUnsavedChanges} {saving} on:save={saveAllSettings} on:discard={discardChanges} />
</div>

<style>
    .alliance-panel {
        display: flex;
        flex-direction: column;
        gap: 24px;
        padding-bottom: 80px;
    }

    .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 16px;
        border-bottom: 1px solid var(--card-border);
        flex-wrap: wrap;
        gap: 12px;
    }
    .header-info {
        display: flex;
        align-items: center;
        gap: 15px;
    }
    .tag-title {
        margin: 0;
        color: var(--text-primary);
        font-size: 1.5rem;
        font-weight: 700;
        letter-spacing: -0.01em;
    }
    .highlight {
        color: var(--accent-blue);
    }

    .status-badge {
        font-size: 0.7rem;
        padding: 3px 10px;
        border-radius: 20px;
        background: var(--bg-tertiary);
        color: var(--text-muted);
        text-transform: uppercase;
        font-weight: 600;
        letter-spacing: 0.06em;
    }
    .status-badge.active {
        background: var(--accent-green-light);
        color: var(--accent-green);
    }

    .header-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
    }
    .btn-action {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid var(--card-border);
        color: var(--text-secondary);
        padding: 9px 16px;
        border-radius: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 500;
        font-size: 0.875rem;
        transition: background var(--transition-base), color var(--transition-base), border-color var(--transition-base), transform var(--transition-base), box-shadow var(--transition-base);
    }
    .btn-action:hover {
        background: rgba(255, 255, 255, 0.06);
        color: var(--text-primary);
        transform: translateY(-1px);
    }

    .btn-action.primary {
        background: var(--accent-blue-light);
        color: var(--accent-blue);
        border-color: rgba(79, 140, 247, 0.25);
    }
    .btn-action.primary:hover {
        background: var(--accent-blue);
        color: white;
        box-shadow: 0 4px 12px rgba(79, 140, 247, 0.25);
    }

    .btn-action.success {
        background: var(--accent-green-light);
        color: var(--accent-green);
        border-color: rgba(52, 211, 153, 0.25);
    }
    .btn-action.success:hover {
        background: var(--accent-green);
        color: white;
        box-shadow: 0 4px 12px rgba(52, 211, 153, 0.25);
    }

    .btn-action:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    .btn-action:disabled:hover {
        background: rgba(255, 255, 255, 0.03);
        color: var(--text-secondary);
        transform: none;
    }

    .btn-action.danger {
        color: var(--accent-red);
        border-color: rgba(248, 113, 113, 0.25);
    }
    .btn-action.danger:hover {
        background: var(--accent-red-light);
        border-color: var(--accent-red);
    }

    .panel-content-split {
        display: flex;
        gap: 24px;
        align-items: flex-start;
    }
    .config-column {
        flex: 0 0 340px;
    }
    .teams-column {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 15px;
    }

    @media (max-width: 900px) {
        .panel-content-split {
            flex-direction: column;
        }
        .config-column {
            width: 100%;
            flex: auto;
        }
    }

    .config-section {
        background: var(--card-bg);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid var(--card-border);
        border-radius: 12px;
        padding: 20px;
        box-shadow: var(--card-shadow), var(--card-highlight);
    }
    .config-title {
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 20px;
        padding-bottom: 12px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    }
    .config-title i {
        color: var(--accent-blue);
        font-size: 0.8rem;
    }
    .teams-section {
        display: flex;
        flex-direction: column;
    }
    .teams-title {
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;
    }
    .teams-title i {
        color: var(--accent-blue);
        font-size: 0.8rem;
    }
    .sticky-card {
        position: sticky;
        top: 20px;
    }

    .settings-list {
        display: flex;
        flex-direction: column;
        gap: 22px;
    }
    .setting-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
        position: relative;
    }
    .setting-group label {
        font-size: 0.85rem;
        color: var(--text-secondary);
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .modern-input {
        background: var(--bg-input);
        border: 1px solid var(--card-border);
        padding: 10px 12px;
        border-radius: 8px;
        color: var(--text-primary);
        width: 100%;
        transition: border-color var(--transition-base), box-shadow var(--transition-base);
        box-sizing: border-box;
    }
    .modern-input:focus {
        border-color: var(--accent-blue);
        box-shadow: var(--focus-ring);
        outline: none;
    }

    .custom-select-container {
        position: relative;
        width: 100%;
    }
    .custom-select-trigger {
        width: 100%;
        height: 42px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 12px;
        background: var(--bg-input);
        border: 1px solid var(--card-border);
        border-radius: 8px;
        color: var(--text-primary);
        cursor: pointer;
        text-align: left;
        box-sizing: border-box;
        transition: border-color var(--transition-base), box-shadow var(--transition-base);
    }
    .custom-select-trigger:hover {
        border-color: var(--border-hover);
    }
    .custom-select-trigger:focus {
        border-color: var(--accent-blue);
        box-shadow: var(--focus-ring);
        outline: none;
    }
    .placeholder {
        color: var(--text-muted);
        font-style: italic;
    }

    .custom-dropdown-menu {
        position: absolute;
        top: calc(100% + 6px);
        left: 0;
        width: 100%;
        background: var(--bg-card);
        border: 1px solid var(--card-border);
        border-radius: 10px;
        z-index: 100;
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.04);
    }
    .dropdown-search {
        width: 100%;
        border: none;
        border-bottom: 1px solid var(--card-border);
        background: rgba(255, 255, 255, 0.02);
        padding: 10px 12px;
        color: var(--text-primary);
        outline: none;
        box-sizing: border-box;
    }
    .options-list {
        max-height: 250px;
        overflow-y: auto;
        padding: 4px;
    }
    .dropdown-option {
        width: 100%;
        text-align: left;
        background: transparent;
        border: none;
        padding: 9px 12px;
        color: var(--text-secondary);
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        border-radius: 6px;
        transition: background var(--transition-fast), color var(--transition-fast);
    }
    .dropdown-option:hover {
        background: var(--row-hover);
        color: var(--text-primary);
    }
    .dropdown-option.danger {
        color: var(--accent-red);
        border-bottom: 1px solid var(--card-border);
        border-radius: 6px 6px 0 0;
    }
    .dropdown-option.danger:hover {
        background: var(--accent-red-light);
    }

    .teams-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 24px;
        align-items: stretch;
    }

    .add-team-card {
        border: 2px dashed var(--card-border);
        background: rgba(255, 255, 255, 0.01);
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 15px;
        color: var(--text-muted);
        cursor: pointer;
        min-height: 250px;
        transition: border-color var(--transition-base), color var(--transition-base), background var(--transition-base);
    }

    .add-team-card:hover {
        border-color: var(--accent-blue);
        color: var(--accent-blue);
        background: var(--accent-blue-light);
    }

    .add-icon-circle {
        width: 52px;
        height: 52px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.04);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        transition: transform var(--transition-base), background var(--transition-base);
    }

    .add-team-card:hover .add-icon-circle {
        transform: scale(1.1);
        background: var(--accent-blue-light);
    }

</style>
