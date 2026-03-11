<script>
    import { createEventDispatcher, tick } from 'svelte';

    const dispatch = createEventDispatcher();

    export let id = '';
    export let options = [];
    export let selected = null;
    export let placeholder = 'Select...';
    export let searchable = false;
    export let displayPrefix = '';

    let isOpen = false;
    let searchQuery = '';

    $: filteredOptions = searchQuery
        ? options.filter((o) => o.label.toLowerCase().includes(searchQuery.toLowerCase()))
        : options;

    $: displayLabel = getDisplayLabel(selected);

    function getDisplayLabel(val) {
        if (!val || val === 'none') return placeholder;
        const opt = options.find((o) => o.value === val);
        return opt ? `${displayPrefix}${opt.label}` : placeholder;
    }

    function toggle(event) {
        event.stopPropagation();
        searchQuery = '';
        isOpen = !isOpen;
        if (isOpen && searchable) {
            tick().then(() => {
                const input = document.getElementById(`search-${id}`);
                if (input) input.focus();
            });
        }
    }

    function select(value) {
        dispatch('change', { value });
        isOpen = false;
    }

    function handleWindowClick() {
        isOpen = false;
    }
</script>

<svelte:window on:click={handleWindowClick} />

<div class="custom-select-container">
    <button class="custom-select-trigger" class:open={isOpen} on:click={toggle}>
        <span class="select-label" class:placeholder={!selected || selected === 'none'}>{displayLabel}</span>
        <i class="fas fa-chevron-down chevron" class:rotated={isOpen}></i>
    </button>
    {#if isOpen}
        <div class="custom-dropdown-menu" on:click|stopPropagation>
            {#if searchable}
                <input
                    id="search-{id}"
                    type="text"
                    class="dropdown-search"
                    placeholder="Search..."
                    bind:value={searchQuery}
                />
            {/if}
            <div class="dropdown-options">
                {#each filteredOptions as opt}
                    <button
                        class="dropdown-option"
                        class:selected={opt.value === selected}
                        on:click={() => select(opt.value)}
                    >
                        {#if opt.icon}
                            <i class={opt.icon}></i>
                        {/if}
                        <span>{displayPrefix}{opt.label}</span>
                    </button>
                {/each}
                {#if filteredOptions.length === 0}
                    <div class="dropdown-option empty">No results found</div>
                {/if}
            </div>
        </div>
    {/if}
</div>

<style>
    .custom-select-container {
        position: relative;
        width: 100%;
    }
    .custom-select-trigger {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 9px 14px;
        background: var(--bg-input, var(--bg-tertiary));
        border: 1px solid var(--card-border);
        border-radius: 8px;
        color: var(--text-primary);
        cursor: pointer;
        font-size: var(--font-size-sm);
        transition: border-color var(--transition-base), box-shadow var(--transition-base);
        min-height: 38px;
    }
    .custom-select-trigger:hover {
        border-color: var(--card-border-hover);
    }
    .custom-select-trigger.open {
        border-color: var(--accent-blue);
        box-shadow: var(--focus-ring);
    }
    .select-label {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .select-label.placeholder {
        color: var(--text-muted);
    }
    .chevron {
        font-size: 0.7em;
        opacity: 0.6;
        transition: transform var(--transition-base);
        flex-shrink: 0;
    }
    .chevron.rotated {
        transform: rotate(180deg);
    }
    .custom-dropdown-menu {
        position: absolute;
        top: calc(100% + 4px);
        left: 0;
        right: 0;
        background: var(--card-bg);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid var(--card-border);
        border-radius: 10px;
        box-shadow: var(--card-shadow-hover);
        z-index: 100;
        overflow: hidden;
        padding: 4px;
    }
    .dropdown-search {
        width: calc(100% - 8px);
        margin: 0 4px 4px;
        padding: 8px 12px;
        background: var(--bg-input);
        border: 1px solid var(--card-border);
        border-radius: 6px;
        color: var(--text-primary);
        font-size: var(--font-size-sm);
        outline: none;
        transition: border-color var(--transition-base), box-shadow var(--transition-base);
    }
    .dropdown-search:focus {
        border-color: var(--accent-blue);
        box-shadow: var(--focus-ring);
    }
    .dropdown-options {
        max-height: 200px;
        overflow-y: auto;
    }
    .dropdown-option {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        padding: 8px 12px;
        background: transparent;
        border: none;
        border-radius: 6px;
        color: var(--text-secondary);
        cursor: pointer;
        text-align: left;
        font-size: var(--font-size-sm);
        transition: background var(--transition-fast), color var(--transition-fast);
        margin: 1px 0;
    }
    .dropdown-option:hover {
        background: var(--row-hover);
        color: var(--text-primary);
    }
    .dropdown-option.selected {
        color: var(--accent-blue);
        background: var(--accent-blue-light);
    }
    .dropdown-option.empty {
        cursor: default;
        font-style: italic;
        text-align: center;
        justify-content: center;
        color: var(--text-muted);
    }
</style>
