<script>
    import { onMount } from 'svelte';
    import { derivePassword } from '$lib/derive.js';
    import { normalizeDomain } from '$lib/domain.js';
    import { policyCheck } from '$lib/format.js';

    let domainInput = '';
    let label = '';
    let version = 'v1';
    let master = '';

    let normalized = '';
    let output = '';
    let showing = false;
    let copyMsg = '';
    let policy = { ok: false, length: false, digit: false, upper: false, symbol: false };

    const OUTPUT_LENGTH = 20;
    const SYMBOL_SET = '@#%+=?^';

    async function doNormalize() {
        normalized = await normalizeDomain(domainInput);
    }

    async function onDerive() {
        copyMsg = '';
        if (!master.trim()) {
            output = '';
            return;
        }
        const dom = normalized || (await normalizeDomain(domainInput));
        if (!dom) {
            output = '';
            return;
        }
        const salt = `${dom}:${label || 'default'}:${version || 'v1'}`;
        output = await derivePassword(master, salt, { length: OUTPUT_LENGTH, symbols: SYMBOL_SET });
        policy = policyCheck(output, { length: OUTPUT_LENGTH, symbols: SYMBOL_SET });
    }

    async function copyOut() {
        if (!output) return;
        try {
            await navigator.clipboard.writeText(output);
            copyMsg = 'Copied (auto-clear suggested)';
            // optional: clear UI password after N seconds (clipboard cannot be cleared programmatically)
            setTimeout(() => { copyMsg = ''; }, 4000);
        } catch {
            copyMsg = 'Copy failed (clipboard blocked?)';
            setTimeout(() => { copyMsg = ''; }, 4000);
        }
    }

    onMount(() => {
        // convenience: if user pastes a URL, normalize on blur
    });
</script>

<svelte:head>
    <title>PassBooster — Generate</title>
</svelte:head>

<main class="wrap">
    <h1>Generate</h1>
    <div class="card form">
        <label>
            <span>Domain or URL</span>
            <input placeholder="example.com or https://sub.example.co.uk/login"
                   bind:value={domainInput}
                   on:blur={doNormalize} />
        </label>

        <div class="row">
            <label class="grow">
                <span>Account label (optional)</span>
                <input placeholder="personal, work, admin…" bind:value={label} />
            </label>
            <label class="ver">
                <span>Version</span>
                <input class="center" placeholder="v1" bind:value={version} />
            </label>
        </div>

        <label>
            <span>Master secret</span>
            <div class="password">
                <input type={showing ? 'text' : 'password'}
                       placeholder="enter your memorized passphrase"
                       bind:value={master} />
                <button class="btn slim" type="button" on:click={() => showing = !showing}>
                    {showing ? 'Hide' : 'Show'}
                </button>
            </div>
        </label>

        <div class="actions">
            <button class="btn" type="button" on:click={doNormalize}>Normalize</button>
            <button class="btn primary" type="button" on:click={onDerive} disabled={!master || !domainInput}>
                Derive
            </button>
            {#if normalized}
                <span class="muted">Normalized: <code>{normalized}</code></span>
            {/if}
        </div>
    </div>

    <div class="card output">
        <div class="row">
            <label class="grow">
                <span>Password</span>
                <input class="mono" readonly value={output} placeholder="(derive to see output)"/>
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
    .row { display: flex; gap: 12px; align-items: end; }
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
    .output .row { align-items: center; }
    .policy { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
    .pill {
        padding: 4px 10px; border-radius: 999px; border: 1px solid rgba(255,255,255,.14);
        color: var(--muted); font-size: .85rem;
    }
    .pill.ok { color: #c7f9cf; border-color: rgba(34,197,94,.5); }
    .pill.strong { margin-left: auto; }
</style>
