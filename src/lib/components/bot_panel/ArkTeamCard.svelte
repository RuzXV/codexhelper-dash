<script>
    import { createEventDispatcher } from 'svelte';
    import { fetchWithAuth } from '$lib/stores/auth';
    export let guildId;
    export let allianceTag;
    export let teamNumber;
    export let teamData;
    export let signups = [];
    export let roles = [];

    const dispatch = createEventDispatcher();
    let saving = false;
    let matchDateObj = new Date(teamData.match_timestamp * 1000);
    const offset = matchDateObj.getTimezoneOffset() * 60000;
    let localDateStr = new Date(matchDateObj.getTime() - offset).toISOString().slice(0, 16);

    let editName = teamData.name;
    let editCap = teamData.cap;
    let newSignupName = '';

    $: utcTimeStr = (() => {
        const d = new Date(localDateStr);
        return d.toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
    })();
    $: roleName =
        teamData.role_id && teamData.role_id !== '0' && teamData.role_id !== 0
            ? roles.find((r) => r.id === String(teamData.role_id))?.name || null
            : null;

    async function saveTeam() {
        saving = true;
        const d = new Date(localDateStr);
        const utcTimestamp = Math.floor(d.getTime() / 1000);

        try {
            await fetchWithAuth(`/api/guilds/${guildId}/ark/team`, {
                method: 'POST',
                body: JSON.stringify({
                    alliance_tag: allianceTag,
                    team_number: teamNumber,
                    team_name: editName,
                    match_timestamp: utcTimestamp,
                    signup_cap: editCap ? parseInt(editCap) : null,
                }),
            });
            dispatch('updated');
        } catch (e) {
            alert('Failed to update team: ' + e.message);
        } finally {
            saving = false;
        }
    }

    async function removeSignup(ign) {
        if (!confirm(`Remove ${ign}?`)) return;
        try {
            await fetchWithAuth(`/api/guilds/${guildId}/ark/signup`, {
                method: 'DELETE',
                body: JSON.stringify({ alliance_tag: allianceTag, in_game_name: ign }),
            });
            dispatch('updated');
        } catch (e) {
            alert('Failed to remove signup.');
        }
    }

    async function addManualSignup() {
        if (!newSignupName.trim()) return;
        try {
            await fetchWithAuth(`/api/guilds/${guildId}/ark/signup`, {
                method: 'POST',
                body: JSON.stringify({
                    alliance_tag: allianceTag,
                    team_number: teamNumber,
                    in_game_name: newSignupName,
                }),
            });
            newSignupName = '';
            dispatch('updated');
        } catch (e) {
            alert('Failed to add signup: ' + (e.message || 'Manual add not supported by API.'));
        }
    }

    async function deleteTeam() {
        if (!confirm(`Delete ${editName}? This will remove the team and all its signups.`)) return;

        try {
            await fetchWithAuth(`/api/guilds/${guildId}/ark/team/${allianceTag}/${teamNumber}`, {
                method: 'DELETE',
            });
            dispatch('updated');
        } catch (e) {
            alert('Failed to delete team: ' + e.message);
        }
    }
</script>

<div class="team-card">
    <div class="team-header">
        <div class="header-main">
            <span class="team-badge">#{teamNumber}</span>
            <input class="team-name-input" bind:value={editName} on:blur={saveTeam} />
        </div>
        <button class="btn-icon danger" on:click={deleteTeam} title="Delete Team"><i class="fas fa-trash"></i></button>
    </div>

    <div class="team-body">
        <div class="settings-row">
            <div class="field">
                <label for="time-{allianceTag}-{teamNumber}"><i class="far fa-clock"></i> Local Match Time</label>
                <input
                    id="time-{allianceTag}-{teamNumber}"
                    type="datetime-local"
                    class="modern-input"
                    bind:value={localDateStr}
                    on:change={saveTeam}
                />
                <span class="utc-time"><i class="fas fa-globe"></i> {utcTimeStr}</span>
            </div>
            <div class="field cap">
                <label for="cap-{allianceTag}-{teamNumber}"><i class="fas fa-users"></i> Cap</label>
                <input
                    id="cap-{allianceTag}-{teamNumber}"
                    type="number"
                    class="modern-input center-text"
                    bind:value={editCap}
                    placeholder="∞"
                    on:change={saveTeam}
                />
            </div>
        </div>

        {#if roleName}
            <div class="role-info">
                <i class="fas fa-at"></i> Assigned Role: <strong>{roleName}</strong>
            </div>
        {/if}

        <div class="signup-container">
            <div class="list-header">
                <span><i class="fas fa-clipboard-list"></i> Signups</span>
                <span class="count-badge" class:full={editCap && signups.length >= editCap}>
                    {signups.length} / {editCap || '∞'}
                </span>
            </div>
            <ul class="signup-list">
                {#if signups.length === 0}
                    <li class="empty-list">No signups yet</li>
                {/if}
                {#each signups as s}
                    <li>
                        <span class="ign">{s.in_game_name}</span>
                        <button class="btn-remove" on:click={() => removeSignup(s.in_game_name)} title="Remove Player">
                            <i class="fas fa-times"></i>
                        </button>
                    </li>
                {/each}
            </ul>
            <div class="add-signup-row">
                <input
                    type="text"
                    placeholder="Manually add player..."
                    bind:value={newSignupName}
                    on:keydown={(e) => e.key === 'Enter' && addManualSignup()}
                />
                <button on:click={addManualSignup} disabled={!newSignupName} aria-label="Add Player"
                    ><i class="fas fa-plus"></i></button
                >
            </div>
        </div>
    </div>
</div>

<style>
    .team-card {
        background: var(--card-bg);
        border: 1px solid var(--card-border);
        border-radius: 12px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        height: 100%;
        box-shadow: var(--card-shadow), var(--card-highlight);
        transition: box-shadow var(--transition-base), border-color var(--transition-base);
    }
    .team-card:hover {
        box-shadow: var(--card-shadow-hover), var(--card-highlight);
        border-color: var(--card-border-hover);
    }

    .team-header {
        background: rgba(255, 255, 255, 0.02);
        padding: 14px 18px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .header-main {
        display: flex;
        align-items: center;
        gap: 10px;
        flex: 1;
    }
    .team-badge {
        background: var(--accent-blue);
        color: white;
        padding: 3px 10px;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 700;
    }

    .team-name-input {
        background: transparent;
        border: 1px solid transparent;
        color: var(--text-primary);
        font-weight: 700;
        font-size: 1rem;
        width: 100%;
        padding: 4px 6px;
        border-radius: 6px;
        transition: border-color var(--transition-base), background var(--transition-base);
    }
    .team-name-input:hover {
        border-color: var(--card-border);
        background: rgba(255, 255, 255, 0.02);
    }
    .team-name-input:focus {
        outline: none;
        border-color: var(--accent-blue);
        box-shadow: var(--focus-ring);
        background: rgba(255, 255, 255, 0.02);
    }

    .btn-icon.danger {
        background: transparent;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        padding: 6px;
        border-radius: 6px;
        transition: color var(--transition-fast), background var(--transition-fast);
    }
    .btn-icon.danger:hover {
        color: var(--accent-red);
        background: var(--accent-red-light);
    }

    .team-body {
        padding: 18px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        flex: 1;
    }

    .settings-row {
        display: flex;
        gap: 10px;
    }
    .field {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 6px;
    }
    .field.cap {
        flex: 0 0 70px;
    }
    .field label {
        font-size: 0.75rem;
        color: var(--text-secondary);
        font-weight: 500;
        display: flex;
        gap: 5px;
        align-items: center;
    }

    .modern-input {
        background: var(--bg-input);
        border: 1px solid var(--card-border);
        padding: 9px 10px;
        border-radius: 8px;
        color: var(--text-primary);
        font-size: 0.85rem;
        width: 100%;
        transition: border-color var(--transition-base), box-shadow var(--transition-base);
    }
    .modern-input.center-text {
        text-align: center;
    }
    .modern-input:focus {
        border-color: var(--accent-blue);
        box-shadow: var(--focus-ring);
        outline: none;
    }

    .utc-time {
        font-size: 0.7rem;
        color: var(--text-muted);
        display: flex;
        align-items: center;
        gap: 4px;
        margin-top: 2px;
    }
    .role-info {
        font-size: 0.8rem;
        color: var(--text-secondary);
        background: var(--accent-blue-light);
        padding: 8px 12px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 6px;
    }
    .role-info i {
        color: var(--accent-blue);
        font-size: 0.75rem;
    }

    .signup-container {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid var(--card-border);
        border-radius: 10px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        flex: 1;
    }
    .list-header {
        padding: 10px 14px;
        background: transparent;
        border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        font-size: 0.8rem;
        font-weight: 600;
        color: var(--text-secondary);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .count-badge {
        background: rgba(255, 255, 255, 0.05);
        padding: 2px 8px;
        border-radius: 10px;
        font-size: 0.7rem;
    }
    .count-badge.full {
        background: var(--accent-red-light);
        color: var(--accent-red);
    }

    .signup-list {
        list-style: none;
        padding: 2px;
        margin: 0;
        flex: 1;
    }
    .signup-list li {
        padding: 1px 10px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.9rem;
        border-radius: 6px;
        transition: background var(--transition-fast);
    }
    .signup-list li:hover {
        background: var(--row-hover);
    }
    .empty-list {
        font-style: italic;
        color: var(--text-muted);
        justify-content: center;
        padding: 20px;
    }

    .btn-remove {
        background: transparent;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        font-size: 0.8rem;
        padding: 4px 6px;
        border-radius: 6px;
        transition: color var(--transition-fast), background var(--transition-fast);
    }
    .btn-remove:hover {
        color: var(--accent-red);
        background: var(--accent-red-light);
    }

    .add-signup-row {
        display: flex;
        border-top: 1px solid var(--card-border);
        background: rgba(255, 255, 255, 0.02);
    }
    .add-signup-row input {
        flex: 1;
        background: transparent;
        border: none;
        padding: 11px 14px;
        color: var(--text-primary);
        font-size: 0.85rem;
        outline: none;
    }
    .add-signup-row button {
        background: transparent;
        border: none;
        border-left: 1px solid var(--card-border);
        width: 42px;
        color: var(--accent-blue);
        cursor: pointer;
        transition: background var(--transition-fast);
    }
    .add-signup-row button:hover {
        background: var(--accent-blue-light);
    }
    .add-signup-row button:disabled {
        color: var(--text-muted);
        cursor: not-allowed;
    }
</style>
