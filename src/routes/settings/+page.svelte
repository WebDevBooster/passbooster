<script>
    import { settings, DEFAULTS } from '$lib/stores.js';
    import { argon2id } from 'hash-wasm';

    // reactive view of the store
    let s; $: s = $settings;

    const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n ?? lo));
    const set = (patch) => settings.update(v => ({ ...v, ...patch }));

    // Profile string + short fingerprint (ID)
    let profileId = '…';
    $: profileStr = `argon2id m${s.memoryMiB} t${s.passes} p${s.parallelism} h${s.hashBytes}`;
    $: (async () => {
        const enc = new TextEncoder().encode(profileStr);
        const buf = await crypto.subtle.digest('SHA-256', enc);
        const hex = [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2,'0')).join('');
        profileId = hex.slice(0, 10).toUpperCase(); // short, readable
    })();

    function resetDefaults() {
        settings.set(structuredClone(DEFAULTS));
        tuneMsg = '';
        unlockPrompt = '';
    }

    function updateNumber(key, value, lo, hi) {
        const n = clamp(Number(value), lo, hi);
        set({ [key]: n });
    }

    function updateText(key, value, fallback = '') {
        set({ [key]: value?.toString() || fallback });
    }

    function toggleStep(step, checked) {
        set({ labelSteps: { ...s.labelSteps, [step]: !!checked } });
    }

    // ---- Auto-tune (unchanged logic) ----
    let tuning = false;
    let tuneMsg = '';

    async function measureOnce({ passes, memoryMiB, parallelism }) {
        const password = crypto.getRandomValues(new Uint8Array(16));
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const t0 = performance.now();
        await argon2id({
            password, salt,
            iterations: passes,
            parallelism,
            memorySize: memoryMiB * 1024,
            hashLength: 16,
            outputType: 'binary'
        });
        return performance.now() - t0;
    }

    async function autoTune() {
        tuning = true; tuneMsg = 'Tuning…';
        try {
            const passes = 3, parallelism = 1;
            const candidates = [256, 192, 128, 96, 64];
            let pickMem = 64, pickMs = Infinity;
            for (const mem of candidates) {
                try {
                    const ms = await measureOnce({ passes, memoryMiB: mem, parallelism });
                    if (ms >= 300 && ms <= 1000) { pickMem = mem; pickMs = ms; break; }
                    if (ms < pickMs) { pickMem = mem; pickMs = ms; }
                } catch { /* too much mem for this device */ }
            }
            let finalPasses = passes;
            if (pickMem === 256 && pickMs < 300) {
                finalPasses = 4;
                pickMs = await measureOnce({ passes: finalPasses, memoryMiB: pickMem, parallelism });
            }
            set({ memoryMiB: pickMem, passes: finalPasses, parallelism });
            tuneMsg = `Set memory to ${pickMem} MiB, passes ${finalPasses} (~${Math.round(pickMs)} ms).`;
        } catch {
            tuneMsg = 'Auto-tune failed (WASM blocked or low memory).';
        } finally {
            tuning = false;
        }
    }

    // ---- KDF unlock flow ----
    let ack = false;        // big warning checkbox
    let unlockShown = false;
    let unlockPrompt = '';  // user must type the Profile ID to unlock
    function lockKdf() { set({ kdfLocked: true }); unlockShown = false; unlockPrompt = ''; }
    function requestUnlock() { unlockShown = true; unlockPrompt = ''; }
    function confirmUnlock() {
        if (unlockPrompt.trim().toUpperCase() === profileId) {
            set({ kdfLocked: false });
            unlockShown = false;
            unlockPrompt = '';
        }
    }
</script>

<svelte:head>
    <title>PassBooster — Settings</title>
</svelte:head>

<main class="container py-4">
    <div class="d-flex align-items-center justify-content-between gap-2">
        <h1 class="h3 mb-0">Settings</h1>
        <div class="d-flex gap-2">
            <a class="btn btn-outline-secondary" href="#/">← Back to Home</a>
        </div>
    </div>

    {#if s.settingsLocked}
        <!-- Big warning gate -->
        <div class="card shadow-sm">
            <div class="card-body">
                <h2 class="h5 text-danger">Warning</h2>
                <div class="alert alert-danger">
                    <strong>Changing settings can change your passwords.</strong><br />
                    The Argon2id parameters (time, memory, lanes, hash length) are inputs to the key derivation.
                    If they change, the generated passwords change — even for the same domain/label/version.
                </div>
                <div class="mb-2">Proceed only if you understand the impact.</div>
                <div class="form-check mb-3">
                    <input class="form-check-input" id="ack" type="checkbox" bind:checked={ack} />
                    <label class="form-check-label" for="ack">I understand that changes may alter my derived passwords.</label>
                </div>
                <button class="btn btn-danger" disabled={!ack} on:click={() => set({ settingsLocked: false })}>
                    Show settings
                </button>
                <a class="btn btn-outline-secondary ms-2" href="#/">Cancel</a>
            </div>
        </div>
    {:else}
        <!-- Settings content -->
        <!-- Profile banner -->
        <div class="card shadow-sm mb-3">
            <div class="card-body d-flex flex-wrap gap-2 align-items-center justify-content-between">
                <div class="h5 mb-0">KDF profile</div>
                <div class="text-muted">
                    <span class="badge text-bg-light">{profileStr}</span>
                    <span class="badge text-bg-secondary">ID {profileId}</span>
                </div>
                <div class="ms-auto">
                    {#if s.kdfLocked}
                        <button class="btn btn-outline-danger" on:click={requestUnlock}>Unlock Argon2id controls</button>
                    {:else}
                        <button class="btn btn-outline-secondary" on:click={lockKdf}>Lock Argon2id controls</button>
                    {/if}
                </div>
            </div>
            {#if unlockShown && s.kdfLocked}
                <div class="card-body border-top">
                    <div class="alert alert-warning mb-3">
                        To unlock, type the current profile ID <strong>{profileId}</strong> and confirm.
                    </div>
                    <div class="row g-2 align-items-end">
                        <div class="col-12 col-md-6">
                            <label class="form-label">Profile ID</label>
                            <input class="form-control" bind:value={unlockPrompt} placeholder="e.g. {profileId}" />
                        </div>
                        <div class="col-auto">
                            <button class="btn btn-danger" on:click={confirmUnlock} disabled={unlockPrompt.trim().toUpperCase() !== profileId}>Unlock</button>
                        </div>
                        <div class="col-auto">
                            <button class="btn btn-outline-secondary" on:click={() => { unlockShown = false; unlockPrompt=''; }}>Cancel</button>
                        </div>
                    </div>
                </div>
            {/if}
        </div>

        <!-- Output -->
        <div class="card shadow-sm mb-3">
            <div class="card-body">
                <h2 class="h5">Output</h2>
                <div class="row g-3">
                    <div class="col-12 col-md-3">
                        <label class="form-label">Length</label>
                        <input
                                type="number"
                                class="form-control"
                                value={s.length}
                                min="12" max="128"
                                on:input={(e) => updateNumber('length', e.currentTarget.value, 12, 128)}
                        />
                        <div class="form-text">12–128 characters.</div>
                    </div>

                    <div class="col-12 col-md-9 position-relative">
                        <label class="form-label">Symbol set</label>
                        <button
                                type="button"
                                class="btn btn-link p-0 pb-tip-trigger"
                                aria-label="What is the symbol set?"
                                aria-describedby="tip-symbols"
                        >
                            <!-- info icon -->
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" style="fill: var(--bs-primary);" class="bi bi-info-circle" viewBox="0 0 16 16">
                                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                                <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/>
                            </svg>
                        </button>

                        <span id="tip-symbols" role="tooltip" class="pb-tip">
                        Some websites force you to have at least 1 special character/symbol in your password. But some are fussy about which symbols you can and cannot use.
                        <br/>
                        That's why by default the symbol set is deliberately limited to just one symbol. <strong>@</strong> is a symbol all sites should allow.
                        <br/>
                        But you could have your own symbol set (not recommended). Or remove all symbols (again, not recommended).
                        </span>

                        <input
                                class="form-control"
                                value={s.symbols}
                                spellcheck="false"
                                autocomplete="off"
                                inputmode="text"
                                on:input={(e) => updateText('symbols', e.currentTarget.value.replace(/\s+/g, ''), '@')}
                        />
                        <div class="form-text">
                            Used for deterministic symbol placement. Leave blank to disable symbols.
                            Default: <code>@</code>. Changing the set or its order will change all derived passwords.
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Argon2id -->
        <div class="card shadow-sm mb-3">
            <div class="card-body">
                <h2 class="h5">Argon2id</h2>
                <div class="row g-3">
                    <div class="col-12">
                        <a href="https://en.wikipedia.org/wiki/Argon2" target="_blank">Info about Argon2id on Wikipedia</a>
                    </div>
                    <div class="col-6 col-md-3">
                        <label class="form-label">Passes (iterations)</label>
                        <input
                                type="number"
                                class="form-control"
                                value={s.passes}
                                min="1" max="6"
                                disabled={s.kdfLocked}
                                on:input={(e) => updateNumber('passes', e.currentTarget.value, 1, 6)}
                        />
                    </div>

                    <div class="col-6 col-md-3">
                        <label class="form-label">Memory (MiB)</label>
                        <input
                                type="number"
                                class="form-control"
                                value={s.memoryMiB}
                                min="32" max="512" step="32"
                                disabled={s.kdfLocked}
                                on:input={(e) => updateNumber('memoryMiB', e.currentTarget.value, 32, 512)}
                        />
                    </div>

                    <div class="col-6 col-md-3">
                        <label class="form-label">Parallelism (lanes)</label>
                        <input
                                type="number"
                                class="form-control"
                                value={s.parallelism}
                                min="1" max="4"
                                disabled={s.kdfLocked}
                                on:input={(e) => updateNumber('parallelism', e.currentTarget.value, 1, 4)}
                        />
                    </div>

                    <div class="col-6 col-md-3">
                        <label class="form-label">Raw hash bytes</label>
                        <input
                                type="number"
                                class="form-control"
                                value={s.hashBytes}
                                min="16" max="64"
                                disabled={s.kdfLocked}
                                on:input={(e) => updateNumber('hashBytes', e.currentTarget.value, 16, 64)}
                        />
                        <div class="form-text">Material before formatting.</div>
                    </div>
                </div>

                <div class="d-flex align-items-center gap-2 mt-3">
                    <button class="btn btn-outline-secondary" disabled={tuning || s.kdfLocked} on:click={autoTune}>
                        {tuning ? 'Tuning…' : 'Auto-tune'}
                    </button>
                    <div class="text-muted" aria-live="polite">{tuneMsg}</div>
                </div>
            </div>
        </div>

        <!-- Clipboard -->
        <div class="card shadow-sm mb-3">
            <div class="card-body">
                <h2 class="h5">Clipboard</h2>
                <div class="row g-3">
                    <div class="col-12 col-md-4">
                        <label class="form-label">Auto-clear timer (seconds)</label>
                        <input
                                type="number"
                                class="form-control"
                                value={s.clipboardClearSec}
                                min="0" max="120"
                                on:input={(e) => updateNumber('clipboardClearSec', e.currentTarget.value, 0, 120)}
                        />
                        <div class="form-text">UI reminder only; browsers can’t force-clear the clipboard.</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Label normalization -->
        <div class="card shadow-sm mb-3">
            <div class="card-body">
                <h2 class="h5">Label normalization</h2>

                <div class="row row-cols-1 row-cols-md-2 g-2">
                    <div class="col">
                        <div class="form-check">
                            <input class="form-check-input" id="nfkc" type="checkbox"
                                   checked={s.labelSteps.unicodeNFKC}
                                   on:change={(e) => toggleStep('unicodeNFKC', e.currentTarget.checked)} />
                            <label class="form-check-label" for="nfkc">Unicode canonicalization (NFKC)</label>
                        </div>
                    </div>

                    <div class="col">
                        <div class="form-check">
                            <input class="form-check-input" id="trim" type="checkbox"
                                   checked={s.labelSteps.trim}
                                   on:change={(e) => toggleStep('trim', e.currentTarget.checked)} />
                            <label class="form-check-label" for="trim">Trim outer spaces</label>
                        </div>
                    </div>

                    <div class="col">
                        <div class="form-check">
                            <input class="form-check-input" id="collapseSpace" type="checkbox"
                                   checked={s.labelSteps.collapseWhitespaceToDash}
                                   on:change={(e) => toggleStep('collapseWhitespaceToDash', e.currentTarget.checked)} />
                            <label class="form-check-label" for="collapseSpace">Collapse internal whitespace to “-”</label>
                        </div>
                    </div>

                    <div class="col">
                        <div class="form-check">
                            <input class="form-check-input" id="lower" type="checkbox"
                                   checked={s.labelSteps.toLower}
                                   on:change={(e) => toggleStep('toLower', e.currentTarget.checked)} />
                            <label class="form-check-label" for="lower">Lowercase (case-insensitive labels)</label>
                        </div>
                    </div>

                    <div class="col">
                        <div class="form-check">
                            <input class="form-check-input" id="restrict" type="checkbox"
                                   checked={s.labelSteps.restrictCharset}
                                   on:change={(e) => toggleStep('restrictCharset', e.currentTarget.checked)} />
                            <label class="form-check-label" for="restrict">
                                Restrict to <code>[a-z0-9._@-]</code> (replace others with “-”)
                            </label>
                        </div>
                    </div>

                    <div class="col">
                        <div class="form-check">
                            <input class="form-check-input" id="collapseDash" type="checkbox"
                                   checked={s.labelSteps.collapseDashes}
                                   on:change={(e) => toggleStep('collapseDashes', e.currentTarget.checked)} />
                            <label class="form-check-label" for="collapseDash">Collapse repeated “-”</label>
                        </div>
                    </div>

                    <div class="col">
                        <div class="form-check">
                            <input class="form-check-input" id="trimDash" type="checkbox"
                                   checked={s.labelSteps.trimDashes}
                                   on:change={(e) => toggleStep('trimDashes', e.currentTarget.checked)} />
                            <label class="form-check-label" for="trimDash">Trim leading/trailing “-”</label>
                        </div>
                    </div>
                </div>

                <div class="text-muted mt-2">These defaults mirror the Generate page’s preview & undo.</div>
            </div>
        </div>

        <!-- Footer actions -->
        <div class="d-flex align-items-center gap-2">
            <button class="btn btn-outline-secondary" on:click={resetDefaults}>Reset to defaults</button>
            <div class="text-muted">Settings save automatically to this browser only.</div>
        </div>
    {/if}
</main>

<style>
    /* Minimal, Bootstrap-looking tooltip */
    .pb-tip {
        position: absolute;
        top: 100%;
        left: 0;
        margin-top: .25rem;
        z-index: 1080;
        background: var(--bs-primary);
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
    /* up-arrow imitation */
    .pb-tip::after {
        content: "";
        position: absolute;
        top: -11px; left: 10px;
        border: 6px solid transparent;
        border-bottom-color: var(--bs-primary);
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
