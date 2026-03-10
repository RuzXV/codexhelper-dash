<script>
    import { logout } from '$lib/stores/auth';

    export let user;

    function getAvatarUrl(user) {
        if (user.avatar) {
            return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64`;
        }
        if (user.discriminator === '0' || !user.discriminator) {
            try {
                const index = Number((BigInt(user.id) >> 22n) % 6n);
                return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
            } catch {
                return `https://cdn.discordapp.com/embed/avatars/0.png`;
            }
        }
        const index = parseInt(user.discriminator) % 5;
        return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
    }

    function getDisplayName(user) {
        return user.display_name || user.global_name || user.username;
    }
</script>

<div class="user-profile">
    <div class="user-info">
        <img src={getAvatarUrl(user)} alt="" class="avatar" />
        <div class="user-text">
            <span class="username">{getDisplayName(user)}</span>
            {#if user.is_active_patron}
                <span class="badge patron">Patron</span>
            {/if}
        </div>
    </div>
    <button class="logout-btn" on:click={logout} title="Logout">
        <i class="fas fa-sign-out-alt"></i>
    </button>
</div>

<style>
    .user-profile {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        border-top: 1px solid var(--border-color);
        margin-top: auto;
    }

    .user-info {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
    }

    .avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        flex-shrink: 0;
    }

    .user-text {
        display: flex;
        flex-direction: column;
        min-width: 0;
    }

    .username {
        font-weight: 600;
        font-size: 0.85rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .badge {
        font-size: 0.65rem;
        font-weight: 600;
        padding: 1px 6px;
        border-radius: 4px;
        width: fit-content;
    }

    .badge.patron {
        background: rgba(59, 130, 246, 0.15);
        color: var(--accent-blue-bright);
    }

    .logout-btn {
        padding: 8px;
        border-radius: var(--radius-md);
        color: var(--text-muted);
        transition: all 0.2s;
        flex-shrink: 0;
    }

    .logout-btn:hover {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
    }
</style>
