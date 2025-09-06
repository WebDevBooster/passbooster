<script>
    import {onMount, onDestroy, tick} from 'svelte';

    import {derivePassword} from '$lib/derive.js';
    import {normalizeDomain} from '$lib/domain.js';
    import {normalizeLabelDetailed, normalizeVersion} from '$lib/normalize.js';
    import {settings} from '$lib/stores.js';
    import {getMaster, clearMaster} from '$lib/sessionMaster.js';

    // reactive settings
    $: s = $settings;
    let domainEl;

    // master access helpers
    const masterFromSession = () => getMaster();
    let hasMaster = false;

    function refreshHasMaster() {
        hasMaster = !!masterFromSession().trim();
    }

    onMount(() => {
        // small delay so layout is ready before focusing
        setTimeout(() => domainEl?.focus({ preventScroll: true }), 0);
        refreshHasMaster();
    });

    // form state
    let domainInput = '';
    let label = '';
    let version = 'v1';

    // normalized previews
    let normalizedDomain = '';
    let normalizedLabel = '';
    let normalizedVersion = 'v1';

    // label normalization change list + local step toggles
    let labelChanges = [];
    let steps = null; // local copy derived from settings on first use

    // output
    let output = '';
    let copyMsg = '';

    // KDF profile string (for user awareness)
    $: kdfProfile = `argon2id m${s.memoryMiB} t${s.passes} p${s.parallelism} h${s.hashBytes}`;

    function currentSteps() {
        if (!steps) steps = {...s.labelSteps};
        return steps;
    }

    async function doNormalizeDomain() {
        normalizedDomain = await normalizeDomain(domainInput);
    }

    let normalizeTimer;

    function onDomainInput() {
        clearTimeout(normalizeTimer);
        normalizeTimer = setTimeout(doNormalizeDomain, 200);
    }

    onDestroy(() => clearTimeout(normalizeTimer));

    function previewNormalization() {
        const {output: out, changes} = normalizeLabelDetailed(label, currentSteps());
        normalizedLabel = out;
        normalizedVersion = normalizeVersion(version);
        labelChanges = changes;
    }

    function undoChange(key) {
        steps = {...currentSteps(), [key]: false};
        previewNormalization();
    }

    let deriving = false;

    async function onDerive(e) {
        e?.preventDefault?.();

        // show skeleton placeholders
        copyMsg = '';
        deriving = true;
        output = '';

        // 🔑 let the DOM update & paint before blocking work
        await tick();                                   // flush Svelte updates
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); // give the browser a paint frame
        await new Promise(r => setTimeout(r, 0));

        try {
            const master = masterFromSession();
            if (!master.trim()) return;

            const dom = normalizedDomain || (await normalizeDomain(domainInput));
            if (!dom) return;

            const pieces = [dom, normalizedLabel || 'default', normalizedVersion || 'v1'];

            const K = await derivePassword(master, pieces, {
                length: s.length,
                symbols: s.symbols,
                passes: s.passes,
                memoryMiB: s.memoryMiB,
                parallelism: s.parallelism,
                hashBytes: s.hashBytes
            });

            output = K;
        } finally {
            deriving = false; // hide placeholders
        }
    }

    async function copyOut() {
        if (!output) return;
        try {
            await navigator.clipboard.writeText(output);
            copyMsg = 'Copied';
            setTimeout(() => (copyMsg = ''), 3000);
        } catch {
            copyMsg = 'Copy failed (clipboard blocked?)';
            setTimeout(() => (copyMsg = ''), 4000);
        }
    }

    function onForgetMaster() {
        clearMaster();
        refreshHasMaster();   // immediately hide the button and show the banner
        output = '';          // clear any derived output in UI
    }
</script>

<svelte:head>
    <title>PassBooster — Generate</title>
</svelte:head>

<main class="container py-4">
    <div class="d-flex align-items-center gap-2 mb-1">
        <h1 class="h3 mb-0">Generate</h1>
        {#if hasMaster}
            <button
                    class="btn btn-outline-secondary btn-sm ms-auto"
                    type="button"
                    on:click={onForgetMaster}
                    title="Remove the in-memory passphrase for this tab"
            >
                Forget master passphrase
            </button>
        {/if}
    </div>

    <!-- Master missing guard -->
    {#if !hasMaster}
        <div class="alert alert-warning mb-3">
            No master passphrase set. Go to the <a href="#/">Home</a> page to enter it.
        </div>
    {/if}

    <!-- KDF profile reminder -->
    <div class="text-muted mb-3">
        KDF profile: <span class="badge text-bg-light">{kdfProfile}</span>
    </div>

    <!-- Form card -->
    <div class="card shadow-sm mb-3">
        <div class="card-body">
            <form on:submit|preventDefault={onDerive}>
            <!-- Domain -->
            <div class="input-group">
                <span class="input-group-text">Domain or URL:</span>
<!--                <label class="form-label">Domain or URL</label>-->
                <input
                        class="form-control"
                        placeholder="example.com or https://sub.example.co.uk/login"
                        bind:this={domainEl}
                        bind:value={domainInput}
                        on:input={onDomainInput}
                        on:blur={doNormalizeDomain}
                        autofocus
                />
            </div>
            {#if normalizedDomain}
                <div class="form-text">
                    Will use domain: <span class="text-bg-secondary px-2 pb-1">{normalizedDomain}</span>
                </div>
            {/if}

            <!-- Label + Version (aligned) -->
            <div class="row mt-2 g-3">
                <div class="col-12 col-md-9">
                    <label class="form-label">Account username, email or label (optional)</label>
                    <input
                            class="form-control"
                            placeholder="personal, work, admin…"
                            bind:value={label}
                            on:input={previewNormalization}
                    />
                    <!-- Label hint and warning -->
                    {#if label && labelChanges.length > 0}
                        <div class="alert alert-warning mb-0 mt-1">
                            <div class="fw-semibold">
                                Changed label to:
                                <span class="text-bg-danger fw-bold px-2 pb-1">{normalizedLabel || 'default'}</span>
                                <br>(check <a href="#/help">help</a> to see why)
                            </div>
                            <ul class="list-unstyled mb-2 mt-2">
                                {#each labelChanges as ch}
                                    <li class="d-flex align-items-center gap-1">
                                        <span class="fw-semibold">{ch.title}:</span>
                                        <span class="text-muted">{ch.detail}</span>
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
                        </div>
                    {:else if label}
                        <div class="form-text">
                            Using label as entered: <span class="text-bg-secondary fw-bold px-2 pb-1">{label}</span>
                        </div>
                    {/if}
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
                        Will use: <span class="text-bg-secondary px-2 pb-1">{normalizedVersion}</span>
                    </div>
                </div>

                <!-- Changed-label hint on its own row to keep columns aligned -->
<!--

                <div class="col-12">
                    {#if label && labelChanges.length > 0}
                        <div class="alert alert-warning mb-0">
                            <div class="fw-semibold">
                                Changed label to:
                                <span class="text-bg-danger fw-bold px-2 pb-1">{normalizedLabel || 'default'}</span> (check <a href="#/help">help</a> to see why)
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
                        </div>
                    {:else if label}
                        <div class="form-text">
                            Using label as entered: <span class="text-bg-secondary fw-bold px-2 pb-1">{label}</span>
                        </div>
                    {/if}
                </div>

-->
            </div>

            <!-- Actions -->
            <div class="d-flex flex-wrap gap-2 align-items-center mt-3">
                <button
                        class="btn btn-primary"
                        type="submit"
                        on:click={onDerive}
                        disabled={!hasMaster || !domainInput || deriving}
                >
                    Derive password from the input above
                </button>
            </div>
            </form>
        </div>
    </div>

    <!-- Output card -->
    <div class="card shadow-sm">
        <div class="card-body">
            {#key deriving} <!-- forces re-render so glow restarts each time -->
            <div class={"input-group " + (deriving && !output ? "placeholder-glow" : "")}>
                <span class={"input-group-text " + (deriving && !output ? "placeholder col-3" : "")}>Derived password:</span>
                <input
                        class={"form-control font-monospace " + (deriving && !output ? "placeholder bg-primary" : "")}
                        readonly
                        value={output}
                        placeholder="(derive to see output)"
                />
                <button class="btn btn-outline-secondary" type="button" on:click={copyOut} disabled={!output}>
                    Copy
                </button>
            </div>
            {/key}
            <small class="bg-success text-light d-block mt-1 text-center">{copyMsg}</small>
        </div>
    </div>

    <div class="row">
        <div class="col-12 mt-2 text-center">
            <a class="link-secondary px-2" href="#/help">❔ Why &amp; How</a>
            <a class="link-secondary px-2" href="#">📔 Algo Card</a>
            <a class="link-secondary px-2" href="#/settings">⚙️ Settings</a>
        </div>
    </div>
</main>
