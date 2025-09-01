<script>
    import { derivePassword, SALT_DELIM } from '$lib/derive.js';
    import { normalizeDomain } from '$lib/domain.js';
    import { policyCheck } from '$lib/format.js';
    import {
        normalizeLabelDetailed,
        normalizeVersion,
        defaultLabelSteps
    } from '$lib/normalize.js';
    import { settings } from '$lib/stores.js';
    $: s = $settings;

    let domainInput = '';
    let label = '';
    let version = 'v1';
    let master = '';

    let normalizedDomain = '';
    let normalizedLabel = '';
    let normalizedVersion = 'v1';

    let labelChanges = [];
    let steps = { ...defaultLabelSteps }; // toggled by per-change Undo

    let output = '';
    let showing = false;
    let copyMsg = '';
    let policy = { ok: false, length: false, digit: false, upper: false, symbol: false };

    // remove the fixed constants:
    // const OUTPUT_LENGTH = 20;
    // const SYMBOL_SET = '@#%+=?^';

    async function doNormalizeDomain() {
        normalizedDomain = await normalizeDomain(domainInput);
        previewNormalization();
    }

    function previewNormalization() {
        const { output, changes } = normalizeLabelDetailed(label, steps);
        normalizedLabel = output;
        normalizedVersion = normalizeVersion(version);
        labelChanges = changes;
    }

    function undoChange(key) {
        steps = { ...steps, [key]: false };
        previewNormalization();
    }

    function resetLabelNormalization() {
        steps = { ...defaultLabelSteps };
        previewNormalization();
    }

    async function onDerive() {
        copyMsg = '';
        if (!master.trim()) { output = ''; return; }
        const dom = normalizedDomain || (await normalizeDomain(domainInput));
        if (!dom) { output = ''; return; }

        // Build salt pieces; delimiter is a safe control char.
        const pieces = [dom, normalizedLabel || 'default', normalizedVersion || 'v1'];
        output = await derivePassword(master, pieces, {
            length: s.length,
            symbols: s.symbols,
            passes: s.passes,
            memoryMiB: s.memoryMiB,
            parallelism: s.parallelism,
            hashBytes: s.hashBytes
        });
        policy = policyCheck(output, { length: s.length, symbols: s.symbols });
    }

    async function copyOut() {
        if (!output) return;
        try {
            await navigator.clipboard.writeText(output);
            copyMsg = 'Copied';
            setTimeout(() => (copyMsg = ''), 4000);
        } catch {
            copyMsg = 'Copy failed (clipboard blocked?)';
            setTimeout(() => (copyMsg = ''), 4000);
        }
    }
</script>

<svelte:head>
    <title>PassBooster — Generate</title>
</svelte:head>

<main class="wrap">
    <h1>Generate</h1>

    <div class="card form">
        <label>
            <span>Domain or URL</span>
            <input
                    placeholder="example.com or https://sub.example.co.uk/login"
                    bind:value={domainInput}
                    on:blur={doNormalizeDomain} />
        </label>

        <div class="row">
            <label class="grow">
                <span>Account label (optional)</span>
                <input
                        placeholder="personal, Work, admin…"
                        bind:value={label}
                        on:input={previewNormalization} />

                <!-- HINT: only show orange warning when changes occurred -->
                {#if label && labelChanges.length > 0}
                    <div class="hint warn">
                        <div class="hint-title">
                            Changed label to: <code>{normalizedLabel || 'default'}</code>
                        </div>
                        <ul class="changes">
                            {#each labelChanges as ch}
                                <li>
                                    <span class="change-title">{ch.title}</span>
                                    <span class="change-detail">— {ch.detail}</span>
                                    <button type="button" class="undo" on:click={() => undoChange(ch.key)} title="Undo this change">
                                        <!-- simple inline icon -->
                                        <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                                            <path d="M12 5a7 7 0 1 1-7 7H3a9 9 0 1 0 9-9V1L6 6l6 5V5z" fill="currentColor"/>
                                        </svg>
                                        <span>undo</span>
                                    </button>
                                </li>
                            {/each}
                        </ul>
                        <div class="hint-footer">
                            <button class="link" type="button" on:click={resetLabelNormalization}>Reset normalization</button>
                        </div>
                    </div>
                {:else if label}
                    <div class="hint muted small">
                        Using label as entered: <code>{label}</code>
                    </div>
                {/if}
            </label>

            <label class="ver">
                <span>Version</span>
                <input class="center" placeholder="v1" bind:value={version} on:input={previewNormalization} />
                <div class="hint muted small">Will use: <code>{normalizedVersion}</code></div>
            </label>
        </div>

        <label>
            <span>Master secret</span>
            <div class="password">
                <input
                        type={showing ? 'text' : 'password'}
                        placeholder="enter your memorized passphrase"
                        bind:value={master} />
                <button class="btn slim" type="button" on:click={() => (showing = !showing)}>
                    {showing ? 'Hide' : 'Show'}
                </button>
            </div>
            <div class="hint muted small">
                You can undo any label adjustment above. Salt delimiter is internal, so labels may include <code>:</code>.
            </div>
        </label>

        <div class="actions">
            <button class="btn" type="button" on:click={doNormalizeDomain}>Normalize</button>
            <button class="btn primary" type="button" on:click={onDerive} disabled={!master || !domainInput}>
                Derive
            </button>
            {#if normalizedDomain}
                <span class="muted">Normalized domain: <code>{normalizedDomain}</code></span>
            {/if}
        </div>
    </div>

    <div class="card output">
        <div class="row">
            <label class="grow">
                <span>Password</span>
                <input class="mono" readonly value={output} placeholder="(derive to see output)" />
            </label>
            <div class="col">
                <button class="btn" type="button" on:click={copyOut} disabled={!output}>Copy</button>
                <span class="muted small">{copyMsg}</span>
            </div>
        </div>

        <div class="policy">
            <span class:ok={policy.length} class="pill">length</span>
            <span class:ok={policy.digit} class="pill">digit</span>
            <span class:ok={policy.upper} class="pill">upper</span>
            <span class:ok={policy.symbol} class="pill">symbol</span>
            {#if output}
                <span class:ok={policy.ok} class="pill strong">{policy.ok ? 'OK' : 'check rules'}</span>
            {/if}
        </div>
    </div>
</main>

<style>
    :root {
        --bg: #0f172a; --card: #111827; --muted: #94a3b8; --text: #e5e7eb;
        --accent: #3b82f6; --accent-2: #60a5fa; --ok: #22c55e; --warn: #f59e0b;
        --radius: 16px; --shadow: 0 8px 24px rgba(0,0,0,.35);
        --warn-surface: #FEF3C7; /* amber-100 */
        --warn-text:    #7C2D12; /* amber-900 */
        --warn-border:  #F59E0B; /* amber-500 */
    }
    .wrap { max-width: 820px; margin: 0 auto; padding: 24px; color: var(--text); }
    h1 { margin: 0 0 16px; letter-spacing: -0.02em; }
    .card {
        background: linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.02));
        border: 1px solid rgba(255,255,255,.08);
        border-radius: var(--radius);
        padding: 16px 18px; box-shadow: var(--shadow); margin-bottom: 16px;
    }
    label { display: block; margin: 10px 0; }
    label span { display: block; font-size: .9rem; color: var(--muted); margin-bottom: 6px; }
    input {
        width: 100%; padding: 10px 12px; border-radius: 10px; border: 1px solid #2a3443;
        background: #0b1220; color: var(--text); outline: none;
    }
    .row { display: flex; gap: 12px; align-items: flex-end; }
    .col { display: flex; flex-direction: column; gap: 6px; align-items: flex-start; }
    .grow { flex: 1; }
    .ver { width: 96px; }
    .center { text-align: center; }
    .password { display: flex; gap: 8px; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace; }
    .actions { display: flex; gap: 10px; align-items: center; margin-top: 10px; }
    .muted { color: var(--muted); }
    .small { font-size: .85rem; }
    .btn {
        display: inline-block; padding: 10px 14px; border-radius: 999px;
        background: #1f2937; color: var(--text); text-decoration: none; border: 1px solid #2a3443;
        transition: transform .06s ease, background .2s ease, border-color .2s ease; cursor: pointer;
    }
    .btn:hover { transform: translateY(-1px); border-color: #3b475a; }
    .btn.primary { background: linear-gradient(180deg, var(--accent-2), var(--accent)); border-color: rgba(255,255,255,.15); }
    .btn.slim { padding: 8px 10px; }

    /* Warning hint */
    .hint.warn {
        margin-top: 6px;
        background: var(--warn-surface);
        border: 1px solid var(--warn-border);
        border-radius: 10px;
        padding: 10px 12px;
        color: var(--warn-text);
    }
    .hint.warn .hint-title,
    .hint.warn .change-title,
    .hint.warn .change-detail {
        color: var(--warn-text);
    }

    .hint.warn code {
        background: #FDE68A;      /* amber-300 chip */
        color: var(--warn-text);
        border-radius: 6px;
        padding: 1px 6px;
    }

    .hint-title { font-weight: 600; margin-bottom: 6px; }
    .changes { list-style: none; padding: 0; margin: 0; display: grid; gap: 6px; }
    .changes li { display: flex; align-items: center; gap: 8px; }
    .change-title { font-weight: 500; }
    .change-detail { color: var(--muted); }
    .undo {
        margin-left: auto;
        display: inline-flex; align-items: center; gap: 4px;
        background: transparent;
        color: var(--warn-text);
        border: 1px dashed var(--warn-text);
        padding: 3px 8px; border-radius: 999px; cursor: pointer;
    }
    .undo span {
        color: var(--warn-text);
        margin-bottom: 0;
    }
    .undo:hover { background: rgba(124, 45, 18, 0.08); } /* amber-900 @ 8% */
    .hint-footer { margin-top: 6px; }
    .link { background: transparent; border: none; color: #93c5fd; cursor: pointer; padding: 0; }
    .link:hover { text-decoration: underline; }

    .policy { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
    .pill {
        padding: 4px 10px; border-radius: 999px; border: 1px solid rgba(255,255,255,.14);
        color: var(--muted); font-size: .85rem;
    }
    .pill.ok { color: #c7f9cf; border-color: rgba(34,197,94,.5); }
    .pill.strong { margin-left: auto; }
</style>
