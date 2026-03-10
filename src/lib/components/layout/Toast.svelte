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
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
        font-size: 0.9rem;
    }

    .toast-success {
        background: rgba(34, 197, 94, 0.15);
        border: 1px solid rgba(34, 197, 94, 0.3);
        color: #4ade80;
    }

    .toast-error {
        background: rgba(239, 68, 68, 0.15);
        border: 1px solid rgba(239, 68, 68, 0.3);
        color: #f87171;
    }

    .toast-info {
        background: rgba(59, 130, 246, 0.15);
        border: 1px solid rgba(59, 130, 246, 0.3);
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
