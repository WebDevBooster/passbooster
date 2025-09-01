<script>
    import { derivePassword } from '$lib/derive.js';
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

    let normalizeTimer;
    function onDomainInput() {
        clearTimeout(normalizeTimer);
        // light debounce so we don't re-run normalization on every keystroke
        normalizeTimer = setTimeout(doNormalizeDomain, 200);
    }

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

<main class="container py-4">
    <h1 class="h3 mb-3">Generate</h1>

    <!-- Form card -->
    <div class="card shadow-sm mb-3">
        <div class="card-body">
            <!-- Domain -->
            <div class="mb-3">
                <label class="form-label">Domain or URL</label>
                <input
                        class="form-control"
                        placeholder="example.com or https://sub.example.co.uk/login"
                        bind:value={domainInput}
                        on:input={onDomainInput}
                        on:blur={doNormalizeDomain}
                />
                {#if normalizedDomain}
                    <div class="form-text">
                        Will use domain: <span class="badge text-bg-secondary">{normalizedDomain}</span>
                    </div>
                {/if}
            </div>

            <!-- Label + Version (aligned) -->
            <div class="row g-3">
                <div class="col-12 col-md-9">
                    <label class="form-label">Account label (optional)</label>
                    <input
                            class="form-control"
                            placeholder="personal, Work, admin…"
                            bind:value={label}
                            on:input={previewNormalization}
                    />
                </div>

                <div class="col-12 col-md-3">
                    <label class="form-label">Version</label>
                    <input
                            class="form-control text-center"
                            placeholder="v1"
                            bind:value={version}
                            on:input={previewNormalization}
                    />
                    <div class="form-text text-end">
                        Will use: <span class="badge text-bg-secondary">{normalizedVersion}</span>
                    </div>
                </div>

                <!-- Changed-label hint lives on its own full-width row so columns stay aligned -->
                <div class="col-12">
                    {#if label && labelChanges.length > 0}
                        <div class="alert alert-warning mb-0">
                            <div class="fs-3 fw-semibold">
                                Changed label to:
                                <span class="badge text-bg-danger">{normalizedLabel || 'default'}</span>
                            </div>
                            <ul class="list-unstyled mb-2 mt-2">
                                {#each labelChanges as ch}
                                    <li class="d-flex align-items-center gap-2">
                                        <span class="fw-semibold">{ch.title}</span>
                                        <span class="text-muted">— {ch.detail}</span>
                                        <button
                                                type="button"
                                                class="btn btn-sm btn-outline-dark"
                                                on:click={() => undoChange(ch.key)}
                                                title="Undo this change"
                                        >
                                            ⟲ undo
                                        </button>
                                    </li>
                                {/each}
                            </ul>
                            <div class="form-text">
                                You can undo any automatic label adjustment above. <br>
                                But the derived password depends on the <span class="fw-bold">EXACT spelling</span> of the label (and the version number).
                            </div>
                        </div>
                    {:else if label}
                        <div class="fs-5 form-text">
                            Using label as entered:
                            <span class="badge text-bg-light">{label}</span>
                        </div>
                    {/if}
                </div>
            </div>

            <!-- Master secret -->
            <div class="mt-3">
                <label class="form-label">Master secret</label>
                <div class="input-group">
                    <input
                            class="form-control"
                            type={showing ? 'text' : 'password'}
                            placeholder="enter your memorized passphrase"
                            bind:value={master}
                            autocomplete="current-password"
                    />
                    <button class="btn btn-outline-secondary" type="button" on:click={() => (showing = !showing)}>
                        {showing ? 'Hide' : 'Show'}
                    </button>
                </div>
            </div>

            <!-- Actions -->
            <div class="d-flex flex-wrap gap-2 align-items-center mt-3">
                <button class="btn btn-primary" type="button" on:click={onDerive} disabled={!master || !domainInput}>
                    Derive
                </button>
            </div>
        </div>
    </div>

    <!-- Output card -->
    <div class="card shadow-sm">
        <div class="card-body">
            <label class="form-label">Password</label>
            <!-- Input-group guarantees perfect alignment with the Copy button -->
            <div class="input-group">
                <input
                        class="form-control font-monospace"
                        readonly
                        value={output}
                        placeholder="(derive to see output)"
                />
                <button class="btn btn-outline-secondary" type="button" on:click={copyOut} disabled={!output}>
                    Copy
                </button>
            </div>
            <small class="text-muted d-block mt-1">{copyMsg}</small>

            <!-- Policy chips -->
            <div class="d-flex flex-wrap gap-2 mt-3">
                <span class={"badge rounded-pill " + (policy.length ? "text-bg-success" : "text-bg-secondary")}>length</span>
                <span class={"badge rounded-pill " + (policy.digit ? "text-bg-success" : "text-bg-secondary")}>digit</span>
                <span class={"badge rounded-pill " + (policy.upper ? "text-bg-success" : "text-bg-secondary")}>upper</span>
                <span class={"badge rounded-pill " + (policy.symbol ? "text-bg-success" : "text-bg-secondary")}>symbol</span>
                {#if output}
          <span class={"badge rounded-pill ms-auto " + (policy.ok ? "text-bg-success" : "text-bg-warning")}>
            {policy.ok ? 'OK' : 'check rules'}
          </span>
                {/if}
            </div>
        </div>
    </div>
</main>
