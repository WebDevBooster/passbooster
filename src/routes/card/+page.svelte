<script>
    import { settings } from '$lib/stores.js';
    import { SALT_DELIM } from '$lib/derive.js';
    import { onMount } from 'svelte';

    // live settings
    $: s = $settings;

    // Friendly titles for label normalization steps (fallback to the key if unknown)
    const STEP_LABELS = {
        trim: 'Trim outer spaces',
        collapse_ws: 'Collapse inner spaces',
        lowercase: 'Lowercase',
        ascii_fold: 'Strip accents (ASCII fold)',
        map_lookalikes: 'Map lookalike chars',
        keep_safe: 'Keep only [a–z 0–9 . _ -]'
    };
    $: enabledSteps = Object.entries(s.labelSteps || {})
        .filter(([, v]) => !!v)
        .map(([k]) => STEP_LABELS[k] || k);

    $: kdfProfile = `argon2id m${s.memoryMiB} t${s.passes} p${s.parallelism} h${s.hashBytes}`;
    $: symbolNote = s.symbols ? `1 symbol from “${s.symbols}”` : 'no symbols (symbols disabled)';
    $: saltFormula = `salt = eTLD+1 ${SALT_DELIM} label ${SALT_DELIM} version`;

    function printCard() {
        window.print();
    }

    onMount(() => {
        // nothing required; reserved if you later add dynamic sizing controls
    });
</script>

<svelte:head>
    <title>PassBooster — Algorithm Card</title>
    <meta name="description" content="Printable reference card for PassBooster: inputs, rules, and KDF profile (no secrets)." />
</svelte:head>

<main class="container py-4">
    <div class="d-flex align-items-center justify-content-between gap-2 no-print">
        <h1 class="h4 mb-0">Algorithm Card</h1>
        <div class="d-flex gap-2">
            <a class="btn btn-outline-secondary" href="#/generate">← Back</a>
            <button class="btn btn-primary" on:click={printCard}>Print / Save PDF</button>
        </div>
    </div>

    <p class="text-muted no-print mt-3">
        This page creates a printable reference card with the exact rules your generator uses.
        <strong>No secrets are shown or stored.</strong> Use your browser’s “Save as PDF” to export.
    </p>

    <!-- Screen preview (what will print) -->
    <section class="print-area mx-auto">
        <div class="algo-card card shadow-sm">
            <div class="card-body">
                <header class="d-flex justify-content-between align-items-start">
                    <div>
                        <h2 class="h5 mb-0">PassBooster — Algorithm</h2>
                        <small class="text-muted">Reference card (keep separate from your master passphrase)</small>
                    </div>
                    <span class="badge text-bg-light">v1</span>
                </header>

                <hr class="my-3" />

                <div class="row g-3">
                    <!-- Inputs -->
                    <div class="col-12">
                        <h3 class="h6 mb-1">Inputs</h3>
                        <ul class="mb-0 small">
                            <li><strong>Domain:</strong> use the site’s eTLD+1 (e.g. <code>sub.example.co.uk</code> → <code>example.co.uk</code>)</li>
                            <li><strong>Label (optional):</strong> username/email/note; normalization applies (see below); default is <code>default</code></li>
                            <li><strong>Version:</strong> rotation tag (e.g. <code>v1</code>, <code>v2</code>) to intentionally change the password</li>
                            <li><strong>Master:</strong> your memorized passphrase (never written here)</li>
                        </ul>
                    </div>

                    <!-- Salt & KDF -->
                    <div class="col-12">
                        <h3 class="h6 mb-1">Salt &amp; KDF</h3>
                        <div class="small">
                            <div><strong>Salt formula:</strong> <code>{saltFormula}</code></div>
                            <div><strong>Delimiter:</strong> <code>{SALT_DELIM}</code></div>
                            <div><strong>KDF profile:</strong> <span class="badge text-bg-light">{kdfProfile}</span></div>
                        </div>
                    </div>

                    <!-- Output rules -->
                    <div class="col-12">
                        <h3 class="h6 mb-1">Output rules (deterministic)</h3>
                        <ul class="mb-0 small">
                            <li>Length: <strong>{s.length}</strong> characters</li>
                            <li>Includes: <strong>≥ 1 uppercase</strong>, <strong>≥ 1 digit</strong> (no 3+ digits in a row), and <strong>{symbolNote}</strong></li>
                            <li>All placements are derived from the hash (no randomness). Same inputs → same password.</li>
                        </ul>
                    </div>

                    <!-- Label normalization -->
                    <div class="col-12">
                        <h3 class="h6 mb-1">Label normalization</h3>
                        {#if enabledSteps.length > 0}
                            <ul class="mb-0 small">
                                {#each enabledSteps as step}
                                    <li>{step}</li>
                                {/each}
                            </ul>
                        {:else}
                            <div class="small text-muted">No normalization steps enabled.</div>
                        {/if}
                    </div>

                    <!-- Notes -->
                    <div class="col-12">
                        <h3 class="h6 mb-1">Notes</h3>
                        <ul class="mb-0 small">
                            <li><strong>Do not</strong> write your master passphrase on this card.</li>
                            <li>Keep <strong>Symbols</strong>, <strong>Length</strong>, and <strong>KDF</strong> identical across devices; changing any of these changes all passwords.</li>
                            <li>If a site rejects certain symbols: adjust Symbols for that derive and bump Version (e.g. <code>v2</code>).</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <div class="text-center mt-3 no-print">
        <small class="text-muted">Tip: choose “Save as PDF” in the print dialog.</small>
    </div>
</main>

<style>
    /* Screen preview sizing */
    .print-area {
        max-width: 420px; /* roughly A6 width on screen */
    }

    .algo-card {
        border-radius: .75rem;
    }

    .algo-card header .badge {
        font-weight: 600;
    }

    /* Print styles */
    @media print {
        :root {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        .no-print { display: none !important; }
        body { background: #fff !important; }
        @page { size: A6 portrait; margin: 10mm; }

        /* Expand the print area to fill the page nicely */
        .print-area { max-width: none !important; }
        .algo-card { box-shadow: none !important; border: 1px solid rgba(0,0,0,.12); }
    }
</style>
