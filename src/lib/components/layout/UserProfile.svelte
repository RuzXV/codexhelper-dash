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
            <div class="badge-row">
                {#if user.is_active_patron}
                    <span class="badge patron"><i class="fab fa-patreon"></i> Patron</span>
                {/if}
                {#if user.is_master_admin}
                    <span class="badge admin"><i class="fas fa-shield-alt"></i> Admin</span>
                {/if}
            </div>
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

    .badge-row {
        display: flex;
        gap: 4px;
    }

    .username {
        font-weight: 600;
        font-size: 0.85rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 0.6rem;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 4px;
        width: fit-content;
        letter-spacing: 0.03em;
    }

    .badge.patron {
        background: linear-gradient(135deg, #f87171, #c084fc, #60a5fa, #34d399, #fbbf24, #f87171);
        background-size: 300% 300%;
        animation: shimmer 4s ease infinite;
        color: #fff;
        text-shadow: 0 0 6px rgba(255, 255, 255, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.15);
    }

    .badge.admin {
        background: linear-gradient(135deg, #60a5fa, #3b82f6, #2563eb);
        color: #fff;
        text-shadow: 0 0 4px rgba(59, 130, 246, 0.4);
        border: 1px solid rgba(96, 165, 250, 0.3);
    }

    @keyframes shimmer {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
    }

    .logout-btn {
        padding: 8px;
        border-radius: var(--radius-md);
        color: var(--text-muted);
        transition: all 0.2s;
        flex-shrink: 0;
    }

    .logout-btn:hover {
        background: var(--accent-red-light);
        color: var(--accent-red);
    }
</style>
