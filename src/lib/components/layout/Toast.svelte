<script>
    import { toastMessage, hideToast } from '$lib/stores/ui';
    import { fade, fly } from 'svelte/transition';
</script>

{#if $toastMessage.visible}
    <div
        class="toast toast-{$toastMessage.type}"
        transition:fly={{ y: -20, duration: 250 }}
    >
        <div class="toast-icon">
            {#if $toastMessage.type === 'success'}
                <i class="fas fa-check-circle"></i>
            {:else if $toastMessage.type === 'error'}
                <i class="fas fa-exclamation-circle"></i>
            {:else}
                <i class="fas fa-info-circle"></i>
            {/if}
        </div>
        <span class="toast-message">{$toastMessage.message}</span>
        <button class="toast-close" on:click={hideToast}>
            <i class="fas fa-times"></i>
        </button>
    </div>
{/if}

<style>
    .toast {
        position: fixed;
        top: 20px;
        right: 20px;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 16px;
        border-radius: var(--radius-lg);
        z-index: 10000;
        max-width: 400px;
        box-shadow: var(--shadow-lg);
        font-size: 0.9rem;
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
    }

    .toast-success {
        background: rgba(52, 211, 153, 0.15);
        border: 1px solid rgba(52, 211, 153, 0.3);
        color: var(--accent-green);
    }

    .toast-error {
        background: rgba(248, 113, 113, 0.15);
        border: 1px solid rgba(248, 113, 113, 0.3);
        color: var(--accent-red);
    }

    .toast-info {
        background: rgba(79, 140, 247, 0.15);
        border: 1px solid rgba(79, 140, 247, 0.3);
        color: var(--accent-blue-bright);
    }

    .toast-close {
        padding: 4px;
        color: inherit;
        opacity: 0.6;
        transition: opacity 0.2s;
    }

    .toast-close:hover {
        opacity: 1;
    }
</style>
