<script>
    import { createEventDispatcher } from 'svelte';
    import { fade, scale } from 'svelte/transition';

    const dispatch = createEventDispatcher();

    export let show = false;
    export let title = 'Are you sure?';
    export let message = 'This action cannot be undone.';
    export let confirmText = 'Confirm';
    export let cancelText = 'Cancel';
    export let confirmClass = 'danger';
    export let icon = 'fa-exclamation-triangle';
</script>

{#if show}
    <div class="modal-overlay" transition:fade={{ duration: 150 }} on:click={() => dispatch('cancel')}>
        <div
            class="modal-card"
            transition:scale={{ start: 0.95, duration: 200 }}
            on:click|stopPropagation
        >
            {#if icon}
                <div class="modal-icon" class:danger={confirmClass === 'danger'} class:warning={confirmClass === 'warning'}>
                    <i class="fas {icon}"></i>
                </div>
            {/if}
            <h3 class="modal-title">{title}</h3>
            <p class="modal-message">{message}</p>
            <div class="modal-actions">
                <button class="btn-cancel" on:click={() => dispatch('cancel')}>{cancelText}</button>
                <button
                    class="btn-confirm"
                    class:danger={confirmClass === 'danger'}
                    class:warning={confirmClass === 'warning'}
                    on:click={() => dispatch('confirm')}
                >
                    {confirmText}
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    .modal-overlay {
        position: fixed;
        inset: 0;
        background: var(--overlay-bg);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
        backdrop-filter: blur(4px);
    }
    .modal-card {
        background: var(--card-bg);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid var(--card-border);
        border-radius: 16px;
        padding: 32px;
        max-width: 400px;
        width: 90%;
        text-align: center;
        box-shadow: var(--card-shadow-hover), var(--card-highlight);
        animation: cardSlideUp var(--transition-smooth) both;
    }
    .modal-icon {
        font-size: 2rem;
        margin-bottom: 12px;
    }
    .modal-icon.danger {
        color: var(--accent-red);
    }
    .modal-icon.warning {
        color: var(--accent-yellow);
    }
    .modal-title {
        font-size: 1.1rem;
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: 8px;
    }
    .modal-message {
        color: var(--text-secondary);
        font-size: var(--font-size-sm);
        line-height: 1.5;
        margin-bottom: 20px;
    }
    .modal-actions {
        display: flex;
        gap: 10px;
        justify-content: center;
    }
    .btn-cancel {
        background: rgba(255, 255, 255, 0.03);
        color: var(--text-secondary);
        border: 1px solid var(--card-border);
        padding: 9px 22px;
        border-radius: 10px;
        font-weight: 500;
        cursor: pointer;
        transition: color var(--transition-base), border-color var(--transition-base), background var(--transition-base);
    }
    .btn-cancel:hover {
        color: var(--text-primary);
        border-color: var(--card-border-hover);
        background: rgba(255, 255, 255, 0.05);
    }
    .btn-confirm {
        padding: 9px 22px;
        border-radius: 10px;
        font-weight: 600;
        cursor: pointer;
        border: none;
        transition: background var(--transition-base), transform var(--transition-fast);
    }
    .btn-confirm:hover {
        transform: translateY(-1px);
    }
    .btn-confirm.danger {
        background: var(--accent-red);
        color: white;
    }
    .btn-confirm.danger:hover {
        background: var(--accent-red-hover);
    }
    .btn-confirm.warning {
        background: var(--accent-yellow);
        color: white;
    }
    .btn-confirm.warning:hover {
        background: var(--accent-yellow);
    }
</style>
