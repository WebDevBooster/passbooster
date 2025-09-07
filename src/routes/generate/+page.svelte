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
    <div class="text-muted mb-3 position-relative d-inline-flex align-items-center gap-1">
        KDF profile: <span class="badge text-bg-light">{kdfProfile}</span>
        <button
                type="button"
                class="btn btn-link p-0 ms-1 pb-tip-trigger"
                aria-label="What is the KDF profile?"
                aria-describedby="tip-kdf"
        >
            <!-- info icon -->
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="rgb(13, 110, 253)" class="bi bi-info-circle" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/>
            </svg>
        </button>

        <span id="tip-kdf" role="tooltip" class="pb-tip">
            <strong>KDF</strong> = Key Derivation Function. <strong>Argon2id</strong> is the best algorithm for this.<br/>
            <strong>m</strong>=memory in MiB, <strong>t</strong>=passes/iterations, <strong>p</strong>=parallelism, <strong>h</strong>=hash bytes.<br/>
            Keep these identical across devices. Changing them changes all derived passwords.
        </span>
    </div>

    <!-- Form card -->
    <div class="card shadow-sm mb-3">
        <div class="card-body">
            <form on:submit|preventDefault={onDerive}>
            <!-- Domain -->
            <div class="input-group">
                <span class="input-group-text">Domain or URL:</span>
                <span class="input-group-text">
                    <button
                            type="button"
                            class="btn btn-link p-0 pb-tip-trigger"
                            aria-label="How is the domain used?"
                            aria-describedby="tip-domain"
                    >
                        <!-- info icon -->
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="rgb(13, 110, 253)" class="bi bi-info-circle" viewBox="0 0 16 16">
                            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                            <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/>
                        </svg>
                    </button>

                    <span id="tip-domain" role="tooltip" class="pb-tip">
                        <strong>Domain</strong> (eTLD+1) + optional username/label + version will be combined into one salt value for the Key Derivation Function.
                        <br/>
                        This is what allows to derive any number of <strong>strong passwords</strong> from ONE master passphrase.
                        <br/>
                        But this also means that all inputs in these fields should be <strong>lowercase</strong>. Because just one uppercase character will change the salt and therefore completely change the derived output.
                    </span>
                </span>
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
                    Will use domain: <span class="text-bg-primary px-2 pb-1">{normalizedDomain}</span>
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
                            Using label as entered: <span class="text-bg-primary px-2 pb-1">{label}</span>
                        </div>
                    {/if}
                </div>

                <div class="col-12 col-md-3">
                    <label class="form-label position-relative d-inline-flex align-items-center gap-1">
                        Version
                        <button
                                type="button"
                                class="btn btn-link p-0 ms-1 pb-tip-trigger"
                                aria-label="What is version?"
                                aria-describedby="tip-version"
                        >
                            <!-- tiny info icon -->
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="rgb(13, 110, 253)" class="bi bi-info-circle" viewBox="0 0 16 16">
                                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                                <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/>
                            </svg>
                        </button>

                        <span id="tip-version" role="tooltip" class="pb-tip">
                            Use <strong>Version</strong> (e.g. v1, v2) to rotate/change the password for this account (when needed). It is part of the salt. So, changing it yields a different password even with the same domain/label.
                        </span>
                    </label>
                    <input
                            class="form-control text-center"
                            placeholder="v1"
                            bind:value={version}
                            on:input={previewNormalization}
                    />
                    <div class="form-text text-end">
                        Will use: <span class="text-bg-primary px-2 pb-1">{normalizedVersion}</span>
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

<style>
    /* Minimal, Bootstrap-looking tooltip */
    .pb-tip {
        position: absolute;
        top: 100%;
        left: 0;
        margin-top: .25rem;
        z-index: 1080;
        background: #257CFD;
        color: #fff;
        padding: .375rem .5rem;
        border-radius: .375rem;
        font-size: .875rem;
        box-shadow: 0 .5rem 1rem rgba(0,0,0,.15);
        white-space: normal;
        min-width: 220px;                   /* don’t get too narrow */
        max-width: min(260px, 50vw);        /* don’t get too wide */

        opacity: 0;
        transform: translateY(-4px);
        pointer-events: none;
        transition: opacity .12s ease, transform .12s ease;
    }
    .pb-tip::after {
        content: "";
        position: absolute;
        top: -6px; left: 10px;
        border: 6px solid transparent;
        border-bottom-color: #212529;
    }
    .pb-tip-trigger { line-height: 0; color: #6c757d; }
    .pb-tip-trigger:hover, .pb-tip-trigger:focus { color: #495057; outline: none; }

    /* Show tip on hover or keyboard focus (works on touch via focus) */
    .pb-tip-trigger:focus + .pb-tip,
    .pb-tip-trigger:hover + .pb-tip {
        opacity: 1;
        transform: translateY(0);
        pointer-events: auto;
    }
</style>
