<script>
    import { settings } from '$lib/stores.js';
    import { SALT_DELIM } from '$lib/derive.js';
    import { onMount } from 'svelte';

    // live settings
    $: s = $settings;

    // Friendly titles for label normalization steps
    const STEP_LABELS = {
        trim: 'Trim outer spaces',
        collapse_ws: 'Collapse inner spaces',
        lowercase: 'Lowercase',
        ascii_fold: 'Strip accents (ASCII fold)',
        map_lookalikes: 'Map lookalike chars',
        keep_safe: 'Keep only [a–z 0–9 . _ -]'
    };

    // List of enabled normalization steps (human-readable)
    $: enabledSteps =
        Object.entries(s.labelSteps || {})
            .filter(([, v]) => !!v)
            .map(([k]) => STEP_LABELS[k] || k);

    // KDF profile summary (matches Generate page)
    $: kdfProfile = `argon2id m${s.memoryMiB} t${s.passes} p${s.parallelism} h${s.hashBytes}`;

    // Output policy summary
    $: symbolNote = (s.symbols && s.symbols.length > 0)
        ? `1 symbol from “${s.symbols}”`
        : 'no symbols (symbols disabled)';

    // Salt formula text (don’t embed raw delimiter)
    const saltFormula = 'join([eTLD+1, label, version], DELIM)';

    // Describe delimiter safely for print (hex + control-name if non-printable)
    function describeDelimiter(delim) {
        if (!delim) return { printable: true, text: "'' (empty)" };

        const cps = [...delim].map(ch => ch.codePointAt(0));
        const printable = cps.every(cp => cp >= 0x20 && cp <= 0x7E); // ASCII printable

        const NAMES = {
            0x00:'NUL',0x01:'SOH',0x02:'STX',0x03:'ETX',0x04:'EOT',0x05:'ENQ',0x06:'ACK',0x07:'BEL',
            0x08:'BS',0x09:'TAB',0x0A:'LF',0x0B:'VT',0x0C:'FF',0x0D:'CR',0x0E:'SO',0x0F:'SI',
            0x10:'DLE',0x11:'DC1',0x12:'DC2',0x13:'DC3',0x14:'DC4',0x15:'NAK',0x16:'SYN',0x17:'ETB',
            0x18:'CAN',0x19:'EM',0x1A:'SUB',0x1B:'ESC',0x1C:'FS',0x1D:'GS',0x1E:'RS',0x1F:'US',0x7F:'DEL'
        };

        if (printable) {
            return { printable: true, text: `'${delim}'` };
        }

        const parts = cps.map(cp => {
            const name = NAMES[cp] || 'control';
            return `U+${cp.toString(16).toUpperCase().padStart(4,'0')} ${name}`;
        });

        return { printable: false, text: parts.join(' + ') };
    }

    $: delimInfo = describeDelimiter(SALT_DELIM);

    function printCard() {
        window.print();
    }

    onMount(() => {
        // nothing required; reserved for adding dynamic sizing controls
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
                        <small class="text-muted">Reference card (keep separate from master passphrase)</small>
                    </div>
                    <span class="badge text-bg-light">v1</span>
                </header>

                <hr class="my-3" />

                <div class="row g-3">
                    <!-- Inputs -->
                    <div class="col-12">
                        <h3 class="h6 mb-1">Inputs</h3>
                        <ul class="mb-0 small">
                            <li><strong>Domain:</strong> use the site’s eTLD+1 (e.g. <code>example.com</code>)</li>
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
                            <div>
                                <strong>Delimiter (DELIM):</strong>
                                {#if delimInfo.printable}
                                    <code>{delimInfo.text}</code> <span class="text-muted">(printable)</span>
                                {:else}
                                    <span class="text-muted">(non-printable)</span>
                                    <code class="ms-1">{delimInfo.text}</code>
                                {/if}
                            </div>
                            <div><strong>KDF profile:</strong> <code class="fw-bold">{kdfProfile}</code></div>
                        </div>
                    </div>

                    <!-- Output rules -->
                    <div class="col-12">
                        <h3 class="h6 mb-1">Output rules (deterministic)</h3>
                        <div class="mb-0 small">
                            Length: <strong>{s.length}</strong> characters. Includes: <strong>≥ 1 uppercase</strong>, <strong>≥ 1 digit</strong> (no 3+ digits in a row) and <strong>{symbolNote}</strong>.
                        </div>

                        <!-- brief "how it works" summary -->
                        <div class="small text-muted">
                            <strong>Deterministic placement (summary)</strong>:
                            <ol class="mb-0 mt-1 ps-3">
                                <li><em>Base</em> = <code>base64url(hash)</code>, then cut/pad to length <code>L</code>.</li>
                                <li>Ensure classes:
                                    <ul class="mb-0 ps-3">
                                        <li>Pick index <code>i = H[k] mod L</code> (skip forward until a free slot);</li>
                                        <li>Uppercase: if <code>a–z</code> at <code>i</code> → uppercase it; else set <code>'A' + (H[k+1] mod 26)</code>.</li>
                                        <li>Digit: set <code>'0' + (H[k+2] mod 10)</code> at its index.</li>
                                        <li>Symbol (if enabled): set <code>symbols[ H[k+3] mod |symbols| ]</code> at its index.</li>
                                    </ul>
                                </li>
                                <li>Scan left→right; if a run of digits exceeds 2, replace that position with
                                    <code>'a' + (H[k+i] mod 26)</code> and uppercase it if <code>H[k+i+1]&1</code>.</li>
                            </ol>
                            (All choices come from hash bytes <code>H</code>; no RNG. Same inputs = same password.)
                        </div>
                    </div>

                    <!-- Label normalization -->
                    <div class="col-12">
                        <h3 class="h6 mb-1">Label normalization</h3>
                        {#if enabledSteps.length > 0}
                            <ul class="mb-0 small pb-cols">
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
                            <li>Keep <strong>Symbols</strong>, <strong>Length</strong> and <strong>KDF</strong> identical across devices. Changing any of these changes all passwords.</li>
                            <li>If a site rejects certain symbols, adjust symbols &amp; bump version (e.g. <code>v2</code>).</li>
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
    /* Screen preview (approx A4 width @96dpi) */
    .print-area { max-width: 794px; } /* 210mm ≈ 8.27in ≈ 794px */

    .algo-card {
        border-radius: .75rem;
    }

    .algo-card header .badge {
        font-weight: 600;
    }

    code, .badge.text-bg-light {
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
    }

    /* Two columns on roomy screens/print, one column on small screens */
    .pb-cols {
        column-count: 2; /* force 2 columns */
        column-gap: 1rem;
    }
    .pb-cols li {
        break-inside: avoid; /* avoid splitting an item */
        -webkit-column-break-inside: avoid;
        page-break-inside: avoid;
    }

    /* Single column on narrow viewports */
    @media (max-width: 576px) {
        .pb-cols { column-count: 1; }
    }

    /* Print styles */
    @media print {
        :root {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        .no-print { display: none !important; }
        body { background: #fff !important; margin: 0 !important; }
        /* Exact-fit A4 page, no external margins (we use internal padding) */
        @page { size: A4 portrait; margin: 10mm; }

        /* 🔧 Reset Bootstrap layout spacing on print */
        .container {
            max-width: none !important;
            width: 100% !important;
            margin-top: 10mm !important;
        }

        /* Expand the print area to fill the page nicely */
        .print-area {
            width: 210mm;
            margin: 0 auto !important;
        }
        .algo-card {
            width: 200mm;
            padding: 5mm;
            box-sizing: border-box;
            box-shadow: none !important;
            border: 1px solid rgba(0,0,0,.12);
            break-inside: avoid;
        }

        .pb-cols { column-count: 2; column-gap: 6mm; }
        .pb-cols li { break-inside: avoid; }
    }
</style>
